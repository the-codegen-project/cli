import {BankAccount} from './BankAccount';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import {default as addFormats} from 'ajv-formats';
interface GetV2UsersSafepayAccountIdBankAccountsResponse_200Interface {
  bankAccounts?: BankAccount[]
  additionalProperties?: Record<string, any>
}
class GetV2UsersSafepayAccountIdBankAccountsResponse_200 {
  private _bankAccounts?: BankAccount[];
  private _additionalProperties?: Record<string, any>;

  constructor(input: GetV2UsersSafepayAccountIdBankAccountsResponse_200Interface) {
    this._bankAccounts = input.bankAccounts;
    this._additionalProperties = input.additionalProperties;
  }

  get bankAccounts(): BankAccount[] | undefined { return this._bankAccounts; }
  set bankAccounts(bankAccounts: BankAccount[] | undefined) { this._bankAccounts = bankAccounts; }

  get additionalProperties(): Record<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Record<string, any> | undefined) { this._additionalProperties = additionalProperties; }

  public toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if(this.bankAccounts !== undefined) {
      json["bankAccounts"] = this.bankAccounts.map((item: any) =>
        item && typeof item === 'object' && 'toJson' in item && typeof item.toJson === 'function'
          ? item.toJson()
          : item
      );
    }
    if(this.additionalProperties !== undefined) {
      for (const [key, value] of Object.entries(this.additionalProperties)) {
        //Only unwrap those that are not already a property in the JSON object
        if(["bankAccounts","additionalProperties"].includes(String(key))) continue;
        json[key] = value;
      }
    }
    return json;
  }

  public marshal(): string {
    return JSON.stringify(this.toJson());
  }

  public static fromJson(obj: Record<string, unknown>): GetV2UsersSafepayAccountIdBankAccountsResponse_200 {
    const instance = new GetV2UsersSafepayAccountIdBankAccountsResponse_200({} as any);

    if (obj["bankAccounts"] !== undefined) {
      instance.bankAccounts = obj["bankAccounts"] == null
        ? undefined
        : (obj["bankAccounts"] as Record<string, unknown>[]).map((item: Record<string, unknown>) => BankAccount.fromJson(item));
    }

    instance.additionalProperties = {};
    const propsToCheck = Object.entries(obj).filter((([key,]) => {return !["bankAccounts","additionalProperties"].includes(key);}));
    for (const [key, value] of propsToCheck) {
      instance.additionalProperties[key] = value as any;
    }
    return instance;
  }

  public static unmarshal(json: string | object): GetV2UsersSafepayAccountIdBankAccountsResponse_200 {
    const obj = typeof json === "object" ? json : JSON.parse(json);
    return GetV2UsersSafepayAccountIdBankAccountsResponse_200.fromJson(obj as Record<string, unknown>);
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
export { GetV2UsersSafepayAccountIdBankAccountsResponse_200, GetV2UsersSafepayAccountIdBankAccountsResponse_200Interface };