
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

export function deserializeFindPetsByStatusAndCategoryHeadersHeaders(headers: Record<string, string | string[] | undefined>): FindPetsByStatusAndCategoryHeaders {
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
  const result = {} as FindPetsByStatusAndCategoryHeaders;
  const xMinusRequestMinusIdValue = readHeader('x-request-id');
  if (xMinusRequestMinusIdValue !== undefined) { result.xMinusRequestMinusId = xMinusRequestMinusIdValue as FindPetsByStatusAndCategoryHeaders['xMinusRequestMinusId']; }
  const acceptMinusLanguageValue = readHeader('accept-language');
  if (acceptMinusLanguageValue !== undefined) { result.acceptMinusLanguage = acceptMinusLanguageValue as FindPetsByStatusAndCategoryHeaders['acceptMinusLanguage']; }
  return result;
}