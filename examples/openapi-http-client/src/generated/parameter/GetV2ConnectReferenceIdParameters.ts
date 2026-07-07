
class GetV2ConnectReferenceIdParameters {
  private _referenceId: string;

  constructor(input: {
    referenceId: string,
  }) {
    this._referenceId = input.referenceId;
  }

  get referenceId(): string { return this._referenceId; }
  set referenceId(referenceId: string) { this._referenceId = referenceId; }



  /**
   * Serialize path parameters according to OpenAPI 2.0/3.x specification
   * @returns Record of parameter names to their serialized values for path substitution
   */
  serializePathParameters(): Record<string, string> {
    const result: Record<string, string> = {};
  
      // Serialize path parameter: referenceId (style: simple, explode: false)
    if (this.referenceId !== undefined && this.referenceId !== null) {
      const value = this.referenceId;
      if (Array.isArray(value)) {
        result['referenceId'] = value.map(val => encodeURIComponent(String(val))).join(',');
      } else if (typeof value === 'object' && value !== null) {
        result['referenceId'] = Object.entries(value).map(([key, val]) => `${encodeURIComponent(key)},${encodeURIComponent(String(val))}`).join(',');
      } else {
        result['referenceId'] = encodeURIComponent(String(value));
      }
    }
  
    return result;
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
  

    return url;
  }

  /**
   * Get the channel path with parameters substituted (compatible with AsyncAPI channel interface)
   * @param basePath The base path template (e.g., '/pet/findByStatus/{status}/{categoryId}')
   * @returns The path with parameters replaced
   */
  getChannelWithParameters(basePath: string): string {
    return this.serializeUrl(basePath);
  }

  /**
   * Static method to create a new instance from a URL
   * @param url The URL to parse
   * @param basePath The base path template (e.g., '/pet/findByStatus/{status}/{categoryId}')

   * @returns A new GetV2ConnectReferenceIdParameters instance
   */
  static fromUrl(url: string, basePath: string): GetV2ConnectReferenceIdParameters {
    // Extract path parameters from URL
    const pathParams = this.extractPathParameters(url, basePath);
    const instance = new GetV2ConnectReferenceIdParameters({ referenceId: pathParams.referenceId });
    return instance;
  }

  /**
   * Extract path parameters from a URL using a base path template
   * @param url The URL to extract parameters from
   * @param basePath The base path template (e.g., '/pet/findByStatus/{status}/{categoryId}')
   * @returns Object containing extracted path parameter values
   */
  private static extractPathParameters(url: string, basePath: string): { referenceId: string } {
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
        case 'referenceId':
            result.referenceId = decodeValue;
            break;
        default:
          result[paramName] = decodeValue;
      }
    });
  
    return result;
  }
}
export { GetV2ConnectReferenceIdParameters };