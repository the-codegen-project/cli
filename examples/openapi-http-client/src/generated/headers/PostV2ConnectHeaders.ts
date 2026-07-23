
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