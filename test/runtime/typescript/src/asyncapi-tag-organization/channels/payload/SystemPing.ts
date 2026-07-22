import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface SystemPingInterface {
  timestamp?: Date
}
class SystemPing {
  private _timestamp?: Date;

  constructor(input: SystemPingInterface) {
    this._timestamp = input.timestamp;
  }

  get timestamp(): Date | undefined { return this._timestamp; }
  set timestamp(timestamp: Date | undefined) { this._timestamp = timestamp; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.timestamp !== undefined) {
      json["timestamp"] = this.timestamp;
    }
  
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): SystemPing {
    const instance = new SystemPing({} as any);

    if (obj["timestamp"] !== undefined) {
      instance.timestamp = obj["timestamp"] == null ? undefined : new Date(obj["timestamp"] as string);
    }

  
    return instance;
  }

  public static unmarshal(json: string | object): SystemPing {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return SystemPing.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","additionalProperties":false,"properties":{"timestamp":{"type":"string","format":"date-time"}},"$id":"SystemPing"};
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
export { SystemPing, SystemPingInterface };