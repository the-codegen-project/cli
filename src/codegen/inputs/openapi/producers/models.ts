/**
 * OpenAPI producer for the models generator. See
 * `inputs/asyncapi/producers/models.ts` for context — this is the
 * matching envelope for OpenAPI documents.
 */
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {ModelsGeneratorInput} from '../../../generators/typescript/models.input';

export function produceOpenAPIModelsInput(
  openapiDocument:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document
): ModelsGeneratorInput {
  return {openapi: openapiDocument};
}
