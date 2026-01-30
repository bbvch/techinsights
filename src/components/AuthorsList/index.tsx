import React from 'react';
import authorsData from '../../../blog/authors.json';
import Author from '@theme/Blog/Components/Author';

export default function AuthorsList(): React.JSX.Element {
  Object.keys(authorsData).map((key) => {
    authorsData[key].url = `/authors/${key}`;
  });

  return (
    <div className="authors-list">
      {Object.values(authorsData).map((author) => (
        <Author as="h2" author={author} count={1} />
      ))}
    </div>
  );
}