export default {
  inputType: 'invalid-type-that-does-not-exist',
  inputPath: './test-schema.yml',
  generators: [
    {
      preset: 'payloads',
      outputPath: './output'
    }
  ],
	telemetry: {
		enabled: false
	}
};

