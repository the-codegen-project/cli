/* eslint-disable no-console */
import { AckPolicy, DeliverPolicy, JetStreamClient, JetStreamManager, NatsConnection, ReplayPolicy, connect } from "nats";
import { jetStreamPublishToUserSignedupMyParameter, jetStreamPullSubscribeToUserSignedupMyParameter, jetStreamPushSubscriptionFromUserSignedupMyParameter, publishToUserSignedupMyParameter, subscribeToUserSignedupMyParameter } from '../src/channels/index';
import { UserSignedUp } from '../src/payloads/UserSignedUp';
import { UserSignedupParameters } from '../src/parameters/UserSignedupParameters';
jest.setTimeout(100000)
describe('channels', () => {
  const testMessage = new UserSignedUp({displayName: 'test', email: 'test@test.dk'});
  const testParameters = new UserSignedupParameters({myParameter: 'test'});
  describe('NATS', () => {
    let nc: NatsConnection;
    let js: JetStreamClient;
    let jsm: JetStreamManager;
    const test_stream = 'userSignedUp';
    const test_subj = 'user.signedup.*';
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
      await jetStreamPublishToUserSignedupMyParameter(testMessage, testParameters, js);
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
        js.publish(`user.signedup.${testParameters.myParameter}`, testMessage.marshal())
        const subscriber = await jetStreamPullSubscribeToUserSignedupMyParameter(async (err, msg, parameters, jetstreamMsg) => {
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
        }, new UserSignedupParameters({myParameter: '*'}), js, undefined, config);
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
        await publishToUserSignedupMyParameter(testMessage, testParameters, nc);
      });
    });

    it('should be able to do core subscribe', () => {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise<void>(async (resolve, reject) => {
        const subscribtion = await subscribeToUserSignedupMyParameter(async (err, msg, parameters) => {
          try {
            expect(err).toBeUndefined();
            expect(msg?.marshal()).toEqual(testMessage.marshal());
            expect(parameters?.myParameter).toEqual(testParameters.myParameter);
            await subscribtion.drain();
            resolve();
          } catch (error) {
            reject(error);
          }
        }, new UserSignedupParameters({myParameter: '*'}), nc);
        nc.publish(`user.signedup.${testParameters.myParameter}`, testMessage.marshal());
      });
    });

    it('should be able to do jetstream push subscribe', () => {
      const config = {
        stream: test_stream,
        config: {
          ack_policy: AckPolicy.Explicit,
          replay_policy: ReplayPolicy.Instant,
          deliver_policy: DeliverPolicy.All,
          deliver_subject: `user.signedup.2`
        },
      };
      return new Promise<void>(async (resolve, reject) => {
        const subscription = await jetStreamPushSubscriptionFromUserSignedupMyParameter(async (err, msg, parameters, jetstreamMsg) => {
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
        }, new UserSignedupParameters({myParameter: '*'}), js, undefined, config);
        js.publish(`user.signedup.${testParameters.myParameter}`, testMessage.marshal());
      });
    });
  });
});
