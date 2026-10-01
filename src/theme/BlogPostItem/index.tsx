import React from "react";
import BlogPostItem from "@theme-original/BlogPostItem";
import type BlogPostItemType from "@theme/BlogPostItem";
import type { WrapperProps } from "@docusaurus/types";
import { useBlogPost } from "@docusaurus/plugin-content-blog/client";
import Comments from "@site/src/components/Comments";
import ShareButtons from "@site/src/components/ShareButtons";
import RelatedArticles from "@site/src/components/RelatedArticles";

type Props = WrapperProps<typeof BlogPostItemType>;

export default function BlogPostItemWrapper(props: Props): React.JSX.Element {
  const { metadata, assets, isBlogPostPage } = useBlogPost();
  const { comments = true } = metadata.frontMatter;

  return (
    <>  
      <img src={assets.image}></img>
      <BlogPostItem {...props}  />
      {isBlogPostPage && <ShareButtons />}
      {isBlogPostPage && <RelatedArticles />}
      {comments && isBlogPostPage && <Comments />}
    </>
  );
}