/**
 * Internal types for the EventCatalog input loader.
 */

export interface EventReference {
  id: string;
  version?: string;
}

export interface ServiceMetadata {
  id: string;
  name?: string;
  version?: string;
  summary?: string;
  /** Absolute path to the service's directory. */
  serviceDir: string;
  /**
   * Resolved absolute paths to the service's spec files (or remote URLs
   * if the frontmatter declared one).
   */
  specifications?: {
    asyncapiPath?: string;
    openapiPath?: string;
  };
  sends: EventReference[];
  receives: EventReference[];
}

export type EventCatalogSpecType = 'asyncapi' | 'openapi';
