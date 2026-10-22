#!/usr/bin/env node
// AI review for blog posts in pull requests. See .github/workflows/blog-ai-review.yml.
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMMENT_MARKER,
  cleanArticle,
  fillTemplate,
  findChangedPosts,
  loadPersonas,
  parsePost,
  renderComment,
  renderPostFeedback,
  selectPersonas,
  unknownTags,
} from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const read = (p) => readFileSync(path.resolve(root, p), 'utf8');

const env = process.env;
const OPENAI_API_KEY = env.OPENAI_API_KEY;
const OPENAI_MODEL = env.OPENAI_MODEL || 'gpt-4.1';
const OPENAI_BASE_URL = (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const MAX_PERSONAS = Number.parseInt(env.BLOG_REVIEW_MAX_PERSONAS || '3', 10);
const GITHUB_API = env.GITHUB_API_URL || 'https://api.github.com';
const REVIEW_LABEL = 'ai-review';

const reviewSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['score', 'summary', 'strengths', 'gaps', 'suggestions'],
  properties: {
    score: { type: 'number', description: 'Score from 0 to 10' },
    summary: { type: 'string', description: 'One-sentence overall verdict' },
    strengths: { type: 'array', items: { type: 'string' } },
    gaps: { type: 'array', items: { type: 'string' } },
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['section', 'suggestion'],
        properties: { section: { type: 'string' }, suggestion: { type: 'string' } },
      },
    },
  },
};

const summarySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['top_issues'],
  properties: { top_issues: { type: 'array', items: { type: 'string' } } },
};

async function openai(system, user, name, schema) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_schema', json_schema: { name, strict: true, schema } },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const message = data.choices?.[0]?.message;
      if (message?.refusal) throw new Error(`Model refused: ${message.refusal}`);
      return JSON.parse(message?.content ?? '');
    }
    const text = await res.text();
    if (attempt < 3 && (res.status === 429 || res.status >= 500)) {
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
      continue;
    }
    throw new Error(`OpenAI API ${res.status}: ${text.slice(0, 300)}`);
  }
}

async function github(method, url, body) {
  const res = await fetch(url.startsWith('http') ? url : `${GITHUB_API}${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`GitHub API ${method} ${url} -> ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.status === 204 || res.status === 404 ? null : res.json();
}

async function upsertComment(repo, prNumber, body) {
  for (let page = 1; ; page++) {
    const comments = await github('GET', `/repos/${repo}/issues/${prNumber}/comments?per_page=100&page=${page}`);
    if (!comments?.length) break;
    const existing = comments.find((c) => c.body?.startsWith(COMMENT_MARKER));
    if (existing) return github('PATCH', `/repos/${repo}/issues/comments/${existing.id}`, { body });
    if (comments.length < 100) break;
  }
  return github('POST', `/repos/${repo}/issues/${prNumber}/comments`, { body });
}

async function publishComment(repo, event, body) {
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, body);
  await upsertComment(repo, event.pull_request.number, body);

  if (event.action === 'labeled' && event.label?.name === REVIEW_LABEL) {
    await github('DELETE', `/repos/${repo}/issues/${event.pull_request.number}/labels/${REVIEW_LABEL}`);
  }
}

async function reviewPost(file, personas, guidelines, tagsYml, personaPrompt, summaryPrompt) {
  const post = parsePost(read(file));
  const selected = selectPersonas(personas, post.tags, MAX_PERSONAS);
  const article = [
    `Title: ${post.title}`,
    `Description: ${post.description}`,
    `Tags: ${post.tags.join(', ')}`,
    '',
    '<article>',
    cleanArticle(post.body),
    '</article>',
  ].join('\n');

  console.log(`Reviewing ${file} with: ${selected.map((p) => p.name).join(', ')}`);
  const reviews = await Promise.all(
    selected.map(async (p) => {
      try {
        const system = fillTemplate(personaPrompt, { persona: p.name, focus: p.focus, guidelines });
        return { persona: p.name, ...(await openai(system, article, 'persona_review', reviewSchema)) };
      } catch (error) {
        console.error(`::warning file=${file}::${p.name} review failed: ${error.message}`);
        return { persona: p.name, error: error.message };
      }
    }),
  );

  let topIssues = [];
  const successful = reviews.filter((r) => !r.error);
  if (successful.length) {
    try {
      const input = JSON.stringify(
        successful.map(({ persona, gaps, suggestions }) => ({ persona, gaps, suggestions })),
        null,
        2,
      );
      topIssues = (await openai(summaryPrompt, input, 'top_issues', summarySchema)).top_issues.slice(0, 5);
    } catch (error) {
      console.error(`::warning file=${file}::Summary failed: ${error.message}`);
    }
  }

  return {
    feedback: renderPostFeedback({
      file,
      title: post.title,
      tags: post.tags,
      unknown: unknownTags(post.tags, tagsYml),
      reviews,
      topIssues,
    }),
    failed: successful.length === 0,
  };
}

async function main() {
  const event = env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8')) : {};
  const pr = event.pull_request;
  const repo = env.GITHUB_REPOSITORY;
  const baseSha = env.BASE_SHA || pr?.base?.sha;
  if (!pr || !repo || !baseSha) throw new Error('This script must run in a pull_request workflow.');

  if (env.BLOG_REVIEW_TEST_MODE === '1') {
    console.log('Test mode enabled. Publishing a fixed comment without LLM calls.');
    await publishComment(repo, event, [
      COMMENT_MARKER,
      '## Blog AI review — test mode',
      '',
      'This is a hard-coded test comment. No LLM was called.',
    ].join('\n'));
    return;
  }

  if (!OPENAI_API_KEY) {
    console.log('::warning::OPENAI_API_KEY is not available (e.g. PR from a fork). Skipping AI review.');
    return;
  }

  const diff = execFileSync('git', ['diff', '--name-only', '--diff-filter=AMR', baseSha, 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  });
  const files = findChangedPosts(diff.split('\n')).filter((f) => existsSync(path.resolve(root, f)));
  if (files.length === 0) {
    console.log('No new or changed blog posts found.');
    return;
  }

  const personas = loadPersonas(read('.github/blog-review/personas.yml'));
  const guidelines = existsSync(path.resolve(root, 'CONTRIBUTING.md')) ? read('CONTRIBUTING.md') : '';
  const tagsYml = existsSync(path.resolve(root, 'blog/tags.yml')) ? read('blog/tags.yml') : '';
  const personaPrompt = read('.github/blog-review/prompts/persona.md');
  const summaryPrompt = read('.github/blog-review/prompts/summary.md');

  const results = [];
  for (const file of files) {
    results.push(await reviewPost(file, personas, guidelines, tagsYml, personaPrompt, summaryPrompt));
  }

  const body = renderComment(
    results.map((r) => r.feedback),
    { model: OPENAI_MODEL, sha: pr.head?.sha },
  );
  await publishComment(repo, event, body);

  if (results.every((r) => r.failed)) {
    throw new Error('All AI reviews failed. See warnings above.');
  }
}

main().catch((error) => {
  console.error(`::error::${error.message}`);
  process.exit(1);
});
