import {
  ConstrainedObjectModel,
  OutputModel
} from '@asyncapi/modelina';
import {
  addParametersToDependencies,
  parameterUnionType,
  renderParameterNormalization
} from '../../../../../src/codegen/generators/typescript/channels/utils';

describe('channels utils', () => {
  describe('addParametersToDependencies', () => {
    it('should import both the parameter class and its companion interface', () => {
      const parameterModel = new OutputModel(
        '',
        new ConstrainedObjectModel('TestParameters', undefined, {}, 'Parameter', {}),
        'TestParameters',
        {models: {}, originalInput: undefined} as any,
        []
      );
      const dependencies: string[] = [];
      addParametersToDependencies(
        {channel: parameterModel},
        {outputPath: './parameters'},
        {outputPath: './channels'},
        dependencies
      );
      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]).toContain('TestParameters, TestParametersInterface');
      expect(dependencies[0]).toMatch(
        /^import \{TestParameters, TestParametersInterface\} from '.+';$/
      );
    });
  });

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
