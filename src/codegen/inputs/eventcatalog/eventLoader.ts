/**
 * Loads native-mode EventCatalog events (an event directory holding an
 * index.md with frontmatter plus a JSON Schema file) and synthesizes an
 * AsyncAPI 3.0 document so the existing AsyncAPI generators can consume
 * the result without any per-input branching.
 */
import fs from 'fs';
import path from 'path';
import {parse as parseYaml} from 'yaml';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {createInputDocumentError} from '../../errors';
import {loadAsyncapiFromMemory} from '../asyncapi';
import {EventReference, ServiceMetadata} from './types';

const FRONTMATTER_DELIMITER = '---';

interface EventFrontmatter {
  id?: string;
  name?: string;
  version?: string;
  summary?: string;
  schemaPath?: string;
}

export interface LoadedEvent {
  id: string;
  schema: Record<string, unknown>;
  schemaPath: string;
}

function readEventFrontmatter(filePath: string): EventFrontmatter {
  const content = fs.readFileSync(filePath, 'utf8').trimStart();
  if (!content.startsWith(FRONTMATTER_DELIMITER)) {
    return {};
  }
  const afterFirst = content.slice(FRONTMATTER_DELIMITER.length);
  const closingIndex = afterFirst.indexOf(`\n${FRONTMATTER_DELIMITER}`);
  if (closingIndex === -1) {
    return {};
  }
  const raw = afterFirst.slice(0, closingIndex);
  const parsed = parseYaml(raw);
  return parsed && typeof parsed === 'object'
    ? (parsed as EventFrontmatter)
    : {};
}

/**
 * Load a single event from the catalog by its `EventReference`. Reads the
 * event's `index.md` frontmatter to find `schemaPath`, falling back to a
 * sibling `schema.json` if no schemaPath is set.
 */
export function loadEvent(
  catalogRoot: string,
  ref: EventReference
): LoadedEvent {
  const eventDir = path.join(catalogRoot, 'events', ref.id);
  if (!fs.existsSync(eventDir)) {
    throw createInputDocumentError({
      inputPath: eventDir,
      inputType: 'eventcatalog',
      errorMessage: `Event '${ref.id}' has no directory under events/.`
    });
  }

  const indexPath = path.join(eventDir, 'index.md');
  let frontmatter: EventFrontmatter = {};
  if (fs.existsSync(indexPath)) {
    try {
      frontmatter = readEventFrontmatter(indexPath);
    } catch (error) {
      throw createInputDocumentError({
        inputPath: indexPath,
        inputType: 'eventcatalog',
        errorMessage: `Invalid frontmatter for event '${ref.id}': ${
          error instanceof Error ? error.message : String(error)
        }`
      });
    }
  }

  const schemaPathRelative = frontmatter.schemaPath ?? 'schema.json';
  const schemaPath = path.resolve(eventDir, schemaPathRelative);

  if (!fs.existsSync(schemaPath)) {
    throw createInputDocumentError({
      inputPath: schemaPath,
      inputType: 'eventcatalog',
      errorMessage: `Schema file for event '${ref.id}' could not be resolved at ${schemaPath}.`
    });
  }

  let schema: Record<string, unknown>;
  try {
    const raw = fs.readFileSync(schemaPath, 'utf8');
    schema = JSON.parse(raw);
  } catch (error) {
    throw createInputDocumentError({
      inputPath: schemaPath,
      inputType: 'eventcatalog',
      errorMessage: `Could not read schema for event '${ref.id}': ${
        error instanceof Error ? error.message : String(error)
      }`
    });
  }

  return {
    id: ref.id,
    schema,
    schemaPath
  };
}

interface SynthesisInput {
  sends: LoadedEvent[];
  receives: LoadedEvent[];
}

/**
 * Build an AsyncAPI 3.0 document from the loaded events. Each event becomes
 * a channel with the event id as the channel name and a single message whose
 * payload is the event schema. The operation `action` is `'send'` for events
 * in `sends` and `'receive'` for events in `receives`.
 */
export async function synthesizeAsyncAPIDocument(
  service: ServiceMetadata,
  events: SynthesisInput
): Promise<AsyncAPIDocumentInterface> {
  const channels: Record<string, unknown> = {};
  const operations: Record<string, unknown> = {};

  const addChannel = (event: LoadedEvent, action: 'send' | 'receive'): void => {
    channels[event.id] = {
      address: event.id,
      messages: {
        [event.id]: {
          name: event.id,
          payload: event.schema
        }
      }
    };
    operations[`${action}${event.id}`] = {
      action,
      channel: {$ref: `#/channels/${event.id}`},
      messages: [{$ref: `#/channels/${event.id}/messages/${event.id}`}]
    };
  };

  for (const event of events.sends) {
    addChannel(event, 'send');
  }
  for (const event of events.receives) {
    addChannel(event, 'receive');
  }

  const document = {
    asyncapi: '3.0.0',
    info: {
      title: service.name ?? service.id,
      version: service.version ?? '1.0.0',
      ...(service.summary ? {description: service.summary} : {})
    },
    channels,
    operations
  };

  const parsed = await loadAsyncapiFromMemory(JSON.stringify(document));
  if (!parsed) {
    throw createInputDocumentError({
      inputPath: service.serviceDir,
      inputType: 'eventcatalog',
      errorMessage: `Failed to synthesize an AsyncAPI document for service '${service.id}'.`
    });
  }
  return parsed;
}
