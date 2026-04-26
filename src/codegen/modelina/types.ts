import {z} from 'zod';

/**
 * TypeScript module system types
 */
export const zodTypeScriptModuleSystemType = z
  .enum(['ESM', 'CJS'])
  .describe(
    'TypeScript module system to target: "ESM" for ES modules or "CJS" for CommonJS modules. [Read more about Modelina TypeScript options here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts)'
  );

/**
 * TypeScript export types
 */
export const zodTypeScriptExportType = z
  .enum(['named', 'default'])
  .describe(
    'How generated TypeScript modules expose their primary symbol: "named" for named exports or "default" for a default export. [Read more about Modelina TypeScript options here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts)'
  );

/**
 * Indentation configuration
 */
export const zodIndentationConfig = z
  .object({
    type: z
      .enum(['spaces', 'tabs'])
      .describe(
        'Whether to indent the generated code with spaces or tabs. [Read more about Modelina common options here](https://github.com/asyncapi/modelina/blob/master/src/generators/AbstractGenerator.ts)'
      ),
    size: z
      .number()
      .min(1)
      .max(8)
      .default(2)
      .describe(
        'Number of indentation characters per indent level (1-8). Defaults to 2. [Read more about Modelina common options here](https://github.com/asyncapi/modelina/blob/master/src/generators/AbstractGenerator.ts)'
      )
  })
  .describe(
    'Controls how generated code is indented, including indentation type (spaces/tabs) and size (1-8). [Read more about Modelina common options here](https://github.com/asyncapi/modelina/blob/master/src/generators/AbstractGenerator.ts)'
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
      .describe(
        'Array of import statements/dependency names tracked by the dependency manager. [Read more about the Modelina TypeScript dependency manager here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptDependencyManager.ts)'
      )
  })
  .partial()
  .describe(
    'Modelina TypeScriptDependencyManager configuration that controls imports and dependencies in generated TypeScript code. [Read more about the Modelina TypeScript dependency manager here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptDependencyManager.ts)'
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
      .describe(
        'Indentation configuration applied to generated TypeScript code. [Read more about Modelina TypeScript options here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts)'
      ),
    dependencyManager: zodTypeScriptDependencyManager
      .optional()
      .describe(
        'Dependency manager configuration that controls how imports are tracked and rendered. [Read more about the Modelina TypeScript dependency manager here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptDependencyManager.ts)'
      ),

    // TypeScript-specific options
    renderTypes: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        'When true (default), TypeScript type annotations are rendered alongside the generated structures. [Read more about Modelina TypeScript options here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts)'
      ),
    modelType: z
      .enum(['class', 'interface'])
      .optional()
      .default('class')
      .describe(
        'Whether object models are generated as TypeScript classes (default) or interfaces. [Read more about Modelina TypeScript options here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts)'
      ),
    enumType: z
      .enum(['enum', 'union'])
      .optional()
      .default('enum')
      .describe(
        'How enum models are rendered: "enum" for TypeScript enums (default) or "union" for string/number union types. [Read more about Modelina TypeScript options here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts)'
      ),
    mapType: z
      .enum(['indexedObject', 'map', 'record'])
      .optional()
      .default('record')
      .describe(
        'How dictionary/map types are rendered: "record" for Record<K, V> (default), "map" for the Map class, or "indexedObject" for index signatures. [Read more about Modelina TypeScript options here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts)'
      ),
    moduleSystem: zodTypeScriptModuleSystemType
      .optional()
      .default('ESM')
      .describe(
        'Module system the generated code targets. Defaults to "ESM". [Read more about Modelina TypeScript options here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts)'
      ),
    useJavascriptReservedKeywords: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'When true, JavaScript reserved keywords are permitted as identifiers. Defaults to false to keep generated code valid in transpiled JavaScript output. [Read more about Modelina TypeScript options here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts)'
      ),
    rawPropertyNames: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'When true, properties keep their raw names from the input schema with no naming constraints applied. [Read more about Modelina TypeScript options here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts)'
      ),

    // Complex options - using any for practical reasons
    typeMapping: z
      .any()
      .optional()
      .describe(
        'Custom type mappings that override how Modelina maps schema types to TypeScript types (complex Modelina type). [Read more about Modelina type mapping here](https://github.com/asyncapi/modelina/blob/master/docs/custom_type_mapping.md)'
      ),
    constraints: z
      .any()
      .optional()
      .describe(
        'Custom naming and validation constraints applied during constraining (complex Modelina type). [Read more about Modelina constraints here](https://github.com/asyncapi/modelina/blob/master/docs/constraints.md)'
      ),
    presets: z
      .any()
      .optional()
      .default([])
      .describe(
        'Array of Modelina presets that customize how the TypeScript code is rendered. [Read more about Modelina presets here](https://github.com/asyncapi/modelina/blob/master/docs/presets.md)'
      ),
    defaultPreset: z
      .any()
      .optional()
      .describe(
        'Override the default preset used by the TypeScript generator (complex Modelina type). [Read more about Modelina presets here](https://github.com/asyncapi/modelina/blob/master/docs/presets.md)'
      ),
    processorOptions: z
      .any()
      .optional()
      .describe(
        'Options forwarded to the schema processor (e.g. AsyncAPI/JSON Schema processor) used to convert input documents into Modelina meta models (complex Modelina type). [Read more about Modelina input processors here](https://github.com/asyncapi/modelina/blob/master/docs/input_processing.md)'
      )
  })
  .partial()
  .describe(
    'Modelina TypeScriptOptions used to configure TypeScript code generation, including model types, enums, modules, and constraints. [Read more about Modelina TypeScript options here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts)'
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
      .describe(
        'Dependency manager that tracks and renders imports for the model currently being generated. [Read more about the Modelina TypeScript dependency manager here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptDependencyManager.ts)'
      ),

    // Common renderer methods
    renderComments: z
      .function()
      .optional()
      .describe(
        'Render JSDoc-style comments for the current content. [Read more about the Modelina TypeScript renderer here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptRenderer.ts)'
      ),
    renderLine: z
      .function()
      .optional()
      .describe(
        'Render a single line of code with the renderer\'s current indentation applied. [Read more about the Modelina TypeScript renderer here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptRenderer.ts)'
      ),
    renderBlock: z
      .function()
      .optional()
      .describe(
        'Render multiple lines of code as an indented block. [Read more about the Modelina TypeScript renderer here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptRenderer.ts)'
      ),
    indent: z
      .function()
      .optional()
      .describe(
        'Apply the configured indentation to a piece of content. [Read more about the Modelina TypeScript renderer here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptRenderer.ts)'
      ),
    runSelfPreset: z
      .function()
      .optional()
      .describe(
        'Execute the "self" preset function for the model currently being rendered. [Read more about Modelina presets here](https://github.com/asyncapi/modelina/blob/master/docs/presets.md)'
      ),
    runAdditionalContentPreset: z
      .function()
      .optional()
      .describe(
        'Execute the "additionalContent" preset hook to append custom content to the rendered model. [Read more about Modelina presets here](https://github.com/asyncapi/modelina/blob/master/docs/presets.md)'
      ),
    runPreset: z
      .function()
      .optional()
      .describe(
        'Execute a specific preset function by name. [Read more about Modelina presets here](https://github.com/asyncapi/modelina/blob/master/docs/presets.md)'
      ),

    // Complex internal properties
    options: zodTypeScriptOptions
      .optional()
      .describe(
        'The TypeScriptOptions in effect for this renderer. [Read more about Modelina TypeScript options here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts)'
      ),
    generator: z
      .any()
      .optional()
      .describe(
        'The TypeScriptGenerator instance that owns this renderer (complex Modelina type). [Read more about the Modelina TypeScript generator here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts)'
      ),
    presets: z
      .any()
      .optional()
      .describe(
        'The array of presets active for this renderer. [Read more about Modelina presets here](https://github.com/asyncapi/modelina/blob/master/docs/presets.md)'
      ),
    model: z
      .any()
      .optional()
      .describe(
        'The ConstrainedMetaModel that is currently being rendered. [Read more about the Modelina internal model here](https://github.com/asyncapi/modelina/blob/master/docs/internal-model.md)'
      ),
    inputModel: z
      .any()
      .optional()
      .describe(
        'The original InputMetaModel (complex Modelina type) that produced the current model. [Read more about the Modelina internal model here](https://github.com/asyncapi/modelina/blob/master/docs/internal-model.md)'
      )
  })
  .partial()
  .describe(
    'Modelina TypeScriptRenderer used to provide rendering helpers for TypeScript code generation inside preset functions. [Read more about the Modelina TypeScript renderer here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptRenderer.ts)'
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
      .describe(
        'The original schema fragment that produced this model before any transformations were applied. [Read more about the Modelina internal model here](https://github.com/asyncapi/modelina/blob/master/docs/internal-model.md)'
      ),
    type: z
      .string()
      .optional()
      .describe(
        'The kind of model this represents (e.g. "object", "string", "enum"). [Read more about the Modelina ConstrainedMetaModel here](https://github.com/asyncapi/modelina/blob/master/src/models/ConstrainedMetaModel.ts)'
      ),
    name: z
      .string()
      .optional()
      .describe(
        'The constrained (rendered) name of the model after naming constraints have been applied. [Read more about the Modelina ConstrainedMetaModel here](https://github.com/asyncapi/modelina/blob/master/src/models/ConstrainedMetaModel.ts)'
      ),

    // For object models
    properties: z
      .record(z.any())
      .optional()
      .describe(
        'The properties of an object model, keyed by constrained property name. [Read more about the Modelina ConstrainedMetaModel here](https://github.com/asyncapi/modelina/blob/master/src/models/ConstrainedMetaModel.ts)'
      ),

    // For enum models
    values: z
      .array(z.any())
      .optional()
      .describe(
        'The enum values when this model represents an enum. [Read more about the Modelina ConstrainedMetaModel here](https://github.com/asyncapi/modelina/blob/master/src/models/ConstrainedMetaModel.ts)'
      ),

    // Complex properties
    options: z
      .any()
      .optional()
      .describe(
        'Model-specific options carried through from the input schema. [Read more about the Modelina ConstrainedMetaModel here](https://github.com/asyncapi/modelina/blob/master/src/models/ConstrainedMetaModel.ts)'
      ),
    constraints: z
      .any()
      .optional()
      .describe(
        'The constraints and transformations that have been applied to produce this constrained model. [Read more about Modelina constraints here](https://github.com/asyncapi/modelina/blob/master/docs/constraints.md)'
      )
  })
  .partial()
  .describe(
    'Modelina ConstrainedMetaModel that represents a processed schema model with naming and other constraints applied. [Read more about the Modelina ConstrainedMetaModel here](https://github.com/asyncapi/modelina/blob/master/src/models/ConstrainedMetaModel.ts) and [read more about the Modelina internal model here](https://github.com/asyncapi/modelina/blob/master/docs/internal-model.md)'
  );

