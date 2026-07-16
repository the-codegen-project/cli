import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface AdminAlertInterface {
  message?: string
}
class AdminAlert {
  private _message?: string;

  constructor(input: AdminAlertInterface) {
    this._message = input.message;
  }

  get message(): string | undefined { return this._message; }
  set message(message: string | undefined) { this._message = message; }

  public marshal() : string {
    let json = '{'
    if(this.message !== undefined) {
      json += `"message": ${typeof this.message === 'number' || typeof this.message === 'boolean' ? this.message : JSON.stringify(this.message)},`;
    }
  
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): AdminAlert {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new AdminAlert({} as any);

    if (obj["message"] !== undefined) {
      instance.message = obj["message"];
    }
  
  
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","additionalProperties":false,"properties":{"message":{"type":"string"}},"$id":"AdminAlert"};
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
export { AdminAlert, AdminAlertInterface };