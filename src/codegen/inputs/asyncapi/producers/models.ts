/**
 * AsyncAPI producer for the models generator.
 *
 * The `models` generator is one of the two documented exceptions
 * (alongside `custom`) where the typed input is an envelope over the
 * source document — Modelina IS the extractor for models, since its
 * scope is document-wide. This producer simply wraps the parsed
 * AsyncAPI document in the envelope.
 */
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {ModelsGeneratorInput} from '../../../generators/typescript/models.input';

export function produceAsyncAPIModelsInput(
  asyncapiDocument: AsyncAPIDocumentInterface
): ModelsGeneratorInput {
  return {asyncapi: asyncapiDocument};
}
