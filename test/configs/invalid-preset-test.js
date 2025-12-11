export default {
  inputType: 'asyncapi',
  inputPath: './test-schema.yml',
  generators: [
    {
      preset: 'completely-invalid-preset-name',
      outputPath: './output'
    }
  ],
	telemetry: {
		enabled: false
	}
};

