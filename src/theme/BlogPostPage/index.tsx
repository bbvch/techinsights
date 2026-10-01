import React, { type ReactNode } from 'react';
import BlogPostPage from '@theme-original/BlogPostPage';
import type BlogPostPageType from '@theme/BlogPostPage';
import type { WrapperProps } from '@docusaurus/types';
import {
  RelatedItemsProvider,
  type RelatedItems,
} from '@site/src/components/RelatedArticles/context';

type Props = WrapperProps<typeof BlogPostPageType> & {
  /** Added to every blog post route by ./plugins/blog-with-related-posts. */
  readonly relatedItems?: RelatedItems;
};

export default function BlogPostPageWrapper({ relatedItems = [], ...props }: Props): ReactNode {
  return (
    <RelatedItemsProvider items={relatedItems}>
      <BlogPostPage {...props} />
    </RelatedItemsProvider>
  );
}
