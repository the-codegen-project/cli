import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface AnUploadedResponseInterface {
  code?: number
  type?: string
  message?: string
  additionalProperties?: Record<string, any>
}
/**
 * Describes the result of uploading an image resource
 */
class AnUploadedResponse {
  private _code?: number;
  private _type?: string;
  private _message?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: AnUploadedResponseInterface) {
    this._code = input.code;
    this._type = input.type;
    this._message = input.message;
    this._additionalProperties = input.additionalProperties;
  }

  get code(): number | undefined { return this._code; }
  set code(code: number | undefined) { this._code = code; }

  get type(): string | undefined { return this._type; }
  set type(type: string | undefined) { this._type = type; }

  get message(): string | undefined { return this._message; }
  set message(message: string | undefined) { this._message = message; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.code !== undefined) {
      json["code"] = this.code;
    }
    if(this.type !== undefined) {
      json["type"] = this.type;
    }
    if(this.message !== undefined) {
      json["message"] = this.message;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["code","type","message","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): AnUploadedResponse {
    const instance = new AnUploadedResponse({} as any);

    if (obj["code"] !== undefined) {
      instance.code = obj["code"] as number;
    }
    if (obj["type"] !== undefined) {
      instance.type = obj["type"] as string;
    }
    if (obj["message"] !== undefined) {
      instance.message = obj["message"] as string;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["code","type","message","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): AnUploadedResponse {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return AnUploadedResponse.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"title":"An uploaded response","description":"Describes the result of uploading an image resource","type":"object","properties":{"code":{"type":"integer","format":"int32"},"type":{"type":"string"},"message":{"type":"string"}},"$id":"ApiResponse","$schema":"http://json-schema.org/draft-07/schema"};
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
    ajvInstance.addVocabulary(["xml", "example"])
    const validate = ajvInstance.compile(this.theCodeGenSchema);
    return validate;
  }

}
export { AnUploadedResponse, AnUploadedResponseInterface };