/* eslint-disable no-undef */
/**
 * Custom http/https resolver factories for cross-spec `$ref`
 * dereferencing. Both factories delegate to `fetchRemoteDocument` so the
 * same auth headers are attached to every resolved reference.
 *
 * - `createOpenapiRefParserResolver` returns the `resolve.http` shape
 *   expected by `@apidevtools/json-schema-ref-parser`.
 * - `createAsyncapiResolvers` returns the resolver array expected by
 *   `@asyncapi/parser`'s `__unstable.resolver` option (Spectral resolver
 *   shape, `read(uri): string | undefined | Promise<string | undefined>`).
 *
 * Both factories emit a debug log per fetched URL, and an info-level
 * warning the first time auth headers are sent to a host that differs
 * from the root document's host.
 */
import {fetchRemoteDocument} from './remoteFetch';
import {InputAuthConfig} from '../codegen/types';
import {Logger} from '../LoggingInterface';

export interface RefResolverContext {
  /** The URL of the root input document — used to detect cross-host fetches. */
  rootUrl: string;
}

interface OpenapiHttpResolver {
  order: number;
  canRead: (file: {url: string}) => boolean;
  read: (file: {url: string}) => Promise<string>;
  /**
   * v14 of @apidevtools/json-schema-ref-parser blocks loopback / internal
   * URLs (127.0.0.1, localhost, etc.) by default. We trust the user's
   * inputPath, so disable the safe-url check.
   */
  safeUrlResolver: false;
}

interface AsyncapiResolver {
  schema: 'http' | 'https';
  read: (uri: {toString(): string}) => Promise<string>;
}

function rootHost(rootUrl: string): string | undefined {
  try {
    return new URL(rootUrl).host;
  } catch {
    return undefined;
  }
}

function createCrossHostWarner(
  rootUrl: string,
  hasAuth: boolean
): (refUrl: string) => void {
  const root = rootHost(rootUrl);
  const warnedHosts = new Set<string>();
  return (refUrl: string) => {
    if (!hasAuth || !root) {
      return;
    }
    let refUrlHost: string | undefined;
    try {
      refUrlHost = new URL(refUrl).host;
    } catch {
      return;
    }
    if (!refUrlHost || refUrlHost === root) {
      return;
    }
    if (warnedHosts.has(refUrlHost)) {
      return;
    }
    warnedHosts.add(refUrlHost);
    Logger.info(
      `[remote-fetch] auth headers sent to '${refUrlHost}' while resolving $ref from '${root}'. If this is unexpected, review the spec.`
    );
  };
}

export function createOpenapiRefParserResolver(
  auth: InputAuthConfig | undefined,
  context: RefResolverContext
): OpenapiHttpResolver {
  const warn = createCrossHostWarner(context.rootUrl, Boolean(auth));
  return {
    order: 1,
    safeUrlResolver: false,
    canRead: (file: {url: string}): boolean =>
      file.url.startsWith('http://') || file.url.startsWith('https://'),
    read: async (file: {url: string}): Promise<string> => {
      Logger.debug(`[remote-fetch] $ref ${file.url}`);
      warn(file.url);
      const {content} = await fetchRemoteDocument(file.url, auth);
      return content;
    }
  };
}

export function createAsyncapiResolvers(
  auth: InputAuthConfig | undefined,
  context: RefResolverContext
): AsyncapiResolver[] {
  const warn = createCrossHostWarner(context.rootUrl, Boolean(auth));
  const read = async (uri: {toString(): string}): Promise<string> => {
    const url = uri.toString();
    Logger.debug(`[remote-fetch] $ref ${url}`);
    warn(url);
    const {content} = await fetchRemoteDocument(url, auth);
    return content;
  };
  return [
    {schema: 'http', read},
    {schema: 'https', read}
  ];
}
