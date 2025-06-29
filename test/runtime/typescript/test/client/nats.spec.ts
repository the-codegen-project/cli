/* eslint-disable no-console */
import { AckPolicy, DeliverPolicy, JetStreamClient, JetStreamManager, NatsConnection, ReplayPolicy, ConsumerOpts } from "nats";
import { NatsClient, UserSignedUp, UserSignedupParameters } from '../../src/client/NatsClient';

describe('nats', () => {
  const testMessage = new UserSignedUp({ displayName: 'test', email: 'test@test.dk' });
  const testParameters = new UserSignedupParameters({ myParameter: 'test', enumParameter: 'asyncapi' });
  describe('client', () => {
    describe('with parameters', () => {
      let client: NatsClient;
      let nc: NatsConnection;
      let js: JetStreamClient;
      let jsm: JetStreamManager;
      const test_stream = 'nats_client_test';
      const test_subj = 'user.signedup.*.*';
      beforeAll(async () => {
        client = new NatsClient();
        ({ nc, js } = await client.connectToHost("nats://localhost:4443"));
        jsm = await nc.jetstreamManager();
        await jsm.streams.add({ name: test_stream, subjects: [test_subj] });
      });
      afterEach(async () => {
        await jsm.streams.purge(test_stream);
      });
      afterAll(async () => {
        await jsm.streams.delete(test_stream);
        await client.disconnect();
      });

      it('should be able publish over JetStream', async () => {
        await client.jetStreamPublishToSendUserSignedup({message: testMessage, parameters: testParameters});
        const msg = await jsm.streams.getMessage(test_stream, { last_by_subj: test_subj });
        expect(msg.json()).toEqual("{\"display_name\": \"test\",\"email\": \"test@test.dk\"}");
      });

      describe('should be able to do pull subscribe', () => {
        it('with correct payload', () => {
          // eslint-disable-next-line no-async-promise-executor
          return new Promise<void>(async (resolve, reject) => {
            const config = {
              stream: test_stream,
              config: {
                ack_policy: AckPolicy.Explicit,
                replay_policy: ReplayPolicy.Instant,
                deliver_policy: DeliverPolicy.All,
              },
            };
            js.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, testMessage.marshal());
            const subscriber = await client.jetStreamPullSubscribeToReceiveUserSignedup({onDataCallback: async (err, msg, parameters, jetstreamMsg) => {
              try {
                expect(err).toBeUndefined();
                expect(msg?.marshal()).toEqual(testMessage.marshal());
                expect(parameters?.myParameter).toEqual(testParameters.myParameter);
                jetstreamMsg?.ack();
                await subscriber.drain();
                resolve();
              } catch (error) {
                reject(error);
              }
            }, parameters: new UserSignedupParameters({ myParameter: '*', enumParameter: 'asyncapi' }), options: config});
            subscriber.pull({ batch: 1, expires: 10000 });
          });
        });

        it('and catch incorrect payload', () => {
          // eslint-disable-next-line no-async-promise-executor
          return new Promise<void>(async (resolve, reject) => {
            const config = {
              stream: test_stream,
              config: {
                ack_policy: AckPolicy.Explicit,
                replay_policy: ReplayPolicy.Instant,
                deliver_policy: DeliverPolicy.All,
              },
            };
            const incorrectPayload = JSON.stringify({ displayName: 'test', email: '123' });
            js.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, incorrectPayload);
            const subscriber = await client.jetStreamPullSubscribeToReceiveUserSignedup({onDataCallback: async (err, _, parameters, jetstreamMsg) => {
              try {
                expect(err).toBeDefined();
                expect(err?.message).toBeDefined();
                expect(parameters?.myParameter).toEqual(testParameters.myParameter);
                jetstreamMsg?.ack();
                await subscriber.drain();
                resolve();
              } catch (error) {
                reject(error);
              }
            }, parameters: new UserSignedupParameters({ myParameter: '*', enumParameter: 'asyncapi' }), options: config});
            subscriber.pull({ batch: 1, expires: 10000 });
          });
        });
      });

      it('should be able to publish core', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          nc.subscribe(test_subj, {
            callback: async (err, msg) => {
              try {
                expect(err).toBeNull();
                expect(msg.json()).toEqual(testMessage.marshal());
                resolve();
              } catch (error) {
                reject(error);
              }
            }
          });
          await client.publishToSendUserSignedup({message: testMessage, parameters: testParameters});
        });
      });

      it('should be able to do core subscribe', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const subscribtion = await client.subscribeToReceiveUserSignedup({onDataCallback: async (err, msg, parameters) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              expect(parameters?.myParameter).toEqual(testParameters.myParameter);
              await subscribtion.drain();
              resolve();
            } catch (error) {
              reject(error);
            }
          }, parameters: new UserSignedupParameters({ myParameter: '*', enumParameter: 'asyncapi' })});
          nc.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, testMessage.marshal());
        });
      });

      it('should be able to do jetstream push subscribe', () => {
        const config: Partial<ConsumerOpts> = {
          stream: test_stream,
          config: {
            durable_name: 'jetstream_push_subscribe',
            ack_policy: AckPolicy.Explicit,
            replay_policy: ReplayPolicy.Instant,
            deliver_policy: DeliverPolicy.All,
            deliver_subject: `ack_jetstream_push_subscribe`
          },
        };
        return new Promise<void>(async (resolve, reject) => {
          const subscription = await client.jetStreamPushSubscriptionFromReceiveUserSignedup({onDataCallback: async (err, msg, parameters, jetstreamMsg) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              expect(parameters?.myParameter).toEqual(testParameters.myParameter);
              jetstreamMsg?.ack();
              await subscription.drain();
              resolve();
            } catch (error) {
              reject(error);
            }
          }, parameters: new UserSignedupParameters({ myParameter: '*', enumParameter: 'asyncapi' }), options: config});
          js.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, testMessage.marshal());
        });
      });
    });
    describe('without parameters', () => {
      let client: NatsClient;
      let nc: NatsConnection;
      let js: JetStreamClient;
      let jsm: JetStreamManager;
      const test_stream = 'noparameters_stream';
      const test_subj = 'noparameters';
      beforeAll(async () => {
        client = new NatsClient();
        ({ nc, js } = await client.connectToHost("nats://localhost:4443"));
        jsm = await nc.jetstreamManager();
        await jsm.streams.add({ name: test_stream, subjects: [test_subj] });
      });
      afterEach(async () => {
        await jsm.streams.purge(test_stream);
      });
      afterAll(async () => {
        await jsm.streams.delete(test_stream);
        await client.disconnect();
      });

      it('should be able publish over JetStream', async () => {
        await client.jetStreamPublishToNoParameter({message: testMessage});
        const msg = await jsm.streams.getMessage(test_stream, { last_by_subj: test_subj });
        expect(msg.json()).toEqual("{\"display_name\": \"test\",\"email\": \"test@test.dk\"}");
      });

      it('should be able to do pull subscribe over JetStream', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const config = {
            stream: test_stream,
            config: {
              ack_policy: AckPolicy.Explicit,
              replay_policy: ReplayPolicy.Instant,
              deliver_policy: DeliverPolicy.All,
            },
          };
          js.publish(`noparameters`, testMessage.marshal())
          const subscriber = await client.jetStreamPullSubscribeToNoParameter({onDataCallback: async (err, msg, jetstreamMsg) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              jetstreamMsg?.ack();
              await subscriber.drain();
              resolve();
            } catch (error) {
              reject(error);
            }
          }, options: config});
          subscriber.pull({ batch: 1, expires: 10000 });
        });
      });

      it('should be able to publish core', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          nc.subscribe(test_subj, {
            callback: async (err, msg) => {
              try {
                expect(err).toBeNull();
                expect(msg.json()).toEqual(testMessage.marshal());
                resolve();
              } catch (error) {
                reject(error);
              }
            }
          });
          await client.publishToNoParameter({message: testMessage});
        });
      });

      it('should be able to do core subscribe', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const subscribtion = await client.subscribeToNoParameter({onDataCallback: async (err, msg, parameters) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              await subscribtion.drain();
              resolve();
            } catch (error) {
              reject(error);
            }
          }});
          nc.publish(`noparameters`, testMessage.marshal());
        });
      });

      it('should be able to do jetstream push subscribe', () => {
        const config: Partial<ConsumerOpts> = {
          stream: test_stream,
          config: {
            durable_name: 'jetstream_push_subscribe',
            ack_policy: AckPolicy.Explicit,
            replay_policy: ReplayPolicy.Instant,
            deliver_policy: DeliverPolicy.All,
            deliver_subject: `ack_jetstream_push_subscribe`
          },
        };
        return new Promise<void>(async (resolve, reject) => {
          const subscription = await client.jetStreamPushSubscriptionFromNoParameter({onDataCallback: async (err, msg, jetstreamMsg) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              jetstreamMsg?.ack();
              await subscription.drain();
              resolve();
            } catch (error) {
              reject(error);
            }
          }, options: config});
          js.publish(`noparameters`, testMessage.marshal());
        });
      });
    });
  });
});
