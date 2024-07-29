import {
  CSHARP_JSON_SERIALIZER_PRESET,
  CSHARP_NEWTONSOFT_SERIALIZER_PRESET,
  CSharpFileGenerator,
  CSharpPreset
} from '@asyncapi/modelina';
import {GenericCodegenContext, PayloadRenderType} from '../../types';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {generateAsyncAPIPayloads} from '../helpers/payloads';
import {z} from 'zod';

export const zodCsharpPayloadGenerator = z.object({
  id: z.string().optional().default('payloads-csharp'),
  dependencies: z.array(z.string()).optional().default([]),
  preset: z.literal('payloads').default('payloads'),
  outputPath: z.string().default('__gen__/payloads'),
  serializationType: z.literal('json').optional().default('json'),
  serializationLibrary: z
    .enum(['newtonsoft', 'json'])
    .optional()
    .default('newtonsoft'),
  language: z.literal('csharp').optional().default('csharp'),
  namespace: z.string().optional().default('The.Codegen.Project')
});
export type CsharpPayloadGenerator = z.infer<typeof zodCsharpPayloadGenerator>;

export const defaultCsharpPayloadGenerator: CsharpPayloadGenerator =
  zodCsharpPayloadGenerator.parse({});

export interface CsharpPayloadContext extends GenericCodegenContext {
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: CsharpPayloadGenerator;
}

export async function generateCsharpPayload(
  context: CsharpPayloadContext
): Promise<PayloadRenderType<CsharpPayloadGenerator>> {
  const {asyncapiDocument, inputType, generator} = context;
  if (inputType === 'asyncapi' && asyncapiDocument === undefined) {
    throw new Error('Expected AsyncAPI input, was not given');
  }
  const presets: CSharpPreset[] = [];
  if (context.generator.serializationLibrary === 'json') {
    presets.push(CSHARP_JSON_SERIALIZER_PRESET);
    presets.push({
      class: {
        additionalContent({ renderer, content, model }) {
          const supportFunctions = `public string Serialize()
{
  return this.Serialize(null);
}
public string Serialize(JsonSerializerOptions? options = null)
{
  return JsonSerializer.Serialize(this, options);
}
public static ${model.type}? Deserialize(string json)
{
  var deserializeOptions = new JsonSerializerOptions();
  deserializeOptions.Converters.Add(new ${model.name}Converter());
  return JsonSerializer.Deserialize<${model.type}>(json, deserializeOptions);
}`;
          return `${content}\n${renderer.indent(supportFunctions)}`;
        }
      },
    });
  } else if (context.generator.serializationLibrary === 'newtonsoft') {
    presets.push(CSHARP_NEWTONSOFT_SERIALIZER_PRESET);
    presets.push({
      class: {
        additionalContent: ({content, model, renderer}) => {
          return renderer.indent(`${content}
public string Serialize()
{
  return JsonConvert.SerializeObject(this);
}
public static ${model.name} Deserialize(string json)
{
  return JsonConvert.DeserializeObject<${model.name}>(json);
}`);
        },
      }
    });
  }
  const modelinaGenerator = new CSharpFileGenerator({
    presets
  });
  return generateAsyncAPIPayloads(
    asyncapiDocument!,
    (input) =>
      modelinaGenerator.generateToFiles(
        input,
        generator.outputPath,
        {namespace: generator.namespace},
        true
      ),
    generator
  );
}
