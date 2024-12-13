import { generateWithConfig } from "../../../src/codegen/generators";
import path from "path";

describe('generateWithConfig', () => {
  test('should generate model correctly', async () => {
    await generateWithConfig(path.resolve(__dirname, '../../configs/config-implicit.js'));
  });
});
