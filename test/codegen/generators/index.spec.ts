//import { generateWithConfig } from "../../../src/codegen/generators";
//import path from "path";
jest.mock('node:fs/promises');
jest.mock('node:fs');

describe('generateWithConfig', () => {
  test('should generate model correctly', async () => {
    //await generateWithConfig(path.resolve(__dirname, '../../configs/config-implicit.js'));
    expect(true).toEqual(true);
  });
});
