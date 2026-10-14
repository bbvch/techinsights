const { test } = require('node:test');
const assert = require('node:assert/strict');
const { computeScore, getRelatedPosts } = require('./relatedPosts');

function post(id, { tags = [], authors = [], date = '2026-01-01', unlisted = false } = {}) {
  return {
    id,
    metadata: {
      date: new Date(date),
      unlisted,
      tags: tags.map((tag) => ({ label: tag, permalink: `/tags/${tag}` })),
      authors: authors.map((author) => (typeof author === 'string' ? { key: author, name: author } : author)),
    },
  };
}

test('scores every shared tag double and a shared author once', () => {
  const current = post('current', { tags: ['rust', 'cpp', 'testing'], authors: ['jane'] });

  assert.equal(computeScore(current, post('a', { tags: ['rust', 'cpp'] })), 4);
  assert.equal(computeScore(current, post('b', { authors: ['jane', 'john'] })), 1);
  assert.equal(computeScore(current, post('c', { tags: ['rust'], authors: ['jane'] })), 3);
  assert.equal(computeScore(current, post('d', { tags: ['java'], authors: ['john'] })), 0);
});

test('ignores authors without a key (inline authors)', () => {
  const current = post('current', { authors: [{ name: 'Inline' }] });
  const candidate = post('a', { authors: [{ name: 'Inline' }] });

  assert.equal(computeScore(current, candidate), 0);
});

test('returns at most three posts, best match first and newest first on ties', () => {
  const current = post('current', { tags: ['rust', 'cpp'], authors: ['jane'] });
  const all = [
    current,
    post('author-old', { authors: ['jane'], date: '2026-01-01' }),
    post('author-new', { authors: ['jane'], date: '2026-03-01' }),
    post('one-tag', { tags: ['rust'], date: '2026-02-01' }),
    post('two-tags', { tags: ['rust', 'cpp'], date: '2025-01-01' }),
  ];

  assert.deepEqual(
    getRelatedPosts(current, all).map(({ id }) => id),
    ['two-tags', 'one-tag', 'author-new'],
  );
});

test('excludes the current post, unlisted posts and posts without overlap', () => {
  const current = post('current', { tags: ['rust'], authors: ['jane'] });
  const all = [
    current,
    post('unlisted', { tags: ['rust'], unlisted: true }),
    post('unrelated', { tags: ['java'], authors: ['john'] }),
  ];

  assert.deepEqual(getRelatedPosts(current, all), []);
});
