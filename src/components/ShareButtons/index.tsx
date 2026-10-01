import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import styles from './styles.module.css';

export default function ShareButtons(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const { metadata } = useBlogPost();
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const copiedTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const url = `${siteConfig.url}${metadata.permalink}`;
  const { title } = metadata;

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
    return () => clearTimeout(copiedTimeout.current);
  }, []);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(copiedTimeout.current);
      copiedTimeout.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) - nothing to fall back to.
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // User cancelled the share sheet - nothing to do.
    }
  }

  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const xHref = `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  return (
    <div className={styles.shareButtons} data-pagefind-ignore>
      <button type="button" className={styles.button} onClick={handleCopyLink}>
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      {canNativeShare && (
        <button type="button" className={styles.button} onClick={handleNativeShare}>
          Share…
        </button>
      )}
      <a className={styles.button} href={linkedInHref} target="_blank" rel="noopener noreferrer">
        LinkedIn
      </a>
      <a className={styles.button} href={xHref} target="_blank" rel="noopener noreferrer">
        X
      </a>
    </div>
  );
}
