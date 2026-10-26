# Contributing to the Tech Insights Blog

Thank you for contributing! This blog is a simple, engineer-driven space for technical content produced by engineers for engineers. Contributions are welcomed as pull requests on this repository.

## Key principles

- Engineers write: posts are authored by engineers and should be technical and practical.
- Engineer review: posts should be reviewed by other engineers when desired/needed.
- Publish in English
- Share widely: engineers are encouraged to cross-post to platforms like Reddit, LinkedIn, Medium, Dev.to, etc.

## What to contribute

- Blog posts (md/mdx)
- Videos (hosted externally, embed via the `YouTube` component)
- Podcasts (hosted externally, component for embedding not available yet)

## How to contribute a blog post

### First time contributing?

1. Request to join the [@bbv-blogger team](https://github.com/orgs/bbvch/teams/bbv-blogger) if not already a member.
2. Clone the repo and setup your local environment. Follow instructions in [README.md](README.md).
3. [Add yourself as an author](#author-and-tag-registry) in `blog/authors.json` if not already present.
4. Join our Slack channel #tech-insights-blog

### Publishing workflow

1. Idea for a blog post?
   1. Announce your idea in the backlog as a draft item.
2. Ready to write?
   1. Put your draft item in "ready to write"
   2. Share your idea with [@bbv-blogger-admin team](https://github.com/orgs/bbvch/teams/bbv-blog-admin).
   3. Find together with [@bbv-blogger-admin team](https://github.com/orgs/bbvch/teams/bbv-blog-admin) a person who would write a blog on bbv.ch
   4. Arrange a date with [@bbv-blogger-admin team](https://github.com/orgs/bbvch/teams/bbv-blog-admin) (In Roadmap view)
3. Start with writing
   1. Convert work item draft to an issue
   2. Put it "in progress"
   3. Assign it to yourself
   4. Create a branch (e.g., `blog/my-post-slug`) for your blog post.
   5. Create a [blog post folder structure](#blog-post-folder-structure).
   6. If you add new tags to `blog/tags.yml`, assign them to a reviewer persona in [`.github/blog-review/personas.yml`](.github/blog-review/personas.yml) (see [AI review](#ai-review)).
4. Ready to review?
   1. Put it "in review"
   2. Create a Pull Request and link to issue with #{issue-number}
   3. An [AI review](#ai-review) is posted automatically as a PR comment
   4. Request feedback from somebody
   5. Update based on feedback where helpful
   6. Request from [@bbv-blogger-admin team](https://github.com/orgs/bbvch/teams/bbv-blog-admin) approval in Pull Request
5. Ready to publish?
   1. When approved, wait for the blog administrator to set a publishing date.
   2. When the publishing date is set, change the blog path and the frontmatter accordingly.
   3. The merge is done by the [@bbv-blogger-admin team](https://github.com/orgs/bbvch/teams/bbv-blog-admin) except you are notified otherwise.
6. Congrats, you published your post!
   1. A few minutes after the merge, your post will be online.
   2. [Share it widely](#cross-posting).
   3. Engage with readers in the comments.

### Blog post folder structure

```
blog/
   YYYY-MM-DD-your-slug/
      index.mdx
      images/
         cover.png
         other-image.png
```

- Each blog post should be in its own folder under `blog/` with a name following the pattern `YYYY-MM-DD-your-slug/`. The date can be the publish date committed with @bbv-blog-admin.
- `index.mdx` is the main content file for your blog post. It should include [frontmatter](#frontmatter-example) at the top with metadata about the post (title, description, authors, date, tags, image).
- The `images/` folder is for any images you want to include in your post. You can reference images in your content using relative paths (e.g., `./images/other-image.png`).

### Frontmatter example

```yaml
---
title: "My Post Title"
description: "Short description for the blog list card" # SEO purpose, used in BlogListPage cards
authors:
  - autherkey  # from blog/authors.yml
date: 2026-01-21 # publish date: use it, if you want to override the date used in the folder name
tags: [tag1, tag2]
image: ./images/cover.png # relative path to the cover image for this post, used in BlogListPage cards and post page header
---
```

### Cross-posting

- You can cross-post your content to other platforms, such as
  - LinkedIn,
  - Reddit,
  - Medium,
  - dev.to
  - and other platforms.
  
  When cross-posting, please link back to the original post on our blog with a canonical URL to drive traffic and engagement.
- You can cross-post content originally posted on your personal blog here. If you do, please add the following to your blog post (MDX file):
   ```html
   <head>
      <link rel="canonical" href="https://your-original-blog-post-page.com/docs/my-post-slug" />
   </head>
   ```

### Author and tag registry

- Use the author keys defined in `blog/authors.yml` for the `authors` frontmatter.
- Use tags defined in `blog/tags.yml` for `tags` frontmatter.

### AI review

The [Blog AI review workflow](.github/workflows/blog-ai-review.yml) reviews new or changed `.md` and `.mdx` posts under `blog/` in pull requests from branches starting with `blog/` to `main`.

#### Triggers and feedback

- The review runs when a PR is opened or marked ready for review. Draft PRs are skipped.
- New commits alone do not trigger another review. After changes, add the `ai-review` label to the PR. Create this label in the repository if it does not exist. It is removed automatically after the review comment is published, so it can be added again for the next review.
- There is no manual **Run workflow** trigger. Check runs and logs under **Actions → Blog AI review**.
- Reviewer personas (e.g. Cloud Architect, DevOps Engineer) are ranked by the number of matching post tags. By default, up to three matching personas review each post. If none match, a Senior Software Engineer reviews instead. A Technical Editor always reviews in addition.
- The persona mapping and review focus live in [`.github/blog-review/personas.yml`](.github/blog-review/personas.yml); extend the mapping when adding new tags. Review instructions live in [the persona prompt](.github/blog-review/prompts/persona.md) and [the summary prompt](.github/blog-review/prompts/summary.md).
- Feedback is posted in English as a single PR comment, which is updated on subsequent runs. It includes scores from 0 to 10, strengths, gaps, suggestions, and a summary of the main issues. Unknown tags are flagged. Scores are additional feedback only and do not determine whether the PR can be merged.

#### Repository configuration

Maintainers configure the following under **Settings → Secrets and variables → Actions**. Add the API key on the **Secrets** tab and the other settings on the **Variables** tab as repository variables.

| Setting | Type | Default | Purpose |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | Secret | None | Required for real AI reviews; not needed in test mode. |
| `BLOG_REVIEW_TEST_MODE` | Variable | `0` | Set to exactly `1` to publish a fixed test comment without LLM calls. |
| `OPENAI_MODEL` | Variable | `gpt-4.1` | Model used for reviews and the summary. |
| `OPENAI_BASE_URL` | Variable | `https://api.openai.com/v1` | API base URL for a compatible Chat Completions endpoint with structured JSON output. |
| `BLOG_REVIEW_MAX_PERSONAS` | Variable | `3` | Maximum number of matching tag-based personas per post; the Technical Editor is additional. |

GitHub supplies `GITHUB_TOKEN` automatically. The workflow requests `contents: read` and `pull-requests: write` permissions to read the repository and publish comments. Test PRs should come from a branch in this repository: fork PRs normally have a read-only token that cannot publish comments. Outside test mode, the review is skipped with a warning if `OPENAI_API_KEY` is unavailable (for example, on fork PRs).

## Analytics and access

- Check our [internal documentation](https://wiki.bbv.ch/index.php/TechInsights)

## Style & content guidance

- Don't clickbait titles; be clear and descriptive.
- Be technical and factual – avoid marketing language.
- Keep posts focused and reproducible: include commands, snippets, and expected outcomes.
- Prefer readable code samples and link to full sample repos on GitHub when appropriate.
- Cite sources and provide links for further reading.
- Maintain a respectful and professional tone.
- If your post includes third-party code, ensure licensing is clear.
- If you use diagrams, pictures or other color elements, check their appearance with dark and bright backgrounds.

## Support & questions

- For help with the publishing workflow, CI, or tooling, contact or tag a maintainer in your PR.

## Thanks

Thank you for contributing. We look forward to your technical content!
