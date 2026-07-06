export default {
  inputType: 'openapi',
  inputPath: './safepay-nordic-sample.json',
  generators: [
    {
      preset: 'channels',
      outputPath: './src/generated',
      language: 'typescript',
      protocols: ['http_client']
    }
  ]
};
