/**
 * MCP Server route handler for The Codegen Project.
 * Exposes tools and resources to help AI assistants work with codegen.
 */

import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import {
  createConfig,
  addGenerator,
  listGenerators,
  validateConfig,
} from '@/lib/tools/config-tools';
import {
  getUsageExample,
  getImports,
} from '@/lib/tools/integration-tools';
import { getDocKeys, getDoc } from '@/lib/resources/bundled-docs';

const handler = createMcpHandler(
  (server) => {
    // ==========================================
    // CONFIGURATION TOOLS
    // ==========================================

    server.tool(
      'create_config',
      'Create a new codegen configuration file. Generates a complete configuration based on input type, generators, and optional protocols.',
      {
        inputType: z
          .enum(['asyncapi', 'openapi', 'jsonschema'])
          .describe('The type of input specification'),
        inputPath: z.string().describe('Path to the input specification file'),
        generators: z
          .array(
            z.enum([
              'payloads',
              'parameters',
              'headers',
              'types',
              'channels',
              'client',
              'models',
              'custom',
            ])
          )
          .describe('Generator presets to include'),
        configFormat: z
          .enum(['mjs', 'ts', 'json', 'yaml'])
          .optional()
          .describe('Output format for the configuration file (default: mjs)'),
        protocols: z
          .array(
            z.enum([
              'nats',
              'kafka',
              'mqtt',
              'amqp',
              'websocket',
              'http_client',
              'event_source',
            ])
          )
          .optional()
          .describe('Protocols to generate for channels/client generators'),
      },
      async (input) => {
        const result = createConfig(input as Parameters<typeof createConfig>[0]);
        const lang = result.filename.endsWith('.json') ? 'json' : result.filename.endsWith('.yaml') ? 'yaml' : result.filename.endsWith('.ts') ? 'typescript' : 'javascript';

        const warnings = result.warnings.length > 0
          ? `**Warnings:**
${result.warnings.map((w) => `- ${w}`).join('\n')}`
          : '';

        const text = `# Generated Configuration

**Filename:** \`${result.filename}\`

\`\`\`${lang}
${result.content}
\`\`\`
${warnings}`;

        return { content: [{ type: 'text', text }] };
      }
    );

    server.tool(
      'add_generator',
      'Generate a configuration object for a single generator to add to an existing config.',
      {
        preset: z
          .enum([
            'payloads',
            'parameters',
            'headers',
            'types',
            'channels',
            'client',
            'models',
            'custom',
          ])
          .describe('Generator preset to add'),
        outputPath: z.string().optional().describe('Output path for generated code'),
        protocols: z
          .array(
            z.enum([
              'nats',
              'kafka',
              'mqtt',
              'amqp',
              'websocket',
              'http_client',
              'event_source',
            ])
          )
          .optional()
          .describe('Protocols for channels/client generators'),
        serializationType: z
          .enum(['json'])
          .optional()
          .describe('Serialization format'),
        includeValidation: z
          .boolean()
          .optional()
          .describe('Include AJV validation'),
      },
      async (input) => {
        const result = addGenerator(input as Parameters<typeof addGenerator>[0]);

        const notes = result.notes.length > 0
          ? `**Notes:**
${result.notes.map((n) => `- ${n}`).join('\n')}`
          : '';

        const text = `# Generator Configuration

Add this to your \`generators\` array:

\`\`\`javascript
${JSON.stringify(result.config, null, 2)}
\`\`\`
${notes}`;

        return { content: [{ type: 'text', text }] };
      }
    );

    server.tool(
      'list_generators',
      'List all available generators and their configuration options, optionally filtered by input type.',
      {
        inputType: z
          .enum(['asyncapi', 'openapi', 'jsonschema'])
          .optional()
          .describe('Filter generators by input type'),
      },
      async (input) => {
        const result = listGenerators(input as Parameters<typeof listGenerators>[0]);

        const filterLine = input.inputType
          ? `Filtered by input type: **${input.inputType}**

`
          : '';

        const generatorSections = result.generators.map((gen) => {
          const dependencies = gen.dependencies?.length
            ? `- **Dependencies:** ${gen.dependencies.join(', ')}`
            : '';

          const options = gen.options.length > 0
            ? `**Options:**
${gen.options.map((opt) => {
  let line = `- \`${opt.name}\` (${opt.type}): ${opt.description}`;
  if (opt.default !== undefined) {
    line += ` [default: ${JSON.stringify(opt.default)}]`;
  }
  if (opt.required) {
    line += ' *required*';
  }
  return line;
}).join('\n')}`
            : '';

          return `## ${gen.preset}

${gen.description}

- **Supported inputs:** ${gen.supportedInputs.join(', ')}
- **Default output:** \`${gen.defaultOutputPath}\`
${dependencies}${options}`;
        }).join('\n\n');

        const protocols = result.protocols
          .map((proto) => `- **${proto.name}:** ${proto.description}`)
          .join('\n');

        const text = `# Available Generators

${filterLine}${generatorSections}

## Supported Protocols

${protocols}`;

        return { content: [{ type: 'text', text }] };
      }
    );

    server.tool(
      'validate_config',
      'Validate a codegen configuration object and report any errors or warnings.',
      {
        config: z.record(z.unknown()).describe('Configuration object to validate'),
      },
      async (input) => {
        const result = validateConfig(input as Parameters<typeof validateConfig>[0]);

        const errors = result.errors.length > 0
          ? `**Errors:**
${result.errors.map((e) => `- ${e}`).join('\n')}

`
          : '';

        const warnings = result.warnings.length > 0
          ? `**Warnings:**
${result.warnings.map((w) => `- ${w}`).join('\n')}`
          : '';

        const success = result.valid && result.warnings.length === 0
          ? 'No issues found. Configuration looks good!'
          : '';

        const text = `# Configuration Validation

**Status:** ${result.valid ? 'Valid' : 'Invalid'}

${errors}${warnings}${success}`;

        return { content: [{ type: 'text', text }] };
      }
    );

    // ==========================================
    // INTEGRATION TOOLS
    // ==========================================

    server.tool(
      'get_usage_example',
      'Get code examples showing how to use generated code for a specific generator type and optional protocol.',
      {
        generatorType: z
          .enum([
            'payloads',
            'parameters',
            'headers',
            'types',
            'channels',
            'client',
            'models',
            'custom',
          ])
          .describe('Type of generator to get examples for'),
        protocol: z
          .enum([
            'nats',
            'kafka',
            'mqtt',
            'amqp',
            'websocket',
            'http_client',
            'event_source',
          ])
          .optional()
          .describe('Protocol for protocol-specific examples'),
      },
      async (input) => {
        const result = getUsageExample(input as Parameters<typeof getUsageExample>[0]);

        const examplesContent = result.examples.length === 0
          ? 'No examples available for this generator type.'
          : result.examples.map((example) => {
              const deps = example.dependencies?.length
                ? `**Required packages:** ${example.dependencies.map((d) => `\`${d}\``).join(', ')}`
                : '';

              return `## ${example.title}

${example.description}

\`\`\`typescript
${example.code}
\`\`\`

${deps}`;
            }).join('');

        const notes = result.notes.length > 0
          ? `**Notes:**
${result.notes.map((n) => `- ${n}`).join('\n')}`
          : '';

        const text = `# Usage Examples: ${input.generatorType}

${examplesContent}${notes}`;

        return { content: [{ type: 'text', text }] };
      }
    );

    server.tool(
      'get_imports',
      'Generate TypeScript import statements for generated code.',
      {
        generatorType: z
          .enum([
            'payloads',
            'parameters',
            'headers',
            'types',
            'channels',
            'client',
            'models',
          ])
          .describe('Type of generator'),
        outputPath: z.string().describe('Path where the generated code is located'),
        items: z
          .array(z.string())
          .optional()
          .describe('Specific items to import (class names, function names)'),
        protocol: z
          .enum([
            'nats',
            'kafka',
            'mqtt',
            'amqp',
            'websocket',
            'http_client',
            'event_source',
          ])
          .optional()
          .describe('Protocol for channels imports'),
      },
      async (input) => {
        const result = getImports(input as Parameters<typeof getImports>[0]);

        const notes = result.notes.length > 0
          ? `**Notes:**
${result.notes.map((n) => `- ${n}`).join('\n')}`
          : '';

        const text = `# Import Statements

\`\`\`typescript
${result.imports.join('\n')}
\`\`\`
${notes}`;

        return { content: [{ type: 'text', text }] };
      }
    );

    // ==========================================
    // DOCUMENTATION RESOURCES
    // ==========================================

    // List all available documentation
    server.resource(
      'codegen://docs',
      'List of all available documentation topics',
      async () => {
        const keys = getDocKeys();

        // Group by category
        const categories: Record<string, string[]> = {
          'Getting Started': [],
          Generators: [],
          Protocols: [],
          Inputs: [],
          Other: [],
        };

        for (const key of keys) {
          if (key.startsWith('getting-started')) {
            categories['Getting Started'].push(key);
          } else if (key.startsWith('generators')) {
            categories['Generators'].push(key);
          } else if (key.startsWith('protocols')) {
            categories['Protocols'].push(key);
          } else if (key.startsWith('inputs')) {
            categories['Inputs'].push(key);
          } else {
            categories['Other'].push(key);
          }
        }

        const categorySections = Object.entries(categories)
          .filter(([, docKeys]) => docKeys.length > 0)
          .map(([category, docKeys]) => {
            const items = docKeys
              .sort()
              .map((key) => {
                const doc = getDoc(key);
                return `- \`codegen://docs/${key}\` - ${doc?.title || key}`;
              })
              .join('\n');

            return `## ${category}

${items}`;
          })
          .join('\n\n');

        const text = `# The Codegen Project Documentation

Available documentation topics:

${categorySections}`;

        return {
          contents: [{ uri: 'codegen://docs', text, mimeType: 'text/markdown' }],
        };
      }
    );

    // Register individual documentation resources
    for (const key of getDocKeys()) {
      const doc = getDoc(key);
      if (doc) {
        server.resource(
          `codegen://docs/${key}`,
          doc.title,
          async () => ({
            contents: [
              {
                uri: `codegen://docs/${key}`,
                text: doc.content,
                mimeType: 'text/markdown',
              },
            ],
          })
        );
      }
    }

    // ==========================================
    // PROMPTS
    // ==========================================

    server.prompt(
      'codegen-guidelines',
      'Guidelines for working with The Codegen Project and generated code',
      () => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `# The Codegen Project - Guidelines for AI Assistants

When working with projects that use The Codegen Project, follow these guidelines:

## Never Edit Generated Files

Generated code should NEVER be manually edited. Any manual changes will be overwritten the next time code generation runs. Generated files are typically located in output directories specified in the codegen configuration file (e.g., \`codegen.config.mjs\`).

## How to Modify Generated Output

To change what code is generated, you have two options:

1. **Modify the input specification** - Update the AsyncAPI, OpenAPI, or JSON Schema document that defines the API/schema. This changes the source of truth.

2. **Modify the codegen configuration** - Update the \`codegen.config.mjs\` (or equivalent) file to change generator options, add/remove generators, change output paths, or adjust protocols.

## Regeneration Workflow

After making changes to either the input specification or configuration:

1. Run \`npx @the-codegen-project/cli generate\` to regenerate code
2. Or use watch mode during development: \`npx @the-codegen-project/cli generate --watch\`

## Identifying Generated Files

Check the project's codegen configuration file to find:
- \`inputPath\` - The source specification file
- \`generators[].outputPath\` - Where each generator writes its output

## Best Practices

- Keep the input specification as the single source of truth
- Commit both the specification and generated code to version control
- Use the \`custom\` generator preset if you need project-specific code generation
- Run generation as part of CI/CD to catch spec/code drift`,
            },
          },
        ],
      })
    );
  },
  {},
  {
    basePath: '/api',
  }
);

export { handler as GET, handler as POST, handler as DELETE };
