import {z} from 'zod';

/**
 * TypeScript module system types
 */
export const zodTypeScriptModuleSystemType = z
  .enum(['ESM', 'CJS'])
  .describe(
    'TypeScript module system type - ESM for ES modules or CJS for CommonJS modules'
  );

/**
 * TypeScript export types
 */
export const zodTypeScriptExportType = z
  .enum(['named', 'default'])
  .describe('TypeScript export type - named exports or default export');

/**
 * Indentation configuration
 */
export const zodIndentationConfig = z
  .object({
    type: z
      .enum(['spaces', 'tabs'])
      .describe('Indentation type - spaces or tabs'),
    size: z
      .number()
      .min(1)
      .max(8)
      .default(2)
      .describe('Indentation size (1-8 characters)')
  })
  .describe(
    'Indentation configuration for generated code - type (spaces/tabs) and size (1-8)'
  );

/**
 * TypeScript dependency manager properties
 * @see https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptDependencyManager.ts
 */
export const zodTypeScriptDependencyManager = z
  .object({
    dependencies: z
      .array(z.string())
      .optional()
      .describe('Array of dependency names')
  })
  .partial()
  .describe(
    'Modelina TypeScriptDependencyManager properties - manages imports and dependencies in generated TypeScript code. See: https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptDependencyManager.ts'
  );

/**
 * TypeScript generator options
 * @see https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts
 */
export const zodTypeScriptOptions = z
  .object({
    // From CommonGeneratorOptions
    indentation: zodIndentationConfig
      .optional()
      .describe('Code indentation configuration'),
    dependencyManager: zodTypeScriptDependencyManager
      .optional()
      .describe('Dependency management configuration'),

    // TypeScript-specific options
    renderTypes: z
      .boolean()
      .optional()
      .default(true)
      .describe('Whether to render type definitions'),
    modelType: z
      .enum(['class', 'interface'])
      .optional()
      .default('class')
      .describe('Generate classes or interfaces'),
    enumType: z
      .enum(['enum', 'union'])
      .optional()
      .default('enum')
      .describe('Generate TypeScript enums or union types'),
    mapType: z
      .enum(['indexedObject', 'map', 'record'])
      .optional()
      .default('record')
      .describe('How to represent map/dictionary types'),
    moduleSystem: zodTypeScriptModuleSystemType
      .optional()
      .default('ESM')
      .describe('Module system to use'),
    useJavascriptReservedKeywords: z
      .boolean()
      .optional()
      .default(false)
      .describe('Allow JavaScript reserved keywords'),
    rawPropertyNames: z
      .boolean()
      .optional()
      .default(false)
      .describe('Use raw property names without constraints'),

    // Complex options - using any for practical reasons
    typeMapping: z
      .any()
      .optional()
      .describe('Custom type mappings (complex Modelina type)'),
    constraints: z
      .any()
      .optional()
      .describe('Naming and validation constraints (complex Modelina type)'),
    presets: z.any().optional().default([]),
    defaultPreset: z.any().optional().describe('Default preset configuration'),
    processorOptions: z
      .any()
      .optional()
      .describe('Schema processing options (complex Modelina type)')
  })
  .partial()
  .describe(
    'Modelina TypeScriptOptions interface - configures TypeScript code generation including model types, enums, modules, and constraints. See: https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts'
  );

/**
 * TypeScript renderer properties
 * @see https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptRenderer.ts
 */
export const zodTypeScriptRenderer = z
  .object({
    // Essential renderer properties
    dependencyManager: zodTypeScriptDependencyManager
      .optional()
      .describe('Manages imports and dependencies'),

    // Common renderer methods
    renderComments: z
      .function()
      .optional()
      .describe('Render JSDoc-style comments'),
    renderLine: z
      .function()
      .optional()
      .describe('Render a single line with indentation'),
    renderBlock: z
      .function()
      .optional()
      .describe('Render multiple lines as a block'),
    indent: z.function().optional().describe('Add indentation to content'),
    runSelfPreset: z
      .function()
      .optional()
      .describe('Execute preset functions for current model'),
    runAdditionalContentPreset: z
      .function()
      .optional()
      .describe('Execute additional content presets'),
    runPreset: z
      .function()
      .optional()
      .describe('Execute specific preset function'),

    // Complex internal properties
    options: zodTypeScriptOptions
      .optional()
      .describe('Generator options configuration'),
    generator: z
      .any()
      .optional()
      .describe('TypeScriptGenerator instance (complex Modelina type)'),
    presets: z.any().optional().describe('Array of active presets'),
    model: z
      .any()
      .optional()
      .describe('Current ConstrainedMetaModel being rendered'),
    inputModel: z
      .any()
      .optional()
      .describe('Original InputMetaModel (complex Modelina type)')
  })
  .partial()
  .describe(
    'Modelina TypeScriptRenderer properties - provides rendering methods for TypeScript code generation within preset functions. See: https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptRenderer.ts'
  );

