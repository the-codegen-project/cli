/* eslint-disable no-console */
import amqplib from 'amqplib';
import { publishToSendUserSignedupQueue, subscribeToReceiveUserSignedupQueue, publishToNoParameterQueue, subscribeToNoParameterQueue, publishToSendUserSignedupExchange } from '../../../src/channels/amqp';
import { UserSignedUp } from '../../../src/payloads/UserSignedUp';
import { UserSignedupParameters } from '../../../src/parameters/UserSignedupParameters';
import { UserSignedUpHeaders } from '../../../src/headers/UserSignedUpHeaders';

describe('amqp', () => {
  const testMessage = new UserSignedUp({displayName: 'test', email: 'test@test.dk'});
  const invalidMessage = new UserSignedUp({displayName: 'test', email: '123'});
  const testParameters = new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'});
  const testHeaders = new UserSignedUpHeaders({ xTestHeader: 'test-header-value' });
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
            onDataCallback: ({err, msg, amqpMsg}) => {
              expect(msg!.marshal()).toEqual(testMessage.marshal());
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

      it('should be able to publish to queue with headers', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const channel = await subscribeToReceiveUserSignedupQueue({
            onDataCallback: ({err, msg, headers, amqpMsg}) => {
              expect(msg!.marshal()).toEqual(testMessage.marshal());
              expect(headers).toBeDefined();
              expect(headers?.xTestHeader).toEqual('test-header-value');
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

          await publishToSendUserSignedupQueue({message: testMessage, parameters: testParameters, headers: testHeaders, amqp: connection});
        });
      });
      it('should be able to catch invalid message', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const channel = await subscribeToReceiveUserSignedupQueue({
            onDataCallback: ({err}) => {
              expect(err).toBeDefined();
              expect(err?.message).toBeDefined();
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
      it('should be able to publish to exchange', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          try {
            const exchangeName = 'test-exchange';
            const routingKey = testParameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}');
            const channel = await connection.createChannel();
            
            // Create the exchange
            await channel.assertExchange(exchangeName, 'direct', { durable: true });
            
            // Create a temporary queue and bind it to the exchange
            const queueResult = await channel.assertQueue('', { exclusive: true });
            const queueName = queueResult.queue;
            await channel.bindQueue(queueName, exchangeName, routingKey);

            // Set up consumer on the queue (not the exchange)
            await channel.consume(queueName, (msg) => {
              try {
                if (msg !== null) {
                  const message = UserSignedUp.unmarshal(msg.content.toString());
                  expect(message.marshal()).toEqual(testMessage.marshal());
                  channel.ack(msg);
                  resolve();
                } else {
                  reject(new Error('Received null message'));
                }
              } catch(e) {
                reject(e);
              }
            });

            // Publish to the exchange
            await publishToSendUserSignedupExchange({
              message: testMessage, 
              parameters: testParameters, 
              amqp: connection, 
              options: { exchange: exchangeName }
            });
          } catch (e) {
            reject(e);
          }
        });
      });

      it('should be able to publish to exchange with headers', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          try {
            const exchangeName = 'test-exchange-headers';
            const routingKey = testParameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}');
            const channel = await connection.createChannel();
            
            // Create the exchange
            await channel.assertExchange(exchangeName, 'direct', { durable: true });
            
            // Create a temporary queue and bind it to the exchange
            const queueResult = await channel.assertQueue('', { exclusive: true });
            const queueName = queueResult.queue;
            await channel.bindQueue(queueName, exchangeName, routingKey);

            // Set up consumer on the queue
            await channel.consume(queueName, (msg) => {
              try {
                if (msg !== null) {
                  const message = UserSignedUp.unmarshal(msg.content.toString());
                  expect(message.marshal()).toEqual(testMessage.marshal());
                  
                  // Extract headers the same way the queue consumer does
                  let extractedHeaders: UserSignedUpHeaders | undefined = undefined;
                  if (msg.properties && msg.properties.headers) {
                    const headerObj: Record<string, any> = {};
                    for (const [key, value] of Object.entries(msg.properties.headers)) {
                      if (value !== undefined) {
                        headerObj[key] = value;
                      }
                    }
                    extractedHeaders = UserSignedUpHeaders.unmarshal(headerObj);
                  }
                  
                  // Check headers
                  expect(extractedHeaders).toBeDefined();
                  expect(extractedHeaders?.xTestHeader).toEqual('test-header-value');
                  channel.ack(msg);
                  resolve();
                } else {
                  reject(new Error('Received null message'));
                }
              } catch(e) {
                reject(e);
              }
            });

            // Publish to the exchange with headers
            await publishToSendUserSignedupExchange({
              message: testMessage, 
              parameters: testParameters, 
              headers: testHeaders,
              amqp: connection, 
              options: { exchange: exchangeName }
            });
          } catch (e) {
            reject(e);
          }
        });
      });
    });
    describe('without parameters', () => {
      it('should be able to publish to queue', () => {
        return new Promise<void>(async (resolve, reject) => {
          
          const channel = await subscribeToNoParameterQueue({
            onDataCallback: ({err, msg, amqpMsg}) => {            
              if (msg) {
                expect(msg.marshal()).toEqual(testMessage.marshal());
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

      it('should be able to publish to queue with headers', () => {
        return new Promise<void>(async (resolve, reject) => {
          
          const channel = await subscribeToNoParameterQueue({
            onDataCallback: ({err, msg, headers, amqpMsg}) => {            
              if (msg) {
                expect(msg.marshal()).toEqual(testMessage.marshal());
                expect(headers).toBeDefined();
                expect(headers?.xTestHeader).toEqual('test-header-value');
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
          await publishToNoParameterQueue({message: testMessage, headers: testHeaders, amqp: connection});
        });
      });
    });
  });
});
