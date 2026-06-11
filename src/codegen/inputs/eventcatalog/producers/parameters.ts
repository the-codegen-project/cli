/**
 * EventCatalog producer for the TypeScript parameters generator.
 *
 * Native events have no parameter concept — only the AsyncAPI /
 * OpenAPI specs supply parameters. Composition merges the parameter
 * maps when both specs are present.
 */
import {
  ParameterEntry,
  ParameterGeneratorInput
} from '../../../generators/typescript/parameters.input';
import {ParsedEventCatalog} from '../parsedCatalog';
import {produceAsyncAPIParameterInput} from '../../asyncapi/producers/parameters';
import {produceOpenAPIParameterInput} from '../../openapi/producers/parameters';

export async function produceEventCatalogParameterInput(
  catalog: ParsedEventCatalog
): Promise<ParameterGeneratorInput> {
  const channelParameters: Record<string, ParameterEntry | undefined> = {};

  if (catalog.asyncapi) {
    const fromAsyncAPI = await produceAsyncAPIParameterInput(catalog.asyncapi);
    Object.assign(channelParameters, fromAsyncAPI.channelParameters);
  }
  if (catalog.openapi) {
    const fromOpenAPI = produceOpenAPIParameterInput(catalog.openapi);
    Object.assign(channelParameters, fromOpenAPI.channelParameters);
  }

  return {channelParameters};
}
