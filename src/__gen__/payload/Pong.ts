
class Pong {
  private _event?: 'pong' = 'pong';
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    additionalProperties?: Record<string, any>,
  }) {
    this._additionalProperties = input.additionalProperties;
  }

  get event(): 'pong' | undefined { return this._event; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.event !== undefined) {
      json += `"event": ${typeof this.event === 'number' || typeof this.event === 'boolean' ? this.event : JSON.stringify(this.event)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["event","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): Pong {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new Pong({} as any);

  
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["event","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
}
export { Pong };