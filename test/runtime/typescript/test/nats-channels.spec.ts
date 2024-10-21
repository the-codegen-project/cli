/* eslint-disable no-console */
import { AckPolicy, DeliverPolicy, JetStreamClient, JetStreamManager, NatsConnection, ReplayPolicy, connect, ConsumerOpts } from "nats";
import { Protocols } from '../src/channels/index';
import { UserSignedUpPayload } from '../src/payloads/UserSignedUpPayload';
import { UserSignedupParameters } from '../src/parameters/UserSignedupParameters';
const { nats } = Protocols;
const { 
  jetStreamPublishToUserSignedup, jetStreamPullSubscribeToUserSignedup, jetStreamPushSubscriptionFromUserSignedup, publishToUserSignedup, subscribeToUserSignedup,
  jetStreamPublishToNoParameter, jetStreamPullSubscribeToNoParameter, jetStreamPushSubscriptionFromNoParameter, publishToNoParameter, subscribeToNoParameter } = nats;

jest.setTimeout(10000)
describe('channels', () => {
  const testMessage = new UserSignedUpPayload({displayName: 'test', email: 'test@test.dk'});
  describe('with parameters', () => {
    const testParameters = new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'});
    describe('NATS', () => {
      let nc: NatsConnection;
      let js: JetStreamClient;
      let jsm: JetStreamManager;
      const test_stream = 'userSignedUp';
      const test_subj = 'user.signedup.*.*';
      beforeAll(async () => {
        nc = await connect({servers: "nats://localhost:4443"});
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
        await jetStreamPublishToUserSignedup(testMessage, testParameters, js);
        const msg = await jsm.streams.getMessage(test_stream, {last_by_subj: test_subj});
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
          js.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, testMessage.marshal())
          const subscriber = await jetStreamPullSubscribeToUserSignedup(async (err, msg, parameters, jetstreamMsg) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              expect(parameters?.myParameter).toEqual(testParameters.myParameter);
              jetstreamMsg?.ack();
              await subscriber.drain();
              resolve();
            } catch (error) {
              reject(error);config
            }
          }, new UserSignedupParameters({myParameter: '*', enumParameter: 'asyncapi'}), js, config);
          subscriber.pull({batch: 1, expires: 10000});
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
          await publishToUserSignedup(testMessage, testParameters, nc);
        });
      });

      it('should be able to do core subscribe', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const subscribtion = await subscribeToUserSignedup(async (err, msg, parameters) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              expect(parameters?.myParameter).toEqual(testParameters.myParameter);
              await subscribtion.drain();
              resolve();
            } catch (error) {
              reject(error);
            }
          }, new UserSignedupParameters({myParameter: '*', enumParameter: 'asyncapi'}), nc);
          nc.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, testMessage.marshal());
        });
      });

      it('should be able to do jetstream push subscribe', () => {
        const config: Partial<ConsumerOpts>= {
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
          const subscription = await jetStreamPushSubscriptionFromUserSignedup(async (err, msg, parameters, jetstreamMsg) => {
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
          }, new UserSignedupParameters({myParameter: '*', enumParameter: 'asyncapi'}), js, config, undefined);
          js.publish(`user.signedup.${testParameters.myParameter}.${testParameters.enumParameter}`, testMessage.marshal());
        });
      });
    });
  });
  describe('without parameters', () => {
    describe('NATS', () => {
      let nc: NatsConnection;
      let js: JetStreamClient;
      let jsm: JetStreamManager;
      const test_stream = 'noparameters_stream';
      const test_subj = 'noparameters';
      beforeAll(async () => {
        nc = await connect({servers: "nats://localhost:4443"});
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
        await jetStreamPublishToNoParameter(testMessage, js);
        const msg = await jsm.streams.getMessage(test_stream, {last_by_subj: test_subj});
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
          const subscriber = await jetStreamPullSubscribeToNoParameter(async (err, msg, jetstreamMsg) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              jetstreamMsg?.ack();
              await subscriber.drain();
              resolve();
            } catch (error) {
              reject(error);
            }
          }, js, config);
          subscriber.pull({batch: 1, expires: 10000});
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
          await publishToNoParameter(testMessage, nc);
        });
      });

      it('should be able to do core subscribe', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const subscribtion = await subscribeToNoParameter(async (err, msg, parameters) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              await subscribtion.drain();
              resolve();
            } catch (error) {
              reject(error);
            }
          }, nc);
          nc.publish(`noparameters`, testMessage.marshal());
        });
      });

      it('should be able to do jetstream push subscribe', () => {
        const config: Partial<ConsumerOpts>= {
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
          const subscription = await jetStreamPushSubscriptionFromNoParameter(async (err, msg, jetstreamMsg) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              jetstreamMsg?.ack();
              await subscription.drain();
              resolve();
            } catch (error) {
              reject(error);
            }
          }, js, config);
          js.publish(`noparameters`, testMessage.marshal());
        });
      });
    });
  });
});
