import {UserSignedUp} from './../payloads/UserSignedUp';
import {UserSignedupParameters} from './../parameters/UserSignedupParameters';
import {UserSignedUpHeaders} from './../headers/UserSignedUpHeaders';
import * as Mqtt from 'mqtt';

export /**
 * MQTT publish operation for `user/signedup/{my_parameter}/{enum_parameter}`
 *
  * @param message to publish
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message as MQTT user properties
 * @param mqtt the MQTT client to publish from
 */
function publishToSendUserSignedup({
  message, 
  parameters, 
  headers, 
  mqtt
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParameters, 
  headers?: UserSignedUpHeaders, 
  mqtt: Mqtt.MqttClient
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      // Set up user properties (headers) if provided
      let publishOptions: Mqtt.IClientPublishOptions = {};
      if (headers) {
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        const userProperties = {};
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            userProperties[key] = String(value);
          }
        }
        publishOptions.properties = { userProperties };
      }
      mqtt.publish(parameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}'), dataToSend, publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

export /**
 * Callback for when receiving messages
 *
 * @callback subscribeToReceiveUserSignedupCallback
 * @param err if any error occurred this will be set
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param headers that was received with the message as MQTT user properties
 * @param mqttMsg the raw MQTT message packet
 */

/**
 * MQTT subscription for `user/signedup/{my_parameter}/{enum_parameter}`
 *
 * @param onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param mqtt the MQTT client to subscribe with
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveUserSignedup({
  onDataCallback, 
  parameters, 
  mqtt, 
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, headers?: UserSignedUpHeaders, mqttMsg?: Mqtt.IPublishPacket}) => void, 
  parameters: UserSignedupParameters, 
  mqtt: Mqtt.MqttClient, 
  skipMessageValidation?: boolean
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const validator = UserSignedUp.createValidator();

      // Set up message listener
      const messageHandler = (topic: string, message: Buffer, packet: Mqtt.IPublishPacket) => {
        
    // Check if the received topic matches this subscription's pattern
    const topicPattern = /^user\/signedup\/([^.]*)\/([^.]*)$/;
    if (!topicPattern.test(topic)) {
      return; // Ignore messages not matching this subscription's topic pattern
    }
    
    const receivedData = message.toString();
    const parameters = UserSignedupParameters.createFromChannel(topic, 'user/signedup/{my_parameter}/{enum_parameter}', /^user\/signedup\/([^.]*)\/([^.]*)$/);
    
    // Extract headers from MQTT v5 user properties
    let extractedHeaders: UserSignedUpHeaders | undefined;
    if (packet.properties && packet.properties.userProperties) {
      try {
        extractedHeaders = UserSignedUpHeaders.unmarshal(packet.properties.userProperties);
      } catch (headerError) {
        onDataCallback({err: new Error(`Failed to parse headers: ${headerError}`), msg: undefined, parameters, headers: undefined, mqttMsg: packet});
        return;
      }
    }
    
    try {
      const parsedMessage = UserSignedUp.unmarshal(receivedData);
      if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback({err: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), msg: undefined, parameters, headers: extractedHeaders, mqttMsg: packet}); return;
    }
  }
      onDataCallback({err: undefined, msg: parsedMessage, parameters, headers: extractedHeaders, mqttMsg: packet});
    } catch (err: any) {
      onDataCallback({err: new Error(`Failed to parse message: ${err.message}`), msg: undefined, parameters, headers: extractedHeaders, mqttMsg: packet});
    }
      };

      mqtt.on('message', messageHandler);

      // Subscribe to the topic
      await mqtt.subscribeAsync(parameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}'));

      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

export /**
 * MQTT publish operation for `noparameters`
 *
  * @param message to publish
 * @param headers optional headers to include with the message as MQTT user properties
 * @param mqtt the MQTT client to publish from
 */
function publishToNoParameter({
  message, 
  headers, 
  mqtt
}: {
  message: UserSignedUp, 
  headers?: UserSignedUpHeaders, 
  mqtt: Mqtt.MqttClient
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      // Set up user properties (headers) if provided
      let publishOptions: Mqtt.IClientPublishOptions = {};
      if (headers) {
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        const userProperties = {};
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            userProperties[key] = String(value);
          }
        }
        publishOptions.properties = { userProperties };
      }
      mqtt.publish('noparameters', dataToSend, publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

export /**
 * Callback for when receiving messages
 *
 * @callback subscribeToNoParameterCallback
 * @param err if any error occurred this will be set
 * @param msg that was received
 * @param headers that was received with the message as MQTT user properties
 * @param mqttMsg the raw MQTT message packet
 */

/**
 * MQTT subscription for `noparameters`
 *
 * @param onDataCallback to call when messages are received
 * @param mqtt the MQTT client to subscribe with
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToNoParameter({
  onDataCallback, 
  mqtt, 
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: UserSignedUp, headers?: UserSignedUpHeaders, mqttMsg?: Mqtt.IPublishPacket}) => void, 
  mqtt: Mqtt.MqttClient, 
  skipMessageValidation?: boolean
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const validator = UserSignedUp.createValidator();

      // Set up message listener
      const messageHandler = (topic: string, message: Buffer, packet: Mqtt.IPublishPacket) => {
        
    // Check if the received topic matches this subscription's pattern
    const topicPattern = /^noparameters$/;
    if (!topicPattern.test(topic)) {
      return; // Ignore messages not matching this subscription's topic pattern
    }
    
    const receivedData = message.toString();
    
    
    // Extract headers from MQTT v5 user properties
    let extractedHeaders: UserSignedUpHeaders | undefined;
    if (packet.properties && packet.properties.userProperties) {
      try {
        extractedHeaders = UserSignedUpHeaders.unmarshal(packet.properties.userProperties);
      } catch (headerError) {
        onDataCallback({err: new Error(`Failed to parse headers: ${headerError}`), msg: undefined, headers: undefined, mqttMsg: packet});
        return;
      }
    }
    
    try {
      const parsedMessage = UserSignedUp.unmarshal(receivedData);
      if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback({err: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), msg: undefined, headers: extractedHeaders, mqttMsg: packet}); return;
    }
  }
      onDataCallback({err: undefined, msg: parsedMessage, headers: extractedHeaders, mqttMsg: packet});
    } catch (err: any) {
      onDataCallback({err: new Error(`Failed to parse message: ${err.message}`), msg: undefined, headers: extractedHeaders, mqttMsg: packet});
    }
      };

      mqtt.on('message', messageHandler);

      // Subscribe to the topic
      await mqtt.subscribeAsync('noparameters');

      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}
