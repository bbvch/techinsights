# Contributing to the bbv TechBlog

Thank you for contributing! This blog is a simple, engineer-driven space for technical content produced by engineers for engineers. Contributions are welcomed as pull requests on this repository.

Key principles

- Engineers write: posts are authored by engineers and should be technical and practical.
- Engineer review: posts should be reviewed by other engineers when desired/needed.
- Publish in English
- Share widely: engineers are encouraged to cross-post to platforms like Reddit, LinkedIn, Medium, Dev.to, etc.

What to contribute

- Blog posts (md/mdx)
- Videos (hosted externally, embed via the `YouTube` component)
- Podcasts (hosted externally, component for embedding not available yet)

How to submit

1. Fork the repo and create a branch for your post.
2. Add yourself as an author in `blog/authors.yml` if not already present.
3. Add a dated folder under `blog/` following the pattern `YYYY-MM-DD-your-slug/`.
   - Place the post in `index.md` (or `index.mdx`) and include frontmatter (title, description, authors, tags, image).
   - Put images in a local `images/` subfolder and reference them relatively (e.g., `./images/cover.png`).
4. Open a Pull Request - if you want/require ask somebody for a review.
5. Merge when you are ready and the CI checks pass.

Frontmatter example

```yaml
---
title: "My Post Title"
description: "Short description for the blog list card" # SEO purpose, used in BlogListPage cards
authors:
  - autherkey  # from blog/authors.yml
date: 2026-01-21
tags: [tag1, tag2]
image: ./images/cover.png
---
```

Author and tag registry

- Use the author keys defined in `blog/authors.yml` for the `authors` frontmatter.
- Use tags defined in `blog/tags.yml` for `tags` frontmatter.

Analytics and access

- Contributors can request access to analytics (views, read-rate, referrers). To request access, open an issue in this repository or contact the repository administrators.

Style & content guidance

- Don't clickbait titles; be clear and descriptive.
- Be technical and factual — avoid marketing language.
- Keep posts focused and reproducible: include commands, snippets, and expected outcomes.
- Prefer readable code samples and link to full sample repos on GitHub when appropriate.
- Cite sources and provide links for further reading.
- Maintain a respectful and professional tone.
- If your post includes third-party code, ensure licensing is clear.

Support & questions

- For help with the publishing workflow, CI, or tooling, open an issue or tag a maintainer in your PR.

Thank you for contributing — we look forward to your technical content!
