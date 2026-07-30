/**
 * Tests for the import-extension pass applied to Modelina's rendered models.
 *
 * Modelina renders the imports between models (an object model and the enum it
 * was split into, for example) as `./<ModelName>` with no extension, and it has
 * no option to change that. Those imports do not compile under
 * `moduleResolution: node16`/`nodenext`, so the extension is applied to the
 * rendered output instead.
 */
import {applyImportExtension} from '../../../src/codegen/output/modelina';

describe('applyImportExtension', () => {
  it('leaves content untouched when the extension is "none"', () => {
    const content = `import {Command} from './Command';\nexport {Thing};`;

    expect(applyImportExtension({content, extension: 'none'})).toEqual(content);
  });

  it('appends the extension to relative cross-model imports', () => {
    const content = `import {Command} from './Command';\nimport {Money} from './nested/Money';`;

    expect(applyImportExtension({content, extension: '.js'})).toEqual(
      `import {Command} from './Command.js';\nimport {Money} from './nested/Money.js';`
    );
  });

  it('supports the .ts extension', () => {
    const content = `import {Command} from './Command';`;

    expect(applyImportExtension({content, extension: '.ts'})).toEqual(
      `import {Command} from './Command.ts';`
    );
  });

  it('leaves bare module specifiers untouched', () => {
    const content = `import {Ajv} from 'ajv';\nimport addFormatsModule from 'ajv-formats';`;

    expect(applyImportExtension({content, extension: '.js'})).toEqual(content);
  });

  it('does not double-append when a specifier already has an extension', () => {
    const content = `import {Command} from './Command.js';`;

    expect(applyImportExtension({content, extension: '.js'})).toEqual(content);
  });

  it('handles parent-relative specifiers and double quotes', () => {
    const content = `import {Money} from "../payloads/Money";`;

    expect(applyImportExtension({content, extension: '.js'})).toEqual(
      `import {Money} from "../payloads/Money.js";`
    );
  });

  it('handles type-only imports and exports', () => {
    const content = `import type {Command} from './Command';\nexport type {Command} from './Command';`;

    expect(applyImportExtension({content, extension: '.js'})).toEqual(
      `import type {Command} from './Command.js';\nexport type {Command} from './Command.js';`
    );
  });

  it('handles CommonJS require specifiers', () => {
    const content = `const {Command} = require('./Command');`;

    expect(applyImportExtension({content, extension: '.js'})).toEqual(
      `const {Command} = require('./Command.js');`
    );
  });
});
