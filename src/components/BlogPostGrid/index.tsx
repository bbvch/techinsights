import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import type { Content } from '@theme/BlogPostPage';
import './styles.css';

type Props = {
  readonly items: readonly { readonly content: Content }[];
  /** Show the post authors on each card (redundant on author pages). */
  readonly showAuthors?: boolean;
  /** Stretch cards to fill the whole row when there are fewer than three posts in total. */
  readonly stretchFewItems?: boolean;
  /** Total number of posts across all pages, used to decide whether to stretch. */
  readonly totalCount?: number;
};

export default function BlogPostGrid({
  items,
  showAuthors = true,
  stretchFewItems = false,
  totalCount = items.length,
}: Props): ReactNode {
  return (
    <div
      className={clsx('blog-list-container', {
        'blog-list-container--single': stretchFewItems && totalCount === 1,
        'blog-list-container--pair': stretchFewItems && totalCount === 2,
      })}>
      {items.map(({ content: BlogPostContent }) => {
        const itemMetadata = BlogPostContent.metadata;

        const authors = itemMetadata.authors;
        const { tags } = itemMetadata;
        const image = BlogPostContent.assets.image;
        const excerpt = itemMetadata.description || 'Read more...';
        return (
          <div key={itemMetadata.permalink} className="blog-post-card">
            {image && (
              // Duplicate of the title link, so hide it from keyboard and screen readers.
              <Link
                to={itemMetadata.permalink}
                className="blog-post-image"
                tabIndex={-1}
                aria-hidden="true">
                <img src={image} alt="" loading="lazy" />
              </Link>
            )}
            <div className="blog-post-content">
              <Link to={itemMetadata.permalink}>
                <h2>{itemMetadata.title}</h2>
              </Link>
              {showAuthors && authors && authors.length > 0 && (
                <div className="blog-post-authors">
                  {authors.map((author, idx) => (
                    <span key={idx} className="blog-post-author">
                      {author.name}
                      {idx < authors.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
              <div className="blog-post-meta">
                <span>{new Date(itemMetadata.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  // Post dates are UTC midnight; avoid shifting to the previous day in western time zones.
                  timeZone: 'UTC',
                })}</span>
                {itemMetadata.readingTime && <span>·</span>}
                {itemMetadata.readingTime && <span>{Math.ceil(itemMetadata.readingTime)} min read</span>}
              </div>
              <p>{excerpt}</p>
              {tags && tags.length > 0 && (
                <div className="blog-post-tags">
                  {tags.map((tag) => (
                    <Link key={tag.permalink} to={tag.permalink} className="blog-post-tag">
                      {tag.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
