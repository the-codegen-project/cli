import {
  parameterUnionType,
  renderParameterNormalization
} from '../../../../../src/codegen/generators/typescript/channels/utils';

describe('channels utils', () => {
  describe('parameterUnionType', () => {
    it('should widen a parameter model name to an interface | class union', () => {
      expect(parameterUnionType('FindPetsByStatusAndCategoryParameters')).toEqual(
        'FindPetsByStatusAndCategoryParametersInterface | FindPetsByStatusAndCategoryParameters'
      );
    });
  });

  describe('renderParameterNormalization', () => {
    it('should normalize a source value to a class instance via instanceof guard', () => {
      expect(
        renderParameterNormalization({
          modelName: 'FindPetsByStatusAndCategoryParameters',
          source: 'context.parameters',
          target: 'parameters'
        })
      ).toEqual(
        'const parameters = context.parameters instanceof FindPetsByStatusAndCategoryParameters ? context.parameters : new FindPetsByStatusAndCategoryParameters(context.parameters);'
      );
    });
  });
});
