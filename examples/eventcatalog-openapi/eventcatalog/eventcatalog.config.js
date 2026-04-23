/** @type {import('@eventcatalog/core/bin/eventcatalog.config').Config} */
export default {
  title: 'E-Commerce API Catalog',
  tagline: 'API documentation for the e-commerce platform',
  organizationName: 'Petstore Inc',
  homepageLink: 'https://eventcatalog.dev/',
  landingPage: '',
  editUrl: 'https://github.com/petstore/eventcatalog/edit/main',
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
    // OpenAPI generator can auto-populate the catalog from spec files
    // ['@eventcatalog/generator-openapi', {
    //   services: [
    //     { path: './services/petstore-api/openapi.json' }
    //   ]
    // }]
  ],
};
