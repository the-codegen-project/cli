import {Status} from './Status';
import {SortBy} from './SortBy';
import {SortOrder} from './SortOrder';
import {Format} from './Format';
class FindPetsByStatusAndCategoryParameters {
  private _status: Status;
  private _categoryId: number;
  private _limit?: number;
  private _offset?: number;
  private _sortBy?: SortBy;
  private _sortOrder?: SortOrder;
  private _tags?: string[];
  private _includePetDetails?: boolean;
  private _format?: Format;

  constructor(input: {
    status: Status,
    categoryId: number,
    limit?: number,
    offset?: number,
    sortBy?: SortBy,
    sortOrder?: SortOrder,
    tags?: string[],
    includePetDetails?: boolean,
    format?: Format,
  }) {
    this._status = input.status;
    this._categoryId = input.categoryId;
    this._limit = input.limit;
    this._offset = input.offset;
    this._sortBy = input.sortBy;
    this._sortOrder = input.sortOrder;
    this._tags = input.tags;
    this._includePetDetails = input.includePetDetails;
    this._format = input.format;
  }

  /**
   * Status value that needs to be considered for filter
   */
  get status(): Status { return this._status; }
  set status(status: Status) { this._status = status; }

  /**
   * Category ID to filter pets by
   */
  get categoryId(): number { return this._categoryId; }
  set categoryId(categoryId: number) { this._categoryId = categoryId; }

  /**
   * Maximum number of pets to return
   */
  get limit(): number | undefined { return this._limit; }
  set limit(limit: number | undefined) { this._limit = limit; }

  /**
   * Number of pets to skip before returning results
   */
  get offset(): number | undefined { return this._offset; }
  set offset(offset: number | undefined) { this._offset = offset; }

  /**
   * Sort pets by specified field
   */
  get sortBy(): SortBy | undefined { return this._sortBy; }
  set sortBy(sortBy: SortBy | undefined) { this._sortBy = sortBy; }

  /**
   * Sort order for results
   */
  get sortOrder(): SortOrder | undefined { return this._sortOrder; }
  set sortOrder(sortOrder: SortOrder | undefined) { this._sortOrder = sortOrder; }

  /**
   * Filter pets by tags (comma-separated)
   */
  get tags(): string[] | undefined { return this._tags; }
  set tags(tags: string[] | undefined) { this._tags = tags; }

  /**
   * Include detailed pet information in response
   */
  get includePetDetails(): boolean | undefined { return this._includePetDetails; }
  set includePetDetails(includePetDetails: boolean | undefined) { this._includePetDetails = includePetDetails; }

  /**
   * Response format preference
   */
  get format(): Format | undefined { return this._format; }
  set format(format: Format | undefined) { this._format = format; }



