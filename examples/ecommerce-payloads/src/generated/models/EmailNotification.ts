import {Attachment} from './Attachment';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class EmailNotification {
  private _type: 'email' = 'email';
  private _recipientId: string;
  private _subject: string;
  private _body: string;
  private _attachments?: Attachment[];
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    recipientId: string,
    subject: string,
    body: string,
    attachments?: Attachment[],
    additionalProperties?: Record<string, any>,
  }) {
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

  public marshal() : string {
    let json = '{'
    if(this.type !== undefined) {
      json += `"type": ${typeof this.type === 'number' || typeof this.type === 'boolean' ? this.type : JSON.stringify(this.type)},`;
    }
    if(this.recipientId !== undefined) {
      json += `"recipientId": ${typeof this.recipientId === 'number' || typeof this.recipientId === 'boolean' ? this.recipientId : JSON.stringify(this.recipientId)},`;
    }
    if(this.subject !== undefined) {
      json += `"subject": ${typeof this.subject === 'number' || typeof this.subject === 'boolean' ? this.subject : JSON.stringify(this.subject)},`;
    }
    if(this.body !== undefined) {
      json += `"body": ${typeof this.body === 'number' || typeof this.body === 'boolean' ? this.body : JSON.stringify(this.body)},`;
    }
    if(this.attachments !== undefined) {
      let attachmentsJsonValues: any[] = [];
      for (const unionItem of this.attachments) {
        attachmentsJsonValues.push(`${unionItem.marshal()}`);
      }
      json += `"attachments": [${attachmentsJsonValues.join(',')}],`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["type","recipientId","subject","body","attachments","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): EmailNotification {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new EmailNotification({} as any);

    if (obj["recipientId"] !== undefined) {
      instance.recipientId = obj["recipientId"];
    }
    if (obj["subject"] !== undefined) {
      instance.subject = obj["subject"];
    }
    if (obj["body"] !== undefined) {
      instance.body = obj["body"];
    }
    if (obj["attachments"] !== undefined) {
      instance.attachments = obj["attachments"] == null
        ? null
        : obj["attachments"].map((item: any) => Attachment.unmarshal(item));
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["type","recipientId","subject","body","attachments","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","required":["type","recipientId","subject","body"],"properties":{"type":{"const":"email"},"recipientId":{"type":"string"},"subject":{"type":"string"},"body":{"type":"string"},"attachments":{"type":"array","items":{"type":"object","properties":{"filename":{"type":"string"},"contentType":{"type":"string"},"data":{"type":"string","contentEncoding":"base64"}}}}}};
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
    const validate = ajvInstance.compile(this.theCodeGenSchema);
    return validate;
  }

}
export { EmailNotification };