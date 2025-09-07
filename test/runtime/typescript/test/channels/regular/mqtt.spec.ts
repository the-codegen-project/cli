/* eslint-disable no-console */
import { Protocols } from '../../../src/channels/index';
import { UserSignedupParameters } from '../../../src/parameters/UserSignedupParameters';
import { UserSignedUp } from '../../../src/payloads/UserSignedUp';
import { UserSignedUpHeaders } from '../../../src/headers/UserSignedUpHeaders';
const { mqtt } = Protocols;
const { publishToNoParameter, publishToSendUserSignedup, subscribeToReceiveUserSignedup, subscribeToNoParameter } = mqtt;
import * as MqttClient from 'mqtt';

describe('mqtt', () => {
  const testMessage = new UserSignedUp({displayName: 'test', email: 'test@test.dk'});
  const testParameters = new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'});
  const testHeaders = new UserSignedUpHeaders({ xTestHeader: 'test-header-value' });
  describe('channels', () => {
    describe('with parameters', () => {
      it('should be able to publish core', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const client = await MqttClient.connectAsync("mqtt://0.0.0.0:1883", { protocolVersion: 5 });
          await client.subscribeAsync("user/signedup/+/+");
          client.on("message", (topic, message) => {
            const messageData = UserSignedUp.unmarshal(message.toString())
            expect(messageData.marshal()).toEqual(testMessage.marshal())
            expect(topic).toEqual(`user/signedup/${testParameters.myParameter}/${testParameters.enumParameter}`)
            client.end();
            resolve();
          });
          await publishToSendUserSignedup({message: testMessage, parameters: testParameters, mqtt: client});
        });
      });

      it('should be able to publish with headers', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const client = await MqttClient.connectAsync("mqtt://0.0.0.0:1883", { protocolVersion: 5 });
          await client.subscribeAsync("user/signedup/+/+");
          client.on("message", (topic, message, packet) => {
            const messageData = UserSignedUp.unmarshal(message.toString())
            expect(messageData.marshal()).toEqual(testMessage.marshal())
            expect(topic).toEqual(`user/signedup/${testParameters.myParameter}/${testParameters.enumParameter}`)
            // Check MQTT v5 user properties for headers
            if (packet.properties && packet.properties.userProperties) {
              expect(packet.properties.userProperties['x-test-header']).toEqual('test-header-value');
            }
            client.end();
            resolve();
          });
          await publishToSendUserSignedup({message: testMessage, parameters: testParameters, headers: testHeaders, mqtt: client});
        });
      });
    });
    describe('without parameters', () => {
      it('should be able to publish core', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const client = await MqttClient.connectAsync("mqtt://0.0.0.0:1883", { protocolVersion: 5 });
          await client.subscribeAsync("noparameters");
          client.on("message", (topic, message) => {
            const messageData = UserSignedUp.unmarshal(message.toString())
            expect(messageData.marshal()).toEqual(testMessage.marshal())
            expect(topic).toEqual('noparameters')
            client.end();
            resolve();
          });
          await publishToNoParameter({message: testMessage, mqtt: client});
        });
      });

      it('should be able to publish with headers', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const client = await MqttClient.connectAsync("mqtt://0.0.0.0:1883", { protocolVersion: 5 });
          await client.subscribeAsync("noparameters");
          client.on("message", (topic, message, packet) => {
            const messageData = UserSignedUp.unmarshal(message.toString())
            expect(messageData.marshal()).toEqual(testMessage.marshal())
            expect(topic).toEqual('noparameters')
            // Check MQTT v5 user properties for headers
            if (packet.properties && packet.properties.userProperties) {
              expect(packet.properties.userProperties['x-test-header']).toEqual('test-header-value');
            }
            client.end();
            resolve();
          });
          await publishToNoParameter({message: testMessage, headers: testHeaders, mqtt: client});
        });
      });
    });

    describe('subscribe functionality', () => {
      describe('with parameters', () => {
        it('should be able to subscribe and receive messages', () => {
          return new Promise<void>(async (resolve, reject) => {
            const client = await MqttClient.connectAsync("mqtt://0.0.0.0:1883", { protocolVersion: 5 });
            
            // Set up subscription using generated function
            await subscribeToReceiveUserSignedup({
              onDataCallback: (params) => {
                const {err, msg, parameters, headers, mqttMsg} = params;
                try {
                  expect(err).toBeUndefined();
                  expect(msg?.marshal()).toEqual(testMessage.marshal());
                  expect(parameters?.myParameter).toEqual(testParameters.myParameter);
                  expect(parameters?.enumParameter).toEqual(testParameters.enumParameter);
                  client.end();
                  resolve();
                } catch (error) {
                  reject(error);
                }
              },
              parameters: testParameters,
              mqtt: client
            });

            // Wait a bit for subscription to be set up
            setTimeout(async () => {
              await publishToSendUserSignedup({message: testMessage, parameters: testParameters, mqtt: client});
            }, 100);
          });
        });

        it('should be able to subscribe and receive messages with headers', () => {
          return new Promise<void>(async (resolve, reject) => {
            const client = await MqttClient.connectAsync("mqtt://0.0.0.0:1883", { protocolVersion: 5 });
            
            // Set up subscription using generated function
            await subscribeToReceiveUserSignedup({
              onDataCallback: (params) => {
                const {err, msg, parameters, headers, mqttMsg} = params;
                try {
                  expect(err).toBeUndefined();
                  expect(msg?.marshal()).toEqual(testMessage.marshal());
                  expect(parameters?.myParameter).toEqual(testParameters.myParameter);
                  expect(parameters?.enumParameter).toEqual(testParameters.enumParameter);
                  expect(headers?.xTestHeader).toEqual('test-header-value');
                  client.end();
                  resolve();
                } catch (error) {
                  reject(error);
                }
              },
              parameters: testParameters,
              mqtt: client
            });

            // Wait a bit for subscription to be set up
            setTimeout(async () => {
              await publishToSendUserSignedup({message: testMessage, parameters: testParameters, headers: testHeaders, mqtt: client});
            }, 100);
          });
        });
      });

      describe('without parameters', () => {
        it('should be able to subscribe and receive messages', () => {
          return new Promise<void>(async (resolve, reject) => {
            const client = await MqttClient.connectAsync("mqtt://0.0.0.0:1883", { protocolVersion: 5 });
            
            // Set up subscription using generated function
            await subscribeToNoParameter({
              onDataCallback: (params) => {
                const {err, msg, headers, mqttMsg} = params;
                try {
                  expect(err).toBeUndefined();
                  expect(msg?.marshal()).toEqual(testMessage.marshal());
                  client.end();
                  resolve();
                } catch (error) {
                  reject(error);
                }
              },
              mqtt: client
            });

            // Wait a bit for subscription to be set up
            setTimeout(async () => {
              await publishToNoParameter({message: testMessage, mqtt: client});
            }, 100);
          });
        });

        it('should be able to subscribe and receive messages with headers', () => {
          return new Promise<void>(async (resolve, reject) => {
            const client = await MqttClient.connectAsync("mqtt://0.0.0.0:1883", { protocolVersion: 5 });
            
            // Set up subscription using generated function
            await subscribeToNoParameter({
              onDataCallback: (params) => {
                const {err, msg, headers, mqttMsg} = params;
                try {
                  expect(err).toBeUndefined();
                  expect(msg?.marshal()).toEqual(testMessage.marshal());
                  expect(headers?.xTestHeader).toEqual('test-header-value');
                  client.end();
                  resolve();
                } catch (error) {
                  reject(error);
                }
              },
              mqtt: client
            });

            // Wait a bit for subscription to be set up
            setTimeout(async () => {
              await publishToNoParameter({message: testMessage, headers: testHeaders, mqtt: client});
            }, 100);
          });
        });
      });
    });
  });
});
