import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class PushNotification {
  private _type: 'push' = 'push';
  private _recipientId: string;
  private _title: string;
  private _body: string;
  private _badge?: number;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    recipientId: string,
    title: string,
    body: string,
    badge?: number,
    additionalProperties?: Record<string, any>,
  }) {
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

  public marshal() : string {
    let json = '{'
    if(this.type !== undefined) {
      json += `"type": ${typeof this.type === 'number' || typeof this.type === 'boolean' ? this.type : JSON.stringify(this.type)},`;
    }
    if(this.recipientId !== undefined) {
      json += `"recipientId": ${typeof this.recipientId === 'number' || typeof this.recipientId === 'boolean' ? this.recipientId : JSON.stringify(this.recipientId)},`;
    }
    if(this.title !== undefined) {
      json += `"title": ${typeof this.title === 'number' || typeof this.title === 'boolean' ? this.title : JSON.stringify(this.title)},`;
    }
    if(this.body !== undefined) {
      json += `"body": ${typeof this.body === 'number' || typeof this.body === 'boolean' ? this.body : JSON.stringify(this.body)},`;
    }
    if(this.badge !== undefined) {
      json += `"badge": ${typeof this.badge === 'number' || typeof this.badge === 'boolean' ? this.badge : JSON.stringify(this.badge)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["type","recipientId","title","body","badge","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): PushNotification {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new PushNotification({} as any);

    if (obj["recipientId"] !== undefined) {
      instance.recipientId = obj["recipientId"];
    }
    if (obj["title"] !== undefined) {
      instance.title = obj["title"];
    }
    if (obj["body"] !== undefined) {
      instance.body = obj["body"];
    }
    if (obj["badge"] !== undefined) {
      instance.badge = obj["badge"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["type","recipientId","title","body","badge","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","required":["type","recipientId","title","body"],"properties":{"type":{"const":"push"},"recipientId":{"type":"string"},"title":{"type":"string"},"body":{"type":"string"},"badge":{"type":"integer","minimum":0}}};
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
export { PushNotification };