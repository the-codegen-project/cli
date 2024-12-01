
const { zodToJsonSchema } = require('zod-to-json-schema');
const types = require('../dist/codegen/types');
const fs = require('fs');
const path = require('path');
const package = require('../package.json');
const majorVersion = package.version.split('.')[0];
const outputPath = path.resolve(__dirname, '../schemas', `configuration-schema-${majorVersion}.json`);
const disabledPresets = ['custom']
const jsonSchema = zodToJsonSchema(types.zodTheCodegenConfiguration, {
  definitions: {
    AsyncAPICodegenConfiguration: types.zodAsyncAPICodegenConfiguration
  }
});
// Remove any NON-JSON and Yaml available generators
jsonSchema.definitions['AsyncAPICodegenConfiguration'].properties['generators'].items.anyOf = jsonSchema.definitions['AsyncAPICodegenConfiguration']?.properties['generators']?.items?.anyOf?.filter((obj) => !obj.properties.preset.const.includes(disabledPresets))
const stringifiedSchema = JSON.stringify(jsonSchema, null, 4);
console.log(`Writing the following schema to ${outputPath}:
${stringifiedSchema}`);
fs.writeFileSync(outputPath, stringifiedSchema);
console.log('Done');