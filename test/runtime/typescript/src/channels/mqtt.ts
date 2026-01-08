import {UserSignedUp} from './../payloads/UserSignedUp';
import * as StringMessageModule from './../payloads/StringMessage';
import * as ArrayMessageModule from './../payloads/ArrayMessage';
import * as UnionMessageModule from './../payloads/UnionMessage';
import {AnonymousSchema_9} from './../payloads/AnonymousSchema_9';
import {UserSignedupParameters} from './../parameters/UserSignedupParameters';
import {UserSignedUpHeaders} from './../headers/UserSignedUpHeaders';
import * as Mqtt from 'mqtt';

/**
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
        const userProperties: Record<string, string> = {};
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

/**
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

/**
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
        const userProperties: Record<string, string> = {};
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

/**
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

/**
 * MQTT publish operation for `string/payload`
 *
  * @param message to publish
 * @param mqtt the MQTT client to publish from
 */
function publishToSendStringPayload({
  message, 
  mqtt
}: {
  message: StringMessageModule.StringMessage, 
  mqtt: Mqtt.MqttClient
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = StringMessageModule.marshal(message);
      let publishOptions: Mqtt.IClientPublishOptions = {};
      mqtt.publish('string/payload', dataToSend, publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback subscribeToReceiveStringPayloadCallback
 * @param err if any error occurred this will be set
 * @param msg that was received
 * @param mqttMsg the raw MQTT message packet
 */

/**
 * MQTT subscription for `string/payload`
 *
 * @param onDataCallback to call when messages are received
 * @param mqtt the MQTT client to subscribe with
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveStringPayload({
  onDataCallback, 
  mqtt, 
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: StringMessageModule.StringMessage, mqttMsg?: Mqtt.IPublishPacket}) => void, 
  mqtt: Mqtt.MqttClient, 
  skipMessageValidation?: boolean
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const validator = StringMessageModule.createValidator();

      // Set up message listener
      const messageHandler = (topic: string, message: Buffer, packet: Mqtt.IPublishPacket) => {
        
    // Check if the received topic matches this subscription's pattern
    const topicPattern = /^string\/payload$/;
    if (!topicPattern.test(topic)) {
      return; // Ignore messages not matching this subscription's topic pattern
    }
    
    const receivedData = message.toString();
    
    
    
    try {
      const parsedMessage = StringMessageModule.unmarshal(receivedData);
      if(!skipMessageValidation) {
    const {valid, errors} = StringMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback({err: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), msg: undefined, mqttMsg: packet}); return;
    }
  }
      onDataCallback({err: undefined, msg: parsedMessage, mqttMsg: packet});
    } catch (err: any) {
      onDataCallback({err: new Error(`Failed to parse message: ${err.message}`), msg: undefined, mqttMsg: packet});
    }
      };

      mqtt.on('message', messageHandler);

      // Subscribe to the topic
      await mqtt.subscribeAsync('string/payload');

      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * MQTT publish operation for `array/payload`
 *
  * @param message to publish
 * @param mqtt the MQTT client to publish from
 */
function publishToSendArrayPayload({
  message, 
  mqtt
}: {
  message: ArrayMessageModule.ArrayMessage, 
  mqtt: Mqtt.MqttClient
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = ArrayMessageModule.marshal(message);
      let publishOptions: Mqtt.IClientPublishOptions = {};
      mqtt.publish('array/payload', dataToSend, publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback subscribeToReceiveArrayPayloadCallback
 * @param err if any error occurred this will be set
 * @param msg that was received
 * @param mqttMsg the raw MQTT message packet
 */

/**
 * MQTT subscription for `array/payload`
 *
 * @param onDataCallback to call when messages are received
 * @param mqtt the MQTT client to subscribe with
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveArrayPayload({
  onDataCallback, 
  mqtt, 
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: ArrayMessageModule.ArrayMessage, mqttMsg?: Mqtt.IPublishPacket}) => void, 
  mqtt: Mqtt.MqttClient, 
  skipMessageValidation?: boolean
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const validator = ArrayMessageModule.createValidator();

      // Set up message listener
      const messageHandler = (topic: string, message: Buffer, packet: Mqtt.IPublishPacket) => {
        
    // Check if the received topic matches this subscription's pattern
    const topicPattern = /^array\/payload$/;
    if (!topicPattern.test(topic)) {
      return; // Ignore messages not matching this subscription's topic pattern
    }
    
    const receivedData = message.toString();
    
    
    
    try {
      const parsedMessage = ArrayMessageModule.unmarshal(receivedData);
      if(!skipMessageValidation) {
    const {valid, errors} = ArrayMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback({err: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), msg: undefined, mqttMsg: packet}); return;
    }
  }
      onDataCallback({err: undefined, msg: parsedMessage, mqttMsg: packet});
    } catch (err: any) {
      onDataCallback({err: new Error(`Failed to parse message: ${err.message}`), msg: undefined, mqttMsg: packet});
    }
      };

      mqtt.on('message', messageHandler);

      // Subscribe to the topic
      await mqtt.subscribeAsync('array/payload');

      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * MQTT publish operation for `union/payload`
 *
  * @param message to publish
 * @param mqtt the MQTT client to publish from
 */
function publishToSendUnionPayload({
  message, 
  mqtt
}: {
  message: UnionMessageModule.UnionMessage, 
  mqtt: Mqtt.MqttClient
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = UnionMessageModule.marshal(message);
      let publishOptions: Mqtt.IClientPublishOptions = {};
      mqtt.publish('union/payload', dataToSend, publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback subscribeToReceiveUnionPayloadCallback
 * @param err if any error occurred this will be set
 * @param msg that was received
 * @param mqttMsg the raw MQTT message packet
 */

/**
 * MQTT subscription for `union/payload`
 *
 * @param onDataCallback to call when messages are received
 * @param mqtt the MQTT client to subscribe with
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveUnionPayload({
  onDataCallback, 
  mqtt, 
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: UnionMessageModule.UnionMessage, mqttMsg?: Mqtt.IPublishPacket}) => void, 
  mqtt: Mqtt.MqttClient, 
  skipMessageValidation?: boolean
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const validator = UnionMessageModule.createValidator();

      // Set up message listener
      const messageHandler = (topic: string, message: Buffer, packet: Mqtt.IPublishPacket) => {
        
    // Check if the received topic matches this subscription's pattern
    const topicPattern = /^union\/payload$/;
    if (!topicPattern.test(topic)) {
      return; // Ignore messages not matching this subscription's topic pattern
    }
    
    const receivedData = message.toString();
    
    
    
    try {
      const parsedMessage = UnionMessageModule.unmarshal(receivedData);
      if(!skipMessageValidation) {
    const {valid, errors} = UnionMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback({err: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), msg: undefined, mqttMsg: packet}); return;
    }
  }
      onDataCallback({err: undefined, msg: parsedMessage, mqttMsg: packet});
    } catch (err: any) {
      onDataCallback({err: new Error(`Failed to parse message: ${err.message}`), msg: undefined, mqttMsg: packet});
    }
      };

      mqtt.on('message', messageHandler);

      // Subscribe to the topic
      await mqtt.subscribeAsync('union/payload');

      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

export { publishToSendUserSignedup, subscribeToReceiveUserSignedup, publishToNoParameter, subscribeToNoParameter, publishToSendStringPayload, subscribeToReceiveStringPayload, publishToSendArrayPayload, subscribeToReceiveArrayPayload, publishToSendUnionPayload, subscribeToReceiveUnionPayload };
