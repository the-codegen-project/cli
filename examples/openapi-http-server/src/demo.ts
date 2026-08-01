/**
 * Demo: the generated HTTP client calling the generated HTTP server.
 *
 * Both sides come out of the same OpenAPI document, so they are exact
 * inverses — what `http_server.ts` marshals, `http_client.ts` unmarshals.
 *
 * Run with `npm run demo`.
 */
import {AddressInfo} from 'node:net';
import {http_client} from './generated/index';
import {createSafepayApp} from './server';

async function main(): Promise<void> {
  const app = createSafepayApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
  console.log(`Server listening on ${baseUrl}\n`);

  try {
    // POST /v2/connect — the client marshals the body, the server validates and
    // unmarshals it, and the response travels back the same way.
    const created = await http_client.postV2Connect({
      baseUrl,
      payload: {returnUrl: 'https://my-shop.example/return', skipKyc: false},
      requestHeaders: {xMinusCorrelationMinusId: 'demo-1'}
    });
    console.log('POST /v2/connect ->', created.status, created.data.marshal());
    console.log('  X-Powered-By    ->', created.headers['x-powered-by']);
    console.log('  X-Correlation-Id ->', created.headers['x-correlation-id']);

    const referenceId = created.data.referenceId as string;

    // GET /v2/connect/{referenceId} — path parameters round-trip through the
    // generated parameter model on both sides.
    const connect = await http_client.getV2ConnectReferenceId({
      baseUrl,
      parameters: {referenceId}
    });
    console.log(
      `\nGET /v2/connect/${referenceId} ->`,
      connect.status,
      connect.data.marshal()
    );

    const bankAccounts =
      await http_client.getV2UsersSafepayAccountIdBankAccounts({
        baseUrl,
        parameters: {safepayAccountId: connect.data.safepayAccountId as string}
      });
    console.log('\nGET bank accounts ->', bankAccounts.status, bankAccounts.data.marshal());

    // A status the server declares and returns; the client turns a non-OK
    // response into a thrown HttpError.
    try {
      await http_client.getV2ConnectReferenceId({
        baseUrl,
        parameters: {referenceId: 'does-not-exist'}
      });
    } catch (error) {
      console.log('\nUnknown referenceId ->', (error as {status: number}).status);
    }
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
