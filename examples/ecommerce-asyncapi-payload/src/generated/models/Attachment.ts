import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface AttachmentInterface {
  filename?: string
  contentType?: string
  data?: string
  additionalProperties?: Record<string, any>
}
class Attachment {
  private _filename?: string;
  private _contentType?: string;
  private _data?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: AttachmentInterface) {
    this._filename = input.filename;
    this._contentType = input.contentType;
    this._data = input.data;
    this._additionalProperties = input.additionalProperties;
  }

  get filename(): string | undefined { return this._filename; }
  set filename(filename: string | undefined) { this._filename = filename; }

  get contentType(): string | undefined { return this._contentType; }
  set contentType(contentType: string | undefined) { this._contentType = contentType; }

  get data(): string | undefined { return this._data; }
  set data(data: string | undefined) { this._data = data; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.filename !== undefined) {
      json["filename"] = this.filename;
    }
    if(this.contentType !== undefined) {
      json["contentType"] = this.contentType;
    }
    if(this.data !== undefined) {
      json["data"] = this.data;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["filename","contentType","data","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): Attachment {
    const instance = new Attachment({} as any);

    if (obj["filename"] !== undefined) {
      instance.filename = obj["filename"] as string;
    }
    if (obj["contentType"] !== undefined) {
      instance.contentType = obj["contentType"] as string;
    }
    if (obj["data"] !== undefined) {
      instance.data = obj["data"] as string;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["filename","contentType","data","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): Attachment {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return Attachment.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","properties":{"filename":{"type":"string"},"contentType":{"type":"string"},"data":{"type":"string","contentEncoding":"base64"}}};
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
export { Attachment, AttachmentInterface };