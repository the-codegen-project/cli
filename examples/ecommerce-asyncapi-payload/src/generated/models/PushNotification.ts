import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormatsModule from 'ajv-formats';
interface PushNotificationInterface {
  recipientId: string
  title: string
  body: string
  badge?: number
  additionalProperties?: Record<string, any>
}
class PushNotification {
  private _type: 'push' = 'push';
  private _recipientId: string;
  private _title: string;
  private _body: string;
  private _badge?: number;
  private _additionalProperties?: Record<string, any>;

  constructor(input: PushNotificationInterface) {
    this._recipientId = input.recipientId;
    this._title = input.title;
    this._body = input.body;
    this._badge = input.badge;
    this._additionalProperties = input.additionalProperties;
  }

  get type(): 'push' { return this._type; }

  get recipientId(): string { return this._recipientId; }
  set recipientId(recipientId: string) { this._recipientId = recipientId; }

  get title(): string { return this._title; }
  set title(title: string) { this._title = title; }

  get body(): string { return this._body; }
  set body(body: string) { this._body = body; }

  get badge(): number | undefined { return this._badge; }
  set badge(badge: number | undefined) { this._badge = badge; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.type !== undefined) {
      json["type"] = this.type;
    }
    if(this.recipientId !== undefined) {
      json["recipientId"] = this.recipientId;
    }
    if(this.title !== undefined) {
      json["title"] = this.title;
    }
    if(this.body !== undefined) {
      json["body"] = this.body;
    }
    if(this.badge !== undefined) {
      json["badge"] = this.badge;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["type","recipientId","title","body","badge","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): PushNotification {
    const instance = new PushNotification({} as any);

    if (obj["recipientId"] !== undefined) {
      instance.recipientId = obj["recipientId"] as string;
    }
    if (obj["title"] !== undefined) {
      instance.title = obj["title"] as string;
    }
    if (obj["body"] !== undefined) {
      instance.body = obj["body"] as string;
    }
    if (obj["badge"] !== undefined) {
      instance.badge = obj["badge"] as number;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["type","recipientId","title","body","badge","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): PushNotification {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return PushNotification.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","required":["type","recipientId","title","body"],"properties":{"type":{"const":"push"},"recipientId":{"type":"string"},"title":{"type":"string"},"body":{"type":"string"},"badge":{"type":"integer","minimum":0}}};
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
    // `ajv-formats` is CommonJS; its default import is the module namespace under
    // `moduleResolution: node16`/`nodenext`, so unwrap `.default` when present.
    const addFormats = ((addFormatsModule as unknown as {default?: unknown}).default ?? addFormatsModule) as (ajv: Ajv) => Ajv;
    addFormats(ajvInstance);
  
    const validate = ajvInstance.compile(this.theCodeGenSchema);
    return validate;
  }

}
export { PushNotification };
export type { PushNotificationInterface };