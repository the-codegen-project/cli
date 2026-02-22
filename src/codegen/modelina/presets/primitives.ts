import {
  ConstrainedMetaModel,
  ConstrainedStringModel,
  ConstrainedIntegerModel,
  ConstrainedFloatModel,
  ConstrainedBooleanModel,
  ConstrainedArrayModel,
  ConstrainedAnyModel
} from '@asyncapi/modelina';
import {TypeScriptRenderer} from '@asyncapi/modelina/lib/types/generators/typescript/TypeScriptRenderer';
import {
  BaseGeneratorContext,
  generateTypescriptValidationCode
} from './validation';

/**
 * Configuration options for the primitives preset
 */
export interface PrimitivesPresetOptions {
  /** Whether to include validation methods in generated primitive types */
  includeValidation: boolean;
}

/**
 * Check if the model is a primitive type (string, integer, float, boolean)
 */
function isPrimitiveModel(model: ConstrainedMetaModel): boolean {
  return (
    model instanceof ConstrainedStringModel ||
    model instanceof ConstrainedIntegerModel ||
    model instanceof ConstrainedFloatModel ||
    model instanceof ConstrainedBooleanModel
  );
}

/**
 * Check if the model is a null type (ConstrainedAnyModel with type: null in schema)
 * Modelina converts null types to ConstrainedAnyModel
 */
function isNullModel(model: ConstrainedMetaModel): boolean {
  if (!(model instanceof ConstrainedAnyModel)) {
    return false;
  }
  // Check if the original input schema has type: null
  const originalInput = model.originalInput;
  return originalInput && originalInput.type === 'null';
}

/**
 * Render marshal function for null type
 */
function renderNullMarshal(model: ConstrainedMetaModel): string {
  return `export function marshal(payload: null): string {
  return JSON.stringify(payload);
}`;
}

/**
 * Render unmarshal function for null type
 */
function renderNullUnmarshal(model: ConstrainedMetaModel): string {
  return `export function unmarshal(json: string): null {
  const parsed = JSON.parse(json);
  if (parsed !== null) {
    throw new Error('Expected null value');
  }
  return null;
}`;
}

/**
 * Render marshal function for primitive types
 */
function renderPrimitiveMarshal(model: ConstrainedMetaModel): string {
  return `export function marshal(payload: ${model.name}): string {
  return JSON.stringify(payload);
}`;
}

/**
 * Render unmarshal function for primitive types
 */
function renderPrimitiveUnmarshal(model: ConstrainedMetaModel): string {
  // For string types, the input can be a JSON string (quoted) or the raw value
  // We use 'any' for the json parameter since JSON.parse returns 'any'
  return `export function unmarshal(json: string): ${model.name} {
  return JSON.parse(json) as ${model.name};
}`;
}

/**
 * Render marshal function for array types
 */
function renderArrayMarshal(model: ConstrainedArrayModel): string {
  const valueModel = model.valueModel;

  // Check if array items have a marshal method (object types)
  const hasItemMarshal =
    valueModel.type !== 'string' &&
    valueModel.type !== 'number' &&
    valueModel.type !== 'boolean';

  if (hasItemMarshal) {
    return `export function marshal(payload: ${model.name}): string {
  return JSON.stringify(payload.map((item) => {
    if (item && typeof item === 'object' && 'marshal' in item && typeof item.marshal === 'function') {
      return JSON.parse(item.marshal());
    }
    return item;
  }));
}`;
  }

  return `export function marshal(payload: ${model.name}): string {
  return JSON.stringify(payload);
}`;
}

/**
 * Render unmarshal function for array types
 */
function renderArrayUnmarshal(model: ConstrainedArrayModel): string {
  const valueModel = model.valueModel;

  // Check if array items have an unmarshal method (only object types do)
  // Exclude primitives and nested arrays - they don't have unmarshal methods
  const hasItemUnmarshal =
    valueModel.type !== 'string' &&
    valueModel.type !== 'number' &&
    valueModel.type !== 'boolean' &&
    !(valueModel instanceof ConstrainedArrayModel);

  if (hasItemUnmarshal) {
    const itemTypeName = valueModel.name;
    return `export function unmarshal(json: string | any[]): ${model.name} {
  const arr = typeof json === 'string' ? JSON.parse(json) : json;
  return arr.map((item: any) => {
    if (item && typeof item === 'object') {
      return ${itemTypeName}.unmarshal(item);
    }
    return item;
  }) as ${model.name};
}`;
  }

  return `export function unmarshal(json: string | any[]): ${model.name} {
  if (typeof json === 'string') {
    return JSON.parse(json) as ${model.name};
  }
  return json as ${model.name};
}`;
}

/**
 * Creates a preset that adds marshalling/unmarshalling and validation methods
 * to primitive types (string, number, boolean) and array types
 *
 * @param options Configuration for primitive generation
 * @param context Generator context containing input type information
 * @returns Modelina preset object with primitive marshalling functionality
 *
 * @example
 * ```typescript
 * const preset = createPrimitivesPreset({
 *   includeValidation: true
 * }, context);
 * ```
 */
export function createPrimitivesPreset(
  options: PrimitivesPresetOptions,
  context: BaseGeneratorContext
) {
  return {
    type: {
      self({
        model,
        content,
        renderer
      }: {
        model: ConstrainedMetaModel;
        content: string;
        renderer: TypeScriptRenderer;
      }) {
        // Handle primitive types (string, integer, float, boolean)
        if (isPrimitiveModel(model)) {
          return `${content}

${renderPrimitiveUnmarshal(model)}
${renderPrimitiveMarshal(model)}
${options.includeValidation ? generateTypescriptValidationCode({model, renderer, asClassMethods: false, context: context as any}) : ''}
`;
        }

        // Handle array types
        if (model instanceof ConstrainedArrayModel) {
          return `${content}

${renderArrayUnmarshal(model)}
${renderArrayMarshal(model)}
${options.includeValidation ? generateTypescriptValidationCode({model, renderer, asClassMethods: false, context: context as any}) : ''}
`;
        }

        // Handle null types (ConstrainedAnyModel with type: null in original schema)
        if (isNullModel(model)) {
          return `${content}

${renderNullUnmarshal(model)}
${renderNullMarshal(model)}
${options.includeValidation ? generateTypescriptValidationCode({model, renderer, asClassMethods: false, context: context as any}) : ''}
`;
        }

        return content;
      }
    }
  };
}
