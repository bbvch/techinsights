import React, { useRef } from 'react';
import { useHistory } from '@docusaurus/router';
import styles from './styles.module.css';

export default function SearchBar(): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const history = useHistory();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (q) {
      history.push(`/search?q=${encodeURIComponent(q)}`);
      inputRef.current!.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} role="search">
      <input
        ref={inputRef}
        type="search"
        placeholder="Search…"
        aria-label="Search"
        className={styles.input}
      />
    </form>
  );
}
