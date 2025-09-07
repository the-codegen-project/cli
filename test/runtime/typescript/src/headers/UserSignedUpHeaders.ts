import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class UserSignedUpHeaders {
  private _xTestHeader?: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    xTestHeader?: string,
    additionalProperties?: Map<string, any>,
  }) {
    this._xTestHeader = input.xTestHeader;
    this._additionalProperties = input.additionalProperties;
  }

  /**
   * Test header
   */
  get xTestHeader(): string | undefined { return this._xTestHeader; }
  set xTestHeader(xTestHeader: string | undefined) { this._xTestHeader = xTestHeader; }

  get additionalProperties(): Map<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.xTestHeader !== undefined) {
      json += `"x-test-header": ${typeof this.xTestHeader === 'number' || typeof this.xTestHeader === 'boolean' ? this.xTestHeader : JSON.stringify(this.xTestHeader)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["x-test-header","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): UserSignedUpHeaders {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new UserSignedUpHeaders({} as any);

    if (obj["x-test-header"] !== undefined) {
      instance.xTestHeader = obj["x-test-header"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["x-test-header","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","properties":{"x-test-header":{"type":"string","description":"Test header"}},"$id":"UserSignedUpHeaders","$schema":"http://json-schema.org/draft-07/schema"};
  public static validate(context?: {data: any, ajvValidatorFunction?: ValidateFunction, ajvInstance?: Ajv, ajvOptions?: AjvOptions}): { valid: boolean; errors?: ErrorObject[]; } {
    const {data, ajvValidatorFunction} = context ?? {};
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const validate = ajvValidatorFunction ?? this.createValidator(context)
    return {
      valid: validate(parsedData),
      errors: validate.errors ?? undefined,
    };
  }
  public static createValidator(context?: {ajvInstance?: Ajv, ajvOptions?: AjvOptions}): ValidateFunction {
    const {ajvInstance} = {...context ?? {}, ajvInstance: new Ajv(context?.ajvOptions ?? {})};
    addFormats(ajvInstance);
  
    const validate = ajvInstance.compile(this.theCodeGenSchema);
    return validate;
  }

}
export { UserSignedUpHeaders };