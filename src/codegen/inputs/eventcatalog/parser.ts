/**
 * Top-level EventCatalog input loader. Reads a service from the catalog,
 * decides which underlying spec drives generation (AsyncAPI, OpenAPI, or
 * a synthesized AsyncAPI document for native services), and returns the
 * loaded document so the dispatch site in `realizeGeneratorContext` can
 * populate the matching field on `RunGeneratorContext`.
 */
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {RunGeneratorContext} from '../../types';
import {CodegenError, ErrorType, createInputDocumentError} from '../../errors';
import {loadAsyncapiDocument} from '../asyncapi';
import {loadOpenapiDocument} from '../openapi';
import {loadServiceMetadata} from './serviceLoader';
import {loadEvent, synthesizeAsyncAPIDocument} from './eventLoader';
import {EventCatalogSpecType} from './types';

export interface EventCatalogLoadResult {
  effectiveInputType: 'asyncapi' | 'openapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  openapiDocument?:
    | OpenAPIV3.Document
    | OpenAPIV2.Document
    | OpenAPIV3_1.Document;
}

interface EventCatalogConfigurationShape {
  inputType: 'eventcatalog';
  service: string;
  specType?: EventCatalogSpecType;
}

/**
 * Resolve the EventCatalog input declared in `context.configuration` and
 * return the effective input type plus the loaded document. The caller
 * is responsible for populating the corresponding field on the context
 * and mutating `context.configuration.inputType` so downstream generators
 * see a familiar `'asyncapi'` or `'openapi'` discriminator.
 */
export async function loadEventCatalog(
  context: RunGeneratorContext
): Promise<EventCatalogLoadResult> {
  const config =
    context.configuration as unknown as EventCatalogConfigurationShape;
  const catalogRoot = context.documentPath;
  const service = loadServiceMetadata(catalogRoot, config.service);

  const hasAsync = Boolean(service.specifications?.asyncapiPath);
  const hasOpen = Boolean(service.specifications?.openapiPath);

  if (hasAsync && !hasOpen) {
    const doc = await loadAsyncapiDocument(
      service.specifications!.asyncapiPath!,
      context.inputAuth
    );
    return {effectiveInputType: 'asyncapi', asyncapiDocument: doc};
  }

  if (hasOpen && !hasAsync) {
    const doc = await loadOpenapiDocument(
      service.specifications!.openapiPath!,
      context.inputAuth
    );
    return {effectiveInputType: 'openapi', openapiDocument: doc};
  }

  if (hasAsync && hasOpen) {
    if (!config.specType) {
      throw new CodegenError({
        type: ErrorType.INPUT_DOCUMENT_ERROR,
        message: `EventCatalog service '${config.service}' declares both asyncapiPath and openapiPath. Set 'specType: "asyncapi"' or 'specType: "openapi"' on the configuration to choose which spec to generate from.`,
        help: `Add 'specType: "asyncapi"' or 'specType: "openapi"' to your codegen configuration. Generating from both specs in a single run is not supported.`
      });
    }
    if (config.specType === 'asyncapi') {
      const doc = await loadAsyncapiDocument(
        service.specifications!.asyncapiPath!,
        context.inputAuth
      );
      return {effectiveInputType: 'asyncapi', asyncapiDocument: doc};
    }
    const doc = await loadOpenapiDocument(
      service.specifications!.openapiPath!,
      context.inputAuth
    );
    return {effectiveInputType: 'openapi', openapiDocument: doc};
  }

  // Native mode — synthesize an AsyncAPI document from the service's events.
  if (service.sends.length === 0 && service.receives.length === 0) {
    throw createInputDocumentError({
      inputPath: service.serviceDir,
      inputType: 'eventcatalog',
      errorMessage: `Service '${config.service}' declares neither specifications nor any sends/receives events. Provide either an asyncapiPath/openapiPath in the service frontmatter or list events in 'sends'/'receives'.`
    });
  }
  const sends = service.sends.map((ref) => loadEvent(catalogRoot, ref));
  const receives = service.receives.map((ref) => loadEvent(catalogRoot, ref));
  const synthesized = await synthesizeAsyncAPIDocument(service, {
    sends,
    receives
  });
  return {effectiveInputType: 'asyncapi', asyncapiDocument: synthesized};
}
