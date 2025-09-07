import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class Pong {
  private _pong?: string;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    pong?: string,
    additionalProperties?: Record<string, any>,
  }) {
    this._pong = input.pong;
    this._additionalProperties = input.additionalProperties;
  }

  get pong(): string | undefined { return this._pong; }
  set pong(pong: string | undefined) { this._pong = pong; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.pong !== undefined) {
      json += `"pong": ${typeof this.pong === 'number' || typeof this.pong === 'boolean' ? this.pong : JSON.stringify(this.pong)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["pong","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): Pong {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new Pong({} as any);

    if (obj["pong"] !== undefined) {
      instance.pong = obj["pong"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["pong","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","properties":{"pong":{"type":"string","description":"pong name"}},"$id":"pong"};
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
export { Pong };