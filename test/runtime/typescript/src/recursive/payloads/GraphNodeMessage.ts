import {GraphEdge} from './GraphEdge';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormatsModule from 'ajv-formats';
interface GraphNodeMessageInterface {
  name: string
  edge?: GraphEdge
  additionalProperties?: Record<string, any>
}
class GraphNodeMessage {
  private _name: string;
  private _edge?: GraphEdge;
  private _additionalProperties?: Record<string, any>;

  constructor(input: GraphNodeMessageInterface) {
    this._name = input.name;
    this._edge = input.edge;
    this._additionalProperties = input.additionalProperties;
  }

  get name(): string { return this._name; }
  set name(name: string) { this._name = name; }

  get edge(): GraphEdge | undefined { return this._edge; }
  set edge(edge: GraphEdge | undefined) { this._edge = edge; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.name !== undefined) {
      json["name"] = this.name;
    }
    if(this.edge !== undefined) {
      json["edge"] = this.edge && typeof this.edge === 'object' && 'toJson' in this.edge && typeof this.edge.toJson === 'function' ? this.edge.toJson() : this.edge;
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["name","edge","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): GraphNodeMessage {
    const instance = new GraphNodeMessage({} as any);

    if (obj["name"] !== undefined) {
      instance.name = obj["name"] as string;
    }
    if (obj["edge"] !== undefined) {
      instance.edge = GraphEdge.fromJson(obj["edge"] as Record<string, unknown>);
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["name","edge","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): GraphNodeMessage {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return GraphNodeMessage.fromJson(obj as Record<string, unknown>);
  }
  public static theCodeGenSchema = {"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":{"type":"object","$schema":"http://json-schema.org/draft-07/schema","required":["name"],"properties":{"name":{"type":"string"},"edge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}},"$id":"GraphNodeMessage","definitions":{"GraphEdge":{"type":"object","required":["weight"],"properties":{"weight":{"type":"number"},"target":true},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}}}},"$id":"GraphEdge"}}};
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
export { GraphNodeMessage };
export type { GraphNodeMessageInterface };