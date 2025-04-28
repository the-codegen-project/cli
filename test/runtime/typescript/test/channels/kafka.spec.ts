import { Protocols } from '../../src/channels';
const { kafka } = Protocols;
const { 
  produceToNoParameter, consumeFromNoParameter, consumeFromReceiveUserSignedup, produceToSendUserSignedup } = kafka;
import { Kafka } from 'kafkajs';
import { UserSignedupParameters } from '../../src/parameters/UserSignedupParameters';
import { UserSignedUp } from '../../src/payloads/UserSignedUp';
const kafkaClient = new Kafka({
  clientId: 'test',
  brokers: ['localhost:9093'],
});
jest.setTimeout(10000);
function createRandomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

describe('kafka', () => {
  const testMessage = new UserSignedUp({displayName: 'test', email: 'test@test.dk'});
  const invalidMessage = new UserSignedUp({displayName: 'test', email: '123'});
  const testParameters = new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'});
  const admin = kafkaClient.admin();
  beforeAll(async () => {
    await admin.connect();
    await admin.createTopics({
      topics: [{
        topic: 'user.signedup.test.asyncapi'
      },{
        topic: 'noparameters'
      }],
      waitForLeaders: true,
    });
  });
  afterEach(async() => {
    await admin.deleteTopicRecords({
      topic: 'user.signedup.test.asyncapi',
      partitions: [{ partition: 0, offset: '-1' }],
    });
    await admin.deleteTopicRecords({
      topic: 'noparameters',
      partitions: [{ partition: 0, offset: '-1' }],
    });
  });
  afterAll(async () => {
    await admin.disconnect();
  });
  describe('channels', () => {
    describe('with parameters', () => {
      it('should get error on incorrect message', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const consumer = await consumeFromReceiveUserSignedup(async (err, msg, parameters) => {
            try {
              expect(msg).toBeUndefined();
              expect(err).toBeDefined();
              expect(err?.message).toEqual('Invalid message payload received');
              expect(err?.cause).toBeDefined();
              expect(parameters?.myParameter).toEqual(testParameters.myParameter);
              resolve();
            } catch (error) {
              reject(error);
            } finally {
              await consumer.stop();
              await consumer.disconnect();
            }
          }, new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'}), kafkaClient, {fromBeginning: true, groupId: createRandomString(10)});
          const producer = await produceToSendUserSignedup(invalidMessage, testParameters, kafkaClient);
          await producer.disconnect();
        });
      });
      it('should be able to publish and consume', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const consumer = await consumeFromReceiveUserSignedup(async (err, msg, parameters) => {
            try {
              expect(err).toBeUndefined();
              expect(msg?.marshal()).toEqual(testMessage.marshal());
              expect(parameters?.myParameter).toEqual(testParameters.myParameter);
              resolve();
            } catch (error) {
              reject(error);
            } finally {
              await consumer.stop();
              await consumer.disconnect();
            }
          }, new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'}), kafkaClient, {fromBeginning: true, groupId: createRandomString(10)});
          const producer = await produceToSendUserSignedup(testMessage, testParameters, kafkaClient);
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
                resolve();
              } catch (error) {
                reject(error);
              } finally {
                await consumer.stop();
                await consumer.disconnect();
              }
            }, 
            kafkaClient, 
            {fromBeginning: true, groupId: createRandomString(10)}
          );
          const producer = await produceToNoParameter(testMessage, kafkaClient);
          await producer.disconnect();
        });
      });
    });
  });
});
