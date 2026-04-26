/**
 * Codegen configuration for EventCatalog with an OpenAPI service.
 *
 * The loader reads the selected service's frontmatter, sees that
 * petstore-api declares `specifications.openapiPath: openapi.json`,
 * and routes generation through the OpenAPI pipeline.
 *
 * @type {import("@the-codegen-project/cli").TheCodegenConfiguration}
 */
export default {
  inputType: 'eventcatalog',
  inputPath: './eventcatalog',
  language: 'typescript',

  // Select which service to generate code for
  service: 'petstore-api',

  generators: [
    {
      preset: 'payloads',
      outputPath: './src/payloads',
      serializationType: 'json',
    },
    {
      preset: 'parameters',
      outputPath: './src/parameters',
    },
    {
      preset: 'headers',
      outputPath: './src/headers',
    },
    {
      preset: 'types',
      outputPath: './src',
    },
    {
      preset: 'channels',
      outputPath: './src/channels',
      protocols: ['http_client'],
    },
  ],
};
