import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class FindPetsByStatusAndCategoryHeaders {
  private _xRequestId?: string;
  private _acceptLanguage?: string;

  constructor(input: {
    xRequestId?: string,
    acceptLanguage?: string,
  }) {
    this._xRequestId = input.xRequestId;
    this._acceptLanguage = input.acceptLanguage;
  }

  /**
   * Unique request identifier for tracing
   */
  get xRequestId(): string | undefined { return this._xRequestId; }
  set xRequestId(xRequestId: string | undefined) { this._xRequestId = xRequestId; }

  /**
   * Preferred language for response messages
   */
  get acceptLanguage(): string | undefined { return this._acceptLanguage; }
  set acceptLanguage(acceptLanguage: string | undefined) { this._acceptLanguage = acceptLanguage; }

  public marshal() : string {
    let json = '{'
    if(this.xRequestId !== undefined) {
      json += `"X-Request-ID": ${typeof this.xRequestId === 'number' || typeof this.xRequestId === 'boolean' ? this.xRequestId : JSON.stringify(this.xRequestId)},`;
    }
    if(this.acceptLanguage !== undefined) {
      json += `"Accept-Language": ${typeof this.acceptLanguage === 'number' || typeof this.acceptLanguage === 'boolean' ? this.acceptLanguage : JSON.stringify(this.acceptLanguage)},`;
    }
  
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): FindPetsByStatusAndCategoryHeaders {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new FindPetsByStatusAndCategoryHeaders({} as any);

    if (obj["X-Request-ID"] !== undefined) {
      instance.xRequestId = obj["X-Request-ID"];
    }
    if (obj["Accept-Language"] !== undefined) {
      instance.acceptLanguage = obj["Accept-Language"];
    }
  
  
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","additionalProperties":false,"properties":{"X-Request-ID":{"type":"string","format":"uuid","pattern":"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$","description":"Unique request identifier for tracing"},"Accept-Language":{"type":"string","pattern":"^[a-z]{2}(-[A-Z]{2})?$","default":"en-US","description":"Preferred language for response messages"}},"$id":"FindPetsByStatusAndCategoryHeaders","$schema":"http://json-schema.org/draft-07/schema"};
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
export { FindPetsByStatusAndCategoryHeaders };