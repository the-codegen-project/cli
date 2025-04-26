import { Protocols } from '../../src/channels';
const { kafka } = Protocols;
const { 
  produceToNoParameter, consumeFromNoParameter, consumeFromReceiveUserSignedup, produceToSendUserSignedup } = kafka;
import { Kafka, EachMessagePayload } from 'kafkajs';
import { UserSignedupParameters } from '../../src/parameters/UserSignedupParameters';
import { UserSignedUp } from '../../src/payloads/UserSignedUp';
const kafkaClient = new Kafka({
  clientId: 'test',
  brokers: ['localhost:9093'],
});
jest.setTimeout(10000);
describe('kafka', () => {
  const testMessage = new UserSignedUp({displayName: 'test', email: 'test@test.dk'});
  const invalidMessage = new UserSignedUp({displayName: 'test', email: '123'});
  const testParameters = new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'});
  describe('channels', () => {
    afterEach(async () => {
      await kafkaClient.admin().connect();
      await kafkaClient.admin().deleteTopicRecords({
        topic: 'user.signedup.test.asyncapi',
        partitions: [{ partition: 0, offset: '0' }],
      });
    })
    describe('with parameters', () => {
      it('should be able to publish and consume', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const consumer = await consumeFromReceiveUserSignedup(async (err, msg, parameters) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              expect(parameters?.myParameter).toEqual(testParameters.myParameter);
              await consumer.disconnect();
              resolve();
            } catch (error) {
              reject(error);
              await consumer.disconnect();
            }
          }, new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'}), kafkaClient, {fromBeginning: true, groupId: 'testId1'});
          const producer = await produceToSendUserSignedup(testMessage, testParameters, kafkaClient);
          await producer.disconnect();
        });
      });
      it('should get error on incorrect message', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const consumer = await consumeFromReceiveUserSignedup(async (err, msg, parameters) => {
            if(msg) return;
            try {
              expect(err).toBeDefined();
              expect(err?.message).toEqual('Invalid message payload received');
              expect(err?.cause).toBeDefined();
              expect(parameters?.myParameter).toEqual(testParameters.myParameter);
              await consumer.disconnect();
              resolve();
            } catch (error) {
              reject(error);
              await consumer.disconnect();
            }
          }, new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'}), kafkaClient, {fromBeginning: true, groupId: 'testId2'});
          const producer = await produceToSendUserSignedup(invalidMessage, testParameters, kafkaClient);
          await producer.disconnect();
        });
      });
    });
    describe('without parameters', () => {
      it('should be able to publish and consume', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const consumer = await consumeFromNoParameter(
            async (err, msg) => {
              try {
                expect(err).toBeUndefined();
                expect(msg?.marshal()).toEqual(testMessage.marshal());
                await consumer.disconnect();
                resolve();
              } catch (error) {
                reject(error);
              }
            }, 
            kafkaClient, 
            {fromBeginning: true, groupId: 'testId3'}
          );
          const producer = await produceToNoParameter(testMessage, kafkaClient);
          await producer.disconnect();
        });
      });
    });
  });
});
