import {
  ConstrainedObjectModel,
  ConstrainedObjectPropertyModel,
  ConstrainedIntegerModel,
  ConstrainedReferenceModel,
  ConstrainedStringModel
} from '@asyncapi/modelina';
import {
  buildParametersInterfaceBody,
  realizeParameterForChannelWithType
} from '../../../../src/codegen/generators/typescript/utils';

describe('typescript generator utils', () => {
  describe('buildParametersInterfaceBody', () => {
    it('should emit one indented property line per property with optional markers', () => {
      const statusProperty = new ConstrainedObjectPropertyModel(
        'status',
        'status',
        true,
        new ConstrainedReferenceModel(
          'status',
          undefined,
          {},
          'Status',
          new ConstrainedStringModel('status', undefined, {}, 'string')
        )
      );
      const categoryIdProperty = new ConstrainedObjectPropertyModel(
        'categoryId',
        'categoryId',
        true,
        new ConstrainedIntegerModel('categoryId', undefined, {}, 'number')
      );
      const limitProperty = new ConstrainedObjectPropertyModel(
        'limit',
        'limit',
        false,
        new ConstrainedIntegerModel('limit', undefined, {}, 'number')
      );
      const model = new ConstrainedObjectModel(
        'FindPetsParameters',
        undefined,
        {},
        'Parameter',
        {
          status: statusProperty,
          categoryId: categoryIdProperty,
          limit: limitProperty
        }
      );

      expect(buildParametersInterfaceBody(model)).toEqual(
        '  status: Status\n  categoryId: number\n  limit?: number'
      );
    });
  });

  describe('realizeParameterForChannelWithType', () => {
    it('should render a required parameter without a stray suffix', () => {
      expect(realizeParameterForChannelWithType('status', 'Status')).toEqual(
        'status: Status'
      );
    });
    it('should render an optional parameter', () => {
      expect(
        realizeParameterForChannelWithType('limit', 'number', false)
      ).toEqual('limit?: number');
    });
  });
});