/**
 * ConstrainedMetaModel properties
 * @see https://github.com/asyncapi/modelina/blob/master/src/models/ConstrainedMetaModel.ts
 * @see https://github.com/asyncapi/modelina/blob/master/docs/internal-model.md
 */
export const zodConstrainedMetaModel = z
  .object({
    // Common properties
    originalInput: z
      .any()
      .optional()
      .describe('Original input that created this model'),
    type: z
      .string()
      .optional()
      .describe('Model type (object, string, enum, etc.)'),
    name: z.string().optional().describe('Constrained name of the model'),

    // For object models
    properties: z
      .record(z.any())
      .optional()
      .describe('Object model properties'),

    // For enum models
    values: z.array(z.any()).optional().describe('Enum values'),

    // Complex properties
    options: z.any().optional().describe('Model-specific options'),
    constraints: z
      .any()
      .optional()
      .describe('Applied constraints and transformations')
  })
  .partial()
  .describe(
    'Modelina ConstrainedMetaModel properties - represents a processed schema model with applied constraints and transformations. See: https://github.com/asyncapi/modelina/blob/master/src/models/ConstrainedMetaModel.ts and https://github.com/asyncapi/modelina/blob/master/docs/internal-model.md'
  );

/**
 * Preset function parameters
 * @see https://github.com/asyncapi/modelina/blob/master/docs/presets.md
 */
export const zodPresetFunctionArgs = z
  .object({
    content: z.string().describe('Current generated content'),
    model: zodConstrainedMetaModel.describe(
      'ConstrainedMetaModel being processed'
    ),
    renderer: zodTypeScriptRenderer.describe(
      'TypeScriptRenderer instance with helper methods'
    ),
    options: zodTypeScriptOptions
      .optional()
      .describe('TypeScriptOptions configuration object')
  })
  .describe(
    'Standard parameters passed to Modelina preset functions - content (current code), model (schema model), renderer (helper methods), and options (generator config). See: https://github.com/asyncapi/modelina/blob/master/docs/presets.md'
  );

/**
 * TypeScript class preset methods
 * @see https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/ClassRenderer.ts
 */
export const zodClassPreset = z
  .object({
    self: z
      .function()
      .args(zodPresetFunctionArgs)
      .returns(z.string())
      .optional()
      .describe('Customize entire class rendering'),
    ctor: z
      .function()
      .args(zodPresetFunctionArgs)
      .returns(z.string())
      .optional()
      .describe('Customize class constructor'),
    property: z
      .function()
      .args(
        zodPresetFunctionArgs.extend({
          property: z
            .any()
            .describe('ConstrainedObjectPropertyModel being rendered')
        })
      )
      .returns(z.string())
      .optional()
      .describe('Customize individual property rendering'),
    getter: z
      .function()
      .args(
        zodPresetFunctionArgs.extend({
          property: z
            .any()
            .describe('ConstrainedObjectPropertyModel for getter')
        })
      )
      .returns(z.string())
      .optional()
      .describe('Customize property getter methods'),
    setter: z
      .function()
      .args(
        zodPresetFunctionArgs.extend({
          property: z
            .any()
            .describe('ConstrainedObjectPropertyModel for setter')
        })
      )
      .returns(z.string())
      .optional()
      .describe('Customize property setter methods'),
    additionalContent: z
      .function()
      .args(zodPresetFunctionArgs)
      .returns(z.string())
      .optional()
      .describe('Add custom methods or content to class')
  })
  .partial()
  .describe(
    'Modelina TypeScript class preset methods - customize class generation including self, constructor, properties, getters, setters, and additional content. See: https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/ClassRenderer.ts'
  );

/**
 * TypeScript interface preset methods
 * @see https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/InterfaceRenderer.ts
 */
