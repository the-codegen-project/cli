/**
 * Custom generator — the documented exception that exposes raw source
 * documents to user-supplied render functions while also supplying
 * every typed `{Generator}Input` so users can pick the layer that fits.
 *
 * The renderer populates the `renderFunction` arg with:
 *   - `inputs`        — typed normalized data for every built-in generator
 *   - `rawDocuments`  — parsed source documents (AsyncAPI, OpenAPI, JSON Schema, EventCatalog)
 *   - `inputType`     — the user-configured input type (never mutated)
 *   - `generator`     — the resolved configuration
 *   - `dependencyOutputs` — outputs of dependency generators
 */
import {GenericCodegenContext} from '../../types';
import {z} from 'zod';
import {CustomGeneratorInput} from './custom.input';

export {
  CustomGeneratorInput,
  CustomGeneratorRawDocuments,
  CustomGeneratorTypedInputs,
  CustomGeneratorInputType
} from './custom.input';

export interface CustomContext extends GenericCodegenContext {
  /** Full custom-generator input passed to the user's render function. */
  input: CustomGeneratorInput;
  generator: CustomGenerator;
}

export const zodCustomGenerator = z.object({
  id: z
    .string()
    .optional()
    .default('custom')
    .describe(
      'Unique identifier for this generator instance. Used by other generators to reference this one as a dependency. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
    ),
  dependencies: z
    .array(z.string())
    .optional()
    .default([])
    .describe(
      'The list of other generator IDs that this generator depends on. Outputs from these generators are passed to renderFunction via dependencyOutputs. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
    ),
  preset: z
    .literal('custom')
    .default('custom')
    .describe(
      'Lets you write a custom render function that produces arbitrary code from typed inputs and the raw input document(s). [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
    ),
  options: z
    .any()
    .optional()
    .default({})
    .describe(
      'Arbitrary user-defined options that are forwarded to the renderFunction as its second argument. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
    ),
  outputPath: z
    .string()
    .optional()
    .default('custom')
    .describe(
      'The directory path where files written by the custom generator will be placed. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
    ),
  language: z.literal('typescript').optional().default('typescript'),
  renderFunction: z
    .function()
    .args(
      z
        .object({
          inputs: z
            .any()
            .describe(
              'Typed normalized inputs for every built-in generator (payloads, parameters, headers, types, channels, client, models). Each field is the same shape that the corresponding built-in generator consumes.'
            ),
          rawDocuments: z
            .any()
            .describe(
              'Parsed source documents available for the custom generator. Includes asyncapi, openapi, jsonSchema, and eventCatalog slots — populated only when the matching source format is in use.'
            ),
          inputType: z
            .enum(['asyncapi', 'openapi', 'jsonschema', 'eventcatalog'])
            .default('asyncapi')
            .describe(
              'The user-configured input type. Never mutated by the dispatch site, even when the source format wraps another (e.g. EventCatalog). [Read more about supported inputs here](https://the-codegen-project.org/docs/configurations)'
            ),
          generator: z
            .any()
            .describe(
              'The fully resolved configuration object for this custom generator instance. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
            ),
          dependencyOutputs: z
            .record(z.any())
            .default({})
            .describe(
              'A map of generator ID to render result for each generator listed in dependencies. Use this to access models, channels, etc. produced by other generators. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
            )
        })
        .default({} as CustomGeneratorInput),
      z
        .any()
        .optional()
        .describe(
          'The user-defined options passed in via the "options" field of this generator configuration. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
        )
        .default({})
    )
    .returns(z.any())
    .optional()
    .default(() => {})
    .describe(
      'The render function executed by the custom generator. Receives typed inputs, raw source documents, and the outputs of dependency generators, and is responsible for producing custom code. [Read more about the custom generator here](https://the-codegen-project.org/docs/generators/custom)'
    )
});

export type CustomGenerator = z.input<typeof zodCustomGenerator>;

export type CustomGeneratorInternal = z.infer<typeof zodCustomGenerator>;

export const defaultCustomGenerator: CustomGeneratorInternal =
  zodCustomGenerator.parse({});
