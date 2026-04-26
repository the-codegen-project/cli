/* eslint-disable no-undef */
/**
 * Fetches a remote document over http(s) with optional auth headers,
 * a timeout, and typed errors. Used by every input parser when
 * `inputPath` is a URL.
 *
 * SECURITY NOTE: When `auth` is configured, the headers are sent to
 * **every** URL fetched through this helper, including external `$ref`
 * targets on other hosts. See docs/configurations#auth-scope for details.
 */
import {InputAuthConfig} from '../codegen/types';
import {CodegenError, createRemoteFetchError} from '../codegen/errors';
import {Logger} from '../LoggingInterface';

export interface FetchedDocument {
  content: string;
  contentType: string | null;
  finalUrl: string;
}

const DEFAULT_TIMEOUT_MS = 30_000;

export async function fetchRemoteDocument(
  url: string,
  auth?: InputAuthConfig,
  options: {timeoutMs?: number} = {}
): Promise<FetchedDocument> {
  Logger.debug(`[remote-fetch] GET ${url}`);

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: buildAuthHeaders(auth),
      signal: controller.signal,
      redirect: 'follow'
    });
    if (!response.ok) {
      throw createRemoteFetchError({
        url,
        status: response.status,
        statusText: response.statusText,
        reason: 'http'
      });
    }
    const content = await response.text();
    return {
      content,
      contentType: response.headers.get('content-type'),
      finalUrl: response.url || url
    };
  } catch (cause) {
    if (cause instanceof CodegenError) {
      throw cause;
    }
    if (
      cause instanceof Error &&
      (cause.name === 'AbortError' ||
        cause.message?.toLowerCase().includes('aborted'))
    ) {
      throw createRemoteFetchError({url, reason: 'timeout', cause});
    }
    throw createRemoteFetchError({url, reason: 'network', cause});
  } finally {
    clearTimeout(timer);
  }
}

function buildAuthHeaders(auth?: InputAuthConfig): Record<string, string> {
  if (!auth) {
    return {};
  }
  switch (auth.type) {
    case 'bearer':
      return {Authorization: `Bearer ${auth.token}`};
    case 'apiKey':
      return {[auth.header]: auth.value};
    case 'custom':
      return {...auth.headers};
    default:
      return {};
  }
}
