import {UserSignedUp} from './../payloads/UserSignedUp';
import {UserSignedupParameters} from './../parameters/UserSignedupParameters';
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
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
publishToSendUserSignedup: ({
  message, 
  parameters, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParameters, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
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
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
jetStreamPublishToSendUserSignedup: ({
  message, 
  parameters, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParameters, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
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
  onDataCallback: (err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, natsMsg?: Nats.Msg) => void, 
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
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, msg); continue;
    }
  }
onDataCallback(undefined, UserSignedUp.unmarshal(receivedData), parameters, msg);
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
  onDataCallback: (err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, jetstreamMsg?: Nats.JsMsg) => void, 
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
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, msg); continue;
    }
  }
onDataCallback(undefined, UserSignedUp.unmarshal(receivedData), parameters, msg);
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
  onDataCallback: (err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, jetstreamMsg?: Nats.JsMsg) => void, 
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
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, msg); continue;
    }
  }
onDataCallback(undefined, UserSignedUp.unmarshal(receivedData), parameters, msg);
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
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
publishToNoParameter: ({
  message, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: UserSignedUp, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
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
  onDataCallback: (err?: Error, msg?: UserSignedUp, natsMsg?: Nats.Msg) => void, 
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
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, UserSignedUp.unmarshal(receivedData), msg);
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
  onDataCallback: (err?: Error, msg?: UserSignedUp, jetstreamMsg?: Nats.JsMsg) => void, 
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
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, UserSignedUp.unmarshal(receivedData), msg);
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
  onDataCallback: (err?: Error, msg?: UserSignedUp, jetstreamMsg?: Nats.JsMsg) => void, 
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
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, UserSignedUp.unmarshal(receivedData), msg);
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
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
jetStreamPublishToNoParameter: ({
  message, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: UserSignedUp, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
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
 * @param kafka the KafkaJS client to publish from
 */
produceToSendUserSignedup: ({
  message, 
  parameters, 
  kafka
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParameters, 
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> => {
  return new Promise(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      const producer = kafka.producer();
      await producer.connect();
      await producer.send({
        topic: parameters.getChannelWithParameters('user.signedup.{my_parameter}.{enum_parameter}'),
        messages: [
          { value: dataToSend },
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
  onDataCallback: (err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, kafkaMsg?: Kafka.EachMessagePayload) => void, 
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
          if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, kafkaMessage);
    }
  }
const callbackData = UserSignedUp.unmarshal(receivedData);
onDataCallback(undefined, callbackData, parameters, kafkaMessage);
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
 * @param kafka the KafkaJS client to publish from
 */
produceToNoParameter: ({
  message, 
  kafka
}: {
  message: UserSignedUp, 
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> => {
  return new Promise(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      const producer = kafka.producer();
      await producer.connect();
      await producer.send({
        topic: 'noparameters',
        messages: [
          { value: dataToSend },
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
  onDataCallback: (err?: Error, msg?: UserSignedUp, kafkaMsg?: Kafka.EachMessagePayload) => void, 
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
          
          if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, kafkaMessage);
    }
  }
const callbackData = UserSignedUp.unmarshal(receivedData);
onDataCallback(undefined, callbackData, kafkaMessage);
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
 * @param mqtt the MQTT client to publish from
 */
publishToSendUserSignedup: ({
  message, 
  parameters, 
  mqtt
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParameters, 
  mqtt: Mqtt.MqttClient
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
mqtt.publish(parameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}'), dataToSend);
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
 * @param mqtt the MQTT client to publish from
 */
publishToNoParameter: ({
  message, 
  mqtt
}: {
  message: UserSignedUp, 
  mqtt: Mqtt.MqttClient
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
mqtt.publish('noparameters', dataToSend);
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
 * @param options additionally used to handle the event source
 * @param skipMessageValidation turn off runtime validation of incoming messages
 * @returns A cleanup function to abort the connection
 */
listenForReceiveUserSignedup: ({
  callback, 
  parameters, 
  options, 
  skipMessageValidation = false
}: {
  callback: (error?: Error, messageEvent?: UserSignedUp) => void, 
  parameters: UserSignedupParameters, 
  options: {authorization?: string, onClose?: (err?: string) => void, baseUrl: string, headers?: Record<string, string>}, 
  skipMessageValidation?: boolean
}): (() => void) => {
	const controller = new AbortController();
	let eventsUrl: string = parameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}');
	const url = `${options.baseUrl}/${eventsUrl}`
  const headers: Record<string, string> = {
	  ...options.headers ?? {},
    Accept: 'text/event-stream'
  }
  if(options.authorization) {
    headers['authorization'] = `Bearer ${options?.authorization}`;
  }
  const validator = UserSignedUp.createValidator();
	fetchEventSource(`${url}`, {
		method: 'GET',
		headers,
		signal: controller.signal,
		onmessage: (ev: EventSourceMessage) => {
      const receivedData = ev.data;
      if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return callback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined);
    }
  }
      const callbackData = UserSignedUp.unmarshal(receivedData);
			callback(undefined, callbackData);
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
				callback(new Error('Client side error, could not open event connection'))
			} else {
				callback(new Error('Unknown error, could not open event connection'));
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
 * @param options additionally used to handle the event source
 * @param skipMessageValidation turn off runtime validation of incoming messages
 * @returns A cleanup function to abort the connection
 */
listenForNoParameter: ({
  callback, 
  options, 
  skipMessageValidation = false
}: {
  callback: (error?: Error, messageEvent?: UserSignedUp) => void, 
  options: {authorization?: string, onClose?: (err?: string) => void, baseUrl: string, headers?: Record<string, string>}, 
  skipMessageValidation?: boolean
}): (() => void) => {
	const controller = new AbortController();
	let eventsUrl: string = 'noparameters';
	const url = `${options.baseUrl}/${eventsUrl}`
  const headers: Record<string, string> = {
	  ...options.headers ?? {},
    Accept: 'text/event-stream'
  }
  if(options.authorization) {
    headers['authorization'] = `Bearer ${options?.authorization}`;
  }
  const validator = UserSignedUp.createValidator();
	fetchEventSource(`${url}`, {
		method: 'GET',
		headers,
		signal: controller.signal,
		onmessage: (ev: EventSourceMessage) => {
      const receivedData = ev.data;
      if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return callback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined);
    }
  }
      const callbackData = UserSignedUp.unmarshal(receivedData);
			callback(undefined, callbackData);
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
				callback(new Error('Client side error, could not open event connection'))
			} else {
				callback(new Error('Unknown error, could not open event connection'));
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
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish exchange operation
 */
publishToSendUserSignedupExchange: ({
  message, 
  parameters, 
  amqp, 
  options
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParameters, 
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
channel.publish(exchange, routingKey, Buffer.from(dataToSend), options);
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
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish queue operation
 */
publishToSendUserSignedupQueue: ({
  message, 
  parameters, 
  amqp, 
  options
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParameters, 
  amqp: Amqp.Connection, 
  options?: Amqp.Options.Publish
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
const channel = await amqp.createChannel();
const queue = parameters.getChannelWithParameters('user/signedup/{my_parameter}/{enum_parameter}');
channel.sendToQueue(queue, Buffer.from(dataToSend), options);
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
  onDataCallback: (err?: Error, msg?: UserSignedUp, amqpMsg?: Amqp.ConsumeMessage) => void, 
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
    if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received ${JSON.stringify({cause: errors})}`), undefined, msg); return;
    }
  }
    const message = UserSignedUp.unmarshal(receivedData);
    onDataCallback(undefined, message, msg);
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
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish exchange operation
 */
publishToNoParameterExchange: ({
  message, 
  amqp, 
  options
}: {
  message: UserSignedUp, 
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
channel.publish(exchange, routingKey, Buffer.from(dataToSend), options);
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
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish queue operation
 */
publishToNoParameterQueue: ({
  message, 
  amqp, 
  options
}: {
  message: UserSignedUp, 
  amqp: Amqp.Connection, 
  options?: Amqp.Options.Publish
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
const channel = await amqp.createChannel();
const queue = 'noparameters';
channel.sendToQueue(queue, Buffer.from(dataToSend), options);
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
  onDataCallback: (err?: Error, msg?: UserSignedUp, amqpMsg?: Amqp.ConsumeMessage) => void, 
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
    if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received ${JSON.stringify({cause: errors})}`), undefined, msg); return;
    }
  }
    const message = UserSignedUp.unmarshal(receivedData);
    onDataCallback(undefined, message, msg);
  }
}, options);
      resolve(channel);
    } catch (e: any) {
      reject(e);
    }
  });
}
}};