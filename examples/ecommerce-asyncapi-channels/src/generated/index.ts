import {OrderCreated} from './payload/OrderCreated';
import {OrderUpdated} from './payload/OrderUpdated';
import {OrderCancelled} from './payload/OrderCancelled';
import * as SubscribeToOrderEventsPayloadModule from './payload/SubscribeToOrderEventsPayload';
import * as OrderLifecyclePayloadModule from './payload/OrderLifecyclePayload';
import {OrderItem} from './payload/OrderItem';
import {Money} from './payload/Money';
import {Currency} from './payload/Currency';
import {Address} from './payload/Address';
import {OrderStatus} from './payload/OrderStatus';
import {OrderLifecycleParameters} from './parameter/OrderLifecycleParameters';
import * as Nats from 'nats';
import * as Kafka from 'kafkajs';
export const Protocols = {
nats: {
  /**
 * NATS publish operation for `orders.{action}`
 * 
  * @param message to publish
 * @param parameters for topic substitution
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
publishToPublishOrderCreated: ({
  message, 
  parameters, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: OrderCreated, 
  parameters: OrderLifecycleParameters, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
dataToSend = codec.encode(dataToSend);
nc.publish(parameters.getChannelWithParameters('orders.{action}'), dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * JetStream publish operation for `orders.{action}`
 * 
  * @param message to publish over jetstream
 * @param parameters for topic substitution
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
jetStreamPublishToPublishOrderCreated: ({
  message, 
  parameters, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: OrderCreated, 
  parameters: OrderLifecycleParameters, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
dataToSend = codec.encode(dataToSend);
await js.publish(parameters.getChannelWithParameters('orders.{action}'), dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * NATS publish operation for `orders.{action}`
 * 
  * @param message to publish
 * @param parameters for topic substitution
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
publishToPublishOrderUpdated: ({
  message, 
  parameters, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: OrderUpdated, 
  parameters: OrderLifecycleParameters, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
dataToSend = codec.encode(dataToSend);
nc.publish(parameters.getChannelWithParameters('orders.{action}'), dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * JetStream publish operation for `orders.{action}`
 * 
  * @param message to publish over jetstream
 * @param parameters for topic substitution
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
jetStreamPublishToPublishOrderUpdated: ({
  message, 
  parameters, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: OrderUpdated, 
  parameters: OrderLifecycleParameters, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
dataToSend = codec.encode(dataToSend);
await js.publish(parameters.getChannelWithParameters('orders.{action}'), dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * NATS publish operation for `orders.{action}`
 * 
  * @param message to publish
 * @param parameters for topic substitution
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
publishToPublishOrderCancelled: ({
  message, 
  parameters, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: OrderCancelled, 
  parameters: OrderLifecycleParameters, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
dataToSend = codec.encode(dataToSend);
nc.publish(parameters.getChannelWithParameters('orders.{action}'), dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * JetStream publish operation for `orders.{action}`
 * 
  * @param message to publish over jetstream
 * @param parameters for topic substitution
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
jetStreamPublishToPublishOrderCancelled: ({
  message, 
  parameters, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: OrderCancelled, 
  parameters: OrderLifecycleParameters, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
dataToSend = codec.encode(dataToSend);
await js.publish(parameters.getChannelWithParameters('orders.{action}'), dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * Callback for when receiving messages
 *
 * @callback subscribeToSubscribeToOrderEventsCallback
 * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param natsMsg
 */

/**
 * Core subscription for `orders.{action}`
 * 
 * @param {subscribeToSubscribeToOrderEventsCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param nc the nats client to setup the subscribe for
 * @param codec the serialization codec to use while receiving the message
 * @param options when setting up the subscription
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
subscribeToSubscribeToOrderEvents: ({
  onDataCallback, 
  parameters, 
  nc, 
  codec = Nats.JSONCodec(), 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: SubscribeToOrderEventsPayloadModule.SubscribeToOrderEventsPayload, parameters?: OrderLifecycleParameters, natsMsg?: Nats.Msg) => void, 
  parameters: OrderLifecycleParameters, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.SubscriptionOptions, 
  skipMessageValidation?: boolean
}): Promise<Nats.Subscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = nc.subscribe(parameters.getChannelWithParameters('orders.{action}'), options);
      const validator = SubscribeToOrderEventsPayloadModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          const parameters = OrderLifecycleParameters.createFromChannel(msg.subject, 'orders.{action}', /^orders.([^.]*)$/)
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = SubscribeToOrderEventsPayloadModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, msg); continue;
    }
  }
onDataCallback(undefined, SubscribeToOrderEventsPayloadModule.unmarshal(receivedData), parameters, msg);
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
 * @callback jetStreamPullSubscribeToSubscribeToOrderEventsCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param jetstreamMsg
 */

/**
 * JetStream pull subscription for `orders.{action}`
 * 
  * @param {jetStreamPullSubscribeToSubscribeToOrderEventsCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
jetStreamPullSubscribeToSubscribeToOrderEvents: ({
  onDataCallback, 
  parameters, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: SubscribeToOrderEventsPayloadModule.SubscribeToOrderEventsPayload, parameters?: OrderLifecycleParameters, jetstreamMsg?: Nats.JsMsg) => void, 
  parameters: OrderLifecycleParameters, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamPullSubscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.pullSubscribe(parameters.getChannelWithParameters('orders.{action}'), options);
      const validator = SubscribeToOrderEventsPayloadModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          const parameters = OrderLifecycleParameters.createFromChannel(msg.subject, 'orders.{action}', /^orders.([^.]*)$/)
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = SubscribeToOrderEventsPayloadModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, msg); continue;
    }
  }
onDataCallback(undefined, SubscribeToOrderEventsPayloadModule.unmarshal(receivedData), parameters, msg);
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
 * @callback jetStreamPushSubscriptionFromSubscribeToOrderEventsCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param jetstreamMsg
 */

/**
 * JetStream push subscription for `orders.{action}`
 * 
  * @param {jetStreamPushSubscriptionFromSubscribeToOrderEventsCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
jetStreamPushSubscriptionFromSubscribeToOrderEvents: ({
  onDataCallback, 
  parameters, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: SubscribeToOrderEventsPayloadModule.SubscribeToOrderEventsPayload, parameters?: OrderLifecycleParameters, jetstreamMsg?: Nats.JsMsg) => void, 
  parameters: OrderLifecycleParameters, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamSubscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.subscribe(parameters.getChannelWithParameters('orders.{action}'), options);
      const validator = SubscribeToOrderEventsPayloadModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          const parameters = OrderLifecycleParameters.createFromChannel(msg.subject, 'orders.{action}', /^orders.([^.]*)$/)
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = SubscribeToOrderEventsPayloadModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, msg); continue;
    }
  }
onDataCallback(undefined, SubscribeToOrderEventsPayloadModule.unmarshal(receivedData), parameters, msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
}
},
kafka: {
  /**
 * Kafka publish operation for `orders.{action}`
 * 
  * @param message to publish
 * @param parameters for topic substitution
 * @param kafka the KafkaJS client to publish from
 */
produceToPublishOrderCreated: ({
  message, 
  parameters, 
  kafka
}: {
  message: OrderCreated, 
  parameters: OrderLifecycleParameters, 
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> => {
  return new Promise(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      const producer = kafka.producer();
      await producer.connect();
      await producer.send({
        topic: parameters.getChannelWithParameters('orders.{action}'),
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
 * Kafka publish operation for `orders.{action}`
 * 
  * @param message to publish
 * @param parameters for topic substitution
 * @param kafka the KafkaJS client to publish from
 */
produceToPublishOrderUpdated: ({
  message, 
  parameters, 
  kafka
}: {
  message: OrderUpdated, 
  parameters: OrderLifecycleParameters, 
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> => {
  return new Promise(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      const producer = kafka.producer();
      await producer.connect();
      await producer.send({
        topic: parameters.getChannelWithParameters('orders.{action}'),
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
 * Kafka publish operation for `orders.{action}`
 * 
  * @param message to publish
 * @param parameters for topic substitution
 * @param kafka the KafkaJS client to publish from
 */
produceToPublishOrderCancelled: ({
  message, 
  parameters, 
  kafka
}: {
  message: OrderCancelled, 
  parameters: OrderLifecycleParameters, 
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> => {
  return new Promise(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      const producer = kafka.producer();
      await producer.connect();
      await producer.send({
        topic: parameters.getChannelWithParameters('orders.{action}'),
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
 * @callback consumeFromSubscribeToOrderEventsCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param kafkaMsg
 */

/**
 * Kafka subscription for `orders.{action}`
 * 
  * @param {consumeFromSubscribeToOrderEventsCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param kafka the KafkaJS client to subscribe through
 * @param options when setting up the subscription
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
consumeFromSubscribeToOrderEvents: ({
  onDataCallback, 
  parameters, 
  kafka, 
  options = {fromBeginning: true, groupId: ''}, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: SubscribeToOrderEventsPayloadModule.SubscribeToOrderEventsPayload, parameters?: OrderLifecycleParameters, kafkaMsg?: Kafka.EachMessagePayload) => void, 
  parameters: OrderLifecycleParameters, 
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

      const validator = SubscribeToOrderEventsPayloadModule.createValidator();
      await consumer.connect();
      await consumer.subscribe({ topic: parameters.getChannelWithParameters('orders.{action}'), fromBeginning: options.fromBeginning });
      await consumer.run({
        eachMessage: async (kafkaMessage: Kafka.EachMessagePayload) => {
          const { topic, message } = kafkaMessage;
          const receivedData = message.value?.toString()!;
          const parameters = OrderLifecycleParameters.createFromChannel(topic, 'orders.{action}', /^orders.([^.]*)$/);
          if(!skipMessageValidation) {
    const {valid, errors} = SubscribeToOrderEventsPayloadModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, kafkaMessage);
    }
  }
const callbackData = SubscribeToOrderEventsPayloadModule.unmarshal(receivedData);
onDataCallback(undefined, callbackData, parameters, kafkaMessage);
        }
      });
      resolve(consumer);
    } catch (e: any) {
      reject(e);
    }
  });
}
}};