/**
 * Preset function parameters
 * @see https://github.com/asyncapi/modelina/blob/master/docs/presets.md
 */
export const zodPresetFunctionArgs = z
  .object({
    content: z
      .string()
      .describe(
        'The current rendered content for this hook, which the preset function may transform or extend. [Read more about Modelina presets here](https://github.com/asyncapi/modelina/blob/master/docs/presets.md)'
      ),
    model: zodConstrainedMetaModel.describe(
      'The ConstrainedMetaModel currently being processed by the preset. [Read more about the Modelina ConstrainedMetaModel here](https://github.com/asyncapi/modelina/blob/master/src/models/ConstrainedMetaModel.ts)'
    ),
    renderer: zodTypeScriptRenderer.describe(
      'The TypeScriptRenderer instance providing helper methods for generating code. [Read more about the Modelina TypeScript renderer here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptRenderer.ts)'
    ),
    options: zodTypeScriptOptions
      .optional()
      .describe(
        'The TypeScriptOptions in effect for this generation run. [Read more about Modelina TypeScript options here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptGenerator.ts)'
      )
  })
  .describe(
    'Standard parameters passed to Modelina preset functions: content (current code), model (schema model), renderer (helper methods), and options (generator config). [Read more about Modelina presets here](https://github.com/asyncapi/modelina/blob/master/docs/presets.md)'
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
      .describe(
        'Customize the entire rendered class. [Read more about Modelina class presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/ClassRenderer.ts)'
      ),
    ctor: z
      .function()
      .args(zodPresetFunctionArgs)
      .returns(z.string())
      .optional()
      .describe(
        'Customize the rendered class constructor. [Read more about Modelina class presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/ClassRenderer.ts)'
      ),
    property: z
      .function()
      .args(
        zodPresetFunctionArgs.extend({
          property: z
            .any()
            .describe(
              'The ConstrainedObjectPropertyModel currently being rendered. [Read more about the Modelina ConstrainedMetaModel here](https://github.com/asyncapi/modelina/blob/master/src/models/ConstrainedMetaModel.ts)'
            )
        })
      )
      .returns(z.string())
      .optional()
      .describe(
        'Customize how individual properties are rendered on the class. [Read more about Modelina class presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/ClassRenderer.ts)'
      ),
    getter: z
      .function()
      .args(
        zodPresetFunctionArgs.extend({
          property: z
            .any()
            .describe(
              'The ConstrainedObjectPropertyModel that the getter is being rendered for. [Read more about the Modelina ConstrainedMetaModel here](https://github.com/asyncapi/modelina/blob/master/src/models/ConstrainedMetaModel.ts)'
            )
        })
      )
      .returns(z.string())
      .optional()
      .describe(
        'Customize property getter methods on the class. [Read more about Modelina class presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/ClassRenderer.ts)'
      ),
    setter: z
      .function()
      .args(
        zodPresetFunctionArgs.extend({
          property: z
            .any()
            .describe(
              'The ConstrainedObjectPropertyModel that the setter is being rendered for. [Read more about the Modelina ConstrainedMetaModel here](https://github.com/asyncapi/modelina/blob/master/src/models/ConstrainedMetaModel.ts)'
            )
        })
      )
      .returns(z.string())
      .optional()
      .describe(
        'Customize property setter methods on the class. [Read more about Modelina class presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/ClassRenderer.ts)'
      ),
    additionalContent: z
      .function()
      .args(zodPresetFunctionArgs)
      .returns(z.string())
      .optional()
      .describe(
        'Append custom methods or other content to the rendered class. [Read more about Modelina class presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/ClassRenderer.ts)'
      )
  })
  .partial()
  .describe(
    'Modelina TypeScript class preset hooks used to customize class generation, including self, constructor, properties, getters, setters, and additional content. [Read more about Modelina class presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/ClassRenderer.ts)'
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
      .optional()
      .describe(
        'Customize the entire rendered interface. [Read more about Modelina interface presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/InterfaceRenderer.ts)'
      ),
    property: z
      .function()
      .args(
        zodPresetFunctionArgs.extend({
          property: z
            .any()
            .describe(
              'The ConstrainedObjectPropertyModel currently being rendered on the interface. [Read more about the Modelina ConstrainedMetaModel here](https://github.com/asyncapi/modelina/blob/master/src/models/ConstrainedMetaModel.ts)'
            )
        })
      )
      .returns(z.string())
      .optional()
      .describe(
        'Customize how individual properties are rendered on the interface. [Read more about Modelina interface presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/InterfaceRenderer.ts)'
      ),
    additionalContent: z
      .function()
      .args(zodPresetFunctionArgs)
      .returns(z.string())
      .optional()
      .describe(
        'Append custom content to the rendered interface. [Read more about Modelina interface presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/InterfaceRenderer.ts)'
      )
  })
  .partial()
  .describe(
    'Modelina TypeScript interface preset hooks used to customize interface generation, including self, properties, and additional content. [Read more about Modelina interface presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/InterfaceRenderer.ts)'
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
      .optional()
      .describe(
        'Customize the entire rendered enum. [Read more about Modelina enum presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/EnumRenderer.ts)'
      ),
    item: z
      .function()
      .args(
        zodPresetFunctionArgs.extend({
          item: z
            .any()
            .describe(
              'The ConstrainedEnumValueModel currently being rendered as an enum item. [Read more about the Modelina ConstrainedMetaModel here](https://github.com/asyncapi/modelina/blob/master/src/models/ConstrainedMetaModel.ts)'
            )
        })
      )
      .returns(z.string())
      .optional()
      .describe(
        'Customize the rendering of individual enum items. [Read more about Modelina enum presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/EnumRenderer.ts)'
      )
  })
  .partial()
  .describe(
    'Modelina TypeScript enum preset hooks used to customize enum generation, including self and individual enum items. [Read more about Modelina enum presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/EnumRenderer.ts)'
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
      .describe(
        'Customize the entire rendered type alias. [Read more about Modelina type presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/TypeRenderer.ts)'
      )
  })
  .partial()
  .describe(
    'Modelina TypeScript type preset hooks used to customize type alias generation. [Read more about Modelina type presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/TypeRenderer.ts)'
  );

