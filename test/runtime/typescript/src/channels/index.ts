import {UserSignedUp} from './../payloads/UserSignedUp';
import {UserSignedupParameters} from './../parameters/UserSignedupParameters';
import {UserSignedUpHeaders} from './../headers/UserSignedUpHeaders';
import * as Nats from 'nats';
import * as Kafka from 'kafkajs';
import * as Mqtt from 'mqtt';
import { NextFunction, Request, Response, Router } from 'express';
import { fetchEventSource, EventStreamContentType, EventSourceMessage } from '@ai-zen/node-fetch-event-source';
import * as Amqp from 'amqplib';
export const Protocols = {
nats: {
  /**
 * NATS publish operation for `user.signedup.{my_parameter}.{enum_parameter}`
 * 
  * @param message to publish
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
publishToSendUserSignedup: ({
  message, 
  parameters, 
  headers, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParameters, 
  headers?: UserSignedUpHeaders, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      // Set up headers if provided
      if (headers) {
        const natsHeaders = Nats.headers();
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            natsHeaders.append(key, String(value));
          }
        }
        options = { ...options, headers: natsHeaders };
      }
dataToSend = codec.encode(dataToSend);
nc.publish(parameters.getChannelWithParameters('user.signedup.{my_parameter}.{enum_parameter}'), dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * JetStream publish operation for `user.signedup.{my_parameter}.{enum_parameter}`
 * 
  * @param message to publish over jetstream
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
jetStreamPublishToSendUserSignedup: ({
  message, 
  parameters, 
  headers, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParameters, 
  headers?: UserSignedUpHeaders, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      // Set up headers if provided
      if (headers) {
        const natsHeaders = Nats.headers();
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            natsHeaders.append(key, String(value));
          }
        }
        options = { ...options, headers: natsHeaders };
      }
dataToSend = codec.encode(dataToSend);
await js.publish(parameters.getChannelWithParameters('user.signedup.{my_parameter}.{enum_parameter}'), dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * Callback for when receiving messages
 *
 * @callback subscribeToReceiveUserSignedupCallback
 * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param headers that were received with the message
 * @param natsMsg
 */

/**
 * Core subscription for `user.signedup.{my_parameter}.{enum_parameter}`
 * 
 * @param {subscribeToReceiveUserSignedupCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param nc the nats client to setup the subscribe for
 * @param codec the serialization codec to use while receiving the message
 * @param options when setting up the subscription
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
subscribeToReceiveUserSignedup: ({
  onDataCallback, 
  parameters, 
  nc, 
  codec = Nats.JSONCodec(), 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, headers?: UserSignedUpHeaders, natsMsg?: Nats.Msg) => void, 
  parameters: UserSignedupParameters, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.SubscriptionOptions, 
  skipMessageValidation?: boolean
}): Promise<Nats.Subscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = nc.subscribe(parameters.getChannelWithParameters('user.signedup.{my_parameter}.{enum_parameter}'), options);
      const validator = UserSignedUp.createValidator();
      (async () => {
        for await (const msg of subscription) {
          const parameters = UserSignedupParameters.createFromChannel(msg.subject, 'user.signedup.{my_parameter}.{enum_parameter}', /^user.signedup.([^.]*).([^.]*)$/)
          let receivedData: any = codec.decode(msg.data);
// Extract headers if present
          let extractedHeaders: UserSignedUpHeaders | undefined = undefined;
          if (msg.headers) {
            const headerObj: Record<string, any> = {};
            // NATS headers support both iteration and get() method
            if (typeof msg.headers.keys === 'function') {
              // Use keys() method if available (NATS MsgHdrs)
              for (const key of msg.headers.keys()) {
                headerObj[key] = msg.headers.get(key);
              }
            } else {
              // Fallback to Object.entries for plain objects
              for (const [key, value] of Object.entries(msg.headers)) {
                headerObj[key] = value;
              }
            }
            extractedHeaders = UserSignedUpHeaders.unmarshal(headerObj);
          }
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, extractedHeaders, msg); continue;
    }
  }
onDataCallback(undefined, UserSignedUp.unmarshal(receivedData), parameters, extractedHeaders, msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * Callback for when receiving messages
 *
 * @callback jetStreamPullSubscribeToReceiveUserSignedupCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param headers that was received with the message
 * @param jetstreamMsg
 */

/**
 * JetStream pull subscription for `user.signedup.{my_parameter}.{enum_parameter}`
 * 
  * @param {jetStreamPullSubscribeToReceiveUserSignedupCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
jetStreamPullSubscribeToReceiveUserSignedup: ({
  onDataCallback, 
  parameters, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, headers?: UserSignedUpHeaders, jetstreamMsg?: Nats.JsMsg) => void, 
  parameters: UserSignedupParameters, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamPullSubscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.pullSubscribe(parameters.getChannelWithParameters('user.signedup.{my_parameter}.{enum_parameter}'), options);
      const validator = UserSignedUp.createValidator();
      (async () => {
        for await (const msg of subscription) {
          const parameters = UserSignedupParameters.createFromChannel(msg.subject, 'user.signedup.{my_parameter}.{enum_parameter}', /^user.signedup.([^.]*).([^.]*)$/)
          let receivedData: any = codec.decode(msg.data);
// Extract headers if present
          let extractedHeaders: UserSignedUpHeaders | undefined = undefined;
          if (msg.headers) {
            const headerObj: Record<string, any> = {};
            // NATS headers support both iteration and get() method
            if (typeof msg.headers.keys === 'function') {
              // Use keys() method if available (NATS MsgHdrs)
              for (const key of msg.headers.keys()) {
                headerObj[key] = msg.headers.get(key);
              }
            } else {
              // Fallback to Object.entries for plain objects
              for (const [key, value] of Object.entries(msg.headers)) {
                headerObj[key] = value;
              }
            }
            extractedHeaders = UserSignedUpHeaders.unmarshal(headerObj);
          }
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, msg); continue;
    }
  }
onDataCallback(undefined, UserSignedUp.unmarshal(receivedData), parameters, extractedHeaders, msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * Callback for when receiving messages
 *
 * @callback jetStreamPushSubscriptionFromReceiveUserSignedupCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param headers that was received with the message
 * @param jetstreamMsg
 */

/**
 * JetStream push subscription for `user.signedup.{my_parameter}.{enum_parameter}`
 * 
  * @param {jetStreamPushSubscriptionFromReceiveUserSignedupCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
jetStreamPushSubscriptionFromReceiveUserSignedup: ({
  onDataCallback, 
  parameters, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, headers?: UserSignedUpHeaders, jetstreamMsg?: Nats.JsMsg) => void, 
  parameters: UserSignedupParameters, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamSubscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.subscribe(parameters.getChannelWithParameters('user.signedup.{my_parameter}.{enum_parameter}'), options);
      const validator = UserSignedUp.createValidator();
      (async () => {
        for await (const msg of subscription) {
          const parameters = UserSignedupParameters.createFromChannel(msg.subject, 'user.signedup.{my_parameter}.{enum_parameter}', /^user.signedup.([^.]*).([^.]*)$/)
          let receivedData: any = codec.decode(msg.data);
// Extract headers if present
          let extractedHeaders: UserSignedUpHeaders | undefined = undefined;
          if (msg.headers) {
            const headerObj: Record<string, any> = {};
            // NATS headers support both iteration and get() method
            if (typeof msg.headers.keys === 'function') {
              // Use keys() method if available (NATS MsgHdrs)
              for (const key of msg.headers.keys()) {
                headerObj[key] = msg.headers.get(key);
              }
            } else {
              // Fallback to Object.entries for plain objects
              for (const [key, value] of Object.entries(msg.headers)) {
                headerObj[key] = value;
              }
            }
            extractedHeaders = UserSignedUpHeaders.unmarshal(headerObj);
          }
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, msg); continue;
    }
  }
onDataCallback(undefined, UserSignedUp.unmarshal(receivedData), parameters, extractedHeaders, msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * NATS publish operation for `noparameters`
 * 
  * @param message to publish
 * @param headers optional headers to include with the message
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
publishToNoParameter: ({
  message, 
  headers, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: UserSignedUp, 
  headers?: UserSignedUpHeaders, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      // Set up headers if provided
      if (headers) {
        const natsHeaders = Nats.headers();
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            natsHeaders.append(key, String(value));
          }
        }
        options = { ...options, headers: natsHeaders };
      }
dataToSend = codec.encode(dataToSend);
nc.publish('noparameters', dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * Callback for when receiving messages
 *
 * @callback subscribeToNoParameterCallback
 * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param headers that were received with the message
 * @param natsMsg
 */

/**
 * Core subscription for `noparameters`
 * 
 * @param {subscribeToNoParameterCallback} onDataCallback to call when messages are received
 * @param nc the nats client to setup the subscribe for
 * @param codec the serialization codec to use while receiving the message
 * @param options when setting up the subscription
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
subscribeToNoParameter: ({
  onDataCallback, 
  nc, 
  codec = Nats.JSONCodec(), 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UserSignedUp, headers?: UserSignedUpHeaders, natsMsg?: Nats.Msg) => void, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.SubscriptionOptions, 
  skipMessageValidation?: boolean
}): Promise<Nats.Subscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = nc.subscribe('noparameters', options);
      const validator = UserSignedUp.createValidator();
      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
// Extract headers if present
          let extractedHeaders: UserSignedUpHeaders | undefined = undefined;
          if (msg.headers) {
            const headerObj: Record<string, any> = {};
            // NATS headers support both iteration and get() method
            if (typeof msg.headers.keys === 'function') {
              // Use keys() method if available (NATS MsgHdrs)
              for (const key of msg.headers.keys()) {
                headerObj[key] = msg.headers.get(key);
              }
            } else {
              // Fallback to Object.entries for plain objects
              for (const [key, value] of Object.entries(msg.headers)) {
                headerObj[key] = value;
              }
            }
            extractedHeaders = UserSignedUpHeaders.unmarshal(headerObj);
          }
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, extractedHeaders, msg); continue;
    }
  }
onDataCallback(undefined, UserSignedUp.unmarshal(receivedData), extractedHeaders, msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * Callback for when receiving messages
 *
 * @callback jetStreamPullSubscribeToNoParameterCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param headers that was received with the message
 * @param jetstreamMsg
 */

/**
 * JetStream pull subscription for `noparameters`
 * 
  * @param {jetStreamPullSubscribeToNoParameterCallback} onDataCallback to call when messages are received
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
jetStreamPullSubscribeToNoParameter: ({
  onDataCallback, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UserSignedUp, headers?: UserSignedUpHeaders, jetstreamMsg?: Nats.JsMsg) => void, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamPullSubscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.pullSubscribe('noparameters', options);
      const validator = UserSignedUp.createValidator();
      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
// Extract headers if present
          let extractedHeaders: UserSignedUpHeaders | undefined = undefined;
          if (msg.headers) {
            const headerObj: Record<string, any> = {};
            // NATS headers support both iteration and get() method
            if (typeof msg.headers.keys === 'function') {
              // Use keys() method if available (NATS MsgHdrs)
              for (const key of msg.headers.keys()) {
                headerObj[key] = msg.headers.get(key);
              }
            } else {
              // Fallback to Object.entries for plain objects
              for (const [key, value] of Object.entries(msg.headers)) {
                headerObj[key] = value;
              }
            }
            extractedHeaders = UserSignedUpHeaders.unmarshal(headerObj);
          }
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, UserSignedUp.unmarshal(receivedData), extractedHeaders, msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * Callback for when receiving messages
 *
 * @callback jetStreamPushSubscriptionFromNoParameterCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param headers that was received with the message
 * @param jetstreamMsg
 */

/**
 * JetStream push subscription for `noparameters`
 * 
  * @param {jetStreamPushSubscriptionFromNoParameterCallback} onDataCallback to call when messages are received
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
jetStreamPushSubscriptionFromNoParameter: ({
  onDataCallback, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UserSignedUp, headers?: UserSignedUpHeaders, jetstreamMsg?: Nats.JsMsg) => void, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamSubscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.subscribe('noparameters', options);
      const validator = UserSignedUp.createValidator();
      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
// Extract headers if present
          let extractedHeaders: UserSignedUpHeaders | undefined = undefined;
          if (msg.headers) {
            const headerObj: Record<string, any> = {};
            // NATS headers support both iteration and get() method
            if (typeof msg.headers.keys === 'function') {
              // Use keys() method if available (NATS MsgHdrs)
              for (const key of msg.headers.keys()) {
                headerObj[key] = msg.headers.get(key);
              }
            } else {
              // Fallback to Object.entries for plain objects
              for (const [key, value] of Object.entries(msg.headers)) {
                headerObj[key] = value;
              }
            }
            extractedHeaders = UserSignedUpHeaders.unmarshal(headerObj);
          }
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, UserSignedUp.unmarshal(receivedData), extractedHeaders, msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * JetStream publish operation for `noparameters`
 * 
  * @param message to publish over jetstream
 * @param headers optional headers to include with the message
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
jetStreamPublishToNoParameter: ({
  message, 
  headers, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: UserSignedUp, 
  headers?: UserSignedUpHeaders, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      // Set up headers if provided
      if (headers) {
        const natsHeaders = Nats.headers();
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            natsHeaders.append(key, String(value));
          }
        }
        options = { ...options, headers: natsHeaders };
      }
dataToSend = codec.encode(dataToSend);
await js.publish('noparameters', dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}
},
kafka: {
  /**
 * Kafka publish operation for `user.signedup.{my_parameter}.{enum_parameter}`
 * 
  * @param message to publish
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param kafka the KafkaJS client to publish from
 */
produceToSendUserSignedup: ({
  message, 
  parameters, 
  headers, 
  kafka
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParameters, 
  headers?: UserSignedUpHeaders, 
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> => {
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
},
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
consumeFromReceiveUserSignedup: ({
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
}): Promise<Kafka.Consumer> => {
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
},
/**
 * Kafka publish operation for `noparameters`
 * 
  * @param message to publish
 * @param headers optional headers to include with the message
 * @param kafka the KafkaJS client to publish from
 */
produceToNoParameter: ({
  message, 
  headers, 
  kafka
}: {
  message: UserSignedUp, 
  headers?: UserSignedUpHeaders, 
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> => {
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
},
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
consumeFromNoParameter: ({
  onDataCallback, 
  kafka, 
  options = {fromBeginning: true, groupId: ''}, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UserSignedUp, headers?: UserSignedUpHeaders, kafkaMsg?: Kafka.EachMessagePayload) => void, 
  kafka: Kafka.Kafka, 
  options: {fromBeginning: boolean, groupId: string}, 
  skipMessageValidation?: boolean
}): Promise<Kafka.Consumer> => {
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
},
mqtt: {
  /**
 * MQTT publish operation for `user/signedup/{my_parameter}/{enum_parameter}`
 * 
  * @param message to publish
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message as MQTT user properties
 * @param mqtt the MQTT client to publish from
 */
publishToSendUserSignedup: ({
  message, 
  parameters, 
  headers, 
  mqtt
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParameters, 
  headers?: UserSignedUpHeaders, 
  mqtt: Mqtt.MqttClient
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      // Set up user properties (headers) if provided
      let publishOptions: Mqtt.IClientPublishOptions = {};
      if (headers) {
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        publishOptions.properties = { userProperties: {} };
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            publishOptions.properties.userProperties[key] = String(value);
          }
        }
      }
      mqtt.publish(parameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}'), dataToSend, publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
},
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
subscribeToReceiveUserSignedup: ({
  onDataCallback, 
  parameters, 
  mqtt, 
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, headers?: UserSignedUpHeaders, mqttMsg?: Mqtt.IPublishPacket}) => void, 
  parameters: UserSignedupParameters, 
  mqtt: Mqtt.MqttClient, 
  skipMessageValidation?: boolean
}): Promise<void> => {
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
},
/**
 * MQTT publish operation for `noparameters`
 * 
  * @param message to publish
 * @param headers optional headers to include with the message as MQTT user properties
 * @param mqtt the MQTT client to publish from
 */
publishToNoParameter: ({
  message, 
  headers, 
  mqtt
}: {
  message: UserSignedUp, 
  headers?: UserSignedUpHeaders, 
  mqtt: Mqtt.MqttClient
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      // Set up user properties (headers) if provided
      let publishOptions: Mqtt.IClientPublishOptions = {};
      if (headers) {
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        publishOptions.properties = { userProperties: {} };
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            publishOptions.properties.userProperties[key] = String(value);
          }
        }
      }
      mqtt.publish('noparameters', dataToSend, publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
},
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
subscribeToNoParameter: ({
  onDataCallback, 
  mqtt, 
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: UserSignedUp, headers?: UserSignedUpHeaders, mqttMsg?: Mqtt.IPublishPacket}) => void, 
  mqtt: Mqtt.MqttClient, 
  skipMessageValidation?: boolean
}): Promise<void> => {
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
},
event_source: {
  registerSendUserSignedup: ({
  router, 
  callback
}: {
  router: Router, 
  callback: ((req: Request, res: Response, next: NextFunction, parameters: UserSignedupParameters, sendEvent: (message: UserSignedUp) => void) => void) | ((req: Request, res: Response, next: NextFunction, parameters: UserSignedupParameters, sendEvent: (message: UserSignedUp) => void) => Promise<void>)
}) => {
  const event = '/user/signedup/:my_parameter/:enum_parameter';
  router.get(event, async (req, res, next) => {
    const listenParameters = UserSignedupParameters.createFromChannel(req.originalUrl.startsWith('/') ? req.originalUrl.slice(1) : req.originalUrl, 'user/signedup/{my_parameter}/{enum_parameter}', /^user\/signedup\/([^.]*)\/([^.]*)$/);
    res.writeHead(200, {
      'Cache-Control': 'no-cache, no-transform',
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })
    const sendEventCallback = (message: UserSignedUp) => {
      if (res.closed) {
        return
      }
      res.write(`event: ${event}\n`)
      res.write(`data: ${message.marshal()}\n\n`)
    }
    await callback(req, res, next, listenParameters, sendEventCallback)
  })
}
,
/**
 * Event source fetch for `user/signedup/{my_parameter}/{enum_parameter}`
 * 
  * @param callback to call when receiving events
 * @param parameters for listening
 * @param headers optional headers to include with the EventSource connection
 * @param options additionally used to handle the event source
 * @param skipMessageValidation turn off runtime validation of incoming messages
 * @returns A cleanup function to abort the connection
 */
listenForReceiveUserSignedup: ({
  callback, 
  parameters, 
  headers, 
  options, 
  skipMessageValidation = false
}: {
  callback: (params: {error?: Error, messageEvent?: UserSignedUp}) => void, 
  parameters: UserSignedupParameters, 
  headers?: UserSignedUpHeaders, 
  options: {authorization?: string, onClose?: (err?: string) => void, baseUrl: string, headers?: Record<string, string>}, 
  skipMessageValidation?: boolean
}): (() => void) => {
	const controller = new AbortController();
	let eventsUrl: string = parameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}');
	const url = `${options.baseUrl}/${eventsUrl}`
  const requestHeaders: Record<string, string> = {
	  ...options.headers ?? {},
    Accept: 'text/event-stream'
  }
  if(options.authorization) {
    requestHeaders['authorization'] = `Bearer ${options?.authorization}`;
  }
  // Add headers from AsyncAPI specification if provided
  if (headers) {
    const asyncApiHeaderData = headers.marshal();
    const parsedAsyncApiHeaders = typeof asyncApiHeaderData === 'string' ? JSON.parse(asyncApiHeaderData) : asyncApiHeaderData;
    for (const [key, value] of Object.entries(parsedAsyncApiHeaders)) {
      if (value !== undefined) {
        requestHeaders[key] = String(value);
      }
    }
  }
  const validator = UserSignedUp.createValidator();
	fetchEventSource(`${url}`, {
		method: 'GET',
		headers: requestHeaders,
		signal: controller.signal,
		onmessage: (ev: EventSourceMessage) => {
      const receivedData = ev.data;
      if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return callback({error: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), messageEvent: undefined});
    }
  }
      const callbackData = UserSignedUp.unmarshal(receivedData);
			callback({error: undefined, messageEvent: callbackData});
		},
		onerror: (err) => {
			options.onClose?.(err);
		},
		onclose: () => {
			options.onClose?.();
		},
		async onopen(response: { ok: any; headers: any; status: number }) {
			if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
				return // everything's good
			} else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
				// client-side errors are usually non-retriable:
				callback({error: new Error('Client side error, could not open event connection'), messageEvent: undefined})
			} else {
				callback({error: new Error('Unknown error, could not open event connection'), messageEvent: undefined});
			}
		},
	});
	
	return () => {
		controller.abort();
	};
}
,
/**
 * Event source fetch for `noparameters`
 * 
  * @param callback to call when receiving events
 * @param headers optional headers to include with the EventSource connection
 * @param options additionally used to handle the event source
 * @param skipMessageValidation turn off runtime validation of incoming messages
 * @returns A cleanup function to abort the connection
 */
