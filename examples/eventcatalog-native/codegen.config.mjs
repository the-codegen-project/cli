/**
 * Example codegen configuration for native EventCatalog integration.
 *
 * NOTE: This is a PROPOSED configuration format. The 'eventcatalog' input type
 * does not exist yet - this example demonstrates what the integration COULD
 * look like.
 *
 * @type {import("@the-codegen-project/cli").TheCodegenConfiguration}
 */
export default {
  inputType: 'eventcatalog',
  inputPath: './eventcatalog',
  language: 'typescript',

  // Select which service to generate code for
  service: 'order-service',

  generators: [
    {
      preset: 'payloads',
      outputPath: './src/payloads',
      serializationType: 'json',
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
