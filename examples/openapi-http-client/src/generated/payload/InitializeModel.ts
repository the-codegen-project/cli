import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
class InitializeModel {
  private _referenceId?: string;
  private _connectUrl?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    referenceId?: string,
    connectUrl?: string,
    additionalProperties?: Record<string, any>,
  }) {
    this._referenceId = input.referenceId;
    this._connectUrl = input.connectUrl;
    this._additionalProperties = input.additionalProperties;
  }

  get referenceId(): string | undefined { return this._referenceId; }
  set referenceId(referenceId: string | undefined) { this._referenceId = referenceId; }

  get connectUrl(): string | undefined { return this._connectUrl; }
  set connectUrl(connectUrl: string | undefined) { this._connectUrl = connectUrl; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.referenceId !== undefined) {
      json += `"referenceId": ${typeof this.referenceId === 'number' || typeof this.referenceId === 'boolean' ? this.referenceId : JSON.stringify(this.referenceId)},`;
    }
    if(this.connectUrl !== undefined) {
      json += `"connectUrl": ${typeof this.connectUrl === 'number' || typeof this.connectUrl === 'boolean' ? this.connectUrl : JSON.stringify(this.connectUrl)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["referenceId","connectUrl","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): InitializeModel {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new InitializeModel({} as any);

    if (obj["referenceId"] !== undefined) {
      instance.referenceId = obj["referenceId"];
    }
    if (obj["connectUrl"] !== undefined) {
      instance.connectUrl = obj["connectUrl"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["referenceId","connectUrl","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","properties":{"referenceId":{"type":"string"},"connectUrl":{"type":"string","format":"uri"}},"$id":"InitializeModel","$schema":"http://json-schema.org/draft-07/schema"};
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
export { InitializeModel };