/**
 * Loads service metadata from an EventCatalog directory by parsing
 * the YAML frontmatter of the service's index.md.
 */
import fs from 'fs';
import path from 'path';
import {parse as parseYaml} from 'yaml';
import {CodegenError, ErrorType, createInputDocumentError} from '../../errors';
import {isRemoteUrl} from '../../../utils/inputSource';
import {EventReference, ServiceMetadata} from './types';

interface ServiceFrontmatter {
  id?: string;
  name?: string;
  version?: string;
  summary?: string;
  sends?: EventReference[];
  receives?: EventReference[];
  specifications?: {
    asyncapiPath?: string;
    openapiPath?: string;
  };
}

const FRONTMATTER_DELIMITER = '---';

function readFrontmatter(filePath: string): ServiceFrontmatter {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw createInputDocumentError({
      inputPath: filePath,
      inputType: 'eventcatalog',
      errorMessage: `Could not read file: ${error instanceof Error ? error.message : String(error)}`
    });
  }

  const trimmed = content.trimStart();
  if (!trimmed.startsWith(FRONTMATTER_DELIMITER)) {
    throw createInputDocumentError({
      inputPath: filePath,
      inputType: 'eventcatalog',
      errorMessage: `Missing YAML frontmatter (expected the file to start with '---').`
    });
  }
  const afterFirst = trimmed.slice(FRONTMATTER_DELIMITER.length);
  const closingIndex = afterFirst.indexOf(`\n${FRONTMATTER_DELIMITER}`);
  if (closingIndex === -1) {
    throw createInputDocumentError({
      inputPath: filePath,
      inputType: 'eventcatalog',
      errorMessage: `Missing closing YAML frontmatter delimiter ('---').`
    });
  }
  const rawFrontmatter = afterFirst.slice(0, closingIndex);
  try {
    const parsed = parseYaml(rawFrontmatter);
    if (parsed && typeof parsed === 'object') {
      return parsed as ServiceFrontmatter;
    }
    return {};
  } catch (error) {
    throw createInputDocumentError({
      inputPath: filePath,
      inputType: 'eventcatalog',
      errorMessage: `Invalid YAML frontmatter: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

function listAvailableServices(servicesDir: string): string[] {
  try {
    return fs
      .readdirSync(servicesDir, {withFileTypes: true})
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

function resolveSpecPath(specPath: string, serviceDir: string): string {
  if (isRemoteUrl(specPath)) {
    return specPath;
  }
  return path.resolve(serviceDir, specPath);
}

function normalizeEventReferences(
  refs: EventReference[] | undefined
): EventReference[] {
  if (!Array.isArray(refs)) {
    return [];
  }
  return refs
    .filter(
      (ref): ref is EventReference => Boolean(ref) && typeof ref.id === 'string'
    )
    .map((ref) => ({id: ref.id, version: ref.version}));
}

/**
 * Resolve a service inside an EventCatalog directory and parse its metadata.
 *
 * @param catalogRoot Absolute path to the EventCatalog root (the directory
 *   that contains the `services/` folder).
 * @param serviceId The `id` of the service to load. Matches the directory
 *   name under `services/`.
 */
export function loadServiceMetadata(
  catalogRoot: string,
  serviceId: string
): ServiceMetadata {
  const servicesDir = path.join(catalogRoot, 'services');
  const serviceDir = path.join(servicesDir, serviceId);
  const indexPath = path.join(serviceDir, 'index.md');

  if (!fs.existsSync(serviceDir)) {
    const available = listAvailableServices(servicesDir);
    const availableHint = available.length
      ? ` Available services: ${available.join(', ')}.`
      : ' No services were found in the catalog.';
    throw new CodegenError({
      type: ErrorType.INPUT_DOCUMENT_ERROR,
      message: `EventCatalog service '${serviceId}' was not found at ${serviceDir}.${availableHint}`,
      help: `Check that 'service' in your codegen configuration matches a directory under '<inputPath>/services/'.`
    });
  }

  if (!fs.existsSync(indexPath)) {
    throw createInputDocumentError({
      inputPath: indexPath,
      inputType: 'eventcatalog',
      errorMessage: `Service '${serviceId}' is missing an index.md file.`
    });
  }

  const frontmatter = readFrontmatter(indexPath);

  const specifications = frontmatter.specifications
    ? {
        asyncapiPath: frontmatter.specifications.asyncapiPath
          ? resolveSpecPath(frontmatter.specifications.asyncapiPath, serviceDir)
          : undefined,
        openapiPath: frontmatter.specifications.openapiPath
          ? resolveSpecPath(frontmatter.specifications.openapiPath, serviceDir)
          : undefined
      }
    : undefined;

  return {
    id: frontmatter.id ?? serviceId,
    name: frontmatter.name,
    version: frontmatter.version,
    summary: frontmatter.summary,
    serviceDir,
    specifications,
    sends: normalizeEventReferences(frontmatter.sends),
    receives: normalizeEventReferences(frontmatter.receives)
  };
}
