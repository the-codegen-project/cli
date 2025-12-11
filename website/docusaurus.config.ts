import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';


const config: Config = {
  title: 'The Codegen Project',
  tagline: 'Next-gen code generator',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://the-codegen-project.org',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'the-codegen-project', // Usually your GitHub org/user name.
  projectName: 'cli', // Usually your repo name.
  plugins: [
    // [
    //   'docusaurus-plugin-typedoc',
    //   {
    //     entryPoints: ['../src/index.ts'],
    //     tsconfig: '../tsconfig.json',
    //     entryFileName: "index2.md"
    //   },
    // ]
  ],
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/the-codegen-project/cli/tree/main'
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: 'all',
            language: 'en',
            title: 'The Codegen Project feed',
            limit: 20,
            // Filter out future posts from RSS feeds
            createFeedItems: async (params) => {
              const {blogPosts, defaultCreateFeedItems, ...rest} = params;
              const now = new Date();
              const publishedPosts = blogPosts.filter((post) => {
                const postDate = new Date(post.metadata.date);
                return postDate <= now;
              });
              return defaultCreateFeedItems({
                blogPosts: publishedPosts,
                ...rest,
              });
            },
          },
          // Filter out future posts from blog listing and sidebar
          processBlogPosts: async (params) => {
            const {blogPosts} = params;
            const now = new Date();
            
            // In production, filter out future posts
            if (process.env.NODE_ENV === 'production') {
              return blogPosts.filter((post) => {
                const postDate = new Date(post.metadata.date);
                return postDate <= now;
              });
            }
            
            // In development, show all posts
            return blogPosts;
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/the-codegen-project/cli/tree/main/website',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        gtag: {
          trackingID: 'G-5K0TKGRQ9R',
          anonymizeIP: true,
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    // Replace with your project's social card
    image: 'img/banner.webp',
    navbar: {
      title: 'The Codegen Project',
      logo: {
        alt: 'The Codegen Project Logo',
        src: 'img/logo.jpg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/the-codegen-project/cli',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },

    // ...
    algolia: {
      // The application ID provided by Algolia
      appId: 'DVZ4D3UN2B',

      // Public API key: it is safe to commit it
      apiKey: '521a283d90d66359e269722f9442a98b',

      indexName: 'The codegen project',

      // Optional: path for search page that enabled by default (`false` to disable it)
      searchPagePath: 'search',

      // Optional: whether the insights feature is enabled or not on Docsearch (`false` by default)
      insights: false,
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Resources',
          items: [
            {
              label: 'Docs',
              to: '/docs',
            },
            {
              label: 'Blog',
              to: '/blog',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/the-codegen-project',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} The Codegen Project Community`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
