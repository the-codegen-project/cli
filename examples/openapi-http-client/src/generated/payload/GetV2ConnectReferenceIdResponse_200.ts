import {Status} from './Status';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface GetV2ConnectReferenceIdResponse_200Interface {
  referenceId?: string
  safepayAccountId?: string
  status?: Status
  additionalProperties?: Record<string, any>
}
class GetV2ConnectReferenceIdResponse_200 {
  private _referenceId?: string;
  private _safepayAccountId?: string;
  private _status?: Status;
  private _additionalProperties?: Record<string, any>;

  constructor(input: GetV2ConnectReferenceIdResponse_200Interface) {
    this._referenceId = input.referenceId;
    this._safepayAccountId = input.safepayAccountId;
    this._status = input.status;
    this._additionalProperties = input.additionalProperties;
  }

  get referenceId(): string | undefined { return this._referenceId; }
  set referenceId(referenceId: string | undefined) { this._referenceId = referenceId; }

  get safepayAccountId(): string | undefined { return this._safepayAccountId; }
  set safepayAccountId(safepayAccountId: string | undefined) { this._safepayAccountId = safepayAccountId; }

  get status(): Status | undefined { return this._status; }
  set status(status: Status | undefined) { this._status = status; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.referenceId !== undefined) {
      json["referenceId"] = this.referenceId;
    }
    if(this.safepayAccountId !== undefined) {
      json["safepayAccountId"] = this.safepayAccountId;
    }
    if(this.status !== undefined) {
      json["status"] = this.status;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["referenceId","safepayAccountId","status","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): GetV2ConnectReferenceIdResponse_200 {
    const instance = new GetV2ConnectReferenceIdResponse_200({} as any);

    if (obj["referenceId"] !== undefined) {
      instance.referenceId = obj["referenceId"] as string;
    }
    if (obj["safepayAccountId"] !== undefined) {
      instance.safepayAccountId = obj["safepayAccountId"] as string;
    }
    if (obj["status"] !== undefined) {
      instance.status = obj["status"] as Status;
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["referenceId","safepayAccountId","status","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): GetV2ConnectReferenceIdResponse_200 {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return GetV2ConnectReferenceIdResponse_200.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","properties":{"referenceId":{"type":"string"},"safepayAccountId":{"type":"string"},"status":{"type":"string","enum":["pending","connected","expired"]}},"$id":"getV2ConnectReferenceId_Response_200","$schema":"http://json-schema.org/draft-07/schema"};
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
export { GetV2ConnectReferenceIdResponse_200, GetV2ConnectReferenceIdResponse_200Interface };