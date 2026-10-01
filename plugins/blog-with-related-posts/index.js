// @ts-check

/**
 * Wraps the official blog plugin and adds a `relatedItems` module to every blog post route.
 * The module has the same shape as the `items` module of the blog list, tag and author pages,
 * so the related posts can be rendered with the shared BlogPostGrid component.
 */
const blogPluginExports = require('@docusaurus/plugin-content-blog');
const { getRelatedPosts } = require('./relatedPosts');

const defaultBlogPlugin = blogPluginExports.default;

/**
 * @param {import('@docusaurus/types').LoadContext} context
 * @param {import('@docusaurus/plugin-content-blog').PluginOptions} options
 * @returns {Promise<import('@docusaurus/types').Plugin<import('@docusaurus/plugin-content-blog').BlogContent>>}
 */
async function blogPluginWithRelatedPosts(context, options) {
  const blogPlugin = await defaultBlogPlugin(context, options);
  const { contentLoaded } = blogPlugin;
  if (!contentLoaded) {
    return blogPlugin;
  }

  return {
    ...blogPlugin,
    async contentLoaded(args) {
      const { content, actions } = args;
      const postsByPermalink = new Map(
        content.blogPosts.map((post) => [post.metadata.permalink, post]),
      );

      /** @type {typeof actions.addRoute} */
      const addRoute = (route) => {
        const post =
          route.component === options.blogPostComponent
            ? postsByPermalink.get(route.path)
            : undefined;
        if (!post) {
          actions.addRoute(route);
          return;
        }
        const relatedItems = getRelatedPosts(post, content.blogPosts).map((relatedPost) => ({
          content: {
            __import: true,
            path: relatedPost.metadata.source,
            query: { truncated: true },
          },
        }));
        actions.addRoute({ ...route, modules: { ...route.modules, relatedItems } });
      };

      await contentLoaded({ ...args, actions: { ...actions, addRoute } });
    },
  };
}

module.exports = { ...blogPluginExports, default: blogPluginWithRelatedPosts };
