/**
 * Demo: consuming the generated Safepay sample HTTP client.
 *
 * Two ways to call the API are shown:
 *   - The `client` preset: a single class (`SafepayApiV2SampleClient`)
 *     constructed once with the shared config (server, auth, ...); every
 *     operation is a method that reuses that config.
 *   - The `channels` preset: standalone per-operation functions where each
 *     call carries its own context. The class simply forwards to these.
 *
 * The supporting generated pieces:
 *   - `payload/`   request/response body models (build bodies, read responses)
 *   - `parameter/` path & query parameter models
 *
 * Run with `npm run demo`. Without a server it just prints what would be sent;
 * set SAFEPAY_SERVER=<base-url> to perform the requests for real.
 */
import {http_client} from './generated/index';
import {SafepayApiV2SampleClient} from './generated/client/SafepayApiV2SampleClient';
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

  // Construct the client once with the shared configuration. Every method call
  // reuses `server`/`auth` and returns an HttpClientResponse<T> whose `data` is
  // the unmarshalled, fully typed response model.
  const safepay = new SafepayApiV2SampleClient({
    server,
    auth: {type: 'bearer', token: process.env.SAFEPAY_TOKEN ?? ''}
  });

  const created = await safepay.postV2Connect({payload: connectBody});
  console.log('connectUrl:', created.data.connectUrl);

  const connect = await safepay.getV2ConnectReferenceId({parameters: params});
  console.log(
    'safepayAccountId:',
    connect.data.safepayAccountId,
    'status:',
    connect.data.status
  );

  // Ergonomic alternative: pass a plain object satisfying the parameter
  // interface. The channel normalizes it to a class instance internally, so
  // you get identical behavior without constructing the model yourself.
  const connectPlain = await safepay.getV2ConnectReferenceId({
    parameters: {referenceId: 'ref_123'}
  });
  console.log('safepayAccountId (plain object):', connectPlain.data.safepayAccountId);

  // The standalone channel functions remain available for one-off calls where
  // constructing a client is unnecessary.
  await http_client.postV2Connect({server, payload: connectBody});
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
