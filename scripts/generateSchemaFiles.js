
const { zodToJsonSchema } = require('zod-to-json-schema');
const types = require('../dist/codegen/types');
const { postProcessClean, postProcessMarkdown } = require('../dist/codegen/schemaPostProcess');
const fs = require('fs');
const path = require('path');
const package = require('../package.json');

const majorVersion = package.version.split('.')[0];
const schemasDir = path.resolve(__dirname, '../schemas');
const cleanPath = path.join(schemasDir, `configuration-schema-${majorVersion}.json`);
const docsPath = path.join(schemasDir, `configuration-schema-${majorVersion}-with-docs.json`);

const disabledPresets = ['custom'];

function build(postProcess) {
  const schema = zodToJsonSchema(types.zodTheCodegenConfiguration, {
    definitions: {
      AsyncAPICodegenConfiguration: types.zodAsyncAPICodegenConfiguration
    },
    postProcess
  });
  // Remove any NON-JSON and Yaml available generators
  schema.definitions['AsyncAPICodegenConfiguration'].properties['generators'].items.anyOf =
    schema.definitions['AsyncAPICodegenConfiguration']?.properties['generators']?.items?.anyOf?.filter(
      (obj) => !obj.properties.preset.const.includes(disabledPresets)
    );
  return schema;
}

const cleanSchema = JSON.stringify(build(postProcessClean), null, 4);
const docsSchema = JSON.stringify(build(postProcessMarkdown), null, 4);

fs.writeFileSync(cleanPath, cleanSchema);
fs.writeFileSync(docsPath, docsSchema);

console.log(`Wrote:\n  ${cleanPath}\n  ${docsPath}`);
