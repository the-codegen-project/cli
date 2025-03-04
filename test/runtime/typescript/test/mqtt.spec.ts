/* eslint-disable no-console */
import { Protocols } from '../src/channels/index';
import { UserSignedupParameters } from '../src/parameters/UserSignedupParameters';
import { UserSignedUp } from '../src/payloads/UserSignedUp';
const { mqtt } = Protocols;
const { publishToNoParameter, publishToSendUserSignedup } = mqtt;
import * as MqttClient from 'mqtt';

describe('mqtt', () => {
  const testMessage = new UserSignedUp({displayName: 'test', email: 'test@test.dk'});
  const testParameters = new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'});
  describe('channels', () => {
    describe('with parameters', () => {
      it('should be able to publish core', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const client = await MqttClient.connectAsync("mqtt://0.0.0.0:1883");
          await client.subscribeAsync("user/signedup/+/+");
          client.on("message", (topic, message) => {
            const messageData = UserSignedUp.unmarshal(message.toString())
            expect(messageData.marshal()).toEqual(testMessage.marshal())
            expect(topic).toEqual(`user/signedup/${testParameters.myParameter}/${testParameters.enumParameter}`)
            client.end();
            resolve();
          });
          await publishToSendUserSignedup(testMessage, testParameters, client);
        });
      });
    });
    describe('without parameters', () => {
      it('should be able to publish core', () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
          const client = await MqttClient.connectAsync("mqtt://0.0.0.0:1883");
          await client.subscribeAsync("noparameters");
          client.on("message", (topic, message) => {
            const messageData = UserSignedUp.unmarshal(message.toString())
            expect(messageData.marshal()).toEqual(testMessage.marshal())
            expect(topic).toEqual('noparameters')
            client.end();
            resolve();
          });
          await publishToNoParameter(testMessage, client);
        });
      });
    });
  });
});
