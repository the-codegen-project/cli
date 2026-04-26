import path from 'path';
import {loadServiceMetadata} from '../../../../src/codegen/inputs/eventcatalog/serviceLoader';
import {
  loadEvent,
  synthesizeAsyncAPIDocument
} from '../../../../src/codegen/inputs/eventcatalog/eventLoader';

const FIXTURES = path.resolve(__dirname, './__fixtures__');
const nativeCatalog = path.join(FIXTURES, 'native-service/eventcatalog');
const missingEventSchema = path.join(
  FIXTURES,
  'invalid/missing-event-schema/eventcatalog'
);

describe('EventCatalog eventLoader', () => {
  describe('loadEvent', () => {
    it('loads an event schema from events/<id>/schema.json', () => {
      const event = loadEvent(nativeCatalog, {
        id: 'OrderCreated',
        version: '1.0.0'
      });
      expect(event.id).toBe('OrderCreated');
      expect(event.schema.$id).toBe('OrderCreated');
      expect(event.schema.type).toBe('object');
      expect(event.schema.properties).toHaveProperty('orderId');
    });

    it('throws when the event directory does not exist', () => {
      expect(() =>
        loadEvent(nativeCatalog, {id: 'NonExistentEvent', version: '1.0.0'})
      ).toThrow(/NonExistentEvent/);
    });

    it('throws when schemaPath cannot be resolved', () => {
      expect(() =>
        loadEvent(missingEventSchema, {
          id: 'MissingSchemaEvent',
          version: '1.0.0'
        })
      ).toThrow(/MissingSchemaEvent|nonexistent/);
    });
  });

  describe('synthesizeAsyncAPIDocument', () => {
    it('synthesizes an AsyncAPI 3.0 document with one channel per send + receive event', async () => {
      const service = loadServiceMetadata(nativeCatalog, 'order-service');
      const sends = service.sends.map((ref) => loadEvent(nativeCatalog, ref));
      const receives = service.receives.map((ref) =>
        loadEvent(nativeCatalog, ref)
      );

      const doc = await synthesizeAsyncAPIDocument(service, {sends, receives});
      const json = doc.json() as any;

      expect(json.asyncapi).toBe('3.0.0');
      expect(json.info.title).toBe('Order Service');
      expect(json.info.version).toBe('1.2.3');

      const channels = json.channels ?? {};
      expect(Object.keys(channels)).toEqual(
        expect.arrayContaining(['OrderCreated', 'OrderShipped'])
      );

      const operations = json.operations ?? {};
      const ops = Object.values(operations) as Array<{action: string}>;
      const sendActions = ops.filter((op) => op.action === 'send');
      const receiveActions = ops.filter((op) => op.action === 'receive');
      expect(sendActions.length).toBe(1);
      expect(receiveActions.length).toBe(1);
    });

    it('falls back to service.id when name is missing', async () => {
      const service = loadServiceMetadata(nativeCatalog, 'order-service');
      const minimalService = {
        ...service,
        name: undefined,
        version: undefined
      };
      const sends = service.sends.map((ref) => loadEvent(nativeCatalog, ref));
      const receives = service.receives.map((ref) =>
        loadEvent(nativeCatalog, ref)
      );

      const doc = await synthesizeAsyncAPIDocument(minimalService as any, {
        sends,
        receives
      });
      const json = doc.json() as any;
      expect(json.info.title).toBe('order-service');
      expect(json.info.version).toBe('1.0.0');
    });
  });
});
