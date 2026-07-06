/**
 * Demo: consuming the generated Safepay sample HTTP client.
 *
 * It shows how the three generated pieces fit together:
 *   - `payload/`   request/response body models (build bodies, read responses)
 *   - `parameter/` path & query parameter models
 *   - `http_client.ts` the call functions you actually invoke
 *
 * Run with `npm run demo`. Without a server it just prints what would be sent;
 * set SAFEPAY_SERVER=<base-url> to perform the requests for real.
 */
import {http_client} from './generated/index';
import {PostV2ConnectRequest} from './generated/payload/PostV2ConnectRequest';
import {GetV2ConnectReferenceIdParameters} from './generated/parameter/GetV2ConnectReferenceIdParameters';

const server = process.env.SAFEPAY_SERVER;

async function main() {
  // 1. POST /v2/connect - a request WITH a body.
  //    Build the body with the generated request model and pass it as `payload`;
  //    the client calls `.marshal()` for you.
  const connectBody = new PostV2ConnectRequest({
    returnUrl: 'https://my-shop.example/return',
    skipKyc: false
  });
  console.log('POST /v2/connect body ->', connectBody.marshal());

  // 2. GET /v2/connect/{referenceId} - a request WITH a path parameter.
  //    Path/query params are supplied through the generated parameter model.
  const params = new GetV2ConnectReferenceIdParameters({referenceId: 'ref_123'});
  console.log(
    'GET path ->',
    params.getChannelWithParameters('/v2/connect/{referenceId}')
  );

  if (!server) {
    console.log(
      '\nSet SAFEPAY_SERVER=<base-url> to actually perform the requests.'
    );
    return;
  }

  // Every call returns an HttpClientResponse<T> where `data` is the unmarshalled,
  // fully typed response model.
  const created = await http_client.postV2Connect({server, payload: connectBody});
  console.log('connectUrl:', created.data.connectUrl);

  const connect = await http_client.getV2ConnectReferenceId({
    server,
    parameters: params
  });
  console.log(
    'safepayAccountId:',
    connect.data.safepayAccountId,
    'status:',
    connect.data.status
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
