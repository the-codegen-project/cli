/**
 * Runtime tests for enum payload types.
 *
 * NOTE: Enum schemas generate as TypeScript enums without marshal/unmarshal/validate
 * functions. This file tests the type generation and enum values.
 * See tracking.json ISS-001 for details.
 */
import { SingleStringEnum } from '../../src/payload-types/payloads/SingleStringEnum';
import { MultipleStringEnum } from '../../src/payload-types/payloads/MultipleStringEnum';
import { IntegerEnum } from '../../src/payload-types/payloads/IntegerEnum';
import * as MixedTypeEnum from '../../src/payload-types/payloads/MixedTypeEnum';
import * as NullableEnum from '../../src/payload-types/payloads/NullableEnum';

describe('Enum Types', () => {
  describe('SingleStringEnum', () => {
    test('should have the enum value defined', () => {
      expect(SingleStringEnum.ACTIVE).toBe('active');
    });

    test('should be usable as a type', () => {
      const value: SingleStringEnum = SingleStringEnum.ACTIVE;
      expect(value).toBe('active');
    });

    test('should allow string comparison', () => {
      const value = SingleStringEnum.ACTIVE;
      expect(value === 'active').toBe(true);
    });
  });

  describe('MultipleStringEnum', () => {
    test('should have all enum values defined', () => {
      expect(MultipleStringEnum.PENDING).toBe('pending');
      expect(MultipleStringEnum.ACTIVE).toBe('active');
      expect(MultipleStringEnum.INACTIVE).toBe('inactive');
      expect(MultipleStringEnum.DELETED).toBe('deleted');
    });

    test('should be usable as a type for each value', () => {
      const pending: MultipleStringEnum = MultipleStringEnum.PENDING;
      const active: MultipleStringEnum = MultipleStringEnum.ACTIVE;
      const inactive: MultipleStringEnum = MultipleStringEnum.INACTIVE;
      const deleted: MultipleStringEnum = MultipleStringEnum.DELETED;

      expect(pending).toBe('pending');
      expect(active).toBe('active');
      expect(inactive).toBe('inactive');
      expect(deleted).toBe('deleted');
    });

    test('should have 4 enum members', () => {
      const values = Object.values(MultipleStringEnum);
      expect(values).toHaveLength(4);
    });
  });

  describe('IntegerEnum', () => {
    test('should have all integer enum values defined', () => {
      expect(IntegerEnum.NUMBER_1).toBe(1);
      expect(IntegerEnum.NUMBER_2).toBe(2);
      expect(IntegerEnum.NUMBER_3).toBe(3);
      expect(IntegerEnum.NUMBER_4).toBe(4);
      expect(IntegerEnum.NUMBER_5).toBe(5);
    });

    test('should be usable as a numeric type', () => {
      const value: IntegerEnum = IntegerEnum.NUMBER_3;
      expect(value).toBe(3);
      expect(typeof value).toBe('number');
    });

    test('should have 5 enum members', () => {
      // For numeric enums, Object.values includes both keys and values
      // Filter to only numeric values
      const values = Object.values(IntegerEnum).filter(v => typeof v === 'number');
      expect(values).toHaveLength(5);
    });
  });

  // MixedTypeEnum converts non-string/number values to strings
  // e.g., true becomes "true", 123 stays as 123, "string_value" stays as is
  describe('MixedTypeEnum', () => {
    test('should have string value', () => {
      expect(MixedTypeEnum.MixedTypeEnum.STRING_VALUE).toBe('string_value');
    });

    test('should have number value', () => {
      expect(MixedTypeEnum.MixedTypeEnum.NUMBER_123).toBe(123);
    });

    test('should convert boolean true to string "true"', () => {
      // TypeScript enums can't have boolean values, so true becomes "true"
      expect(MixedTypeEnum.MixedTypeEnum.RESERVED_TRUE).toBe('true');
    });

    test('should have 3 values', () => {
      const values = Object.values(MixedTypeEnum.MixedTypeEnum);
      expect(values).toContain('string_value');
      expect(values).toContain(123);
      expect(values).toContain('true');
    });
  });

  // NullableEnum converts null to string 'null'
  describe('NullableEnum', () => {
    test('should have option_a value', () => {
      expect(NullableEnum.NullableEnum.OPTION_A).toBe('option_a');
    });

    test('should have option_b value', () => {
      expect(NullableEnum.NullableEnum.OPTION_B).toBe('option_b');
    });

    test('should convert null to string "null"', () => {
      // TypeScript enums can't have null values, so null becomes 'null'
      expect(NullableEnum.NullableEnum.RESERVED_NULL).toBe('null');
    });

    test('should have 3 values', () => {
      const values = Object.values(NullableEnum.NullableEnum);
      expect(values).toContain('option_a');
      expect(values).toContain('option_b');
      expect(values).toContain('null');
    });
  });
});