/**
 * Complete TypeScript preset object
 * @see https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptPreset.ts
 */
export const zodTypeScriptPreset = z
  .object({
    class: zodClassPreset
      .optional()
      .describe(
        'Hooks for customizing class rendering. [Read more about Modelina class presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/ClassRenderer.ts)'
      ),
    interface: zodInterfacePreset
      .optional()
      .describe(
        'Hooks for customizing interface rendering. [Read more about Modelina interface presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/InterfaceRenderer.ts)'
      ),
    enum: zodEnumPreset
      .optional()
      .describe(
        'Hooks for customizing enum rendering. [Read more about Modelina enum presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/EnumRenderer.ts)'
      ),
    type: zodTypePreset
      .optional()
      .describe(
        'Hooks for customizing type alias rendering. [Read more about Modelina type presets here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/renderers/TypeRenderer.ts)'
      )
  })
  .partial()
  .describe(
    'Complete Modelina TypeScript preset that bundles class, interface, enum, and type hooks together. [Read more about the Modelina TypeScript preset here](https://github.com/asyncapi/modelina/blob/master/src/generators/typescript/TypeScriptPreset.ts)'
  );

/**
 * Preset with options pattern
 */
export const zodPresetWithOptions = z
  .object({
    preset: zodTypeScriptPreset.describe(
      'The Modelina preset whose hooks will be applied. [Read more about Modelina presets here](https://github.com/asyncapi/modelina/blob/master/docs/presets.md)'
    ),
    options: z
      .record(z.any())
      .optional()
      .describe(
        'Options forwarded to the preset (e.g. enabling marshalling on TS_COMMON_PRESET). [Read more about Modelina presets here](https://github.com/asyncapi/modelina/blob/master/docs/presets.md)'
      )
  })
  .describe(
    'Modelina preset paired with options. Used for reusable presets such as TS_COMMON_PRESET that accept configuration. [Read more about Modelina presets here](https://github.com/asyncapi/modelina/blob/master/docs/presets.md)'
  );

/**
 * Preset array items
 */
export const zodPresetItem = z
  .union([zodTypeScriptPreset, zodPresetWithOptions])
  .describe(
    'An entry in the Modelina presets array. Either a direct preset object or a preset paired with options. [Read more about Modelina presets here](https://github.com/asyncapi/modelina/blob/master/docs/presets.md)'
  );

/**
 * Array of TypeScript presets
 */
export const zodTypeScriptPresets = z
  .array(zodPresetItem)
  .describe(
    'Array of Modelina TypeScript presets passed to TypeScriptFileGenerator. Presets act as middleware that customizes the generated code. [Read more about Modelina presets here](https://github.com/asyncapi/modelina/blob/master/docs/presets.md)'
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
