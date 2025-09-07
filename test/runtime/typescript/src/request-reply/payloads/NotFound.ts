import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class NotFound {
  private _error?: string;
  private _code?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    error?: string,
    code?: string,
    additionalProperties?: Record<string, any>,
  }) {
    this._error = input.error;
    this._code = input.code;
    this._additionalProperties = input.additionalProperties;
  }

  get error(): string | undefined { return this._error; }
  set error(error: string | undefined) { this._error = error; }

  get code(): string | undefined { return this._code; }
  set code(code: string | undefined) { this._code = code; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.error !== undefined) {
      json += `"error": ${typeof this.error === 'number' || typeof this.error === 'boolean' ? this.error : JSON.stringify(this.error)},`;
    }
    if(this.code !== undefined) {
      json += `"code": ${typeof this.code === 'number' || typeof this.code === 'boolean' ? this.code : JSON.stringify(this.code)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["error","code","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): NotFound {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new NotFound({} as any);

    if (obj["error"] !== undefined) {
      instance.error = obj["error"];
    }
    if (obj["code"] !== undefined) {
      instance.code = obj["code"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["error","code","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","properties":{"error":{"type":"string","description":"Error message"},"code":{"type":"string","description":"Error code"}},"$id":"notFound"};
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
export { NotFound };