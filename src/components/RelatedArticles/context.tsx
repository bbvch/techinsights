import React, { createContext, useContext, type ReactNode } from 'react';
import type { Content } from '@theme/BlogPostPage';

/** Same shape as the `items` passed to the blog list, tag and author pages. */
export type RelatedItems = readonly { readonly content: Content }[];

const RelatedItemsContext = createContext<RelatedItems>([]);

export function RelatedItemsProvider({
  items,
  children,
}: {
  readonly items: RelatedItems;
  readonly children: ReactNode;
}): ReactNode {
  return <RelatedItemsContext.Provider value={items}>{children}</RelatedItemsContext.Provider>;
}

export function useRelatedItems(): RelatedItems {
  return useContext(RelatedItemsContext);
}
