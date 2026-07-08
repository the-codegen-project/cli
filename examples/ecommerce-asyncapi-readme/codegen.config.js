export default {
  inputType: 'asyncapi',
  inputPath: './user-events.yaml',
  generators: [
    {
      preset: 'payloads',
      outputPath: './src/generated/payloads',
      language: 'typescript'
    },
    {
      preset: 'channels',
      outputPath: './src/generated/channels',
      language: 'typescript',
      protocols: ['nats']
    },
    {
      preset: 'readme',
      outputPath: '.',
      language: 'typescript',
      packageName: '@my-org/user-events-sdk',
      packageVersion: '1.0.0',
      introduction:
        '# User Events SDK\n\nA generated SDK for publishing and subscribing to user lifecycle events.',
      // List every referenced generator so its output is rendered before the README
      dependencies: ['channels-typescript', 'payloads-typescript']
    }
  ]
};
