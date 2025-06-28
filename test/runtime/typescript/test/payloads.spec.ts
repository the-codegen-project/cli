import { UserSignedUp } from '../src/payloads/UserSignedUp';
import { APet } from '../src/openapi/payloads/APet';
import { AUser } from '../src/openapi/payloads/AUser';
import { PetCategory } from '../src/openapi/payloads/PetCategory';
import { PetTag } from '../src/openapi/payloads/PetTag';
import { PetOrder } from '../src/openapi/payloads/PetOrder';
import { AnUploadedResponse } from '../src/openapi/payloads/AnUploadedResponse';
import { Status } from '../src/openapi/payloads/Status';
import { ItemStatus } from '../src/openapi/payloads/ItemStatus';
import * as FindPetsByStatusAndCategoryResponse from '../src/openapi/payloads/FindPetsByStatusAndCategoryResponse';

describe('payloads', () => {
  describe('AsyncAPI', () => {

    describe('should be able to serialize and deserialize the model', () => {
      const testObject = new UserSignedUp({
        email: 'emailTest',
        displayName: 'displayNameTest'
      });
      test('be able to serialize model', () => {
        const serialized = testObject.marshal();
        expect(serialized).toEqual("{\"display_name\": \"displayNameTest\",\"email\": \"emailTest\"}");
      });
      test('be able to serialize model and turning it back to a model with the same values', () => {
        const serialized = testObject.marshal();
        const newAddress = UserSignedUp.unmarshal(serialized);
        expect(serialized).toEqual(newAddress.marshal());
      });
    });
  
    describe('validate function', () => {
      const testObject = new UserSignedUp({
        email: 'test@example.com',
        displayName: 'Test User'
      });
  
      test('should validate correct payload', () => {
        const result = UserSignedUp.validate({
          data: {
            display_name: 'Test User',
            email: 'test@example.com'
          }
        });
        expect(result.valid).toBe(true);
      });
  
      test('should invalidate incorrect email format', () => {
        const result = UserSignedUp.validate({
          data: {
            display_name: 'Test User',
            email: 'invalid-email'
          }
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toEqual([{
          instancePath: "/email",
          schemaPath: "#/properties/email/format",
          keyword: "format",
          params: {
            format: "email",
          },
          message: "must match format \"email\"",
        }]);
      });
  
      test('should provide validation function', () => {
        const validate = UserSignedUp.createValidator();
        expect(typeof validate).toBe('function');
      });
  
      test('should be able to validate multiple times', () => {
        const validate = UserSignedUp.createValidator();
        const result = UserSignedUp.validate({
          data: {
            display_name: 'Test User',
            email: 'test@example.com'
          },
          ajvValidatorFunction: validate
        });
        expect(result.valid).toBe(true);
        expect(UserSignedUp.validate({
          data: {
            display_name: 'Test User',
            email: 'test@example.com'
          },
          ajvValidatorFunction: validate
        }).valid).toBe(true);
      });
    });
  });

  describe('OpenAPI', () => {
    describe('APet', () => {
      describe('serialization and deserialization', () => {
        const category = new PetCategory({ id: 1, name: 'dogs' });
        const tag = new PetTag({ id: 1, name: 'friendly' });
        const testPet = new APet({
          id: 1,
          category,
          name: 'Buddy',
          photoUrls: ['http://example.com/photo1.jpg', 'http://example.com/photo2.jpg'],
          tags: [tag],
          status: Status.AVAILABLE
        });

        test('should serialize model correctly', () => {
          const serialized = testPet.marshal();
          const parsed = JSON.parse(serialized);
          expect(parsed.id).toBe(1);
          expect(parsed.name).toBe('Buddy');
          expect(parsed.photoUrls).toEqual(['http://example.com/photo1.jpg', 'http://example.com/photo2.jpg']);
          expect(parsed.status).toBe('available');
          expect(parsed.category.id).toBe(1);
          expect(parsed.category.name).toBe('dogs');
          expect(parsed.tags[0].id).toBe(1);
          expect(parsed.tags[0].name).toBe('friendly');
        });

        test('should deserialize and reserialize with same values', () => {
          const serialized = testPet.marshal();
          const deserialized = APet.unmarshal(serialized);
          expect(serialized).toEqual(deserialized.marshal());
        });

        test('should handle minimal required fields', () => {
          const minimalPet = new APet({
            name: 'MinimalPet',
            photoUrls: ['http://example.com/photo.jpg']
          });
          const serialized = minimalPet.marshal();
          const deserialized = APet.unmarshal(serialized);
          expect(deserialized.name).toBe('MinimalPet');
          expect(deserialized.photoUrls).toEqual(['http://example.com/photo.jpg']);
        });
      });

      describe('validation', () => {
        test('should validate correct pet data', () => {
          const result = APet.validate({
            data: {
              id: 1,
              name: 'Buddy',
              photoUrls: ['http://example.com/photo.jpg'],
              status: 'available'
            }
          });
          expect(result.valid).toBe(true);
          expect(result.errors).toBeUndefined();
        });

        test('should invalidate pet without required name', () => {
          const result = APet.validate({
            data: {
              id: 1,
              photoUrls: ['http://example.com/photo.jpg']
            }
          });
          expect(result.valid).toBe(false);
          expect(result.errors).toBeDefined();
          expect(result.errors?.some(e => e.instancePath === '' && e.keyword === 'required')).toBe(true);
        });

        test('should invalidate pet without required photoUrls', () => {
          const result = APet.validate({
            data: {
              id: 1,
              name: 'Buddy'
            }
          });
          expect(result.valid).toBe(false);
          expect(result.errors).toBeDefined();
          expect(result.errors?.some(e => e.instancePath === '' && e.keyword === 'required')).toBe(true);
        });

        test('should create validator function', () => {
          const validate = APet.createValidator();
          expect(typeof validate).toBe('function');
        });
      });
    });

    describe('AUser', () => {
      describe('serialization and deserialization', () => {
        const testUser = new AUser({
          id: 1,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'password123',
          phone: '+1234567890',
          userStatus: 1
        });

        test('should serialize model correctly', () => {
          const serialized = testUser.marshal();
          const parsed = JSON.parse(serialized);
          expect(parsed.id).toBe(1);
          expect(parsed.username).toBe('testuser');
          expect(parsed.firstName).toBe('Test');
          expect(parsed.lastName).toBe('User');
          expect(parsed.email).toBe('test@example.com');
          expect(parsed.password).toBe('password123');
          expect(parsed.phone).toBe('+1234567890');
          expect(parsed.userStatus).toBe(1);
        });

        test('should deserialize and reserialize with same values', () => {
          const serialized = testUser.marshal();
          const deserialized = AUser.unmarshal(serialized);
          expect(serialized).toEqual(deserialized.marshal());
        });

        test('should handle optional fields', () => {
          const minimalUser = new AUser({});
          const serialized = minimalUser.marshal();
          expect(serialized).toBe('{}');
          const deserialized = AUser.unmarshal(serialized);
          expect(deserialized.id).toBeUndefined();
          expect(deserialized.username).toBeUndefined();
        });
      });

      describe('validation', () => {
        test('should validate correct user data', () => {
          const result = AUser.validate({
            data: {
              id: 1,
              username: 'testuser',
              email: 'test@example.com'
            }
          });
          expect(result.valid).toBe(true);
          expect(result.errors).toBeUndefined();
        });

        test('should validate empty user data', () => {
          const result = AUser.validate({
            data: {}
          });
          expect(result.valid).toBe(true);
        });
      });
    });

    describe('PetCategory', () => {
      describe('serialization and deserialization', () => {
        const testCategory = new PetCategory({
          id: 1,
          name: 'dogs'
        });

        test('should serialize model correctly', () => {
          const serialized = testCategory.marshal();
          const parsed = JSON.parse(serialized);
          expect(parsed.id).toBe(1);
          expect(parsed.name).toBe('dogs');
        });

        test('should deserialize and reserialize with same values', () => {
          const serialized = testCategory.marshal();
          const deserialized = PetCategory.unmarshal(serialized);
          expect(serialized).toEqual(deserialized.marshal());
        });
      });

      describe('validation', () => {
        test('should validate correct category data', () => {
          const result = PetCategory.validate({
            data: {
              id: 1,
              name: 'dogs'
            }
          });
          expect(result.valid).toBe(true);
        });

        test('should invalidate category with invalid name pattern', () => {
          const result = PetCategory.validate({
            data: {
              id: 1,
              name: '!invalid-name!'
            }
          });
          expect(result.valid).toBe(false);
          expect(result.errors?.some(e => e.keyword === 'pattern')).toBe(true);
        });
      });
    });

    describe('PetOrder', () => {
      describe('serialization and deserialization', () => {
        const testOrder = new PetOrder({
          id: 1,
          petId: 10,
          quantity: 2,
          shipDate: '2023-12-01T10:00:00.000Z',
          status: Status.PENDING,
          complete: false
        });

        test('should serialize model correctly', () => {
          const serialized = testOrder.marshal();
          const parsed = JSON.parse(serialized);
          expect(parsed.id).toBe(1);
          expect(parsed.petId).toBe(10);
          expect(parsed.quantity).toBe(2);
          expect(parsed.shipDate).toBe('2023-12-01T10:00:00.000Z');
          expect(parsed.status).toBe('pending');
          expect(parsed.complete).toBe(false);
        });

        test('should deserialize and reserialize with same values', () => {
          const serialized = testOrder.marshal();
          const deserialized = PetOrder.unmarshal(serialized);
          expect(serialized).toEqual(deserialized.marshal());
        });
      });

      describe('validation', () => {
        test('should validate correct order data', () => {
          const result = PetOrder.validate({
            data: {
              id: 1,
              petId: 10,
              quantity: 2,
              status: 'placed'
            }
          });
          expect(result.valid).toBe(true);
        });

        test('should invalidate order with invalid status', () => {
          const result = PetOrder.validate({
            data: {
              id: 1,
              status: 'invalid-status'
            }
          });
          expect(result.valid).toBe(false);
          expect(result.errors?.some(e => e.keyword === 'enum')).toBe(true);
        });

        test('should invalidate order with invalid date format', () => {
          const result = PetOrder.validate({
            data: {
              id: 1,
              shipDate: 'invalid-date'
            }
          });
          expect(result.valid).toBe(false);
          expect(result.errors?.some(e => e.keyword === 'format')).toBe(true);
        });
      });
    });

    describe('AnUploadedResponse', () => {
      describe('serialization and deserialization', () => {
        const testResponse = new AnUploadedResponse({
          code: 200,
          type: 'success',
          message: 'File uploaded successfully'
        });

        test('should serialize model correctly', () => {
          const serialized = testResponse.marshal();
          const parsed = JSON.parse(serialized);
          expect(parsed.code).toBe(200);
          expect(parsed.type).toBe('success');
          expect(parsed.message).toBe('File uploaded successfully');
        });

        test('should deserialize and reserialize with same values', () => {
          const serialized = testResponse.marshal();
          const deserialized = AnUploadedResponse.unmarshal(serialized);
          expect(serialized).toEqual(deserialized.marshal());
        });

        test('should handle empty response', () => {
          const emptyResponse = new AnUploadedResponse({});
          const serialized = emptyResponse.marshal();
          expect(serialized).toBe('{}');
        });
      });

      describe('validation', () => {
        test('should validate correct response data', () => {
          const result = AnUploadedResponse.validate({
            data: {
              code: 200,
              type: 'success',
              message: 'File uploaded successfully'
            }
          });
          expect(result.valid).toBe(true);
        });

        test('should validate empty response data', () => {
          const result = AnUploadedResponse.validate({
            data: {}
          });
          expect(result.valid).toBe(true);
        });
      });
    });

    describe('FindPetsByStatusAndCategoryResponse_200', () => {
      describe('serialization and deserialization', () => {
        const pet1 = new APet({
          id: 1,
          name: 'Buddy',
          photoUrls: ['http://example.com/photo1.jpg'],
          status: Status.AVAILABLE
        });
        const pet2 = new APet({
          id: 2,
          name: 'Max',
          photoUrls: ['http://example.com/photo2.jpg'],
          status: Status.PENDING
        });
        const testResponse = [pet1, pet2];

        test('should serialize array response correctly', () => {
          const serialized = FindPetsByStatusAndCategoryResponse.marshal(testResponse);
          const parsed = JSON.parse(serialized);
          expect(Array.isArray(parsed)).toBe(true);
          expect(parsed).toHaveLength(2);
          expect(parsed[0].id).toBe(1);
          expect(parsed[0].name).toBe('Buddy');
          expect(parsed[1].id).toBe(2);
          expect(parsed[1].name).toBe('Max');
        });

        test('should deserialize array response correctly', () => {
          const serialized = FindPetsByStatusAndCategoryResponse.marshal(testResponse);
          const deserialized = FindPetsByStatusAndCategoryResponse.unmarshal(serialized);
          expect(Array.isArray(deserialized)).toBe(true);
          expect(deserialized).toHaveLength(2);
          expect(deserialized[0].id).toBe(1);
          expect(deserialized[0].name).toBe('Buddy');
        });

        test('should handle empty array', () => {
          const emptyResponse: APet[] = [];
          const serialized = FindPetsByStatusAndCategoryResponse.marshal(emptyResponse);
          expect(serialized).toBe('[]');
          const deserialized = FindPetsByStatusAndCategoryResponse.unmarshal(serialized);
          expect(Array.isArray(deserialized)).toBe(true);
          expect(deserialized).toHaveLength(0);
        });
      });

      describe('validation', () => {
        test('should validate correct array response', () => {
          const result = FindPetsByStatusAndCategoryResponse.validate({
            data: [
              {
                id: 1,
                name: 'Buddy',
                photoUrls: ['http://example.com/photo.jpg']
              }
            ]
          });
          expect(result.valid).toBe(true);
        });

        test('should validate empty array', () => {
          const result = FindPetsByStatusAndCategoryResponse.validate({
            data: []
          });
          expect(result.valid).toBe(true);
        });

        test('should invalidate non-array data', () => {
          const result = FindPetsByStatusAndCategoryResponse.validate({
            data: {
              id: 1,
              name: 'Buddy'
            }
          });
          expect(result.valid).toBe(false);
          expect(result.errors?.some(e => e.keyword === 'type')).toBe(true);
        });
      });
    });

    describe('Enums', () => {
      test('Status enum should have correct values', () => {
        expect(Status.AVAILABLE).toBe('available');
        expect(Status.PENDING).toBe('pending');
        expect(Status.SOLD).toBe('sold');
      });

      test('ItemStatus enum should have correct values', () => {
        expect(ItemStatus.AVAILABLE).toBe('available');
        expect(ItemStatus.PENDING).toBe('pending');
        expect(ItemStatus.SOLD).toBe('sold');
      });
    });

    describe('Additional Properties', () => {
      test('should handle additional properties in APet', () => {
        const petData = {
          id: 1,
          name: 'Buddy',
          photoUrls: ['http://example.com/photo.jpg'],
          customField: 'customValue'
        };
        const pet = APet.unmarshal(petData);
        expect(pet.id).toBe(1);
        expect(pet.name).toBe('Buddy');
        // Additional properties should be stored
        expect(pet.additionalProperties).toBeDefined();
      });
    });

    describe('Validator Reuse', () => {
      test('should reuse validator function for better performance', () => {
        const validator = APet.createValidator();
        
        const result1 = APet.validate({
          data: {
            id: 1,
            name: 'Buddy',
            photoUrls: ['http://example.com/photo.jpg']
          },
          ajvValidatorFunction: validator
        });
        
        const result2 = APet.validate({
          data: {
            id: 2,
            name: 'Max',
            photoUrls: ['http://example.com/photo2.jpg']
          },
          ajvValidatorFunction: validator
        });
        
        expect(result1.valid).toBe(true);
        expect(result2.valid).toBe(true);
      });
    });
  });
});
