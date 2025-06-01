import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class Attachment {
  private _filename?: string;
  private _contentType?: string;
  private _data?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    filename?: string,
    contentType?: string,
    data?: string,
    additionalProperties?: Record<string, any>,
  }) {
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

  public marshal() : string {
    let json = '{'
    if(this.filename !== undefined) {
      json += `"filename": ${typeof this.filename === 'number' || typeof this.filename === 'boolean' ? this.filename : JSON.stringify(this.filename)},`;
    }
    if(this.contentType !== undefined) {
      json += `"contentType": ${typeof this.contentType === 'number' || typeof this.contentType === 'boolean' ? this.contentType : JSON.stringify(this.contentType)},`;
    }
    if(this.data !== undefined) {
      json += `"data": ${typeof this.data === 'number' || typeof this.data === 'boolean' ? this.data : JSON.stringify(this.data)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["filename","contentType","data","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): Attachment {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new Attachment({} as any);

    if (obj["filename"] !== undefined) {
      instance.filename = obj["filename"];
    }
    if (obj["contentType"] !== undefined) {
      instance.contentType = obj["contentType"];
    }
    if (obj["data"] !== undefined) {
      instance.data = obj["data"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["filename","contentType","data","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","properties":{"filename":{"type":"string"},"contentType":{"type":"string"},"data":{"type":"string","contentEncoding":"base64"}}};
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
export { Attachment };