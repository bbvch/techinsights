import React from 'react';
import authorsData from '../../../blog/authors.json';
import Author from '@theme/Blog/Components/Author';
import type {AuthorWithKey} from '@docusaurus/plugin-content-blog';

type AuthorRecord = {
  name: string;
  title: string;
  description: string;
  url: string;
  image: string;
  imageURL: string;
  socials?: {
    linkedin?: string;
    github?: string;
    sessionize?: string;
    mastodon?: string;
  };
};

export default function AuthorsList(): React.JSX.Element {
  const authors = Object.entries(authorsData as Record<string, AuthorRecord>).map(([key, author]) => ({
    ...author,
    key,
    page: {permalink: `/authors/${key}`},
    url: `/authors/${key}`,
  }));

  authors.forEach((author) => {
    if (author.socials?.linkedin) {
      author.socials.linkedin = 'https://www.linkedin.com/in/' + author.socials.linkedin;
    }
    if (author.socials?.github) {
      author.socials.github = 'https://github.com/' + author.socials.github;
    }
  });

  return (
    <div className="authors-list">
      {authors.map((author) => (
        <Author as="h2" author={author satisfies AuthorWithKey} />
      ))}
    </div>
  );
}