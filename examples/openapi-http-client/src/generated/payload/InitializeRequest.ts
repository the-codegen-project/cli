import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface InitializeRequestInterface {
  returnUrl: string
  skipKyc?: boolean
  additionalProperties?: Record<string, any>
}
class InitializeRequest {
  private _returnUrl: string;
  private _skipKyc?: boolean;
  private _additionalProperties?: Record<string, any>;

  constructor(input: InitializeRequestInterface) {
    this._returnUrl = input.returnUrl;
    this._skipKyc = input.skipKyc;
    this._additionalProperties = input.additionalProperties;
  }

  get returnUrl(): string { return this._returnUrl; }
  set returnUrl(returnUrl: string) { this._returnUrl = returnUrl; }

  get skipKyc(): boolean | undefined { return this._skipKyc; }
  set skipKyc(skipKyc: boolean | undefined) { this._skipKyc = skipKyc; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.returnUrl !== undefined) {
      json["returnUrl"] = this.returnUrl;
    }
    if(this.skipKyc !== undefined) {
      json["skipKyc"] = this.skipKyc;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["returnUrl","skipKyc","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): InitializeRequest {
    const instance = new InitializeRequest({} as any);

    if (obj["returnUrl"] !== undefined) {
      instance.returnUrl = obj["returnUrl"] as string;
    }
    if (obj["skipKyc"] !== undefined) {
      instance.skipKyc = obj["skipKyc"] as boolean;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["returnUrl","skipKyc","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): InitializeRequest {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return InitializeRequest.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","required":["returnUrl"],"properties":{"returnUrl":{"type":"string","format":"uri"},"skipKyc":{"type":"boolean"}},"$id":"InitializeRequest","$schema":"http://json-schema.org/draft-07/schema"};
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
export { InitializeRequest, InitializeRequestInterface };