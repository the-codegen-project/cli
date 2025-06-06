import { UserSignedupParameters } from '../src/parameters/UserSignedupParameters';
import { FindPetsByStatusAndCategoryParameters } from '../src/openapi/parameters/FindPetsByStatusAndCategoryParameters';
describe('parameters', () => {
  const testObject = new UserSignedupParameters({
    myParameter: 'parameter',
    enumParameter: 'asyncapi'
  });
  test('getChannelWithParameters should return correct channel', () => {
    const channelWithParameters = testObject.getChannelWithParameters('user.signedup.{my_parameter}.{enum_parameter}');
    expect(channelWithParameters).toEqual(`user.signedup.${testObject.myParameter}.${testObject.enumParameter}`);
  });
  test('be able to get correct channel', () => {
    const parameter = UserSignedupParameters.createFromChannel('user.signedup.test_my_parameter.asyncapi', 'user.signedup.{my_parameter}.{enum_parameter}', /^user.signedup.([^.]*).([^.]*)$/);
    expect(parameter.enumParameter).toEqual('asyncapi');
    expect(parameter.myParameter).toEqual('test_my_parameter');
  });
  describe('openapi', () => {
    describe('FindPetsByStatusAndCategoryParameters', () => {
      test('should roundtrip serialize and deserialize with only required path parameters', () => {
        const original = new FindPetsByStatusAndCategoryParameters({
          status: 'available',
          categoryId: 123
        });

        const basePath = '/pet/findByStatus/{status}/{categoryId}';
        const serializedUrl = original.serializeUrl(basePath);
        
        // Should have path parameters substituted but no query parameters
        expect(serializedUrl).toEqual('/pet/findByStatus/available/123');

        const deserialized = FindPetsByStatusAndCategoryParameters.fromUrl(serializedUrl, basePath);
        
        // Path parameters are extracted from URL in deserialization
        expect(deserialized.status).toEqual(original.status);
        expect(deserialized.categoryId).toEqual(original.categoryId);
      });

      test('should roundtrip serialize and deserialize with all parameters', () => {
        const original = new FindPetsByStatusAndCategoryParameters({
          status: 'pending',
          categoryId: 456,
          limit: 50,
          offset: 10,
          sortBy: 'name',
          sortOrder: 'desc',
          tags: ['friendly', 'small'],
          includePetDetails: true,
          format: 'json'
        });

        const basePath = '/pet/findByStatus/{status}/{categoryId}';
        const serializedUrl = original.serializeUrl(basePath);
        
        // Should have both path parameters substituted and query parameters
        expect(serializedUrl).toContain('/pet/findByStatus/pending/456');
        expect(serializedUrl).toContain('limit=50');
        expect(serializedUrl).toContain('offset=10');
        expect(serializedUrl).toContain('sortBy=name');
        expect(serializedUrl).toContain('sortOrder=desc');
        expect(serializedUrl).toContain('tags=friendly%2Csmall'); // URL encoded comma
        expect(serializedUrl).toContain('includePetDetails=true');
        expect(serializedUrl).toContain('format=json');

        const deserialized = FindPetsByStatusAndCategoryParameters.fromUrl(serializedUrl, basePath);
        
        // Path parameters (extracted from URL)
        expect(deserialized.status).toEqual(original.status);
        expect(deserialized.categoryId).toEqual(original.categoryId);
        
        // Query parameters (extracted from URL)
        expect(deserialized.limit).toEqual(original.limit);
        expect(deserialized.offset).toEqual(original.offset);
        expect(deserialized.sortBy).toEqual(original.sortBy);
        expect(deserialized.sortOrder).toEqual(original.sortOrder);
        expect(deserialized.tags).toEqual(original.tags);
        expect(deserialized.includePetDetails).toEqual(original.includePetDetails);
        expect(deserialized.format).toEqual(original.format);
      });

      test('should handle path parameter serialization separately from query parameters', () => {
        const params = new FindPetsByStatusAndCategoryParameters({
          status: 'sold',
          categoryId: 789,
          limit: 25
        });

        // Test path parameter serialization
        const pathParams = params.serializePathParameters();
        expect(pathParams).toEqual({
          status: 'sold',
          categoryId: '789'
        });

        // Test query parameter serialization
        const queryParams = params.serializeQueryParameters();
        expect(queryParams.get('limit')).toEqual('25');
        expect(queryParams.has('status')).toBe(false); // status is path param, not query
        expect(queryParams.has('categoryId')).toBe(false); // categoryId is path param, not query
      });

      test('should handle empty tags array correctly', () => {
        const original = new FindPetsByStatusAndCategoryParameters({
          status: 'available',
          categoryId: 1,
          tags: []
        });

        const basePath = '/pet/findByStatus/{status}/{categoryId}';
        const serializedUrl = original.serializeUrl(basePath);
        
        // Empty array should serialize as empty string
        expect(serializedUrl).toContain('tags=');

        const deserialized = FindPetsByStatusAndCategoryParameters.fromUrl(serializedUrl, basePath);
        expect(deserialized.tags).toEqual([]);
      });

      test('should handle special characters in path parameters', () => {
        // Note: In real scenarios, enum values wouldn't have special chars, but testing encoding
        const params = new FindPetsByStatusAndCategoryParameters({
          status: 'available',
          categoryId: 999
        });

        const pathParams = params.serializePathParameters();
        expect(pathParams.status).toEqual('available'); // No encoding needed for this value
        expect(pathParams.categoryId).toEqual('999');
      });

      test('should handle undefined optional query parameters', () => {
        const original = new FindPetsByStatusAndCategoryParameters({
          status: 'available',
          categoryId: 1,
          limit: undefined,
          offset: undefined,
          sortBy: undefined,
          sortOrder: undefined,
          tags: undefined,
          includePetDetails: undefined,
          format: undefined
        });

        const basePath = '/pet/findByStatus/{status}/{categoryId}';
        const serializedUrl = original.serializeUrl(basePath);
        
        // Should only have path parameters, no query string
        expect(serializedUrl).toEqual('/pet/findByStatus/available/1');

        const deserialized = FindPetsByStatusAndCategoryParameters.fromUrl(serializedUrl, basePath);
        expect(deserialized.limit).toBeUndefined();
        expect(deserialized.offset).toBeUndefined();
        expect(deserialized.sortBy).toBeUndefined();
        expect(deserialized.sortOrder).toBeUndefined();
        expect(deserialized.tags).toBeUndefined();
        expect(deserialized.includePetDetails).toBeUndefined();
        expect(deserialized.format).toBeUndefined();
      });

      test('should handle boolean parameter serialization correctly', () => {
        const original = new FindPetsByStatusAndCategoryParameters({
          status: 'available',
          categoryId: 1,
          includePetDetails: false
        });

        const queryParams = original.serializeQueryParameters();
        expect(queryParams.get('includePetDetails')).toEqual('false');

        const basePath = '/pet/findByStatus/{status}/{categoryId}';
        const serializedUrl = original.serializeUrl(basePath);
        const deserialized = FindPetsByStatusAndCategoryParameters.fromUrl(serializedUrl, basePath);
        
        expect(deserialized.includePetDetails).toBe(false);
      });
    });
  })
});
