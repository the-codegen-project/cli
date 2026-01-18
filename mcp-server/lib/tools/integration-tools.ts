/**
 * MCP Tools for integration assistance.
 * These tools help users integrate generated code into their projects.
 */

import { z } from 'zod';
import type { GeneratorPreset, Protocol } from '../data/generators';
import { getAllExamples } from '../data/examples';

/**
 * Schema for get_usage_example tool
 */
export const getUsageExampleSchema = z.object({
  generatorType: z
    .enum(['payloads', 'parameters', 'headers', 'types', 'channels', 'client', 'models', 'custom'])
    .describe('Type of generator to get examples for'),
  protocol: z
    .enum(['nats', 'kafka', 'mqtt', 'amqp', 'websocket', 'http_client', 'event_source'])
    .optional()
    .describe('Protocol for protocol-specific examples (channels/client)'),
});

export type GetUsageExampleInput = z.infer<typeof getUsageExampleSchema>;

/**
 * Get usage examples for generated code
 */
export function getUsageExample(input: GetUsageExampleInput): {
  examples: Array<{
    title: string;
    description: string;
    code: string;
    dependencies?: string[];
  }>;
  notes: string[];
} {
  const notes: string[] = [];
  const examples = getAllExamples(
    input.generatorType as GeneratorPreset,
    input.protocol as Protocol | undefined
  );

  if (examples.length === 0) {
    notes.push(`No examples found for generator type "${input.generatorType}".`);
  }

  if (input.protocol && !['channels', 'client'].includes(input.generatorType)) {
    notes.push(
      `Protocol parameter is only relevant for "channels" and "client" generators. Ignoring protocol.`
    );
  }

  // Add general notes based on generator type
  switch (input.generatorType) {
    case 'payloads':
      notes.push('Payloads require ajv and ajv-formats packages for validation.');
      break;
    case 'channels':
      notes.push('Channel functions require the protocol-specific client library (e.g., nats, kafkajs, mqtt).');
      break;
    case 'client':
      notes.push('The client generator currently only supports NATS protocol.');
      break;
    case 'custom':
      notes.push('Custom generators require a JavaScript/TypeScript configuration file (not JSON/YAML).');
      break;
  }

  return {
    examples: examples.map((e) => ({
      title: e.title,
      description: e.description,
      code: e.code,
      dependencies: e.dependencies,
    })),
    notes,
  };
}

/**
 * Schema for get_imports tool
 */
export const getImportsSchema = z.object({
  generatorType: z
    .enum(['payloads', 'parameters', 'headers', 'types', 'channels', 'client', 'models'])
    .describe('Type of generator'),
  outputPath: z.string().describe('Path where the generated code is located'),
  items: z
    .array(z.string())
    .optional()
    .describe('Specific items to import (e.g., class names, function names)'),
  protocol: z
    .enum(['nats', 'kafka', 'mqtt', 'amqp', 'websocket', 'http_client', 'event_source'])
    .optional()
    .describe('Protocol for channels imports'),
});

export type GetImportsInput = z.infer<typeof getImportsSchema>;

/**
 * Generate import statements for generated code
 */
export function getImports(input: GetImportsInput): {
  imports: string[];
  notes: string[];
} {
  const notes: string[] = [];
  const imports: string[] = [];
  const basePath = input.outputPath.replace(/^\.\//, '').replace(/\/$/, '');

  switch (input.generatorType) {
    case 'payloads': {
      if (input.items?.length) {
        // Import specific payload classes
        for (const item of input.items) {
          imports.push(`import { ${item} } from '${basePath}/${item}';`);
        }
      } else {
        notes.push('Provide specific payload class names in the "items" parameter for accurate imports.');
        imports.push(`// Import specific payload classes:`);
        imports.push(`// import { YourPayloadClass } from '${basePath}/YourPayloadClass';`);
      }
      break;
    }

    case 'parameters': {
      if (input.items?.length) {
        for (const item of input.items) {
          imports.push(`import { ${item} } from '${basePath}/${item}';`);
        }
      } else {
        notes.push('Provide specific parameter class names in the "items" parameter for accurate imports.');
        imports.push(`// Import specific parameter classes:`);
        imports.push(`// import { YourParameters } from '${basePath}/YourParameters';`);
      }
      break;
    }

    case 'headers': {
      if (input.items?.length) {
        for (const item of input.items) {
          imports.push(`import { ${item} } from '${basePath}/${item}';`);
        }
      } else {
        notes.push('Provide specific header class names in the "items" parameter for accurate imports.');
        imports.push(`// Import specific header classes:`);
        imports.push(`// import { YourHeaders } from '${basePath}/YourHeaders';`);
      }
      break;
    }

    case 'types': {
      imports.push(`import { Topics, TopicIds, ToTopicIds, ToTopics, TopicsMap } from '${basePath}/Types';`);
      notes.push('Types.ts exports topic utilities and type definitions.');
      break;
    }

    case 'channels': {
      if (input.protocol) {
        if (input.items?.length) {
          imports.push(`import { ${input.items.join(', ')} } from '${basePath}/${input.protocol}';`);
        } else {
          imports.push(`import * as ${input.protocol}Channels from '${basePath}/${input.protocol}';`);
          notes.push('Use namespace import or specify function names in "items" parameter.');
        }

        // Add protocol client import
        const clientImports: Record<string, string> = {
          nats: "import { connect } from 'nats';",
          kafka: "import { Kafka } from 'kafkajs';",
          mqtt: "import mqtt from 'mqtt';",
          amqp: "import amqp from 'amqplib';",
          websocket: "import WebSocket from 'ws';",
          http_client: '// HTTP client uses native fetch or axios',
          event_source: "import { fetchEventSource } from '@microsoft/fetch-event-source';",
        };
        imports.push('');
        imports.push('// Protocol client:');
        imports.push(clientImports[input.protocol] || '// No additional import needed');
      } else {
        imports.push(`// Import from protocol-specific file:`);
        imports.push(`// import { publishToX, subscribeToX } from '${basePath}/nats';`);
        imports.push(`// import { publishToX, subscribeToX } from '${basePath}/kafka';`);
        notes.push('Specify a protocol to get accurate imports.');
      }
      break;
    }

    case 'client': {
      const protocol = input.protocol || 'nats';
      const clientName = `${protocol.charAt(0).toUpperCase() + protocol.slice(1)}Client`;
      imports.push(`import { ${clientName} } from '${basePath}/${clientName}';`);

      if (protocol === 'nats') {
        imports.push('');
        imports.push('// NATS types (optional):');
        imports.push("import type { NatsConnection, JetStreamClient } from 'nats';");
      }
      break;
    }

    case 'models': {
      if (input.items?.length) {
        for (const item of input.items) {
          imports.push(`import { ${item} } from '${basePath}/${item}';`);
        }
      } else {
        notes.push('Provide specific model class names in the "items" parameter for accurate imports.');
        imports.push(`// Import specific model classes:`);
        imports.push(`// import { YourModel } from '${basePath}/YourModel';`);
      }
      break;
    }
  }

  return { imports, notes };
}

/**
 * Export all tools for registration
 */
export const integrationTools = {
  getUsageExample: {
    schema: getUsageExampleSchema,
    handler: getUsageExample,
  },
  getImports: {
    schema: getImportsSchema,
    handler: getImports,
  },
};