  /**
   * Serialize path parameters according to OpenAPI 2.0/3.x specification
   * @returns Record of parameter names to their serialized values for path substitution
   */
  serializePathParameters(): Record<string, string> {
    const result: Record<string, string> = {};
  
      // Serialize path parameter: status (style: simple, explode: false)
    if (this.status !== undefined && this.status !== null) {
      const value = this.status;
      if (Array.isArray(value)) {
        result['status'] = value.map(val => encodeURIComponent(String(val))).join(',');
      } else if (typeof value === 'object' && value !== null) {
        result['status'] = Object.entries(value).map(([key, val]) => `${encodeURIComponent(key)},${encodeURIComponent(String(val))}`).join(',');
      } else {
        result['status'] = encodeURIComponent(String(value));
      }
    }
      // Serialize path parameter: categoryId (style: simple, explode: false)
    if (this.categoryId !== undefined && this.categoryId !== null) {
      const value = this.categoryId;
      if (Array.isArray(value)) {
        result['categoryId'] = value.map(val => encodeURIComponent(String(val))).join(',');
      } else if (typeof value === 'object' && value !== null) {
        result['categoryId'] = Object.entries(value).map(([key, val]) => `${encodeURIComponent(key)},${encodeURIComponent(String(val))}`).join(',');
      } else {
        result['categoryId'] = encodeURIComponent(String(value));
      }
    }
  
    return result;
  }
  /**
   * Serialize query parameters according to OpenAPI 2.0/3.x specification
   * @returns URLSearchParams object with serialized query parameters
   */
  serializeQueryParameters(): URLSearchParams {
    const params = new URLSearchParams();
  
    // Serialize query parameter: limit (style: form, explode: true)
    if (this.limit !== undefined && this.limit !== null) {
      const value = this.limit;
      if (Array.isArray(value)) {
        value.forEach(val => params.append('limit', encodeURIComponent(String(val))));
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => params.append(encodeURIComponent(key), encodeURIComponent(String(val))));
      } else {
        params.append('limit', encodeURIComponent(String(value)));
      }
    }
    // Serialize query parameter: offset (style: form, explode: true)
    if (this.offset !== undefined && this.offset !== null) {
      const value = this.offset;
      if (Array.isArray(value)) {
        value.forEach(val => params.append('offset', encodeURIComponent(String(val))));
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => params.append(encodeURIComponent(key), encodeURIComponent(String(val))));
      } else {
        params.append('offset', encodeURIComponent(String(value)));
      }
    }
    // Serialize query parameter: sortBy (style: form, explode: true)
    if (this.sortBy !== undefined && this.sortBy !== null) {
      const value = this.sortBy;
      if (Array.isArray(value)) {
        value.forEach(val => params.append('sortBy', encodeURIComponent(String(val))));
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => params.append(encodeURIComponent(key), encodeURIComponent(String(val))));
      } else {
        params.append('sortBy', encodeURIComponent(String(value)));
      }
    }
    // Serialize query parameter: sortOrder (style: form, explode: true)
    if (this.sortOrder !== undefined && this.sortOrder !== null) {
      const value = this.sortOrder;
      if (Array.isArray(value)) {
        value.forEach(val => params.append('sortOrder', encodeURIComponent(String(val))));
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => params.append(encodeURIComponent(key), encodeURIComponent(String(val))));
      } else {
        params.append('sortOrder', encodeURIComponent(String(value)));
      }
    }
    // Serialize query parameter: tags (style: form, explode: false)
    if (this.tags !== undefined && this.tags !== null) {
      const value = this.tags;
      if (Array.isArray(value)) {
        params.append('tags', value.map(val => encodeURIComponent(String(val))).join(','));
      } else if (typeof value === 'object' && value !== null) {
        params.append('tags', Object.entries(value).map(([key, val]) => `${encodeURIComponent(key)},${encodeURIComponent(String(val))}`).join(','));
      } else {
        params.append('tags', encodeURIComponent(String(value)));
      }
    }
    // Serialize query parameter: includePetDetails (style: form, explode: true)
    if (this.includePetDetails !== undefined && this.includePetDetails !== null) {
      const value = this.includePetDetails;
      if (Array.isArray(value)) {
        value.forEach(val => params.append('includePetDetails', encodeURIComponent(String(val))));
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => params.append(encodeURIComponent(key), encodeURIComponent(String(val))));
      } else {
        params.append('includePetDetails', encodeURIComponent(String(value)));
      }
    }
    // Serialize query parameter: format (style: form, explode: true)
    if (this.format !== undefined && this.format !== null) {
      const value = this.format;
      if (Array.isArray(value)) {
        value.forEach(val => params.append('format', String(val)));
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => params.append(key, String(val)));
      } else {
        params.append('format', String(value));
      }
    }
  
    return params;
  }
  /**
   * Get the complete serialized URL with path and query parameters
   * @param basePath The base path template (e.g., '/users/{id}')
   * @returns The complete URL with serialized parameters
   */
  serializeUrl(basePath: string): string {
    let url = basePath;
  
    // Replace path parameters
  
    const pathParams = this.serializePathParameters();
    for (const [name, value] of Object.entries(pathParams)) {
      url = url.replace(new RegExp(`{${name}}`, 'g'), value);
    }
  
    // Add query parameters
  
    const queryParams = this.serializeQueryParameters();
    const queryString = queryParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  
    return url;
  }
  /**
   * Deserialize URL and populate instance properties from query parameters
   * @param url The URL to parse (can be full URL or just query string)
   */
  deserializeUrl(url: string): void {
    // Extract query string from URL
    let queryString = '';
    if (url.includes('?')) {
      queryString = url.split('?')[1];
    } else if (url.includes('=')) {
      // Assume it's already a query string
      queryString = url;
    }

    if (!queryString) {
      return;
    }

    const params = new URLSearchParams(queryString);

    // Deserialize query parameter: limit (style: form, explode: true)
    if (params.has('limit')) {
      const value = params.get('limit');
      if (value) {
        const decodedValue = decodeURIComponent(value);
        const numValue = Number(decodedValue);
        if (!isNaN(numValue)) {
          this.limit = numValue;
        }
      }
    }
    // Deserialize query parameter: offset (style: form, explode: true)
    if (params.has('offset')) {
      const value = params.get('offset');
      if (value) {
        const decodedValue = decodeURIComponent(value);
        const numValue = Number(decodedValue);
        if (!isNaN(numValue)) {
          this.offset = numValue;
        }
      }
    }
    // Deserialize query parameter: sortBy (style: form, explode: true)
    if (params.has('sortBy')) {
      const value = params.get('sortBy');
      if (value) {
        const decodedValue = decodeURIComponent(value);
        this.sortBy = decodedValue as "name" | "id" | "category" | "status";
      }
    }
    // Deserialize query parameter: sortOrder (style: form, explode: true)
    if (params.has('sortOrder')) {
      const value = params.get('sortOrder');
      if (value) {
        const decodedValue = decodeURIComponent(value);
        this.sortOrder = decodedValue as "asc" | "desc";
      }
    }
    // Deserialize query parameter: tags (style: form, explode: false)
    if (params.has('tags')) {
      const value = params.get('tags');
      if (value === '') {
        this.tags = [];
      } else if (value) {
        // Split by comma and decode
        const decodedValues = value.split(',').map(val => decodeURIComponent(val.trim()));
        this.tags = decodedValues as string[];
      }
    }
    // Deserialize query parameter: includePetDetails (style: form, explode: true)
    if (params.has('includePetDetails')) {
      const value = params.get('includePetDetails');
      if (value) {
        const decodedValue = decodeURIComponent(value);
        this.includePetDetails = decodedValue.toLowerCase() === 'true';
      }
    }
    // Deserialize query parameter: format (style: form, explode: true)
    if (params.has('format')) {
      const value = params.get('format');
      if (value) {
        const decodedValue = decodeURIComponent(value);
        this.format = decodedValue as "json" | "xml" | "csv";
      }
    }
  }

  /**
   * Static method to create a new instance from a URL
   * @param url The URL to parse
   * @param basePath The base path template (e.g., '/pet/findByStatus/{status}/{categoryId}')

   * @returns A new FindPetsByStatusAndCategoryParameters instance
   */
  static fromUrl(url: string, basePath: string): FindPetsByStatusAndCategoryParameters {
    // Extract path parameters from URL
    const pathParams = this.extractPathParameters(url, basePath);
    const instance = new FindPetsByStatusAndCategoryParameters({ status: pathParams.status, categoryId: pathParams.categoryId });
    instance.deserializeUrl(url);
    return instance;
  }

  /**
   * Extract path parameters from a URL using a base path template
   * @param url The URL to extract parameters from
   * @param basePath The base path template (e.g., '/pet/findByStatus/{status}/{categoryId}')
   * @returns Object containing extracted path parameter values
   */
  private static extractPathParameters(url: string, basePath: string): { status: "available" | "pending" | "sold", categoryId: number } {
    // Remove query string from URL for path matching
    const urlPath = url.split('?')[0];
  
    // Create regex pattern from base path template
    const regexPattern = basePath.replace(/\{([^}]+)\}/g, '([^/]+)');
    const regex = new RegExp('^' + regexPattern + '$');
  
    const match = urlPath.match(regex);
    if (!match) {
      throw new Error(`URL path '${urlPath}' does not match base path template '${basePath}'`);
    }
  
    // Extract parameter names from base path template
    const paramNames = basePath.match(/\{([^}]+)\}/g)?.map(p => p.slice(1, -1)) || [];
  
    // Map matched values to parameter names
    const result: any = {};
    paramNames.forEach((paramName, index) => {
      const rawValue = match[index + 1];
      const decodeValue = decodeURIComponent(rawValue);
      switch (paramName) {
        case 'status':
            result.status = decodeValue as "available" | "pending" | "sold";
            break;
        case 'categoryId':
            result.categoryId = Number(decodeValue) as number;
            break;
        default:
          result[paramName] = decodeValue;
      }
    });
  
    return result;
  }
}
export { FindPetsByStatusAndCategoryParameters };