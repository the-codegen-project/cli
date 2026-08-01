
interface PostV2ConnectHeaders {
  /**
   * Correlation ID used for logging.
   */
  xMinusCorrelationMinusId?: string;
}
export { PostV2ConnectHeaders };

export function serializePostV2ConnectHeadersHeaders(headers: PostV2ConnectHeaders): Record<string, string> {
  const result: Record<string, string> = {};
  if (headers.xMinusCorrelationMinusId !== undefined) { result['X-Correlation-Id'] = String(headers.xMinusCorrelationMinusId); }
  return result;
}

export function deserializePostV2ConnectHeadersHeaders(headers: Record<string, string | string[] | undefined>): PostV2ConnectHeaders {
  // Header names are case-insensitive on the wire, so match on a lower-cased
  // view of whatever arrived (Express hands over lower-cased names already).
  const normalized: Record<string, string | string[] | undefined> = {};
  for (const [name, value] of Object.entries(headers)) {
    normalized[name.toLowerCase()] = value;
  }
  const readHeader = (name: string): string | undefined => {
    const value = normalized[name];
    if (value === undefined) { return undefined; }
    return Array.isArray(value) ? value[0] : value;
  };
  // Built up property by property; an absent header leaves its property absent
  // rather than assigning undefined, so required properties stay required.
  const result = {} as PostV2ConnectHeaders;
  const xMinusCorrelationMinusIdValue = readHeader('x-correlation-id');
  if (xMinusCorrelationMinusIdValue !== undefined) { result.xMinusCorrelationMinusId = xMinusCorrelationMinusIdValue as PostV2ConnectHeaders['xMinusCorrelationMinusId']; }
  return result;
}