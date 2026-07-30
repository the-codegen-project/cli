import {Attachment} from './Attachment';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormatsModule from 'ajv-formats';
interface EmailNotificationInterface {
  recipientId: string
  subject: string
  body: string
  attachments?: Attachment[]
  additionalProperties?: Record<string, any>
}
class EmailNotification {
  private _type: 'email' = 'email';
  private _recipientId: string;
  private _subject: string;
  private _body: string;
  private _attachments?: Attachment[];
  private _additionalProperties?: Record<string, any>;

  constructor(input: EmailNotificationInterface) {
    this._recipientId = input.recipientId;
    this._subject = input.subject;
    this._body = input.body;
    this._attachments = input.attachments;
    this._additionalProperties = input.additionalProperties;
  }

  get type(): 'email' { return this._type; }

  get recipientId(): string { return this._recipientId; }
  set recipientId(recipientId: string) { this._recipientId = recipientId; }

  get subject(): string { return this._subject; }
  set subject(subject: string) { this._subject = subject; }

  get body(): string { return this._body; }
  set body(body: string) { this._body = body; }

  get attachments(): Attachment[] | undefined { return this._attachments; }
  set attachments(attachments: Attachment[] | undefined) { this._attachments = attachments; }

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
    if(this.subject !== undefined) {
      json["subject"] = this.subject;
    }
    if(this.body !== undefined) {
      json["body"] = this.body;
    }
    if(this.attachments !== undefined) {
      json["attachments"] = this.attachments.map((item: any) =>
        item && typeof item === 'object' && 'toJson' in item && typeof item.toJson === 'function'
          ? item.toJson()
          : item
      );
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["type","recipientId","subject","body","attachments","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): EmailNotification {
    const instance = new EmailNotification({} as any);

    if (obj["recipientId"] !== undefined) {
      instance.recipientId = obj["recipientId"] as string;
    }
    if (obj["subject"] !== undefined) {
      instance.subject = obj["subject"] as string;
    }
    if (obj["body"] !== undefined) {
      instance.body = obj["body"] as string;
    }
    if (obj["attachments"] !== undefined) {
      instance.attachments = obj["attachments"] == null
        ? undefined
        : (obj["attachments"] as Record<string, unknown>[]).map((item: Record<string, unknown>) => Attachment.fromJson(item));
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["type","recipientId","subject","body","attachments","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): EmailNotification {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return EmailNotification.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","required":["type","recipientId","subject","body"],"properties":{"type":{"const":"email"},"recipientId":{"type":"string"},"subject":{"type":"string"},"body":{"type":"string"},"attachments":{"type":"array","items":{"type":"object","properties":{"filename":{"type":"string"},"contentType":{"type":"string"},"data":{"type":"string","contentEncoding":"base64"}}}}}};
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
export { EmailNotification };
export type { EmailNotificationInterface };