/**
 * Loads native-mode EventCatalog events (an event directory holding an
 * `index.md` with frontmatter plus a JSON Schema file). The result is
 * consumed directly by the EventCatalog producers to populate
 * `{Generator}Input` shapes — no AsyncAPI synthesis round-trip.
 */
import fs from 'fs';
import path from 'path';
import {parse as parseYaml} from 'yaml';
import {createInputDocumentError} from '../../errors';
import {EventReference} from './types';

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
export function loadEvent({
  catalogRoot,
  ref
}: {
  catalogRoot: string;
  ref: EventReference;
}): LoadedEvent {
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
    // EventCatalog schema files are usually `schema.json`, but a
    // `schemaPath` in the frontmatter can point at a YAML JSON Schema
    // too. Parse YAML for `.yaml`/`.yml`, JSON otherwise (JSON parsing
    // stays strict for the common `.json` case).
    const extension = path.extname(schemaPath).toLowerCase();
    schema =
      extension === '.yaml' || extension === '.yml'
        ? (parseYaml(raw) as Record<string, unknown>)
        : JSON.parse(raw);
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
