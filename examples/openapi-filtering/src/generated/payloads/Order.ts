import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface OrderInterface {
  id?: string
  total?: number
  additionalProperties?: Record<string, any>
}
class Order {
  private _id?: string;
  private _total?: number;
  private _additionalProperties?: Record<string, any>;

  constructor(input: OrderInterface) {
    this._id = input.id;
    this._total = input.total;
    this._additionalProperties = input.additionalProperties;
  }

  get id(): string | undefined { return this._id; }
  set id(id: string | undefined) { this._id = id; }

  get total(): number | undefined { return this._total; }
  set total(total: number | undefined) { this._total = total; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.id !== undefined) {
      json["id"] = this.id;
    }
    if(this.total !== undefined) {
      json["total"] = this.total;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["id","total","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): Order {
    const instance = new Order({} as any);

    if (obj["id"] !== undefined) {
      instance.id = obj["id"] as string;
    }
    if (obj["total"] !== undefined) {
      instance.total = obj["total"] as number;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["id","total","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): Order {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return Order.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","properties":{"id":{"type":"string"},"total":{"type":"number"}}};
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
export { Order, OrderInterface };