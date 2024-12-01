import * as path from 'path';
import * as fs from 'fs';

// Select a specific file to test
const TEST_SPECIFIC_FILE: any = '';
// Select a specific config to test
const TEST_SPECIFIC_CONFIG: any = '';

/**
 * Read all the files in the folder, and return the appropriate Jest `each` entries.
 * @param folder
 */
function readFilesInFolder(folder: string) {
  // eslint-disable-next-line no-undef
  const fullPath = path.resolve(__dirname, folder);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return fs.readdirSync(fullPath).map((file) => {
    return {
      file: `${folder}/${file}`
    };
  });
}

export const filesToTest = [
  ...readFilesInFolder('./schemas/asyncapi')
].filter((value) => {
  if(TEST_SPECIFIC_FILE !== '')
    return value.file.includes(TEST_SPECIFIC_FILE);
  return true;
});;

export const typescriptConfig = readFilesInFolder('./configs/typescript').filter((value) => {
  if(TEST_SPECIFIC_CONFIG !== '')
    return value.file.includes(TEST_SPECIFIC_CONFIG);
  return true;
});
