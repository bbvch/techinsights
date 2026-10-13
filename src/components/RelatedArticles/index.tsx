import React, { type ReactNode } from 'react';
import useRouteContext from '@docusaurus/useRouteContext';
import type { Content } from '@theme/BlogPostPage';
import BlogPostGrid from '@site/src/components/BlogPostGrid';
import styles from './styles.module.css';

/** Same shape as the `items` passed to the blog list, tag and author pages. */
type RelatedItems = readonly { readonly content: Content }[];

export default function RelatedArticles(): ReactNode {
  const { data } = useRouteContext();
  const items = (data?.relatedItems as RelatedItems | undefined) ?? [];

  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.relatedArticles} data-pagefind-ignore>
      <h2 className={styles.heading}>Related Articles</h2>
      <BlogPostGrid items={items} stretchFewItems titleAs="h3" />
    </section>
  );
}