listenForNoParameter: ({
  callback, 
  headers, 
  options, 
  skipMessageValidation = false
}: {
  callback: (params: {error?: Error, messageEvent?: UserSignedUp}) => void, 
  headers?: UserSignedUpHeaders, 
  options: {authorization?: string, onClose?: (err?: string) => void, baseUrl: string, headers?: Record<string, string>}, 
  skipMessageValidation?: boolean
}): (() => void) => {
	const controller = new AbortController();
	let eventsUrl: string = 'noparameters';
	const url = `${options.baseUrl}/${eventsUrl}`
  const requestHeaders: Record<string, string> = {
	  ...options.headers ?? {},
    Accept: 'text/event-stream'
  }
  if(options.authorization) {
    requestHeaders['authorization'] = `Bearer ${options?.authorization}`;
  }
  // Add headers from AsyncAPI specification if provided
  if (headers) {
    const asyncApiHeaderData = headers.marshal();
    const parsedAsyncApiHeaders = typeof asyncApiHeaderData === 'string' ? JSON.parse(asyncApiHeaderData) : asyncApiHeaderData;
    for (const [key, value] of Object.entries(parsedAsyncApiHeaders)) {
      if (value !== undefined) {
        requestHeaders[key] = String(value);
      }
    }
  }
  const validator = UserSignedUp.createValidator();
	fetchEventSource(`${url}`, {
		method: 'GET',
		headers: requestHeaders,
		signal: controller.signal,
		onmessage: (ev: EventSourceMessage) => {
      const receivedData = ev.data;
      if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return callback({error: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), messageEvent: undefined});
    }
  }
      const callbackData = UserSignedUp.unmarshal(receivedData);
			callback({error: undefined, messageEvent: callbackData});
		},
		onerror: (err) => {
			options.onClose?.(err);
		},
		onclose: () => {
			options.onClose?.();
		},
		async onopen(response: { ok: any; headers: any; status: number }) {
			if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
				return // everything's good
			} else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
				// client-side errors are usually non-retriable:
				callback({error: new Error('Client side error, could not open event connection'), messageEvent: undefined})
			} else {
				callback({error: new Error('Unknown error, could not open event connection'), messageEvent: undefined});
			}
		},
	});
	
	return () => {
		controller.abort();
	};
}
,
registerNoParameter: ({
  router, 
  callback
}: {
  router: Router, 
  callback: ((req: Request, res: Response, next: NextFunction, sendEvent: (message: UserSignedUp) => void) => void) | ((req: Request, res: Response, next: NextFunction, sendEvent: (message: UserSignedUp) => void) => Promise<void>)
}) => {
  const event = '/noparameters';
  router.get(event, async (req, res, next) => {
    
    res.writeHead(200, {
      'Cache-Control': 'no-cache, no-transform',
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })
    const sendEventCallback = (message: UserSignedUp) => {
      if (res.closed) {
        return
      }
      res.write(`event: ${event}\n`)
      res.write(`data: ${message.marshal()}\n\n`)
    }
    await callback(req, res, next,  sendEventCallback)
  })
}

},
amqp: {
  /**
 * AMQP publish operation for exchange `user/signedup/{my_parameter}/{enum_parameter}`
 * 
  * @param message to publish
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish exchange operation
 */
publishToSendUserSignedupExchange: ({
  message, 
  parameters, 
  headers, 
  amqp, 
  options
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParameters, 
  headers?: UserSignedUpHeaders, 
  amqp: Amqp.Connection, 
  options?: {exchange: string | undefined} & Amqp.Options.Publish
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    const exchange = options?.exchange ?? 'undefined';
    if(!exchange) {
      return reject('No exchange value found, please provide one')
    }
    try {
      let dataToSend: any = message.marshal();
const channel = await amqp.createChannel();
const routingKey = parameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}');
// Set up message properties (headers) if provided
let publishOptions = { ...options };
if (headers) {
  const headerData = headers.marshal();
  const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
  publishOptions.headers = {};
  for (const [key, value] of Object.entries(parsedHeaders)) {
    if (value !== undefined) {
      publishOptions.headers[key] = value;
    }
  }
}
channel.publish(exchange, routingKey, Buffer.from(dataToSend), publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * AMQP publish operation for queue `user/signedup/{my_parameter}/{enum_parameter}`
 * 
  * @param message to publish
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish queue operation
 */
publishToSendUserSignedupQueue: ({
  message, 
  parameters, 
  headers, 
  amqp, 
  options
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParameters, 
  headers?: UserSignedUpHeaders, 
  amqp: Amqp.Connection, 
  options?: Amqp.Options.Publish
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
const channel = await amqp.createChannel();
const queue = parameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}');
// Set up message properties (headers) if provided
let publishOptions = { ...options };
if (headers) {
  const headerData = headers.marshal();
  const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
  publishOptions.headers = {};
  for (const [key, value] of Object.entries(parsedHeaders)) {
    if (value !== undefined) {
      publishOptions.headers[key] = value;
    }
  }
}
channel.sendToQueue(queue, Buffer.from(dataToSend), publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * AMQP subscribe operation for queue `user/signedup/{my_parameter}/{enum_parameter}`
 * 
  * @param {subscribeToReceiveUserSignedupQueueCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param amqp the AMQP connection to receive from
 * @param options for the AMQP subscribe queue operation
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
subscribeToReceiveUserSignedupQueue: ({
  onDataCallback, 
  parameters, 
  amqp, 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: UserSignedUp, headers?: UserSignedUpHeaders, amqpMsg?: Amqp.ConsumeMessage}) => void, 
  parameters: UserSignedupParameters, 
  amqp: Amqp.Connection, 
  options?: Amqp.Options.Consume, 
  skipMessageValidation?: boolean
}): Promise<Amqp.Channel> => {
  return new Promise(async (resolve, reject) => {
    try {
      const channel = await amqp.createChannel();
const queue = parameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}');
await channel.assertQueue(queue, { durable: true });
const validator = UserSignedUp.createValidator();
channel.consume(queue, (msg) => {
  if (msg !== null) {
    const receivedData = msg.content.toString()
    // Extract headers if present
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
    if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback({err: new Error(`Invalid message payload received ${JSON.stringify({cause: errors})}`), msg: undefined, headers: extractedHeaders, amqpMsg: msg}); return;
    }
  }
    const message = UserSignedUp.unmarshal(receivedData);
    onDataCallback({err: undefined, msg: message, headers: extractedHeaders, amqpMsg: msg});
  }
}, options);
      resolve(channel);
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * AMQP publish operation for exchange `noparameters`
 * 
  * @param message to publish
 * @param headers optional headers to include with the message
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish exchange operation
 */
publishToNoParameterExchange: ({
  message, 
  headers, 
  amqp, 
  options
}: {
  message: UserSignedUp, 
  headers?: UserSignedUpHeaders, 
  amqp: Amqp.Connection, 
  options?: {exchange: string | undefined} & Amqp.Options.Publish
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    const exchange = options?.exchange ?? 'undefined';
    if(!exchange) {
      return reject('No exchange value found, please provide one')
    }
    try {
      let dataToSend: any = message.marshal();
const channel = await amqp.createChannel();
const routingKey = 'noparameters';
// Set up message properties (headers) if provided
let publishOptions = { ...options };
if (headers) {
  const headerData = headers.marshal();
  const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
  publishOptions.headers = {};
  for (const [key, value] of Object.entries(parsedHeaders)) {
    if (value !== undefined) {
      publishOptions.headers[key] = value;
    }
  }
}
channel.publish(exchange, routingKey, Buffer.from(dataToSend), publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * AMQP publish operation for queue `noparameters`
 * 
  * @param message to publish
 * @param headers optional headers to include with the message
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish queue operation
 */
publishToNoParameterQueue: ({
  message, 
  headers, 
  amqp, 
  options
}: {
  message: UserSignedUp, 
  headers?: UserSignedUpHeaders, 
  amqp: Amqp.Connection, 
  options?: Amqp.Options.Publish
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
const channel = await amqp.createChannel();
const queue = 'noparameters';
// Set up message properties (headers) if provided
let publishOptions = { ...options };
if (headers) {
  const headerData = headers.marshal();
  const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
  publishOptions.headers = {};
  for (const [key, value] of Object.entries(parsedHeaders)) {
    if (value !== undefined) {
      publishOptions.headers[key] = value;
    }
  }
}
channel.sendToQueue(queue, Buffer.from(dataToSend), publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * AMQP subscribe operation for queue `noparameters`
 * 
  * @param {subscribeToNoParameterQueueCallback} onDataCallback to call when messages are received
 * @param amqp the AMQP connection to receive from
 * @param options for the AMQP subscribe queue operation
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
subscribeToNoParameterQueue: ({
  onDataCallback, 
  amqp, 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: UserSignedUp, headers?: UserSignedUpHeaders, amqpMsg?: Amqp.ConsumeMessage}) => void, 
  amqp: Amqp.Connection, 
  options?: Amqp.Options.Consume, 
  skipMessageValidation?: boolean
}): Promise<Amqp.Channel> => {
  return new Promise(async (resolve, reject) => {
    try {
      const channel = await amqp.createChannel();
const queue = 'noparameters';
await channel.assertQueue(queue, { durable: true });
const validator = UserSignedUp.createValidator();
channel.consume(queue, (msg) => {
  if (msg !== null) {
    const receivedData = msg.content.toString()
    // Extract headers if present
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
    if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback({err: new Error(`Invalid message payload received ${JSON.stringify({cause: errors})}`), msg: undefined, headers: extractedHeaders, amqpMsg: msg}); return;
    }
  }
    const message = UserSignedUp.unmarshal(receivedData);
    onDataCallback({err: undefined, msg: message, headers: extractedHeaders, amqpMsg: msg});
  }
}, options);
      resolve(channel);
    } catch (e: any) {
      reject(e);
    }
  });
}
}};