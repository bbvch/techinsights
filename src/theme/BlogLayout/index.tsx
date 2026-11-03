import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import BlogSidebar from '@theme/BlogSidebar';
import { useLocation } from '@docusaurus/router';

import type { Props } from '@theme/BlogLayout';

export default function BlogLayout(props: Props): ReactNode {
  const { sidebar, toc, children, ...layoutProps } = props;
  const hasSidebar = sidebar && sidebar.items.length > 0;
  const { pathname } = useLocation();
  // Exclude list and tag pages from the pagefind index.
  // data-pagefind-ignore="all" must be outside <main data-pagefind-body> to take effect.
  const pagefindIgnore =
    pathname === '/' || pathname.startsWith('/tags/') || pathname.startsWith('/archive');

  return (
    <Layout {...layoutProps}>
      <div
        className="container margin-vert--md"
        {...(pagefindIgnore ? { 'data-pagefind-ignore': 'all' } : {})}>
        <div className="row">
          <BlogSidebar sidebar={sidebar} />
          <main
            className={clsx('col', {
              'col--7': hasSidebar,
              'col--9 col--offset-1': !hasSidebar,
            })}
            data-pagefind-body>
            {children}
          </main>
          {toc && <div className="col col--2">{toc}</div>}
        </div>
      </div>
    </Layout>
  );
}
