import yaml from 'js-yaml';

export const COMMENT_MARKER = '<!-- ai-blog-review -->';
const MAX_COMMENT_LENGTH = 65000;
const MAX_ARTICLE_LENGTH = 60000;

const POST_PATH = /^blog\/(?:[^/]+\/index|[^/]+)\.mdx?$/;

export function findChangedPosts(changedFiles) {
  return changedFiles.map((f) => f.trim().replace(/\\/g, '/')).filter((f) => POST_PATH.test(f));
}

export function parsePost(source) {
  const match = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const frontmatter = match ? yaml.load(match[1]) ?? {} : {};
  const body = match ? match[2] : source;
  const tags = (Array.isArray(frontmatter.tags) ? frontmatter.tags : [])
    .map((t) => (typeof t === 'object' && t !== null ? t.label ?? '' : String(t)))
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  return {
    title: frontmatter.title ? String(frontmatter.title) : '',
    description: frontmatter.description ? String(frontmatter.description) : '',
    tags,
    body,
  };
}

export function cleanArticle(body) {
  const cleaned = body
    .replace(/^\s*(import|export)\s.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned.length > MAX_ARTICLE_LENGTH
    ? `${cleaned.slice(0, MAX_ARTICLE_LENGTH)}\n\n[... article truncated for review ...]`
    : cleaned;
}

export function loadPersonas(source) {
  const raw = yaml.load(source) ?? {};
  return Object.entries(raw).map(([id, p]) => ({
    id,
    name: p.name ?? id,
    focus: p.focus ?? '',
    tags: (p.tags ?? []).map((t) => String(t).toLowerCase()),
    always: Boolean(p.always),
    fallback: Boolean(p.fallback),
  }));
}

export function selectPersonas(personas, tags, maxPersonas = 3) {
  const tagSet = new Set(tags);
  const ranked = personas
    .filter((p) => !p.always && !p.fallback)
    .map((p, index) => ({ p, index, hits: p.tags.filter((t) => tagSet.has(t)).length }))
    .filter((r) => r.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.index - b.index)
    .slice(0, Math.max(0, maxPersonas))
    .map((r) => r.p);
  const selected = ranked.length > 0 ? ranked : personas.filter((p) => p.fallback).slice(0, 1);
  return [...selected, ...personas.filter((p) => p.always)];
}

export function unknownTags(tags, tagsYmlSource) {
  const known = new Set(Object.keys(yaml.load(tagsYmlSource) ?? {}).map((t) => t.toLowerCase()));
  return tags.filter((t) => !known.has(t));
}

export function clampScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.min(10, Math.max(0, n)) * 10) / 10;
}

export function overallScore(reviews) {
  const scores = reviews.filter((r) => !r.error).map((r) => clampScore(r.score));
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

export function render(text) {
  return String(text ?? '')
    .replace(/\r?\n+/g, ' ')
    .replace(/<!--/g, '&lt;!--')
    .replace(/@(?=\w)/g, '@\u200b')
    .trim();
}

function formatScore(score) {
  return `${Number.isInteger(score) ? score : score.toFixed(1)}/10`;
}

export function renderPostFeedback({ file, title, tags, unknown, reviews, topIssues }) {
  const lines = [`# Feedback: "${render(title || file)}"`, ''];
  const overall = overallScore(reviews);
  lines.push(`**Overall Score: ${overall === null ? 'n/a' : formatScore(overall)}**`, '');
  lines.push(`<sub>\`${file}\` · Tags: ${tags.length ? tags.map((t) => `\`${t}\``).join(', ') : '_none_'}</sub>`, '');
  if (unknown.length) {
    lines.push(`> [!WARNING]`, `> Tags not defined in \`blog/tags.yml\`: ${unknown.map((t) => `\`${t}\``).join(', ')}`, '');
  }

  for (const review of reviews) {
    if (review.error) {
      lines.push(`## ${review.persona}: n/a`, `⚠️ Review failed: ${render(review.error)}`, '');
      continue;
    }
    lines.push(`## ${review.persona}: ${formatScore(clampScore(review.score))}`);
    if (review.summary) lines.push(`_${render(review.summary)}_`, '');
    for (const s of review.strengths ?? []) lines.push(`✅ ${render(s)}  `);
    for (const g of review.gaps ?? []) lines.push(`❌ Missing: ${render(g)}  `);
    if (review.suggestions?.length) {
      lines.push('', '<details><summary>Suggestions</summary>', '');
      for (const s of review.suggestions) {
        lines.push(`- **${render(s.section) || 'General'}:** ${render(s.suggestion)}`);
      }
      lines.push('', '</details>');
    }
    lines.push('');
  }

  if (topIssues?.length) {
    lines.push('## Top Issues to Fix:');
    topIssues.forEach((issue, i) => lines.push(`${i + 1}. ${render(issue)}`));
    lines.push('');
  }
  return lines.join('\n');
}

export function renderComment(sections, { model, sha }) {
  const footer = [
    '---',
    `<sub>🤖 AI review (${model}) for ${sha ? `\`${sha.slice(0, 7)}\`` : 'this PR'}. Scores are additional feedback only and do not affect the PR. ` +
      'Add the label `ai-review` to run it again.</sub>',
  ].join('\n');
  let body = [COMMENT_MARKER, sections.join('\n---\n\n'), footer].join('\n\n');
  if (body.length > MAX_COMMENT_LENGTH) {
    body = `${body.slice(0, MAX_COMMENT_LENGTH - footer.length - 40)}\n\n_[... truncated ...]_\n\n${footer}`;
  }
  return body;
}

export function fillTemplate(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? '');
}
