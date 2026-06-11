/**
 * EventCatalog input loader. Reads a service from the catalog and
 * builds a `ParsedEventCatalog` containing the service metadata,
 * the loaded native events (from `events/<id>/`), and any declared
 * AsyncAPI/OpenAPI specs. Each per-generator producer composes
 * whichever fields are present.
 *
 * Unlike the pre-refactor design, this loader does NOT synthesize a
 * synthetic AsyncAPI document for native services. The native events
 * are surfaced directly via `ParsedEventCatalog.sends`/`receives` and
 * the EventCatalog producers translate them into the typed
 * `{Generator}Input` shapes.
 */
import {RunGeneratorContext} from '../../types';
import {createInputDocumentError} from '../../errors';
import {loadAsyncapiDocument} from '../asyncapi';
import {loadOpenapiDocument} from '../openapi';
import {loadServiceMetadata} from './serviceLoader';
import {loadEvent} from './eventLoader';
import {ParsedEventCatalog} from './parsedCatalog';

interface EventCatalogConfigurationShape {
  inputType: 'eventcatalog';
  service: string;
}

/**
 * Resolve the EventCatalog input declared in `context.configuration`
 * and return a `ParsedEventCatalog` describing every aspect the
 * producers might consume.
 */
export async function loadEventCatalog(
  context: RunGeneratorContext
): Promise<ParsedEventCatalog> {
  const config =
    context.configuration as unknown as EventCatalogConfigurationShape;
  const catalogRoot = context.documentPath;
  const service = loadServiceMetadata(catalogRoot, config.service);

  const hasAsync = Boolean(service.specifications?.asyncapiPath);
  const hasOpen = Boolean(service.specifications?.openapiPath);
  const hasSpec = hasAsync || hasOpen;

  // Native events are only loaded when no spec is declared. When the
  // service declares an AsyncAPI or OpenAPI spec, the listed
  // `sends`/`receives` event references are metadata for catalog
  // navigation — the spec is the authoritative source of channels and
  // payloads. Loading the JSON Schemas in that case would
  // double-count and may even fail (no `events/<id>/` directory needs
  // to exist when specs cover the channels).
  const sends = hasSpec
    ? []
    : service.sends.map((ref) => loadEvent(catalogRoot, ref));
  const receives = hasSpec
    ? []
    : service.receives.map((ref) => loadEvent(catalogRoot, ref));

  // Validate: a service with no specs and no events can't generate anything.
  if (!hasSpec && service.sends.length === 0 && service.receives.length === 0) {
    throw createInputDocumentError({
      inputPath: service.serviceDir,
      inputType: 'eventcatalog',
      errorMessage: `Service '${config.service}' declares neither specifications nor any sends/receives events. Provide either an asyncapiPath/openapiPath in the service frontmatter or list events in 'sends'/'receives'.`
    });
  }

  const result: ParsedEventCatalog = {
    service,
    sends,
    receives
  };

  if (hasAsync) {
    result.asyncapi = await loadAsyncapiDocument(
      service.specifications!.asyncapiPath!,
      context.inputAuth
    );
  }
  if (hasOpen) {
    result.openapi = await loadOpenapiDocument(
      service.specifications!.openapiPath!,
      context.inputAuth
    );
  }

  return result;
}
