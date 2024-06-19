
class UserSignedUp {
  private _displayName?: string;
  private _email?: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    displayName?: string,
    email?: string,
    additionalProperties?: Map<string, any>,
  }) {
    this._displayName = input.displayName;
    this._email = input.email;
    this._additionalProperties = input.additionalProperties;
  }

  get displayName(): string | undefined { return this._displayName; }
  set displayName(displayName: string | undefined) { this._displayName = displayName; }

  get email(): string | undefined { return this._email; }
  set email(email: string | undefined) { this._email = email; }

  get additionalProperties(): Map<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.displayName !== undefined) {
      json += `"displayName": ${typeof this.displayName === 'number' || typeof this.displayName === 'boolean' ? this.displayName : JSON.stringify(this.displayName)},`;
    }
    if(this.email !== undefined) {
      json += `"email": ${typeof this.email === 'number' || typeof this.email === 'boolean' ? this.email : JSON.stringify(this.email)},`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["displayName","email","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): UserSignedUp {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new UserSignedUp({} as any);

    if (obj["displayName"] !== undefined) {
      instance.displayName = obj["displayName"];
    }
    if (obj["email"] !== undefined) {
      instance.email = obj["email"];
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["displayName","email","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
}
export { UserSignedUp };