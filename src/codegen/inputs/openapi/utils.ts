/**
 * Shared helpers for deriving stable identifiers from OpenAPI operations.
 */
import {FormatHelpers} from '@asyncapi/modelina';

/**
 * Derive the operation identifier used to correlate payloads, parameters,
 * headers and channel functions for a single OpenAPI operation.
 *
 * When the spec provides an `operationId` it is used verbatim so generated
 * names stay predictable. Otherwise a name is synthesized from the HTTP method
 * and path segments, preserving word boundaries so it can be cased cleanly
 * (e.g. `GET /v2/connect/{referenceId}` -> `getV2ConnectReferenceId`) instead
 * of collapsing into an uncasable blob (`getv2connectreferenceId`).
 */
export function deriveOperationId({
  operationId,
  method,
  path
}: {
  operationId?: string;
  method: string;
  path: string;
}): string {
  if (operationId) {
    return operationId;
  }
  const segments = path
    .split('/')
    .map((segment) => segment.replace(/[{}]/g, ''))
    .filter((segment) => segment.length > 0);
  return FormatHelpers.toCamelCase([method, ...segments].join(' '));
}
