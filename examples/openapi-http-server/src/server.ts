/**
 * The server side: mount the generated handler stubs on an Express router.
 *
 * Everything here that is *not* business logic is generated — routing, request
 * parsing, parameter extraction, header deserialization, request validation,
 * response marshalling and error mapping. What you write is the body of each
 * `callback`, and the type system tells you exactly which statuses and payload
 * shapes you are allowed to return.
 */
import express, {Express, Router} from 'express';
import {
  HttpError,
  registerGetV2ConnectReferenceId,
  registerGetV2UsersSafepayAccountIdBankAccounts,
  registerPostV2Connect
} from './generated/http_server';
import {BankAccount} from './generated/payload/BankAccount';
import {Status} from './generated/payload/Status';

/** A stand-in for whatever your real data store is. */
const connectSessions = new Map<
  string,
  {safepayAccountId: string; status: Status}
>();

export function createSafepayRouter(): Router {
  const router = Router();

  // POST /v2/connect — a request WITH a body.
  // `body` arrives as a validated `PostV2ConnectRequest` instance; the request
  // is rejected with 400 before this runs if it does not match the schema.
  registerPostV2Connect({
    router,
    additionalHeaders: {'X-Powered-By': 'the-codegen-project'},
    callback: ({body, requestHeaders}) => {
      if (!body.returnUrl.startsWith('https://')) {
        // Throw an HttpError to answer with a specific status. Anything else
        // you throw becomes a 500 with no details leaked.
        throw new HttpError('returnUrl must be https', 400, 'Bad Request', {
          field: 'returnUrl'
        });
      }

      const referenceId = `ref_${connectSessions.size + 1}`;
      connectSessions.set(referenceId, {
        safepayAccountId: `acct_${connectSessions.size + 1}`,
        status: Status.PENDING
      });

      // The return value is the response. A plain object literal is fine — it
      // is normalized to the generated model before being marshalled.
      return {
        status: 200,
        body: {referenceId, connectUrl: `https://connect.example/${referenceId}`},
        headers: {
          'X-Correlation-Id': requestHeaders.xMinusCorrelationMinusId ?? 'none'
        }
      };
    }
  });

  // GET /v2/connect/{referenceId} — path parameters arrive typed and parsed.
  registerGetV2ConnectReferenceId({
    router,
    callback: ({parameters}) => {
      const session = connectSessions.get(parameters.referenceId);
      if (!session) {
        // 404 is a declared response for this operation, so it is returnable
        // directly. Returning an undeclared status is a compile error.
        return {status: 404};
      }
      return {
        status: 200,
        body: {
          referenceId: parameters.referenceId,
          safepayAccountId: session.safepayAccountId,
          status: session.status
        }
      };
    }
  });

  registerGetV2UsersSafepayAccountIdBankAccounts({
    router,
    callback: ({parameters}) => ({
      status: 200,
      // Only the top-level response body accepts a plain object literal;
      // nested models are typed as their generated class, so build those.
      body: {
        bankAccounts: [
          new BankAccount({
            id: `ba_${parameters.safepayAccountId}`,
            iban: 'DK5000400440116243',
            isDefault: true
          })
        ]
      }
    })
  });

  return router;
}

/**
 * Nothing generated ever calls `listen` or constructs a `Router` — mounting is
 * yours. `app.use('/prefix', router)` works too: the generated code reads the
 * mount-relative `request.url`, so path templates still match.
 */
export function createSafepayApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(createSafepayRouter());
  return app;
}
