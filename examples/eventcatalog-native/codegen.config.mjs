/**
 * Codegen configuration for a native EventCatalog service.
 *
 * The order-service has no specifications block, so the loader walks the
 * `sends`/`receives` references and synthesizes an AsyncAPI 3.0 document
 * (one channel per event) which then drives the AsyncAPI generators.
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
