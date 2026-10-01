import React, { type ReactNode } from 'react';
import BlogPostGrid from '@site/src/components/BlogPostGrid';
import { useRelatedItems } from './context';
import styles from './styles.module.css';

export default function RelatedArticles(): ReactNode {
  const items = useRelatedItems();

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
