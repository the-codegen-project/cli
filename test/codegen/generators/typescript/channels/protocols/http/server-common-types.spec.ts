/**
 * The shared block emitted once per generated `http_server.ts` — the mirror of
 * `renderHttpCommonTypes` for the client.
 */
import {renderHttpServerCommonTypes} from '../../../../../../../src/codegen/generators/typescript/channels/protocols/http/server-common-types';

describe('renderHttpServerCommonTypes', () => {
  it('declares the shared server infrastructure', () => {
    const code = renderHttpServerCommonTypes();

    expect(code).toContain('export class HttpError extends HttpGlobalError');
    expect(code).toContain('export interface HttpServerHooks');
    expect(code).toContain('export interface HttpServerContext');
    expect(code).toContain('function readJsonBody');
    expect(code).toContain('function resolveErrorResponse');
    expect(code).toContain('function sendResponse');
    expect(code).toContain('function handleHandlerError');
  });

  it('captures the global Error under an alias a payload model cannot shadow', () => {
    const code = renderHttpServerCommonTypes();

    // A document is free to declare a schema called `Error`, and its generated
    // model is imported into this very file.
    expect(code).toContain('const HttpGlobalError = globalThis.Error;');
    expect(code).toContain(
      'type HttpGlobalError = InstanceType<typeof globalThis.Error>;'
    );
    expect(code).not.toMatch(/extends Error\b/);
    expect(code).not.toMatch(/new Error\(/);
    expect(code).not.toMatch(/instanceof Error\b/);
  });

  it('emits no client-only auth, retry or OAuth2 machinery', () => {
    const code = renderHttpServerCommonTypes();

    expect(code).not.toContain('OAuth2');
    expect(code).not.toContain('RetryConfig');
    expect(code).not.toContain('AuthConfig');
    expect(code).not.toContain('ApiKeyAuth');
    expect(code).not.toContain('makeRequest');
  });

  it('never leaks a non-HttpError message into the response body', () => {
    const code = renderHttpServerCommonTypes();
    const resolver = code.slice(code.indexOf('function resolveErrorResponse'));

    expect(resolver).toContain('Internal Server Error');
    // The only message that may reach the body is the one an HttpError carries.
    expect(resolver).not.toMatch(/body:\s*\{message:\s*error\.message/);
  });

  it('is stateless — two calls produce identical output', () => {
    expect(renderHttpServerCommonTypes()).toEqual(
      renderHttpServerCommonTypes()
    );
  });

  it('matches the snapshot of the whole block', () => {
    expect(renderHttpServerCommonTypes()).toMatchSnapshot();
  });
});
