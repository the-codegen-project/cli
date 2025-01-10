/* eslint-disable no-console */
import { Protocols } from '../src/channels/index';
const { amqp } = Protocols
const  {publishToSendUserSignedupQueue, publishToNoParameterQueue, publishToNoParameterExchange, publishToSendUserSignedupExchange} = amqp;
import amqplib from 'amqplib';
import { UserSignedUp } from '../src/payloads/UserSignedUp';
import { UserSignedupParameters } from '../src/parameters/UserSignedupParameters';

jest.setTimeout(10000)
describe('amqp', () => {
  const testMessage = new UserSignedUp({displayName: 'test', email: 'test@test.dk'});
  const testParameters = new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'});

  describe('channels', () => {
    describe('with parameters', () => {
      it('should be able to publish to queue', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const conn = await amqplib.connect('amqp://localhost');
          const queue = testParameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}');
          const ch1 = await conn.createChannel();
          await ch1.assertQueue(queue);

          ch1.consume(queue, (msg) => {
            if (msg !== null) {
              const message = UserSignedUp
              .unmarshal(msg.content.toString())
              expect(message.marshal()).toEqual(testMessage.marshal());
              resolve()
            } else {
              reject();
            }
          });

          await publishToSendUserSignedupQueue(testMessage, testParameters, conn);
        });
      });
      it('should be able to publish to exchange', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const conn = await amqplib.connect('amqp://localhost');
          const exchange = testParameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}');
          const ch1 = await conn.createChannel();
          await ch1.assertExchange(exchange, 'direct');

          ch1.consume(exchange, (msg) => {
            if (msg !== null) {
              const message = UserSignedUp
              .unmarshal(msg.content.toString())
              expect(message.marshal()).toEqual(testMessage.marshal());
              resolve()
            } else {
              reject();
            }
          });

          await publishToSendUserSignedupExchange(testMessage, testParameters, conn, {exchange: 'test'});
        });
      });
    });
    describe('without parameters', () => {
      it('should be able to publish to queue', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const conn = await amqplib.connect('amqp://localhost');
          const queue = 'noparameters';
          const ch1 = await conn.createChannel();
          await ch1.assertQueue(queue);

          ch1.consume(queue, (msg) => {
            if (msg !== null) {
              const message = UserSignedUp
              .unmarshal(msg.content.toString())
              expect(message.marshal()).toEqual(testMessage.marshal());
              resolve()
            } else {
              reject();
            }
          });

          await publishToNoParameterQueue(testMessage, conn);
        });
      });
    });
  });
});
