const path = require('path');
const fs = require('fs');
const {buildConfigurationSchema} = require('../dist/codegen/configurationSchemaBuilder');
const {postProcessClean, postProcessMarkdown} = require('../dist/codegen/schemaPostProcess');
const package = require('../package.json');

const majorVersion = package.version.split('.')[0];
const schemasDir = path.resolve(__dirname, '../schemas');
const cleanPath = path.join(schemasDir, `configuration-schema-${majorVersion}.json`);
const docsPath = path.join(schemasDir, `configuration-schema-${majorVersion}-with-docs.json`);

fs.writeFileSync(cleanPath, JSON.stringify(buildConfigurationSchema(postProcessClean), null, 4));
fs.writeFileSync(docsPath, JSON.stringify(buildConfigurationSchema(postProcessMarkdown), null, 4));

console.log(`Wrote:\n  ${cleanPath}\n  ${docsPath}`);
