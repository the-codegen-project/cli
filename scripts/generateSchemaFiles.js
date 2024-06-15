
const { zodToJsonSchema } = require('zod-to-json-schema');
const types = require('../dist/codegen/types');
const fs = require('fs');
const path = require('path');
const package = require('../package.json');
const majorVersion = package.version.split('.')[0];
const outputPath = path.resolve(__dirname, '../schemas', `configuration-schema-${majorVersion}.json`);

const jsonSchema = zodToJsonSchema(types.zodTheCodegenConfiguration, {
  definitions: {
    AsyncAPICodegenConfiguration: types.zodAsyncAPICodegenConfiguration
  }
});
const stringifiedSchema = JSON.stringify(jsonSchema, null, 4);
console.log(`Writing the following schema to ${outputPath}:
${stringifiedSchema}`);
fs.writeFileSync(outputPath, stringifiedSchema);
console.log('Done');