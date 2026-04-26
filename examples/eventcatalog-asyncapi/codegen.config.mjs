/**
 * Codegen configuration for EventCatalog with an AsyncAPI service.
 *
 * The loader reads the selected service's frontmatter, sees that
 * user-service declares `specifications.asyncapiPath: asyncapi.yaml`,
 * and routes generation through the AsyncAPI pipeline.
 *
 * @type {import("@the-codegen-project/cli").TheCodegenConfiguration}
 */
export default {
  inputType: 'eventcatalog',
  inputPath: './eventcatalog',
  language: 'typescript',

  // Select which service to generate code for
  service: 'user-service',

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
      protocols: ['nats'],
    },
    {
      preset: 'client',
      outputPath: './src/client',
      protocols: ['nats'],
    },
  ],
};
