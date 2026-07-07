import {BankAccountsItem} from './BankAccountsItem';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
class GetV2UsersSafepayAccountIdBankAccountsResponse_200 {
  private _bankAccounts?: BankAccountsItem[];
  private _additionalProperties?: Record<string, any>;

  constructor(input: {
    bankAccounts?: BankAccountsItem[],
    additionalProperties?: Record<string, any>,
  }) {
    this._bankAccounts = input.bankAccounts;
    this._additionalProperties = input.additionalProperties;
  }

  get bankAccounts(): BankAccountsItem[] | undefined { return this._bankAccounts; }
  set bankAccounts(bankAccounts: BankAccountsItem[] | undefined) { this._bankAccounts = bankAccounts; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public marshal() : string {
    let json = '{'
    if(this.bankAccounts !== undefined) {
      let bankAccountsJsonValues: any[] = [];
      for (const unionItem of this.bankAccounts) {
        bankAccountsJsonValues.push(`${unionItem && typeof unionItem === 'object' && 'marshal' in unionItem && typeof unionItem.marshal === 'function' ? unionItem.marshal() : JSON.stringify(unionItem)}`);
      }
      json += `"bankAccounts": [${bankAccountsJsonValues.join(',')}],`;
    }
    if(this.additionalProperties !== undefined) { 
      for (const [key, value] of this.additionalProperties.entries()) {
        //Only unwrap those that are not already a property in the JSON object
        if(["bankAccounts","additionalProperties"].includes(String(key))) continue;
        json += `"${key}": ${typeof value === 'number' || typeof value === 'boolean' ? value : JSON.stringify(value)},`;
      }
    }
    //Remove potential last comma 
    return `${json.charAt(json.length-1) === ',' ? json.slice(0, json.length-1) : json}}`;
  }

  public static unmarshal(json: string | object): GetV2UsersSafepayAccountIdBankAccountsResponse_200 {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    const instance = new GetV2UsersSafepayAccountIdBankAccountsResponse_200({} as any);

    if (obj["bankAccounts"] !== undefined) {
      instance.bankAccounts = obj["bankAccounts"] == null
        ? undefined
        : obj["bankAccounts"].map((item: any) => BankAccountsItem.unmarshal(item));
    }
  
    instance.additionalProperties = new Map();
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["bankAccounts","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties.set(key, value as any);
    }
    return instance;
  }
  public static theCodeGenSchema = {"type":"object","properties":{"bankAccounts":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"iban":{"type":"string"},"isDefault":{"type":"boolean"}}}}},"$id":"getV2UsersSafepayAccountIdBankAccounts_Response_200","$schema":"http://json-schema.org/draft-07/schema"};
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
export { GetV2UsersSafepayAccountIdBankAccountsResponse_200 };