export const zodInterfacePreset = z
  .object({
    self: z
      .function()
      .args(zodPresetFunctionArgs)
      .returns(z.string())
      .optional(),
    property: z
      .function()
      .args(
        zodPresetFunctionArgs.extend({
          property: z.any() // ConstrainedObjectPropertyModel
        })
      )
      .returns(z.string())
      .optional(),
    additionalContent: z
      .function()
      .args(zodPresetFunctionArgs)
      .returns(z.string())
      .optional()
  })
  .partial()
  .describe(
    'Modelina TypeScript interface preset methods - customize interface generation including self, properties, and additional content. See: https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/InterfaceRenderer.ts'
  );

/**
 * TypeScript enum preset methods
 * @see https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/EnumRenderer.ts
 */
export const zodEnumPreset = z
  .object({
    self: z
      .function()
      .args(zodPresetFunctionArgs)
      .returns(z.string())
      .optional(),
    item: z
      .function()
      .args(
        zodPresetFunctionArgs.extend({
          item: z.any() // ConstrainedEnumValueModel
        })
      )
      .returns(z.string())
      .optional()
  })
  .partial()
  .describe(
    'Modelina TypeScript enum preset methods - customize enum generation including self and individual enum items. See: https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/EnumRenderer.ts'
  );

/**
 * TypeScript type preset methods
 * @see https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/TypeRenderer.ts
 */
export const zodTypePreset = z
  .object({
    self: z
      .function()
      .args(zodPresetFunctionArgs)
      .returns(z.string())
      .optional()
  })
  .partial()
  .describe(
    'Modelina TypeScript type preset methods - customize type alias generation. See: https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/TypeRenderer.ts'
  );

/**
 * Complete TypeScript preset object
 * @see https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptPreset.ts
 */
export const zodTypeScriptPreset = z
  .object({
    class: zodClassPreset.optional(),
    interface: zodInterfacePreset.optional(),
    enum: zodEnumPreset.optional(),
    type: zodTypePreset.optional()
  })
  .partial()
  .describe(
    'Complete Modelina TypeScript preset object containing class, interface, enum, and type preset methods. See: https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptPreset.ts'
  );

/**
 * Preset with options pattern
 */
export const zodPresetWithOptions = z
  .object({
    preset: zodTypeScriptPreset,
    options: z.record(z.any()).optional()
  })
  .describe(
    'Modelina preset with options pattern - combines a preset object with custom options for reusable presets like TS_COMMON_PRESET'
  );

/**
 * Preset array items
 */
export const zodPresetItem = z
  .union([zodTypeScriptPreset, zodPresetWithOptions])
  .describe(
    'Modelina preset array item - can be either a direct preset object or a preset with options'
  );

/**
 * Array of TypeScript presets
 */
export const zodTypeScriptPresets = z
  .array(zodPresetItem)
  .describe(
    'Array of Modelina TypeScript presets passed to TypeScriptFileGenerator - middleware for customizing code generation'
  )
  .default([]);

// Export types for TypeScript usage
export type TypeScriptModuleSystemType = z.infer<
  typeof zodTypeScriptModuleSystemType
>;
export type TypeScriptExportType = z.infer<typeof zodTypeScriptExportType>;
export type IndentationConfig = z.infer<typeof zodIndentationConfig>;
export type TypeScriptDependencyManager = z.infer<
  typeof zodTypeScriptDependencyManager
>;
export type TypeScriptOptions = z.infer<typeof zodTypeScriptOptions>;
export type TypeScriptRenderer = z.infer<typeof zodTypeScriptRenderer>;
export type ConstrainedMetaModel = z.infer<typeof zodConstrainedMetaModel>;
export type PresetFunctionArgs = z.infer<typeof zodPresetFunctionArgs>;
export type ClassPreset = z.infer<typeof zodClassPreset>;
export type InterfacePreset = z.infer<typeof zodInterfacePreset>;
export type EnumPreset = z.infer<typeof zodEnumPreset>;
export type TypePreset = z.infer<typeof zodTypePreset>;
export type TypeScriptPreset = z.infer<typeof zodTypeScriptPreset>;
export type PresetWithOptions = z.infer<typeof zodPresetWithOptions>;
export type PresetItem = z.infer<typeof zodPresetItem>;
export type TypeScriptPresets = z.infer<typeof zodTypeScriptPresets>;
