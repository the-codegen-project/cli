/**
 * JSON Schema producer for the models generator. See
 * `inputs/asyncapi/producers/models.ts` for context.
 */
import {JsonSchemaDocument} from '../parser';
import {ModelsGeneratorInput} from '../../../generators/typescript/models.input';

export function produceJsonSchemaModelsInput(
  jsonSchemaDocument: JsonSchemaDocument
): ModelsGeneratorInput {
  return {jsonSchema: jsonSchemaDocument};
}
