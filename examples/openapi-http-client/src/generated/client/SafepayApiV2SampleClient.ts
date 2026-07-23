import {PostV2ConnectRequest, PostV2ConnectRequestInterface} from './../payload/PostV2ConnectRequest';
import {PostV2ConnectResponse_200, PostV2ConnectResponse_200Interface} from './../payload/PostV2ConnectResponse_200';
import {GetV2ConnectReferenceIdResponse_200, GetV2ConnectReferenceIdResponse_200Interface} from './../payload/GetV2ConnectReferenceIdResponse_200';
import {GetV2UsersSafepayAccountIdBankAccountsResponse_200, GetV2UsersSafepayAccountIdBankAccountsResponse_200Interface} from './../payload/GetV2UsersSafepayAccountIdBankAccountsResponse_200';
import {Status} from './../payload/Status';
import {BankAccount, BankAccountInterface} from './../payload/BankAccount';
import {InitializeRequest, InitializeRequestInterface} from './../payload/InitializeRequest';
import {InitializeModel, InitializeModelInterface} from './../payload/InitializeModel';
import {GetConnectModel, GetConnectModelInterface} from './../payload/GetConnectModel';
export {PostV2ConnectRequest};
export {PostV2ConnectResponse_200};
export {GetV2ConnectReferenceIdResponse_200};
export {GetV2UsersSafepayAccountIdBankAccountsResponse_200};
export {Status};
export {BankAccount};
export {InitializeRequest};
export {InitializeModel};
export {GetConnectModel};
import {GetV2ConnectReferenceIdParameters, GetV2ConnectReferenceIdParametersInterface} from './../parameter/GetV2ConnectReferenceIdParameters';
import {GetV2UsersSafepayAccountIdBankAccountsParameters, GetV2UsersSafepayAccountIdBankAccountsParametersInterface} from './../parameter/GetV2UsersSafepayAccountIdBankAccountsParameters';
export {GetV2ConnectReferenceIdParameters};
export {GetV2UsersSafepayAccountIdBankAccountsParameters};

//Import channel functions
import * as http_client from './../http_client';

/**
 * @class SafepayApiV2SampleClient
 *
 * A fully-typed HTTP client for the Safepay API V2 (sample). Construct it once with the shared request configuration
 * (baseUrl, auth, hooks, ...) and call the operation methods; every method
 * forwards to the underlying channel function with that configuration applied.
 */
export class SafepayApiV2SampleClient {
  /**
   * @param config shared HTTP configuration applied to every request. Any field
   * can be overridden per call through the method's context argument.
   */
  constructor(private readonly config: http_client.HttpClientContext = {}) {}
  
  /**
   * Invokes the `postV2Connect` operation using this client's shared configuration.
   *
   * @param context per-call request context; overrides any field set on the client.
   */
  public async postV2Connect(context: http_client.PostV2ConnectContext): Promise<Awaited<ReturnType<typeof http_client.postV2Connect>>> {
    return http_client.postV2Connect({...this.config, ...context});
  }

  /**
   * Invokes the `getV2ConnectReferenceId` operation using this client's shared configuration.
   *
   * @param context per-call request context; overrides any field set on the client.
   */
  public async getV2ConnectReferenceId(context: http_client.GetV2ConnectReferenceIdContext): Promise<Awaited<ReturnType<typeof http_client.getV2ConnectReferenceId>>> {
    return http_client.getV2ConnectReferenceId({...this.config, ...context});
  }

  /**
   * Invokes the `getV2UsersSafepayAccountIdBankAccounts` operation using this client's shared configuration.
   *
   * @param context per-call request context; overrides any field set on the client.
   */
  public async getV2UsersSafepayAccountIdBankAccounts(context: http_client.GetV2UsersSafepayAccountIdBankAccountsContext): Promise<Awaited<ReturnType<typeof http_client.getV2UsersSafepayAccountIdBankAccounts>>> {
    return http_client.getV2UsersSafepayAccountIdBankAccounts({...this.config, ...context});
  }
}