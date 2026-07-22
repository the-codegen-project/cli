import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface NotFoundInterface {
  error?: string
  code?: string
  additionalProperties?: Record<string, any>
}
class NotFound {
  private _error?: string;
  private _code?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: NotFoundInterface) {
    this._error = input.error;
    this._code = input.code;
    this._additionalProperties = input.additionalProperties;
  }

  /**
   * Error message
   */
  get error(): string | undefined { return this._error; }
  set error(error: string | undefined) { this._error = error; }

  /**
   * Error code
   */
  get code(): string | undefined { return this._code; }
  set code(code: string | undefined) { this._code = code; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.error !== undefined) {
      json["error"] = this.error;
    }
    if(this.code !== undefined) {
      json["code"] = this.code;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["error","code","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): NotFound {
    const instance = new NotFound({} as any);

    if (obj["error"] !== undefined) {
      instance.error = obj["error"] as string;
    }
    if (obj["code"] !== undefined) {
      instance.code = obj["code"] as string;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["error","code","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): NotFound {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return NotFound.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","properties":{"error":{"type":"string","description":"Error message"},"code":{"type":"string","description":"Error code"}},"$id":"notFound"};
  public static validate(context?: {data: any, ajvValidatorFunction?: ValidateFunction, ajvInstance?: Ajv, ajvOptions?: AjvOptions}): { valid: boolean; errors?: ErrorObject[]; } {
    const {data, ajvValidatorFunction} = context ?? {};
    // Intentionally parse JSON strings to support validation of marshalled output.
    // Example: validate({data: marshal(obj)}) works because marshal returns JSON string.
    // Note: String 'true' will be coerced to boolean true due to JSON.parse.
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
export { NotFound, NotFoundInterface };