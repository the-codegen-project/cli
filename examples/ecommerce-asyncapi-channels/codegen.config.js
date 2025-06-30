export default {
  inputType: 'asyncapi',
  inputPath: './ecommerce-event-channels.yaml',
  generators: [
    {
      preset: 'channels',
      outputPath: './src/generated',
      language: 'typescript',
      protocols: ['nats', 'kafka']
    }
  ]
}; 