// @ts-check

const TAG_SCORE = 2;
const AUTHOR_SCORE = 1;
const MAX_RELATED_POSTS = 3;

/** @typedef {import('@docusaurus/plugin-content-blog').BlogPost} BlogPost */

/** @param {BlogPost} post */
function getTagPermalinks(post) {
  return post.metadata.tags.map((tag) => tag.permalink);
}

/** @param {BlogPost} post */
function getAuthorKeys(post) {
  return post.metadata.authors
    .map((author) => author.key)
    .filter((key) => typeof key === 'string');
}

/**
 * Every shared tag scores TAG_SCORE, sharing at least one author scores AUTHOR_SCORE.
 * @param {BlogPost} post
 * @param {BlogPost} candidate
 */
function computeScore(post, candidate) {
  const tags = new Set(getTagPermalinks(post));
  const authors = new Set(getAuthorKeys(post));
  const tagOverlap = getTagPermalinks(candidate).filter((tag) => tags.has(tag)).length;
  const hasAuthorOverlap = getAuthorKeys(candidate).some((key) => authors.has(key));
  return tagOverlap * TAG_SCORE + (hasAuthorOverlap ? AUTHOR_SCORE : 0);
}

/** @param {BlogPost} post */
function getTime(post) {
  return new Date(post.metadata.date).getTime();
}

/**
 * Returns the posts most related to `post`, best match first and newest first on ties.
 * Posts without a shared tag or author are never returned, so the result may be empty.
 * @param {BlogPost} post
 * @param {readonly BlogPost[]} allPosts
 * @param {number} [maxCount]
 * @returns {BlogPost[]}
 */
function getRelatedPosts(post, allPosts, maxCount = MAX_RELATED_POSTS) {
  return allPosts
    .filter((candidate) => candidate.id !== post.id && !candidate.metadata.unlisted)
    .map((candidate) => ({ candidate, score: computeScore(post, candidate) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || getTime(b.candidate) - getTime(a.candidate))
    .slice(0, maxCount)
    .map(({ candidate }) => candidate);
}

module.exports = { computeScore, getRelatedPosts };
