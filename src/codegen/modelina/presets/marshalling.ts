import {
  ConstrainedArrayModel,
  ConstrainedMetaModel,
  ConstrainedObjectModel,
  ConstrainedStringModel
} from '@asyncapi/modelina';

/**
 * Whether a property renders as a JavaScript `Date` (i.e. a string schema with a
 * `date`/`date-time` format). These are the properties Modelina converts from a
 * JSON string into a `Date` during unmarshalling.
 */
function isDateProperty(model: ConstrainedMetaModel): boolean {
  if (!(model instanceof ConstrainedStringModel)) {
    return false;
  }
  const format = model.originalInput?.format;
  return format === 'date' || format === 'date-time';
}

/**
 * Whether a property's declared type includes `null`.
 */
function isNullable(model: ConstrainedMetaModel): boolean {
  return model.options?.isNullable === true || model.type.includes('| null');
}

/**
 * Fixes two `tsc`-breaking defects in the marshal/unmarshal methods emitted by
 * Modelina's `TS_COMMON_PRESET` (tracked upstream as the-codegen-project/cli#373).
 *
 * Modelina lives in an external package, so we correct its output here by
 * post-processing the already-rendered class body. Each replacement is derived
 * from the model, so it targets exactly the buggy line for the affected property
 * and leaves every other property untouched:
 *
 *  1. `unmarshal()` emits `obj["x"] == null ? null : new Date(obj["x"])` for a
 *     required, non-nullable date property, yielding `Date | null` where `Date`
 *     is declared. The null branch is dropped so the assignment type-checks.
 *  2. `marshal()` guards a nullable array with only `!== undefined` before
 *     iterating it, so `null` slips through and `for (const item of this.x)`
 *     reports "Object is possibly 'null'". An explicit null guard is added.
 *
 * This preset must run after `TS_COMMON_PRESET` so that `content` already
 * contains the rendered marshal/unmarshal methods.
 */
export function createMarshallingFixPreset() {
  return {
    class: {
      additionalContent({
        content,
        model
      }: {
        content: string;
        model: ConstrainedMetaModel;
      }) {
        if (!(model instanceof ConstrainedObjectModel)) {
          return content;
        }

        let result = content;
        for (const propModel of Object.values(model.properties)) {
          const property = propModel.property;
          const accessor = propModel.propertyName;
          const wireKey = propModel.unconstrainedPropertyName;

          if (
            isDateProperty(property) &&
            propModel.required &&
            !isNullable(property)
          ) {
            const buggy = `instance.${accessor} = obj["${wireKey}"] == null ? null : new Date(obj["${wireKey}"]);`;
            const fixed = `instance.${accessor} = new Date(obj["${wireKey}"]);`;
            result = result.replace(buggy, fixed);
          }

          if (
            property instanceof ConstrainedArrayModel &&
            isNullable(property)
          ) {
            const buggy = `if(this.${accessor} !== undefined) {`;
            const fixed = `if(this.${accessor} !== undefined && this.${accessor} !== null) {`;
            result = result.replace(buggy, fixed);
          }
        }
        return result;
      }
    }
  };
}
