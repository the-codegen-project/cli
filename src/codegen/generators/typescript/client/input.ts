/**
 * Input contract for the TypeScript client generator.
 *
 * The client generator wraps the channels generator's output with a
 * connection-managing client class (e.g. NatsClient). Most of what it
 * needs is already present in the channels render output via
 * `dependencyOutputs`; this input contract exposes only what is needed
 * to make protocol-specific decisions independently of the source
 * document.
 */
import {SecuritySchemeOptions} from '../../../inputs/openapi/security';
import {ChannelInfo} from '../channels/input';

/**
 * Normalized data consumed by the TypeScript client generator.
 */
export interface ClientGeneratorInput {
  /** Channel info — same shape as the channels generator consumes. */
  channels: ChannelInfo[];
  /**
   * Security schemes extracted from the source document. Used by HTTP
   * client generators; empty for source formats without security.
   */
  securitySchemes: SecuritySchemeOptions[];
}
