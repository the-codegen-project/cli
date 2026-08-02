import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormatsModule from 'ajv-formats';
interface NodeMessageInterface {
  label: string
  children?: NodeMessage[]
  additionalProperties?: Record<string, any>
}
class NodeMessage {
  private _label: string;
  private _children?: NodeMessage[];
  private _additionalProperties?: Record<string, any>;

  constructor(input: NodeMessageInterface) {
    this._label = input.label;
    this._children = input.children;
    this._additionalProperties = input.additionalProperties;
  }

  get label(): string { return this._label; }
  set label(label: string) { this._label = label; }

  get children(): NodeMessage[] | undefined { return this._children; }
  set children(children: NodeMessage[] | undefined) { this._children = children; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.label !== undefined) {
      json["label"] = this.label;
    }
    if(this.children !== undefined) {
      json["children"] = this.children.map((item: any) =>
        item && typeof item === 'object' && 'toJson' in item && typeof item.toJson === 'function'
          ? item.toJson()
          : item
      );
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["label","children","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): NodeMessage {
    const instance = new NodeMessage({} as any);

    if (obj["label"] !== undefined) {
      instance.label = obj["label"] as string;
    }
    if (obj["children"] !== undefined) {
      instance.children = obj["children"] == null
        ? undefined
        : (obj["children"] as Record<string, unknown>[]).map((item: Record<string, unknown>) => NodeMessage.fromJson(item));
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["label","children","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): NodeMessage {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return NodeMessage.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["label"],"properties":{"label":{"type":"string"},"children":{"type":"array","items":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["label"],"properties":{"label":{"type":"string"},"children":{"type":"array","items":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["label"],"properties":{"label":{"type":"string"},"children":{"type":"array","items":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["label"],"properties":{"label":{"type":"string"},"children":{"type":"array","items":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["label"],"properties":{"label":{"type":"string"},"children":{"type":"array","items":true}},"$id":"NodeMessage"}}},"$id":"NodeMessage"}}},"$id":"NodeMessage"}}},"$id":"NodeMessage"}}},"$id":"NodeMessage"};
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
export { NodeMessage };
export type { NodeMessageInterface };