export default {
  inputType: 'openapi',
  inputPath: './safepay-nordic-sample.json',
  generators: [
    {
      preset: 'channels',
      outputPath: './src/generated',
      language: 'typescript',
      // Both sides of the same document: `http_server` mounts typed handlers on
      // an Express router, `http_client` calls them.
      protocols: ['http_server', 'http_client']
    }
  ]
};
