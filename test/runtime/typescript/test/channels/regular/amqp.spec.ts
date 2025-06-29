/* eslint-disable no-console */
import { Protocols } from '../../../src/channels/index';
const { amqp } = Protocols
const  {publishToSendUserSignedupQueue, subscribeToReceiveUserSignedupQueue, publishToNoParameterQueue, subscribeToNoParameterQueue} = amqp;
import amqplib from 'amqplib';
import { UserSignedUp } from '../../../src/payloads/UserSignedUp';
import { UserSignedupParameters } from '../../../src/parameters/UserSignedupParameters';

describe('amqp', () => {
  const testMessage = new UserSignedUp({displayName: 'test', email: 'test@test.dk'});
  const invalidMessage = new UserSignedUp({displayName: 'test', email: '123'});
  const testParameters = new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'});
  let connection;
  beforeAll(async () => {
    connection = await amqplib.connect('amqp://0.0.0.0');
    connection.on('error', console.error);
  })
  afterAll(async () => {
    await connection.close();
  })
  describe('channels', () => {
    describe('with parameters', () => {
      it('should be able to publish to queue', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const channel = await subscribeToReceiveUserSignedupQueue({
            onDataCallback: (err, message, amqpMsg) => {
              expect(message!.marshal()).toEqual(testMessage.marshal());
              channel.ack(amqpMsg!);
              resolve();
            }, 
            parameters: testParameters, 
            amqp: connection, 
            options: { 
              noAck: true 
            }
          });
          channel.on('error', (err) => {
            reject(err);
          });
          await channel.prefetch(1);

          await publishToSendUserSignedupQueue({message: testMessage, parameters: testParameters, amqp: connection});
        });
      });
      it('should be able to catch invalid message', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const channel = await subscribeToReceiveUserSignedupQueue({
            onDataCallback: (err) => {
              expect(err).toBeDefined();
              expect(err?.message).toBeDefined();
              expect(err?.cause).toBeDefined();
              resolve()
            }, 
            parameters: testParameters, 
            amqp: connection, 
            options: { 
              noAck: true 
            }
          });
          channel.on('error', (err) => {
            reject(err);
          });
          await channel.prefetch(1);

          await publishToSendUserSignedupQueue({message: invalidMessage, parameters: testParameters, amqp: connection});
        });
      });
      // TODO: cannot create exchange 
      // it('should be able to publish to exchange', () => {
      //   // eslint-disable-next-line no-async-promise-executor
      //   return new Promise<void>(async (resolve, reject) => {
      //     const conn = await amqplib.connect('amqp://localhost');
      //     const exchange = testParameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}');
      //     const ch1 = await conn.createChannel();
      //     await ch1.assertExchange(exchange, 'direct');

      //     ch1.consume(exchange, (msg) => {
      //       try{
      //         if (msg !== null) {
      //           const message = UserSignedUp
      //           .unmarshal(msg.content.toString())
      //           expect(message.marshal()).toEqual(testMessage.marshal());
      //           resolve()
      //         } else {
      //           reject();
      //         }
      //       } catch(e) {
      //         reject(e)
      //       }
      //     });

      //     await publishToSendUserSignedupExchange(testMessage, testParameters, conn, {exchange: exchange});
      //   });
      // });
    });
    describe('without parameters', () => {
      it('should be able to publish to queue', () => {
        return new Promise<void>(async (resolve, reject) => {
          
          const channel = await subscribeToNoParameterQueue({
            onDataCallback: (err, message, amqpMsg) => {            
              if (message) {
                expect(message.marshal()).toEqual(testMessage.marshal());
                channel.ack(amqpMsg!);
                resolve()
              } else {
                reject();
              }
            }, 
            amqp: connection, 
            options: { 
              noAck: true 
            }
          });
          channel.on('error', (err) => {
            reject(err);
          });
          await channel.prefetch(1);
          await publishToNoParameterQueue({message: testMessage, amqp: connection});
        });
      });
    });
  });
});
