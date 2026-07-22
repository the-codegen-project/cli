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

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.message !== undefined) {
      json["message"] = this.message;
    }
  
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): AdminAlert {
    const instance = new AdminAlert({} as any);

    if (obj["message"] !== undefined) {
      instance.message = obj["message"] as string;
    }

  
    return instance;
  }

  public static unmarshal(json: string | object): AdminAlert {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return AdminAlert.fromJson(obj as Record<string, unknown>);
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