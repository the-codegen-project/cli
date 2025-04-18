/* eslint-disable no-console */
import { AckPolicy, DeliverPolicy, JetStreamClient, JetStreamManager, NatsConnection, ReplayPolicy, ConsumerOpts, connect, JSONCodec } from "nats";
import { NatsClient, UserSignedUp, UserSignedupParameters } from '../src/client/NatsClient';
import { Protocols } from '../src/channels/index';
import { Ping } from "../src/payloads/Ping";
import { Pong } from "../src/payloads/Pong";
const { nats } = Protocols;
const { 
  jetStreamPublishToSendUserSignedup, jetStreamPullSubscribeToReceiveUserSignedup, jetStreamPushSubscriptionFromReceiveUserSignedup, publishToSendUserSignedup, subscribeToReceiveUserSignedup,
  jetStreamPublishToNoParameter, jetStreamPullSubscribeToNoParameter, jetStreamPushSubscriptionFromNoParameter, publishToNoParameter, subscribeToNoParameter, replyToPongReply, requestToPingRequest } = nats;

describe('nats', () => {
  const testMessage = new UserSignedUp({displayName: 'test', email: 'test@test.dk'});
  const testParameters = new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'});
  describe('client', () => {
    describe('with parameters', () => {
      let client: NatsClient;
      let nc: NatsConnection;
      let js: JetStreamClient;
      let jsm: JetStreamManager;
      const test_stream = 'userSignedUp';
      const test_subj = 'user.signedup.*.*';
      beforeAll(async () => {
        client = new NatsClient();
        ({nc, js} = await client.connectToHost("nats://localhost:4443"));
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
        await client.jetStreamPublishToSendUserSignedup(testMessage, testParameters);
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
          const subscriber = await client.jetStreamPullSubscribeToReceiveUserSignedup(async (err, msg, parameters, jetstreamMsg) => {
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
          }, new UserSignedupParameters({myParameter: '*', enumParameter: 'asyncapi'}), config);
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
          await client.publishToSendUserSignedup(testMessage, testParameters);
        });
      });

      it('should be able to do core subscribe', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const subscribtion = await client.subscribeToReceiveUserSignedup(async (err, msg, parameters) => {
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
          const subscription = await client.jetStreamPushSubscriptionFromReceiveUserSignedup(async (err, msg, parameters, jetstreamMsg) => {
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
          }, new UserSignedupParameters({myParameter: '*', enumParameter: 'asyncapi'}), config);
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
        ({nc, js} = await client.connectToHost("nats://localhost:4443"));
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
        await client.jetStreamPublishToNoParameter(testMessage);
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
          const subscriber = await client.jetStreamPullSubscribeToNoParameter(async (err, msg, jetstreamMsg) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              jetstreamMsg?.ack();
              await subscriber.drain();
              resolve();
            } catch (error) {
              reject(error);
            }
          }, config);
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
          await client.publishToNoParameter(testMessage);
        });
      });

      it('should be able to do core subscribe', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const subscribtion = await client.subscribeToNoParameter(async (err, msg, parameters) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              await subscribtion.drain();
              resolve();
            } catch (error) {
              reject(error);
            }
          });
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
          const subscription = await client.jetStreamPushSubscriptionFromNoParameter(async (err, msg, jetstreamMsg) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              jetstreamMsg?.ack();
              await subscription.drain();
              resolve();
            } catch (error) {
              reject(error);
            }
          }, config);
          js.publish(`noparameters`, testMessage.marshal());
        });
      });
    });
  });

  describe('channels', () => {
    const testMessage = new UserSignedUp({displayName: 'test', email: 'test@test.dk'});
    describe('with parameters', () => {
      const testParameters = new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'});
      describe('NATS', () => {
        let nc: NatsConnection;
        let js: JetStreamClient;
        let jsm: JetStreamManager;
        const test_stream = 'userSignedUpChannels';
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
          await jetStreamPublishToSendUserSignedup(testMessage, testParameters, js);
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
            const subscriber = await jetStreamPullSubscribeToReceiveUserSignedup(async (err, msg, parameters, jetstreamMsg) => {
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
            await publishToSendUserSignedup(testMessage, testParameters, nc);
          });
        });

        it('should be able to do core subscribe', () => {
          // eslint-disable-next-line no-async-promise-executor
          return new Promise<void>(async (resolve, reject) => {
            const subscribtion = await subscribeToReceiveUserSignedup(async (err, msg, parameters) => {
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
            const subscription = await jetStreamPushSubscriptionFromReceiveUserSignedup(async (err, msg, parameters, jetstreamMsg) => {
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

        it('should be able to setup reply', async () => {
          const requestMessage = new Ping({})
          const replyMessage = new Pong({additionalProperties: new Map([['test', true]])})
          const callback = jest.fn().mockReturnValue(replyMessage);
          await replyToPongReply(callback, nc);
          const reply = await nc.request('ping', requestMessage.marshal());
          const decodedMsg = JSONCodec().decode(reply.data);
          const msg = Pong.unmarshal(decodedMsg as any);
          const expectedJson = msg.marshal();
          const actualJson = replyMessage.marshal();
          expect(expectedJson).toEqual(actualJson);
        });

        it('should be able to make request', async () => {
          return new Promise<void>(async (resolve, reject) => {
            const requestMessage = new Ping({})
            const replyMessage = new Pong({additionalProperties: new Map([['test', true]])})
            let subscription = nc.subscribe('ping');
            (async () => {
              for await (const msg of subscription) {
                if (msg.reply) {
                  msg.respond(JSONCodec().encode(replyMessage.marshal()));
                } else {
                  reject('expected reply')
                }
              }
            })();
            const receivedReplyMessage = await requestToPingRequest(requestMessage, nc)
            expect(receivedReplyMessage.marshal()).toEqual(replyMessage.marshal())
            resolve();
          });
        });
      });
    });
  });
});
