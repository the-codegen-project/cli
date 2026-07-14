import { UserSignedupParameters } from '../src/parameters/UserSignedupParameters';
import { FindPetsByStatusAndCategoryParameters, serializeFindPetsByStatusAndCategoryParametersUrl, parseFindPetsByStatusAndCategoryParametersFromUrl } from '../src/openapi/parameters/FindPetsByStatusAndCategoryParameters';
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
        const original: FindPetsByStatusAndCategoryParameters = {
          status: 'available',
          categoryId: 123
        };

        const basePath = '/pet/findByStatus/{status}/{categoryId}';
        const serializedUrl = serializeFindPetsByStatusAndCategoryParametersUrl(original, basePath);

        expect(serializedUrl).toEqual('/pet/findByStatus/available/123');

        const deserialized = parseFindPetsByStatusAndCategoryParametersFromUrl(serializedUrl, basePath);

        expect(deserialized.status).toEqual(original.status);
        expect(deserialized.categoryId).toEqual(original.categoryId);
      });

      test('should roundtrip serialize and deserialize with all parameters', () => {
        const original: FindPetsByStatusAndCategoryParameters = {
          status: 'pending',
          categoryId: 456,
          limit: 50,
          offset: 10,
          sortBy: 'name',
          sortOrder: 'desc',
          tags: ['friendly', 'small'],
          includePetDetails: true,
          format: 'json'
        };

        const basePath = '/pet/findByStatus/{status}/{categoryId}';
        const serializedUrl = serializeFindPetsByStatusAndCategoryParametersUrl(original, basePath);

        expect(serializedUrl).toContain('/pet/findByStatus/pending/456');
        expect(serializedUrl).toContain('limit=50');
        expect(serializedUrl).toContain('offset=10');
        expect(serializedUrl).toContain('sortBy=name');
        expect(serializedUrl).toContain('sortOrder=desc');
        expect(serializedUrl).toContain('tags=friendly,small');
        expect(serializedUrl).toContain('includePetDetails=true');
        expect(serializedUrl).toContain('format=json');

        const deserialized = parseFindPetsByStatusAndCategoryParametersFromUrl(serializedUrl, basePath);

        expect(deserialized.status).toEqual(original.status);
        expect(deserialized.categoryId).toEqual(original.categoryId);
        expect(deserialized.limit).toEqual(original.limit);
        expect(deserialized.offset).toEqual(original.offset);
        expect(deserialized.sortBy).toEqual(original.sortBy);
        expect(deserialized.sortOrder).toEqual(original.sortOrder);
        expect(deserialized.tags).toEqual(original.tags);
        expect(deserialized.includePetDetails).toEqual(original.includePetDetails);
        expect(deserialized.format).toEqual(original.format);
      });

      test('should handle empty tags array correctly', () => {
        const original: FindPetsByStatusAndCategoryParameters = {
          status: 'available',
          categoryId: 1,
          tags: []
        };

        const basePath = '/pet/findByStatus/{status}/{categoryId}';
        const serializedUrl = serializeFindPetsByStatusAndCategoryParametersUrl(original, basePath);

        expect(serializedUrl).toContain('tags=');

        const deserialized = parseFindPetsByStatusAndCategoryParametersFromUrl(serializedUrl, basePath);
        expect(deserialized.tags).toEqual([]);
      });

      test('should handle undefined optional query parameters', () => {
        const original: FindPetsByStatusAndCategoryParameters = {
          status: 'available',
          categoryId: 1,
          limit: undefined,
          offset: undefined,
          sortBy: undefined,
          sortOrder: undefined,
          tags: undefined,
          includePetDetails: undefined,
          format: undefined
        };

        const basePath = '/pet/findByStatus/{status}/{categoryId}';
        const serializedUrl = serializeFindPetsByStatusAndCategoryParametersUrl(original, basePath);

        expect(serializedUrl).toEqual('/pet/findByStatus/available/1');

        const deserialized = parseFindPetsByStatusAndCategoryParametersFromUrl(serializedUrl, basePath);
        expect(deserialized.limit).toBeUndefined();
        expect(deserialized.offset).toBeUndefined();
        expect(deserialized.sortBy).toBeUndefined();
        expect(deserialized.sortOrder).toBeUndefined();
        expect(deserialized.tags).toBeUndefined();
        expect(deserialized.includePetDetails).toBeUndefined();
        expect(deserialized.format).toBeUndefined();
      });

      test('should handle boolean parameter serialization correctly', () => {
        const original: FindPetsByStatusAndCategoryParameters = {
          status: 'available',
          categoryId: 1,
          includePetDetails: false
        };

        const basePath = '/pet/findByStatus/{status}/{categoryId}';
        const serializedUrl = serializeFindPetsByStatusAndCategoryParametersUrl(original, basePath);
        expect(serializedUrl).toContain('includePetDetails=false');

        const deserialized = parseFindPetsByStatusAndCategoryParametersFromUrl(serializedUrl, basePath);
        expect(deserialized.includePetDetails).toBe(false);
      });

      test('should encode and decode special characters in query params without double-encoding', () => {
        const original: FindPetsByStatusAndCategoryParameters = {
          status: 'available',
          categoryId: 1,
          tags: ['a&b', 'c=d', 'e f']
        };

        const basePath = '/pet/findByStatus/{status}/{categoryId}';
        const serializedUrl = serializeFindPetsByStatusAndCategoryParametersUrl(original, basePath);

        const deserialized = parseFindPetsByStatusAndCategoryParametersFromUrl(serializedUrl, basePath);
        expect(deserialized.tags).toEqual(original.tags);
      });

      test('should coerce numeric and boolean types on parse', () => {
        const original: FindPetsByStatusAndCategoryParameters = {
          status: 'available',
          categoryId: 42,
          limit: 10,
          offset: 5,
          includePetDetails: true
        };

        const basePath = '/pet/findByStatus/{status}/{categoryId}';
        const serializedUrl = serializeFindPetsByStatusAndCategoryParametersUrl(original, basePath);
        const deserialized = parseFindPetsByStatusAndCategoryParametersFromUrl(serializedUrl, basePath);

        expect(typeof deserialized.categoryId).toBe('number');
        expect(typeof deserialized.limit).toBe('number');
        expect(typeof deserialized.offset).toBe('number');
        expect(typeof deserialized.includePetDetails).toBe('boolean');
      });

      test('should throw when required parameter missing from URL', () => {
        const basePath = '/pet/findByStatus/{status}/{categoryId}';
        expect(() => {
          parseFindPetsByStatusAndCategoryParametersFromUrl('/pet/findByStatus/available', basePath);
        }).toThrow();
      });

      test('form non-explode array should serialize as comma-joined', () => {
        const original: FindPetsByStatusAndCategoryParameters = {
          status: 'available',
          categoryId: 1,
          tags: ['3', '4', '5']
        };

        const basePath = '/pet/findByStatus/{status}/{categoryId}';
        const serializedUrl = serializeFindPetsByStatusAndCategoryParametersUrl(original, basePath);
        expect(serializedUrl).toContain('tags=3,4,5');
      });
    });
  })
});
