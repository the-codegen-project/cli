import * as path from 'path';
import * as fs from 'fs';

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
];

export const typescriptConfig = readFilesInFolder('./configs/typescript');
