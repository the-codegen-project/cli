/* eslint-disable no-console */
import { AckPolicy, DeliverPolicy, JetStreamClient, JetStreamManager, NatsConnection, ReplayPolicy, ConsumerOpts, connect } from "nats";
import { NatsClient, UserSignedUp, UserSignedupParameters } from '../src/client/NatsClient';

import { Protocols } from '../src/channels/index';
const { nats } = Protocols;

jest.setTimeout(10000)
describe('nats', () => {
  const testMessage = new UserSignedUp({displayName: 'test', email: 'test@test.dk'});
  const testParameters = new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'});
  describe('client', () => {
    describe('with parameters', () => {
      let client: NatsClient;
      let nc: NatsConnection;
      let js: JetStreamClient;
      beforeAll(async () => {
        client = new NatsClient();
        ({nc, js} = await client.connectToHost("nats://localhost:4443"));
      });
      afterAll(async () => {
        await client.disconnect();
      });

      it('should be able to setup reply and get a request', async () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const subscribtion = await client.subscribeToUserSignedup(async (err, msg, parameters) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              expect(parameters?.myParameter).toEqual(testParameters.myParameter);
              await subscribtion.drain();
              resolve();
            } catch (error) {
              reject(error);
            }
          }, new UserSignedupParameters({myParameter: '*', enumParameter: 'asyncapi'}));
          nc.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, testMessage.marshal());
        });
      });
    });
  });
});
