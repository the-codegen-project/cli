/**
 * Codegen configuration for EventCatalog with OpenAPI service.
 *
 * NOTE: This is a PROPOSED configuration format. The 'eventcatalog' input type
 * does not exist yet - this example demonstrates what the integration COULD
 * look like.
 *
 * The tool would detect that petstore-api has `openapiPath: openapi.json`
 * in its metadata and automatically use OpenAPI processing.
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
