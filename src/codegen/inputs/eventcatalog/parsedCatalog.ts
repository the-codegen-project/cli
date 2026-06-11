/**
 * Raw, parsed representation of an EventCatalog service. Used as the
 * input to per-generator producers under
 * `src/codegen/inputs/eventcatalog/producers/`. Each producer composes
 * the AsyncAPI / OpenAPI / native-event paths into the appropriate
 * `{Generator}Input` shape.
 *
 * This type intentionally exposes everything the producers need —
 * including the optional pre-parsed AsyncAPI/OpenAPI documents — so
 * that EventCatalog can run multiple producers and merge results when
 * a service declares both specs.
 */
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {ServiceMetadata} from './types';
import {LoadedEvent} from './eventLoader';

/**
 * A native event loaded from `events/<id>/`. Re-exported here for
 * clarity at the producer layer — same shape as `LoadedEvent`.
 */
export type ParsedEventCatalogEvent = LoadedEvent;

/**
 * Service-level metadata read from `services/<id>/index.md` frontmatter.
 * Includes the lists of declared sends/receives event references and
 * resolved spec paths (when present).
 */
export type ParsedEventCatalogService = ServiceMetadata;

/**
 * Result of loading an EventCatalog service. Each field is independent
 * — a service may declare native sends/receives, an AsyncAPI spec, an
 * OpenAPI spec, or any combination. Producers compose whichever fields
 * are present.
 */
export interface ParsedEventCatalog {
  /** Service-level metadata. */
  service: ParsedEventCatalogService;
  /** Native events declared in the service's `sends` block, loaded. */
  sends: ParsedEventCatalogEvent[];
  /** Native events declared in the service's `receives` block, loaded. */
  receives: ParsedEventCatalogEvent[];
  /** Parsed AsyncAPI document, when the service declares one. */
  asyncapi?: AsyncAPIDocumentInterface;
  /** Parsed OpenAPI document, when the service declares one. */
  openapi?: OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document;
}
