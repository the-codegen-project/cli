import {PetCategory} from './PetCategory';
import {PetTag} from './PetTag';
import {Status} from './Status';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormats from 'ajv-formats';
class APet {
  private _id?: number;
  private _category?: PetCategory;
  private _name: string;
  private _photoUrls: string[];
  private _tags?: PetTag[];
  private _status?: Status;
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    id?: number,
    category?: PetCategory,
    name: string,
    photoUrls: string[],
    tags?: PetTag[],
    status?: Status,
    additionalProperties?: Record<string, any>,
  }) {
    this._id = input.id;
    this._category = input.category;
    this._name = input.name;
    this._photoUrls = input.photoUrls;
    this._tags = input.tags;
    this._status = input.status;
    this._additionalProperties = input.additionalProperties;
  }

  get id(): number | undefined { return this._id; }
  set id(id: number | undefined) { this._id = id; }

  get category(): PetCategory | undefined { return this._category; }
  set category(category: PetCategory | undefined) { this._category = category; }

  get name(): string { return this._name; }
  set name(name: string) { this._name = name; }

  get photoUrls(): string[] { return this._photoUrls; }
  set photoUrls(photoUrls: string[]) { this._photoUrls = photoUrls; }

  get tags(): PetTag[] | undefined { return this._tags; }
  set tags(tags: PetTag[] | undefined) { this._tags = tags; }

  get status(): Status | undefined { return this._status; }
  set status(status: Status | undefined) { this._status = status; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.id !== undefined) {
      json += `"id": ${typeof this.id === 'number' || typeof this.id === 'boolean' ? this.id : JSON.stringify(this.id)},`;
    }
    if(this.category !== undefined) {
      json += `"category": ${this.category.marshal()},`;
    }
    if(this.name !== undefined) {
      json += `"name": ${typeof this.name === 'number' || typeof this.name === 'boolean' ? this.name : JSON.stringify(this.name)},`;
    }
    if(this.photoUrls !== undefined) {
      let photoUrlsJsonValues: any[] = [];
      for (const unionItem of this.photoUrls) {
        photoUrlsJsonValues.push(`${typeof unionItem === 'number' || typeof unionItem === 'boolean' ? unionItem : JSON.stringify(unionItem)}`);
      }
      json += `"photoUrls": [${photoUrlsJsonValues.join(',')}],`;
    }
    if(this.tags !== undefined) {
      let tagsJsonValues: any[] = [];
      for (const unionItem of this.tags) {
        tagsJsonValues.push(`${unionItem.marshal()}`);
      }
      json += `"tags": [${tagsJsonValues.join(',')}],`;
    }
    if(this.status !== undefined) {
      json += `"status": ${typeof this.status === 'number' || typeof this.status === 'boolean' ? this.status : JSON.stringify(this.status)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["id","category","name","photoUrls","tags","status","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): APet {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new APet({} as any);

    if (obj["id"] !== undefined) {
      instance.id = obj["id"];
    }
    if (obj["category"] !== undefined) {
      instance.category = PetCategory.unmarshal(obj["category"]);
    }
    if (obj["name"] !== undefined) {
      instance.name = obj["name"];
    }
    if (obj["photoUrls"] !== undefined) {
      instance.photoUrls = obj["photoUrls"];
    }
    if (obj["tags"] !== undefined) {
      instance.tags = obj["tags"] == null
        ? null
        : obj["tags"].map((item: any) => PetTag.unmarshal(item));
    }
    if (obj["status"] !== undefined) {
      instance.status = obj["status"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["id","category","name","photoUrls","tags","status","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"title":"a Pet","description":"A pet for sale in the pet store","type":"object","required":["name","photoUrls"],"properties":{"id":{"type":"integer","format":"int64"},"category":{"title":"Pet category","description":"A category for a pet","type":"object","properties":{"id":{"type":"integer","format":"int64"},"name":{"type":"string","pattern":"^[a-zA-Z0-9]+[a-zA-Z0-9\\.\\-_]*[a-zA-Z0-9]+$"}},"xml":{"name":"Category"}},"name":{"type":"string","example":"doggie"},"photoUrls":{"type":"array","xml":{"name":"photoUrl","wrapped":true},"items":{"type":"string"}},"tags":{"type":"array","xml":{"name":"tag","wrapped":true},"items":{"title":"Pet Tag","description":"A tag for a pet","type":"object","properties":{"id":{"type":"integer","format":"int64"},"name":{"type":"string"}},"xml":{"name":"Tag"}}},"status":{"type":"string","description":"pet status in the store","deprecated":true,"enum":["available","pending","sold"]}},"xml":{"name":"Pet"},"$id":"Pet","$schema":"http://json-schema.org/draft-07/schema"};
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
    ajvInstance.addVocabulary(["xml", "example"])
    const validate = ajvInstance.compile(this.theCodeGenSchema);
    return validate;
  }

}
export { APet };