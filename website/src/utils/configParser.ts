/**
 * Parse TypeScript config code back to form state.
 * Used to sync TypeScript editor → form changes.
 */

import type { ConfigFormState, GeneratorFormState } from './configCodegen';
import { getDefaultFormState } from './configCodegen';

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Parse TypeScript config back to form state.
 * Uses regex/simple parsing - not full TS execution.
 */
export function parseTsConfig(code: string): ParseResult<ConfigFormState> {
  try {
    // Extract the default export object
    const exportMatch = code.match(
      /export\s+default\s+(\{[\s\S]*?\})\s*(?:satisfies|as)/
    );
    if (!exportMatch) {
      // Try without satisfies/as
      const simpleMatch = code.match(/export\s+default\s+(\{[\s\S]*\});?\s*$/);
      if (!simpleMatch) {
        return { success: false, error: 'Could not find default export' };
      }
      return parseConfigObject(simpleMatch[1]);
    }

    return parseConfigObject(exportMatch[1]);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Parse error',
    };
  }
}

function parseConfigObject(objStr: string): ParseResult<ConfigFormState> {
  try {
    // Extract inputType
    const inputTypeMatch = objStr.match(/inputType:\s*['"](\w+)['"]/);
    const inputType = (inputTypeMatch?.[1] || 'asyncapi') as ConfigFormState['inputType'];

    // Extract generators array
    const generatorsMatch = objStr.match(/generators:\s*\[([\s\S]*?)\]\s*[,}]/);
    if (!generatorsMatch) {
      return { success: false, error: 'Could not find generators array' };
    }

    const generators = parseGeneratorsArray(generatorsMatch[1]);
    const protocols = extractProtocols(generatorsMatch[1]);

    // Merge with default state to fill in disabled generators
    const defaultState = getDefaultFormState();
    const mergedGenerators: GeneratorFormState[] = defaultState.generators.map(
      (defaultGen) => {
        const parsed = generators.find((g) => g.preset === defaultGen.preset);
        if (parsed) {
          return { ...parsed, enabled: true };
        }
        return { ...defaultGen, enabled: false };
      }
    );

    return {
      success: true,
      data: {
        inputType,
        generators: mergedGenerators,
        protocols,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Parse error',
    };
  }
}

function parseGeneratorsArray(arrayStr: string): GeneratorFormState[] {
  const generators: GeneratorFormState[] = [];

  // Match individual generator objects
  const objectRegex = /\{[^{}]*\}/g;
  let match: RegExpExecArray | null;

  while ((match = objectRegex.exec(arrayStr)) !== null) {
    const objStr = match[0];

    const presetMatch = objStr.match(/preset:\s*['"](\w+)['"]/);
    const outputPathMatch = objStr.match(/outputPath:\s*['"]([^'"]+)['"]/);

    if (presetMatch && outputPathMatch) {
      generators.push({
        preset: presetMatch[1],
        outputPath: outputPathMatch[1],
        enabled: true,
      });
    }
  }

  return generators;
}

function extractProtocols(generatorsStr: string): string[] {
  // Look for protocols array in any generator
  const protocolsMatch = generatorsStr.match(
    /protocols:\s*\[([^\]]+)\]/
  );

  if (!protocolsMatch) {
    return ['nats'];
  }

  const protocolsStr = protocolsMatch[1];
  const protocols: string[] = [];

  const protocolRegex = /['"](\w+)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = protocolRegex.exec(protocolsStr)) !== null) {
    protocols.push(match[1]);
  }

  return protocols.length > 0 ? protocols : ['nats'];
}
