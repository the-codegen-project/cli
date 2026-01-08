import {UserSignedUp} from './../payloads/UserSignedUp';
import * as StringMessageModule from './../payloads/StringMessage';
import * as ArrayMessageModule from './../payloads/ArrayMessage';
import * as UnionMessageModule from './../payloads/UnionMessage';
import {AnonymousSchema_9} from './../payloads/AnonymousSchema_9';
import {UserSignedupParameters} from './../parameters/UserSignedupParameters';
import {UserSignedUpHeaders} from './../headers/UserSignedUpHeaders';
import * as Kafka from 'kafkajs';

/**
 * Kafka publish operation for `user.signedup.{my_parameter}.{enum_parameter}`
 *
  * @param message to publish
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param kafka the KafkaJS client to publish from
 */
function produceToSendUserSignedup({
  message, 
  parameters, 
  headers, 
  kafka
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParameters, 
  headers?: UserSignedUpHeaders, 
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> {
  return new Promise(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      const producer = kafka.producer();
      await producer.connect();
      // Set up headers if provided
      let messageHeaders: Record<string, string> | undefined = undefined;
      if (headers) {
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        messageHeaders = {};
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            messageHeaders[key] = String(value);
          }
        }
      }

      await producer.send({
        topic: parameters.getChannelWithParameters('user.signedup.{my_parameter}.{enum_parameter}'),
        messages: [
          {
            value: dataToSend,
            headers: messageHeaders
          },
        ],
      });
      resolve(producer);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback consumeFromReceiveUserSignedupCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param headers that was received with the message
 * @param kafkaMsg
 */

/**
 * Kafka subscription for `user.signedup.{my_parameter}.{enum_parameter}`
 *
  * @param {consumeFromReceiveUserSignedupCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param kafka the KafkaJS client to subscribe through
 * @param options when setting up the subscription
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function consumeFromReceiveUserSignedup({
  onDataCallback, 
  parameters, 
  kafka, 
  options = {fromBeginning: true, groupId: ''}, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, headers?: UserSignedUpHeaders, kafkaMsg?: Kafka.EachMessagePayload) => void, 
  parameters: UserSignedupParameters, 
  kafka: Kafka.Kafka, 
  options: {fromBeginning: boolean, groupId: string}, 
  skipMessageValidation?: boolean
}): Promise<Kafka.Consumer> {
  return new Promise(async (resolve, reject) => {
    try {
      if(!options.groupId) {
        return reject('No group ID provided');
      }
      const consumer = kafka.consumer({ groupId: options.groupId });

      const validator = UserSignedUp.createValidator();
      await consumer.connect();
      await consumer.subscribe({ topic: parameters.getChannelWithParameters('user.signedup.{my_parameter}.{enum_parameter}'), fromBeginning: options.fromBeginning });
      await consumer.run({
        eachMessage: async (kafkaMessage: Kafka.EachMessagePayload) => {
          const { topic, message } = kafkaMessage;
          const receivedData = message.value?.toString()!;
          const parameters = UserSignedupParameters.createFromChannel(topic, 'user.signedup.{my_parameter}.{enum_parameter}', /^user.signedup.([^.]*).([^.]*)$/);
          
          // Extract headers if present
          let extractedHeaders: UserSignedUpHeaders | undefined = undefined;
          if (message.headers) {
            const headerObj: Record<string, any> = {};
            for (const [key, value] of Object.entries(message.headers)) {
              if (value !== undefined) {
                headerObj[key] = value.toString();
              }
            }
            extractedHeaders = UserSignedUpHeaders.unmarshal(headerObj);
          }
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, extractedHeaders, kafkaMessage);
    }
  }
const callbackData = UserSignedUp.unmarshal(receivedData);
onDataCallback(undefined, callbackData, parameters, extractedHeaders, kafkaMessage);
        }
      });
      resolve(consumer);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Kafka publish operation for `noparameters`
 *
  * @param message to publish
 * @param headers optional headers to include with the message
 * @param kafka the KafkaJS client to publish from
 */
function produceToNoParameter({
  message, 
  headers, 
  kafka
}: {
  message: UserSignedUp, 
  headers?: UserSignedUpHeaders, 
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> {
  return new Promise(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      const producer = kafka.producer();
      await producer.connect();
      // Set up headers if provided
      let messageHeaders: Record<string, string> | undefined = undefined;
      if (headers) {
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        messageHeaders = {};
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            messageHeaders[key] = String(value);
          }
        }
      }

      await producer.send({
        topic: 'noparameters',
        messages: [
          {
            value: dataToSend,
            headers: messageHeaders
          },
        ],
      });
      resolve(producer);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback consumeFromNoParameterCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param headers that was received with the message
 * @param kafkaMsg
 */

/**
 * Kafka subscription for `noparameters`
 *
  * @param {consumeFromNoParameterCallback} onDataCallback to call when messages are received
 * @param kafka the KafkaJS client to subscribe through
 * @param options when setting up the subscription
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function consumeFromNoParameter({
  onDataCallback, 
  kafka, 
  options = {fromBeginning: true, groupId: ''}, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UserSignedUp, headers?: UserSignedUpHeaders, kafkaMsg?: Kafka.EachMessagePayload) => void, 
  kafka: Kafka.Kafka, 
  options: {fromBeginning: boolean, groupId: string}, 
  skipMessageValidation?: boolean
}): Promise<Kafka.Consumer> {
  return new Promise(async (resolve, reject) => {
    try {
      if(!options.groupId) {
        return reject('No group ID provided');
      }
      const consumer = kafka.consumer({ groupId: options.groupId });

      const validator = UserSignedUp.createValidator();
      await consumer.connect();
      await consumer.subscribe({ topic: 'noparameters', fromBeginning: options.fromBeginning });
      await consumer.run({
        eachMessage: async (kafkaMessage: Kafka.EachMessagePayload) => {
          const { topic, message } = kafkaMessage;
          const receivedData = message.value?.toString()!;
          
          
          // Extract headers if present
          let extractedHeaders: UserSignedUpHeaders | undefined = undefined;
          if (message.headers) {
            const headerObj: Record<string, any> = {};
            for (const [key, value] of Object.entries(message.headers)) {
              if (value !== undefined) {
                headerObj[key] = value.toString();
              }
            }
            extractedHeaders = UserSignedUpHeaders.unmarshal(headerObj);
          }
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, extractedHeaders, kafkaMessage);
    }
  }
const callbackData = UserSignedUp.unmarshal(receivedData);
onDataCallback(undefined, callbackData, extractedHeaders, kafkaMessage);
        }
      });
      resolve(consumer);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Kafka publish operation for `string.payload`
 *
  * @param message to publish
 * @param kafka the KafkaJS client to publish from
 */
function produceToSendStringPayload({
  message, 
  kafka
}: {
  message: StringMessageModule.StringMessage, 
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> {
  return new Promise(async (resolve, reject) => {
    try {
      let dataToSend: any = StringMessageModule.marshal(message);
      const producer = kafka.producer();
      await producer.connect();
      

      await producer.send({
        topic: 'string.payload',
        messages: [
          {
            value: dataToSend
          },
        ],
      });
      resolve(producer);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback consumeFromReceiveStringPayloadCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param kafkaMsg
 */

/**
 * Kafka subscription for `string.payload`
 *
  * @param {consumeFromReceiveStringPayloadCallback} onDataCallback to call when messages are received
 * @param kafka the KafkaJS client to subscribe through
 * @param options when setting up the subscription
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function consumeFromReceiveStringPayload({
  onDataCallback, 
  kafka, 
  options = {fromBeginning: true, groupId: ''}, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: StringMessageModule.StringMessage, kafkaMsg?: Kafka.EachMessagePayload) => void, 
  kafka: Kafka.Kafka, 
  options: {fromBeginning: boolean, groupId: string}, 
  skipMessageValidation?: boolean
}): Promise<Kafka.Consumer> {
  return new Promise(async (resolve, reject) => {
    try {
      if(!options.groupId) {
        return reject('No group ID provided');
      }
      const consumer = kafka.consumer({ groupId: options.groupId });

      const validator = StringMessageModule.createValidator();
      await consumer.connect();
      await consumer.subscribe({ topic: 'string.payload', fromBeginning: options.fromBeginning });
      await consumer.run({
        eachMessage: async (kafkaMessage: Kafka.EachMessagePayload) => {
          const { topic, message } = kafkaMessage;
          const receivedData = message.value?.toString()!;
          
          if(!skipMessageValidation) {
    const {valid, errors} = StringMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, kafkaMessage);
    }
  }
const callbackData = StringMessageModule.unmarshal(receivedData);
onDataCallback(undefined, callbackData, kafkaMessage);
        }
      });
      resolve(consumer);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Kafka publish operation for `array.payload`
 *
  * @param message to publish
 * @param kafka the KafkaJS client to publish from
 */
function produceToSendArrayPayload({
  message, 
  kafka
}: {
  message: ArrayMessageModule.ArrayMessage, 
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> {
  return new Promise(async (resolve, reject) => {
    try {
      let dataToSend: any = ArrayMessageModule.marshal(message);
      const producer = kafka.producer();
      await producer.connect();
      

      await producer.send({
        topic: 'array.payload',
        messages: [
          {
            value: dataToSend
          },
        ],
      });
      resolve(producer);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback consumeFromReceiveArrayPayloadCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param kafkaMsg
 */

/**
 * Kafka subscription for `array.payload`
 *
  * @param {consumeFromReceiveArrayPayloadCallback} onDataCallback to call when messages are received
 * @param kafka the KafkaJS client to subscribe through
 * @param options when setting up the subscription
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function consumeFromReceiveArrayPayload({
  onDataCallback, 
  kafka, 
  options = {fromBeginning: true, groupId: ''}, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: ArrayMessageModule.ArrayMessage, kafkaMsg?: Kafka.EachMessagePayload) => void, 
  kafka: Kafka.Kafka, 
  options: {fromBeginning: boolean, groupId: string}, 
  skipMessageValidation?: boolean
}): Promise<Kafka.Consumer> {
  return new Promise(async (resolve, reject) => {
    try {
      if(!options.groupId) {
        return reject('No group ID provided');
      }
      const consumer = kafka.consumer({ groupId: options.groupId });

      const validator = ArrayMessageModule.createValidator();
      await consumer.connect();
      await consumer.subscribe({ topic: 'array.payload', fromBeginning: options.fromBeginning });
      await consumer.run({
        eachMessage: async (kafkaMessage: Kafka.EachMessagePayload) => {
          const { topic, message } = kafkaMessage;
          const receivedData = message.value?.toString()!;
          
          if(!skipMessageValidation) {
    const {valid, errors} = ArrayMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, kafkaMessage);
    }
  }
const callbackData = ArrayMessageModule.unmarshal(receivedData);
onDataCallback(undefined, callbackData, kafkaMessage);
        }
      });
      resolve(consumer);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Kafka publish operation for `union.payload`
 *
  * @param message to publish
 * @param kafka the KafkaJS client to publish from
 */
function produceToSendUnionPayload({
  message, 
  kafka
}: {
  message: UnionMessageModule.UnionMessage, 
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> {
  return new Promise(async (resolve, reject) => {
    try {
      let dataToSend: any = UnionMessageModule.marshal(message);
      const producer = kafka.producer();
      await producer.connect();
      

      await producer.send({
        topic: 'union.payload',
        messages: [
          {
            value: dataToSend
          },
        ],
      });
      resolve(producer);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback consumeFromReceiveUnionPayloadCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param kafkaMsg
 */

/**
 * Kafka subscription for `union.payload`
 *
  * @param {consumeFromReceiveUnionPayloadCallback} onDataCallback to call when messages are received
 * @param kafka the KafkaJS client to subscribe through
 * @param options when setting up the subscription
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function consumeFromReceiveUnionPayload({
  onDataCallback, 
  kafka, 
  options = {fromBeginning: true, groupId: ''}, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UnionMessageModule.UnionMessage, kafkaMsg?: Kafka.EachMessagePayload) => void, 
  kafka: Kafka.Kafka, 
  options: {fromBeginning: boolean, groupId: string}, 
  skipMessageValidation?: boolean
}): Promise<Kafka.Consumer> {
  return new Promise(async (resolve, reject) => {
    try {
      if(!options.groupId) {
        return reject('No group ID provided');
      }
      const consumer = kafka.consumer({ groupId: options.groupId });

      const validator = UnionMessageModule.createValidator();
      await consumer.connect();
      await consumer.subscribe({ topic: 'union.payload', fromBeginning: options.fromBeginning });
      await consumer.run({
        eachMessage: async (kafkaMessage: Kafka.EachMessagePayload) => {
          const { topic, message } = kafkaMessage;
          const receivedData = message.value?.toString()!;
          
          if(!skipMessageValidation) {
    const {valid, errors} = UnionMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, kafkaMessage);
    }
  }
const callbackData = UnionMessageModule.unmarshal(receivedData);
onDataCallback(undefined, callbackData, kafkaMessage);
        }
      });
      resolve(consumer);
    } catch (e: any) {
      reject(e);
    }
  });
}

export { produceToSendUserSignedup, consumeFromReceiveUserSignedup, produceToNoParameter, consumeFromNoParameter, produceToSendStringPayload, consumeFromReceiveStringPayload, produceToSendArrayPayload, consumeFromReceiveArrayPayload, produceToSendUnionPayload, consumeFromReceiveUnionPayload };
