/** @type {import('@eventcatalog/core/bin/eventcatalog.config').Config} */
export default {
  title: 'User Domain Catalog',
  tagline: 'Event-driven architecture documentation for the user domain',
  organizationName: 'Acme Corp',
  homepageLink: 'https://eventcatalog.dev/',
  landingPage: '',
  editUrl: 'https://github.com/acme-corp/eventcatalog/edit/main',
  trailingSlash: false,
  base: '/',
  logo: {
    alt: 'EventCatalog Logo',
    src: '/logo.png',
  },
  docs: {
    sidebar: {
      showPageHeadings: true,
    },
  },
  generators: [
    // AsyncAPI generator can auto-populate the catalog from spec files
    // ['@eventcatalog/generator-asyncapi', {
    //   services: [
    //     { path: './services/user-service/asyncapi.yaml' }
    //   ]
    // }]
  ],
};
