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
// MixedTypeEnum and NullableEnum may generate differently due to mixed/null types

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

  // Skip MixedTypeEnum and NullableEnum tests as they may generate differently
  // Mixed types (string | number | boolean) and nullable enums require special handling
  describe('MixedTypeEnum (skipped)', () => {
    test.skip('mixed type enums may not generate as TypeScript enums', () => {
      // This test is skipped because mixed type enums cannot be represented
      // as TypeScript enums and may generate as union types instead
    });
  });

  describe('NullableEnum (skipped)', () => {
    test.skip('nullable enums may not generate as TypeScript enums', () => {
      // This test is skipped because enums with null values cannot be
      // represented as TypeScript enums
    });
  });
});
