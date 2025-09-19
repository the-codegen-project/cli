export default {
  inputType: 'jsonschema',
  inputPath: './user-schema.json',
  language: 'typescript',
  generators: [
    {
      preset: 'models',
      outputPath: './src/models',
      options: {
        modelType: 'class',
        enumType: 'enum'
      },
      renderers: [
        {
          class: {
            property: ({ content, property }) => {
              // Add JSDoc comments for better documentation
              const description = property.property.description;
              if (description) {
                return `  /** ${description} */\n${content}`;
              }
              return content;
            }
          }
        }
      ]
    }
  ]
};
