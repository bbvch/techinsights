import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  COMMENT_MARKER,
  cleanArticle,
  findChangedPosts,
  loadPersonas,
  overallScore,
  parsePost,
  render,
  renderComment,
  renderPostFeedback,
  selectPersonas,
  unknownTags,
} from './lib.mjs';

const personas = loadPersonas(`
cloud-architect:
  name: Cloud Architect
  tags: [architecture, kubernetes]
devops-engineer:
  name: DevOps Engineer
  tags: [devops, kubernetes]
security-engineer:
  name: Security Engineer
  tags: [security]
software-engineer:
  name: Senior Software Engineer
  fallback: true
editor:
  name: Technical Editor
  always: true
`);

test('findChangedPosts keeps only blog post files', () => {
  assert.deepEqual(
    findChangedPosts([
      'blog/2026-10-19-x/index.mdx',
      'blog/2026-10-19-x/images/a.png',
      'blog/tags.yml',
      'blog/single-post.md',
      'src/pages/index.md',
      '',
    ]),
    ['blog/2026-10-19-x/index.mdx', 'blog/single-post.md'],
  );
});

test('parsePost reads title and tags from frontmatter', () => {
  const post = parsePost('---\ntitle: "Hello"\ntags: [Architecture, devops]\n---\n\nBody');
  assert.equal(post.title, 'Hello');
  assert.deepEqual(post.tags, ['architecture', 'devops']);
  assert.equal(post.body.trim(), 'Body');
});

test('parsePost handles CRLF and missing frontmatter', () => {
  assert.deepEqual(parsePost('---\r\ntags:\r\n  - git\r\n---\r\nText').tags, ['git']);
  assert.deepEqual(parsePost('No frontmatter').tags, []);
});

test('cleanArticle removes imports and MDX comments', () => {
  const cleaned = cleanArticle("import X from '@site/x';\n\nIntro\n\n{/* truncate */}\n\nMore");
  assert.equal(cleaned, 'Intro\n\nMore');
});

test('selectPersonas ranks by tag matches and adds always-on personas', () => {
  const names = selectPersonas(personas, ['architecture', 'devops', 'kubernetes'], 3).map((p) => p.name);
  assert.deepEqual(names, ['Cloud Architect', 'DevOps Engineer', 'Technical Editor']);
});

test('selectPersonas respects the maximum', () => {
  const names = selectPersonas(personas, ['kubernetes', 'architecture', 'security'], 1).map((p) => p.name);
  assert.deepEqual(names, ['Cloud Architect', 'Technical Editor']);
});

test('selectPersonas falls back when no persona matches', () => {
  const names = selectPersonas(personas, ['unknown'], 3).map((p) => p.name);
  assert.deepEqual(names, ['Senior Software Engineer', 'Technical Editor']);
});

test('unknownTags reports tags missing in tags.yml', () => {
  assert.deepEqual(unknownTags(['git', 'nope'], 'git:\n  label: Git\n'), ['nope']);
});

test('overallScore averages successful reviews only', () => {
  assert.equal(overallScore([{ score: 8 }, { score: 7 }, { error: 'x' }]), 7.5);
  assert.equal(overallScore([{ error: 'x' }]), null);
  assert.equal(overallScore([{ score: 42 }]), 10);
});

test('render neutralizes mentions, markers and newlines', () => {
  assert.equal(render('Ask @octocat\n<!-- x'), 'Ask @\u200boctocat &lt;!-- x');
});

test('renderPostFeedback produces the expected structure', () => {
  const md = renderPostFeedback({
    file: 'blog/x/index.mdx',
    title: 'Kubernetes Multi-Cluster Setup',
    tags: ['architecture'],
    unknown: [],
    reviews: [
      { persona: 'Cloud Architect', score: 8, summary: '', strengths: ['Good architecture'], gaps: ['cost analysis'], suggestions: [] },
      { persona: 'DevOps Engineer', score: 7, summary: '', strengths: ['Good examples'], gaps: ['monitoring'], suggestions: [] },
    ],
    topIssues: ['Add monitoring setup', 'Include cost estimates'],
  });
  assert.match(md, /# Feedback: "Kubernetes Multi-Cluster Setup"/);
  assert.match(md, /\*\*Overall Score: 7\.5\/10\*\*/);
  assert.match(md, /## Cloud Architect: 8\/10\n✅ Good architecture {2}\n❌ Missing: cost analysis/);
  assert.match(md, /## Top Issues to Fix:\n1\. Add monitoring setup\n2\. Include cost estimates/);
});

test('renderComment starts with marker', () => {
  const body = renderComment(['# Feedback'], { model: 'gpt', sha: 'abcdef123456' });
  assert.ok(body.startsWith(COMMENT_MARKER));
  assert.match(body, /`abcdef1`/);
});
