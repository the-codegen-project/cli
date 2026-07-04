import path from 'path';
import {loadEvent} from '../../../../src/codegen/inputs/eventcatalog/eventLoader';

const FIXTURES = path.resolve(__dirname, './__fixtures__');
const nativeCatalog = path.join(FIXTURES, 'native-service/eventcatalog');
const missingEventSchema = path.join(
  FIXTURES,
  'invalid/missing-event-schema/eventcatalog'
);

describe('EventCatalog eventLoader', () => {
  describe('loadEvent', () => {
    it('loads an event schema from events/<id>/schema.json', () => {
      const event = loadEvent({
        catalogRoot: nativeCatalog,
        ref: {
          id: 'OrderCreated',
          version: '1.0.0'
        }
      });
      expect(event.id).toBe('OrderCreated');
      expect((event.schema as any).$id).toBe('OrderCreated');
      expect((event.schema as any).type).toBe('object');
      expect((event.schema as any).properties).toHaveProperty('orderId');
    });

    it('throws when the event directory does not exist', () => {
      expect(() =>
        loadEvent({
          catalogRoot: nativeCatalog,
          ref: {id: 'NonExistentEvent', version: '1.0.0'}
        })
      ).toThrow(/NonExistentEvent/);
    });

    it('throws when schemaPath cannot be resolved', () => {
      expect(() =>
        loadEvent({
          catalogRoot: missingEventSchema,
          ref: {
            id: 'MissingSchemaEvent',
            version: '1.0.0'
          }
        })
      ).toThrow(/MissingSchemaEvent|nonexistent/);
    });
  });
});
