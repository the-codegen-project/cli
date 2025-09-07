import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class AnUploadedResponse {
  private _code?: number;
  private _type?: string;
  private _message?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    code?: number,
    type?: string,
    message?: string,
    additionalProperties?: Record<string, any>,
  }) {
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

  public marshal() : string {
    let json = '{'
    if(this.code !== undefined) {
      json += `"code": ${typeof this.code === 'number' || typeof this.code === 'boolean' ? this.code : JSON.stringify(this.code)},`;
    }
    if(this.type !== undefined) {
      json += `"type": ${typeof this.type === 'number' || typeof this.type === 'boolean' ? this.type : JSON.stringify(this.type)},`;
    }
    if(this.message !== undefined) {
      json += `"message": ${typeof this.message === 'number' || typeof this.message === 'boolean' ? this.message : JSON.stringify(this.message)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["code","type","message","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): AnUploadedResponse {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new AnUploadedResponse({} as any);

    if (obj["code"] !== undefined) {
      instance.code = obj["code"];
    }
    if (obj["type"] !== undefined) {
      instance.type = obj["type"];
    }
    if (obj["message"] !== undefined) {
      instance.message = obj["message"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["code","type","message","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"title":"An uploaded response","description":"Describes the result of uploading an image resource","type":"object","properties":{"code":{"type":"integer","format":"int32"},"type":{"type":"string"},"message":{"type":"string"}},"$id":"ApiResponse","$schema":"http://json-schema.org/draft-07/schema"};
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
    ajvInstance.addVocabulary(["xml", "example"])
    const validate = ajvInstance.compile(this.theCodeGenSchema);
    return validate;
  }

}
export { AnUploadedResponse };