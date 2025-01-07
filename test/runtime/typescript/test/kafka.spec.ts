/* eslint-disable no-console */
import { Protocols } from '../src/channels/index';
const { kafka } = Protocols;
const { 
  publishToNoParameter, subscribeToNoParameter, publishToSendUserSignedup, subscribeToReceiveUserSignedup } = kafka;
import { Kafka } from 'kafkajs';
import { UserSignedupParameters } from '../src/parameters/UserSignedupParameters';
import { UserSignedUp } from '../src/payloads/UserSignedUp';
const kafkaClient = new Kafka({
  clientId: 'test',
  brokers: ['0.0.0.0:9092'],
})
jest.setTimeout(10000)
describe('kafka', () => {
  const testMessage = new UserSignedUp({displayName: 'test', email: 'test@test.dk'});
  const testParameters = new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'});
  describe('channels', () => {
    describe('with parameters', () => {
      it('should be able to publish and subscribe', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          await subscribeToReceiveUserSignedup(async (err, msg, parameters) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              expect(parameters?.myParameter).toEqual(testParameters.myParameter);
              resolve();
            } catch (error) {
              reject(error);
            }
          }, new UserSignedupParameters({myParameter: '*', enumParameter: 'asyncapi'}), kafkaClient);
          await publishToSendUserSignedup(testMessage, testParameters, kafkaClient.producer());
        });
      });
    });
    describe('without parameters', () => {
      it('should be able to publish and subscribe', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          await subscribeToNoParameter(async (err, msg) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              resolve();
            } catch (error) {
              reject(error);
            }
          }, kafkaClient);
          await publishToNoParameter(testMessage, kafkaClient.producer());
        });
      });
    });
  });
});
