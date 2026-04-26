/* eslint-disable no-console */
import { connect, NatsConnection } from 'nats';
import { EventCatalogPing } from '../../src/eventcatalog/payloads/EventCatalogPing';
import {
  publishToSendEventcatalogPing,
  subscribeToReceiveEventcatalogPing
} from '../../src/eventcatalog/channels/nats';

describe('EventCatalog input (asyncapi mode)', () => {
  let nc: NatsConnection;
  beforeAll(async () => {
    nc = await connect({ servers: 'nats://localhost:4443' });
  });
  afterAll(async () => {
    const done = nc.closed();
    await nc.close();
    const err = await done;
    if (err) {
      console.log('error closing nats:', err);
    }
  });

  it('publishes and subscribes via generated NATS channels', async () => {
    const message = new EventCatalogPing({ message: 'hello from eventcatalog' });

    await new Promise<void>(async (resolve, reject) => {
      const subscription = await subscribeToReceiveEventcatalogPing({
        onDataCallback: async (err, received) => {
          try {
            expect(err).toBeUndefined();
            expect(received?.marshal()).toEqual(message.marshal());
            await subscription.drain();
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        nc
      });
      await publishToSendEventcatalogPing({ message, nc });
    });
  });
});
