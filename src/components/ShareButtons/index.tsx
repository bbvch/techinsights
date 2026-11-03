import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import styles from './styles.module.css';

export default function ShareButtons(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const { metadata } = useBlogPost();
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const copiedTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const buttonClassName = `${styles.button} share-button`;

  const url = `${siteConfig.url}${metadata.permalink}`;
  const { title } = metadata;

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
    return () => clearTimeout(copiedTimeout.current);
  }, []);

  async function handleCopyLink() {
    clearTimeout(copiedTimeout.current);
    setCopied(false);
    setStatus(null);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setStatus({ message: 'Link copied.', isError: false });
      copiedTimeout.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus({
        message: 'Copy failed. You can copy the link from your browser’s address bar.',
        isError: true,
      });
    }
  }

  async function handleNativeShare() {
    setStatus(null);
    try {
      await navigator.share({ title, url });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      setStatus({ message: 'Sharing failed. You can copy the link instead.', isError: true });
    }
  }

  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const xHref = `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  return (
    <div className={styles.shareButtons} data-pagefind-ignore>
      <button type="button" className={buttonClassName} onClick={handleCopyLink}>
        <span className={styles.copyLabel}>
          <span className={copied ? styles.hiddenLabel : undefined} aria-hidden={copied}>
            Copy link
          </span>
          {copied && <span className={styles.copiedLabel}>Copied!</span>}
        </span>
      </button>
      {canNativeShare && (
        <button type="button" className={buttonClassName} onClick={handleNativeShare}>
          Share…
        </button>
      )}
      <a
        className={buttonClassName}
        href={linkedInHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn (opens in new tab)">
        LinkedIn
      </a>
      <a
        className={buttonClassName}
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X (opens in new tab)">
        X
      </a>
      <span
        className={status?.isError ? styles.status : styles.visuallyHidden}
        role="status"
        aria-atomic="true">
        {status?.message}
      </span>
    </div>
  );
}
