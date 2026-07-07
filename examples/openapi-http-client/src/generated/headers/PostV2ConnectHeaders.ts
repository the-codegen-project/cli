import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
class PostV2ConnectHeaders {
  private _xCorrelationId?: string;

  constructor(input: {
    xCorrelationId?: string,
  }) {
    this._xCorrelationId = input.xCorrelationId;
  }

  /**
   * Correlation ID used for logging.
   */
  get xCorrelationId(): string | undefined { return this._xCorrelationId; }
  set xCorrelationId(xCorrelationId: string | undefined) { this._xCorrelationId = xCorrelationId; }

  public marshal() : string {
    let json = '{'
    if(this.xCorrelationId !== undefined) {
      json += `"X-Correlation-Id": ${typeof this.xCorrelationId === 'number' || typeof this.xCorrelationId === 'boolean' ? this.xCorrelationId : JSON.stringify(this.xCorrelationId)},`;
    }
  
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): PostV2ConnectHeaders {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new PostV2ConnectHeaders({} as any);

    if (obj["X-Correlation-Id"] !== undefined) {
      instance.xCorrelationId = obj["X-Correlation-Id"];
    }
  
  
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","additionalProperties":false,"properties":{"X-Correlation-Id":{"type":"string","minLength":20,"maxLength":64,"description":"Correlation ID used for logging."}},"$id":"PostV2ConnectHeaders","$schema":"http://json-schema.org/draft-07/schema"};
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
export { PostV2ConnectHeaders };