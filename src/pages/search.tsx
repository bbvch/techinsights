import React, { useCallback, useEffect, useRef, useState } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './search.module.css';

const isDev = process.env.NODE_ENV === 'development';

interface PagefindResult {
  url: string;
  meta: { title?: string; image?: string };
  excerpt: string;
}

interface PagefindApi {
  init: () => Promise<void>;
  search: (query: string) => Promise<{ results: { data: () => Promise<PagefindResult> }[] }>;
}

export default function SearchPage(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const location = useLocation();

  const urlQuery = new URLSearchParams(location.search).get('q') ?? '';

  const [query, setQuery] = useState(urlQuery);
  const [results, setResults] = useState<PagefindResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pagefindRef = useRef<PagefindApi | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the query we want to run as soon as pagefind is ready
  const pendingQueryRef = useRef(urlQuery);

  const runSearch = useCallback(async (searchQuery: string) => {
    const pf = pagefindRef.current;
    if (!pf || !searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const search = await pf.search(searchQuery);
      const all = await Promise.all(search.results.slice(0, 50).map((r) => r.data()));
      // Keep only blog posts and author pages; deduplicate by URL
      const seen = new Set<string>();
      const filtered = all.filter((r) => {
        if (seen.has(r.url)) return false;
        seen.add(r.url);
        if (r.url === '/' || r.url === '') return false;
        if (r.url.startsWith('/tags/')) return false;
        if (r.url === '/archive' || r.url.startsWith('/archive/')) return false;
        return true;
      });
      setResults(filtered.slice(0, 20)); // Limit to 20 results for readability
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // React to URL param changes caused by navbar search while already on this page.
  // Cancel any pending debounce from typing so it doesn't overwrite the new search.
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setQuery(urlQuery);
    pendingQueryRef.current = urlQuery;
    if (pagefindRef.current) {
      runSearch(urlQuery);
    }
  }, [urlQuery, runSearch]);

  // Load pagefind once; if a pending query exists, run it immediately after init
  useEffect(() => {
    if (isDev) return;

    async function load() {
      try {
        const dynamicImport = new Function('path', 'return import(path)');
        const pf = await dynamicImport('/pagefind/pagefind.js') as PagefindApi;
        await pf.init();
        pagefindRef.current = pf;
        if (pendingQueryRef.current) {
          runSearch(pendingQueryRef.current);
        }
      } catch {
        setError('Search index not available. Run npm run build to generate it.');
      }
    }

    load();
  }, [runSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    pendingQueryRef.current = value;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 300);
  };

  return (
    <Layout title="Search" description={`Search ${siteConfig.title}`}>
      <main className={styles.searchPage}>
        <div className="container">
          <h1>Search</h1>
          {isDev ? (
            <p className={styles.notice}>
              Search is only available in production builds. Run{' '}
              <code>npm run build && npm run serve</code> to test it locally.
            </p>
          ) : error ? (
            <p className={styles.notice}>{error}</p>
          ) : (
            <>
              <input
                autoFocus
                type="search"
                placeholder="Search posts…"
                value={query}
                onChange={handleChange}
                className={styles.searchInput}
              />
              {isLoading && <p className={styles.status}>Searching…</p>}
              {!isLoading && query.trim() && results.length === 0 && (
                <p className={styles.status}>
                  No results found for <strong>{query}</strong>.
                </p>
              )}
              {results.length > 0 && (
                <ul className={styles.results}>
                  {results.map((result) => (
                    <li key={result.url} className={styles.result}>
                      <Link to={result.url}>
                        <h2 className={styles.resultTitle}>{result.meta.title ?? result.url}</h2>
                      </Link>
                      {/* excerpt contains <mark> tags from pagefind – content is our own */}
                      {/* eslint-disable-next-line react/no-danger */}
                      <p
                        className={styles.resultExcerpt}
                        dangerouslySetInnerHTML={{ __html: result.excerpt }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </main>
    </Layout>
  );
}
