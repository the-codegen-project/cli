import Parser from "@asyncapi/parser";
import { generateAsyncAPIPayloads } from "../../../../src/codegen/generators/helpers/payloads";
import { TypeScriptFileGenerator } from "@asyncapi/modelina";

describe('generateAsyncAPIPayloads', () => {
  test('should generate model correctly', async () => {
    const p = new Parser();
    const {document} = await p.parse({
      asyncapi: "3.0.0",
      info: {
        title: "Not example",
        version: "1.0.0"
      },
      channels: {
        test: {
          address: "test",
          messages: {
            testMessages: {
              $ref: "#/components/messages/testMessages"
            }
          }
        }
      },
      operations: {
        onTestMsg: {
          action: "receive",
          channel: {
            $ref: "#/channels/test"
          },
          messages: [
            {
              $ref: "#/channels/test/messages/testMessages"
            }
          ]
        }
      },
      components: {
        messages: {
          testMessages: {
            payload: {
              $ref: "#/components/schemas/testSchema"
            }
          }
        },
        schemas: {
          testSchema: {
            type: "object",
            properties: {
              key: {
                not: {
                  type: "integer"
                }
              }
            }
          }
        }
      }
    });
    
  const modelinaGenerator = new TypeScriptFileGenerator();
    expect(document).not.toBeUndefined();
    const models = await generateAsyncAPIPayloads(document!, (input) => {
      return modelinaGenerator.generate(input);
    }, {});
    expect(Object.keys(models.channelModels).length).toEqual(1);
  });
});
