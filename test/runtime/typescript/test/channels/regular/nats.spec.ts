/* eslint-disable no-console */
import { AckPolicy, DeliverPolicy, JetStreamClient, JetStreamManager, NatsConnection, ReplayPolicy, ConsumerOpts, connect, JSONCodec } from "nats";
import { UserSignedUp, UserSignedupParameters } from '../../../src/client/NatsClient';
import { Protocols } from '../../../src/channels/index';
const { nats } = Protocols;
const {
  jetStreamPublishToSendUserSignedup, jetStreamPullSubscribeToReceiveUserSignedup, jetStreamPushSubscriptionFromReceiveUserSignedup, publishToSendUserSignedup, subscribeToReceiveUserSignedup,
  jetStreamPublishToNoParameter, jetStreamPullSubscribeToNoParameter, jetStreamPushSubscriptionFromNoParameter, publishToNoParameter, subscribeToNoParameter } = nats;

describe('nats', () => {
  const testMessage = new UserSignedUp({ displayName: 'test', email: 'test@test.dk' });
  const testParameters = new UserSignedupParameters({ myParameter: 'test', enumParameter: 'asyncapi' });

  describe('channels', () => {
    describe('with parameters', () => {
      let nc: NatsConnection;
      let js: JetStreamClient;
      let jsm: JetStreamManager;
      const test_stream = 'nats_channels_test';
      const test_subj = 'user.signedup.*.*';
      beforeAll(async () => {
        nc = await connect({ servers: "nats://localhost:4443" });
        js = nc.jetstream();
        jsm = await nc.jetstreamManager();
        await jsm.streams.add({ name: test_stream, subjects: [test_subj] });
      });
      afterEach(async () => {
        await jsm.streams.purge(test_stream);
      });
      afterAll(async () => {
        await jsm.streams.delete(test_stream);
        // close the connection
        const done = nc.closed();
        await nc.close();
        // check if the close was OK
        const err = await done;
        if (err) {
          console.log(`error closing:`, err);
        }
      });

      it('should be able publish over JetStream', async () => {
        await jetStreamPublishToSendUserSignedup({ message: testMessage, parameters: testParameters, js });
        const msg = await jsm.streams.getMessage(test_stream, { last_by_subj: test_subj });
        expect(msg.json()).toEqual("{\"display_name\": \"test\",\"email\": \"test@test.dk\"}");
      });

      describe('should be able to do pull subscribe', () => {
        it('with correct payload', () => {
          const config = {
            stream: test_stream,
            config: {
              durable_name: 'jps_correct_payload',
              ack_policy: AckPolicy.Explicit,
              replay_policy: ReplayPolicy.Instant,
              deliver_policy: DeliverPolicy.All,
            },
          };
          // eslint-disable-next-line no-async-promise-executor
          return new Promise<void>(async (resolve, reject) => {
            js.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, testMessage.marshal());
            const subscriber = await jetStreamPullSubscribeToReceiveUserSignedup({
              onDataCallback: async (err, msg, parameters, jetstreamMsg) => {
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
              },
              parameters: new UserSignedupParameters({ myParameter: '*', enumParameter: 'asyncapi' }),
              js,
              options: config
            });
            subscriber.pull({ batch: 1, expires: 10000 });
          });
        });

        it('and catch incorrect payload', () => {
          const config = {
            stream: test_stream,
            config: {
              durable_name: 'jps_incorrect_payload',
              ack_policy: AckPolicy.Explicit,
              replay_policy: ReplayPolicy.Instant,
              deliver_policy: DeliverPolicy.All,
            },
          };
          // eslint-disable-next-line no-async-promise-executor
          return new Promise<void>(async (resolve, reject) => {
            const incorrectPayload = JSON.stringify({ displayName: 'test', email: '123' });
            const subscriber = await jetStreamPullSubscribeToReceiveUserSignedup({
              onDataCallback: async (err, _, parameters, jetstreamMsg) => {
                try {
                  expect(err).toBeDefined();
                  expect(err?.message).toBeDefined();
                  expect(err?.cause).toBeDefined();
                  expect(parameters?.myParameter).toEqual(testParameters.myParameter);
                  jetstreamMsg?.ack();
                  await subscriber.drain();
                  resolve();
                } catch (error) {
                  reject(error);
                }
              },
              parameters: new UserSignedupParameters({ myParameter: '*', enumParameter: 'asyncapi' }),
              js,
              options: config
            });
            js.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, incorrectPayload);
            subscriber.pull({ batch: 1, expires: 10000 });
          });
        });

        it('and ignore incorrect payload', () => {
          const config = {
            stream: test_stream,
            config: {
              durable_name: 'jps_ignore_payload',
              ack_policy: AckPolicy.Explicit,
              replay_policy: ReplayPolicy.Instant,
              deliver_policy: DeliverPolicy.All,
            },
          };
          // eslint-disable-next-line no-async-promise-executor
          return new Promise<void>(async (resolve, reject) => {
            const incorrectPayload = JSON.stringify({ email: '123', displayName: 'test' });
            js.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, incorrectPayload);
            const subscriber = await jetStreamPullSubscribeToReceiveUserSignedup({
              onDataCallback: async (err, msg, parameters, jetstreamMsg) => {
                try {
                  expect(err).toBeUndefined();
                  expect(msg?.marshal()).toEqual("{\"email\": \"123\",\"displayName\": \"test\"}");
                  expect(parameters?.myParameter).toEqual(testParameters.myParameter);
                  jetstreamMsg?.ack();
                  await subscriber.drain();
                  resolve();
                } catch (error) {
                  reject(error);
                }
              },
              parameters: new UserSignedupParameters({ myParameter: '*', enumParameter: 'asyncapi' }),
              js,
              options: config,
              skipMessageValidation: true
            });
            subscriber.pull({ batch: 2, expires: 10000 });
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
          await publishToSendUserSignedup({ message: testMessage, parameters: testParameters, nc });
        });
      });

      describe('should be able to do core subscribe', () => {
        it('with correct payload', () => {
          // eslint-disable-next-line no-async-promise-executor
          return new Promise<void>(async (resolve, reject) => {
            const subscribtion = await subscribeToReceiveUserSignedup({
              onDataCallback: async (err, msg, parameters) => {
                try {
                  expect(err).toBeUndefined();
                  expect(msg?.marshal()).toEqual(testMessage.marshal());
                  expect(parameters?.myParameter).toEqual(testParameters.myParameter);
                  await subscribtion.drain();
                  resolve();
                } catch (error) {
                  reject(error);
                }
              },
              parameters: new UserSignedupParameters({ myParameter: '*', enumParameter: 'asyncapi' }),
              nc
            });
            nc.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, testMessage.marshal());
          });
        });
        it('and catch incorrect payload', () => {
          // eslint-disable-next-line no-async-promise-executor
          return new Promise<void>(async (resolve, reject) => {
            const subscribtion = await subscribeToReceiveUserSignedup({
              onDataCallback: async (err, _, parameters) => {
                try {
                  expect(err).toBeDefined();
                  expect(err?.message).toBeDefined();
                  expect(err?.cause).toBeDefined();
                  expect(parameters?.myParameter).toEqual(testParameters.myParameter);
                  await subscribtion.drain();
                  resolve();
                } catch (error) {
                  reject(error);
                }
              },
              parameters: new UserSignedupParameters({ myParameter: '*', enumParameter: 'asyncapi' }),
              nc
            });
            const incorrectPaylod = JSON.stringify({ displayName: 'test', email: '123' })
            nc.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, incorrectPaylod);
          });
        });
        it('and ignore incorrect payload', () => {
          // eslint-disable-next-line no-async-promise-executor
          return new Promise<void>(async (resolve, reject) => {
            const subscribtion = await subscribeToReceiveUserSignedup({
              onDataCallback: async (err, msg, parameters) => {
                try {
                  expect(err).toBeUndefined();
                  expect(msg?.marshal()).toEqual("{\"email\": \"123\",\"displayName\": \"test\"}");
                  expect(parameters?.myParameter).toEqual(testParameters.myParameter);
                  await subscribtion.drain();
                  resolve();
                } catch (error) {
                  reject(error);
                }
              },
              parameters: new UserSignedupParameters({ myParameter: '*', enumParameter: 'asyncapi' }),
              nc,
              skipMessageValidation: true
            });
            const incorrectPaylod = JSON.stringify({ displayName: 'test', email: '123' })
            nc.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, incorrectPaylod);
          });
        });
      });

      describe('should be able to do jetstream push subscribe', () => {
        it('with correct payload', () => {
          const config: Partial<ConsumerOpts> = {
            stream: test_stream,
            config: {
              durable_name: 'jpushs_correct_payload',
              ack_policy: AckPolicy.Explicit,
              replay_policy: ReplayPolicy.Instant,
              deliver_policy: DeliverPolicy.All,
              deliver_subject: `ack_jps_correct_payload`
            },
          };
          return new Promise<void>(async (resolve, reject) => {
            const subscription = await jetStreamPushSubscriptionFromReceiveUserSignedup({
              onDataCallback: async (err, msg, parameters, jetstreamMsg) => {
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
              },
              parameters: new UserSignedupParameters({ myParameter: '*', enumParameter: 'asyncapi' }),
              js,
              options: config
            });
            js.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, testMessage.marshal());
          });
        });
        it('and catch incorrect payload', () => {
          const config: Partial<ConsumerOpts> = {
            stream: test_stream,
            config: {
              durable_name: 'jpushs_incorrect_payload',
              ack_policy: AckPolicy.Explicit,
              replay_policy: ReplayPolicy.Instant,
              deliver_policy: DeliverPolicy.All,
              deliver_subject: `ack_jps_incorrect_payload`
            },
          };
          return new Promise<void>(async (resolve, reject) => {
            const subscription = await jetStreamPushSubscriptionFromReceiveUserSignedup({
              onDataCallback: async (err, _, parameters, jetstreamMsg) => {
                try {
                  expect(err).toBeDefined();
                  expect(err?.message).toBeDefined();
                  expect(err?.cause).toBeDefined();
                  expect(parameters?.myParameter).toEqual(testParameters.myParameter);
                  await subscription.drain();
                  resolve();
                } catch (error) {
                  reject(error);
                }
              },
              parameters: new UserSignedupParameters({ myParameter: '*', enumParameter: 'asyncapi' }),
              js,
              options: config
            });
            const incorrectPaylod = JSON.stringify({ displayName: 'test', email: '123' })
            nc.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, incorrectPaylod);
          });
        });
        it('and ignore incorrect payload', () => {
          const config: Partial<ConsumerOpts> = {
            stream: test_stream,
            config: {
              durable_name: 'jpushs_ignore_payload',
              ack_policy: AckPolicy.Explicit,
              replay_policy: ReplayPolicy.Instant,
              deliver_policy: DeliverPolicy.All,
              deliver_subject: `ack_jps_ignore_payload`
            },
          };
          return new Promise<void>(async (resolve, reject) => {
            const subscription = await jetStreamPushSubscriptionFromReceiveUserSignedup({
              onDataCallback: async (err, msg, parameters) => {
                try {
                  expect(err).toBeUndefined();
                  expect(msg?.marshal()).toEqual("{\"email\": \"123\",\"displayName\": \"test\"}");
                  expect(parameters?.myParameter).toEqual(testParameters.myParameter);
                  await subscription.drain();
                  resolve();
                } catch (error) {
                  reject(error);
                }
              },
              parameters: new UserSignedupParameters({ myParameter: '*', enumParameter: 'asyncapi' }),
              js,
              options: config,
              skipMessageValidation: true
            });
            const incorrectPaylod = JSON.stringify({ displayName: 'test', email: '123' })
            nc.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, incorrectPaylod);
          });
        });
      });
    });
    describe('without parameters', () => {
      let nc: NatsConnection;
      let js: JetStreamClient;
      let jsm: JetStreamManager;
      const test_stream = 'noparameters_stream';
      const test_subj = 'noparameters';
      beforeAll(async () => {
        nc = await connect({ servers: "nats://localhost:4443" });
        js = nc.jetstream();
        jsm = await nc.jetstreamManager();
        await jsm.streams.add({ name: test_stream, subjects: [test_subj] });
      });
      afterEach(async () => {
        await jsm.streams.purge(test_stream);
      });
      afterAll(async () => {
        await jsm.streams.delete(test_stream);
        // close the connection
        const done = nc.closed();
        await nc.close();
        // check if the close was OK
        const err = await done;
        if (err) {
          console.log(`error closing:`, err);
        }
      });

      it('should be able publish over JetStream', async () => {
        await jetStreamPublishToNoParameter({ message: testMessage, js });
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
          const subscriber = await jetStreamPullSubscribeToNoParameter({
            onDataCallback: async (err, msg, jetstreamMsg) => {
              try {
                expect(err).toBeUndefined();
                expect(msg?.marshal()).toEqual(testMessage.marshal());
                jetstreamMsg?.ack();
                await subscriber.drain();
                resolve();
              } catch (error) {
                reject(error);
              }
            },
            js,
            options: config
          });
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
          await publishToNoParameter({ message: testMessage, nc });
        });
      });

      it('should be able to do core subscribe', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const subscribtion = await subscribeToNoParameter({
            onDataCallback: async (err, msg) => {
              try {
                expect(err).toBeUndefined();
                expect(msg?.marshal()).toEqual(testMessage.marshal());
                await subscribtion.drain();
                resolve();
              } catch (error) {
                reject(error);
              }
            },
            nc
          });
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
          const subscription = await jetStreamPushSubscriptionFromNoParameter({
            onDataCallback: async (err, msg, jetstreamMsg) => {
              try {
                expect(err).toBeUndefined();
                expect(msg?.marshal()).toEqual(testMessage.marshal());
                jetstreamMsg?.ack();
                await subscription.drain();
                resolve();
              } catch (error) {
                reject(error);
              }
            },
            js,
            options: config
          });
          js.publish(`noparameters`, testMessage.marshal());
        });
      });
    });
  });
});
