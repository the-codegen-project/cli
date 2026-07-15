
interface FindPetsByStatusAndCategoryHeaders {
  /**
   * Unique request identifier for tracing
   */
  xMinusRequestMinusId?: string;
  /**
   * Preferred language for response messages
   */
  acceptMinusLanguage?: string;
}
export { FindPetsByStatusAndCategoryHeaders };

export function serializeFindPetsByStatusAndCategoryHeadersHeaders(headers: FindPetsByStatusAndCategoryHeaders): Record<string, string> {
  const result: Record<string, string> = {};
  if (headers.xMinusRequestMinusId !== undefined) { result['X-Request-ID'] = String(headers.xMinusRequestMinusId); }
  if (headers.acceptMinusLanguage !== undefined) { result['Accept-Language'] = String(headers.acceptMinusLanguage); }
  return result;
}