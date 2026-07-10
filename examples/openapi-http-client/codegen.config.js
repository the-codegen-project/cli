export default {
  inputType: 'openapi',
  inputPath: './safepay-nordic-sample.json',
  generators: [
    {
      preset: 'channels',
      outputPath: './src/generated',
      language: 'typescript',
      protocols: ['http_client']
    },
    {
      preset: 'client',
      outputPath: './src/generated/client',
      language: 'typescript',
      protocols: ['http'],
      channelsGeneratorId: 'channels-typescript'
    }
  ]
};
