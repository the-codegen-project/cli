import {Status} from './Status';
import {SortBy} from './SortBy';
import {SortOrder} from './SortOrder';
import {Format} from './Format';
interface FindPetsByStatusAndCategoryParameters {
  /**
   * Status value that needs to be considered for filter
   */
  status: Status;
  /**
   * Category ID to filter pets by
   */
  categoryId: number;
  /**
   * Maximum number of pets to return
   */
  limit?: number;
  /**
   * Number of pets to skip before returning results
   */
  offset?: number;
  /**
   * Sort pets by specified field
   */
  sortBy?: SortBy;
  /**
   * Sort order for results
   */
  sortOrder?: SortOrder;
  /**
   * Filter pets by tags (comma-separated)
   */
  tags?: string[];
  /**
   * Include detailed pet information in response
   */
  includePetDetails?: boolean;
  /**
   * Response format preference
   */
  format?: Format;
}
export { FindPetsByStatusAndCategoryParameters };

export function serializeFindPetsByStatusAndCategoryParametersUrl(parameters: FindPetsByStatusAndCategoryParameters, basePath: string): string {
  let url = basePath;

  url = url.replace(/\{status\}/g, encodeURIComponent(String(parameters.status)));
  url = url.replace(/\{categoryId\}/g, encodeURIComponent(String(parameters.categoryId)));

  const parts: string[] = [];
  if (parameters.limit !== undefined && parameters.limit !== null) {
    const val = parameters.limit;
    if (Array.isArray(val)) {
      val.forEach(v => parts.push(`limit=${encodeURIComponent(String(v))}`));
    } else {
      parts.push(`limit=${encodeURIComponent(String(parameters.limit))}`);
    }
  }
  if (parameters.offset !== undefined && parameters.offset !== null) {
    const val = parameters.offset;
    if (Array.isArray(val)) {
      val.forEach(v => parts.push(`offset=${encodeURIComponent(String(v))}`));
    } else {
      parts.push(`offset=${encodeURIComponent(String(parameters.offset))}`);
    }
  }
  if (parameters.sortBy !== undefined && parameters.sortBy !== null) {
    const val = parameters.sortBy;
    if (Array.isArray(val)) {
      val.forEach(v => parts.push(`sortBy=${encodeURIComponent(String(v))}`));
    } else {
      parts.push(`sortBy=${encodeURIComponent(String(parameters.sortBy))}`);
    }
  }
  if (parameters.sortOrder !== undefined && parameters.sortOrder !== null) {
    const val = parameters.sortOrder;
    if (Array.isArray(val)) {
      val.forEach(v => parts.push(`sortOrder=${encodeURIComponent(String(v))}`));
    } else {
      parts.push(`sortOrder=${encodeURIComponent(String(parameters.sortOrder))}`);
    }
  }
  if (parameters.tags !== undefined && parameters.tags !== null) {
    const val = parameters.tags;
    if (Array.isArray(val)) {
      if (val.length === 0) {
        parts.push('tags=');
      } else {
        parts.push(`tags=${val.map(v => encodeURIComponent(String(v))).join(',')}`);
      }
    } else {
      parts.push(`tags=${encodeURIComponent(String(parameters.tags))}`);
    }
  }
  if (parameters.includePetDetails !== undefined && parameters.includePetDetails !== null) {
    const val = parameters.includePetDetails;
    if (Array.isArray(val)) {
      val.forEach(v => parts.push(`includePetDetails=${encodeURIComponent(String(v))}`));
    } else {
      parts.push(`includePetDetails=${encodeURIComponent(String(parameters.includePetDetails))}`);
    }
  }
  if (parameters.format !== undefined && parameters.format !== null) {
    const val = parameters.format;
    if (Array.isArray(val)) {
      val.forEach(v => parts.push(`format=${String(v)}`));
    } else {
      parts.push(`format=${String(parameters.format)}`);
    }
  }

  const queryString = parts.join('&');
  if (queryString) {
    url += `?${queryString}`;
  }

  return url;
}

export function parseFindPetsByStatusAndCategoryParametersFromUrl(url: string, basePath: string): FindPetsByStatusAndCategoryParameters {
  const urlPath = url.indexOf('?') !== -1 ? url.slice(0, url.indexOf('?')) : url;

  const regexPattern = basePath.replace(/\{([^}]+)\}/g, '([^/?]+)');
  const regex = new RegExp('^' + regexPattern + '$');
  const match = urlPath.match(regex);

  if (!match) {
    throw new Error(`URL path '${urlPath}' does not match base path template '${basePath}'`);
  }

  const paramNames = basePath.match(/\{([^}]+)\}/g)?.map(p => p.slice(1, -1)) || [];
  const pathValues: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    pathValues[name] = decodeURIComponent(match[index + 1]);
  });


  if (pathValues['status'] === undefined) {
    throw new Error(`Required parameter 'status' is missing from URL`);
  }
  if (pathValues['categoryId'] === undefined) {
    throw new Error(`Required parameter 'categoryId' is missing from URL`);
  }
  const result: FindPetsByStatusAndCategoryParameters = {
    status: pathValues['status'] as "available" | "pending" | "sold",
    categoryId: Number(pathValues['categoryId'])
  };

  const qIdx = url.indexOf('?');
  if (qIdx === -1) {
    return result;
  }

  const queryString = url.slice(qIdx + 1);
  if (!queryString) {
    return result;
  }

  const params = new URLSearchParams(queryString);

  if (params.has('limit')) {
    const raw = params.get('limit');
    if (raw !== null) {
      const num = Number(raw);
      if (!isNaN(num)) {
        result.limit = num;
      }
    }
  }
  if (params.has('offset')) {
    const raw = params.get('offset');
    if (raw !== null) {
      const num = Number(raw);
      if (!isNaN(num)) {
        result.offset = num;
      }
    }
  }
  if (params.has('sortBy')) {
    const raw = params.get('sortBy');
    if (raw !== null) {
      result.sortBy = raw as "name" | "id" | "category" | "status";
    }
  }
  if (params.has('sortOrder')) {
    const raw = params.get('sortOrder');
    if (raw !== null) {
      result.sortOrder = raw as "asc" | "desc";
    }
  }
  if (params.has('tags')) {
    const raw = params.get('tags');
    if (raw === '') {
      result.tags = [];
    } else if (raw !== null) {
      result.tags = raw.split(',') as string[];
    }
  }
  if (params.has('includePetDetails')) {
    const raw = params.get('includePetDetails');
    if (raw !== null) {
      result.includePetDetails = raw.toLowerCase() === 'true';
    }
  }
  if (params.has('format')) {
    const raw = params.get('format');
    if (raw !== null) {
      result.format = raw as "json" | "xml" | "csv";
    }
  }

  return result;
}