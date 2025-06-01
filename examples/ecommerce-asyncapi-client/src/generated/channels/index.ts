import {OrderCreated} from './payload/OrderCreated';
import {OrderUpdated} from './payload/OrderUpdated';
import {OrderCancelled} from './payload/OrderCancelled';
import * as OrderEventsPayloadModule from './payload/OrderEventsPayload';
import * as OrderLifecyclePayloadModule from './payload/OrderLifecyclePayload';
import {OrderItem} from './payload/OrderItem';
import {Money} from './payload/Money';
import {Currency} from './payload/Currency';
import {Address} from './payload/Address';
import {OrderStatus} from './payload/OrderStatus';
import {OrderLifecycleParameters} from './parameter/OrderLifecycleParameters';
import * as Nats from 'nats';
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
publishToOrderCreated: ({
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
jetStreamPublishToOrderCreated: ({
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
publishToOrderUpdated: ({
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
jetStreamPublishToOrderUpdated: ({
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
publishToOrderCancelled: ({
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
jetStreamPublishToOrderCancelled: ({
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
 * @callback subscribeToOrderEventsCallback
 * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param natsMsg
 */

/**
 * Core subscription for `orders.{action}`
 * 
 * @param {subscribeToOrderEventsCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param nc the nats client to setup the subscribe for
 * @param codec the serialization codec to use while receiving the message
 * @param options when setting up the subscription
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
subscribeToOrderEvents: ({
  onDataCallback, 
  parameters, 
  nc, 
  codec = Nats.JSONCodec(), 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: OrderEventsPayloadModule.OrderEventsPayload, parameters?: OrderLifecycleParameters, natsMsg?: Nats.Msg) => void, 
  parameters: OrderLifecycleParameters, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.SubscriptionOptions, 
  skipMessageValidation?: boolean
}): Promise<Nats.Subscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = nc.subscribe(parameters.getChannelWithParameters('orders.{action}'), options);
      const validator = OrderEventsPayloadModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          const parameters = OrderLifecycleParameters.createFromChannel(msg.subject, 'orders.{action}', /^orders.([^.]*)$/)
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = OrderEventsPayloadModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, msg); continue;
    }
  }
onDataCallback(undefined, OrderEventsPayloadModule.unmarshal(receivedData), parameters, msg);
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
 * @callback jetStreamPullSubscribeToOrderEventsCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param jetstreamMsg
 */

/**
 * JetStream pull subscription for `orders.{action}`
 * 
  * @param {jetStreamPullSubscribeToOrderEventsCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
jetStreamPullSubscribeToOrderEvents: ({
  onDataCallback, 
  parameters, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: OrderEventsPayloadModule.OrderEventsPayload, parameters?: OrderLifecycleParameters, jetstreamMsg?: Nats.JsMsg) => void, 
  parameters: OrderLifecycleParameters, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamPullSubscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.pullSubscribe(parameters.getChannelWithParameters('orders.{action}'), options);
      const validator = OrderEventsPayloadModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          const parameters = OrderLifecycleParameters.createFromChannel(msg.subject, 'orders.{action}', /^orders.([^.]*)$/)
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = OrderEventsPayloadModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, msg); continue;
    }
  }
onDataCallback(undefined, OrderEventsPayloadModule.unmarshal(receivedData), parameters, msg);
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
 * @callback jetStreamPushSubscriptionFromOrderEventsCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param jetstreamMsg
 */

/**
 * JetStream push subscription for `orders.{action}`
 * 
  * @param {jetStreamPushSubscriptionFromOrderEventsCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
jetStreamPushSubscriptionFromOrderEvents: ({
  onDataCallback, 
  parameters, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: OrderEventsPayloadModule.OrderEventsPayload, parameters?: OrderLifecycleParameters, jetstreamMsg?: Nats.JsMsg) => void, 
  parameters: OrderLifecycleParameters, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamSubscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.subscribe(parameters.getChannelWithParameters('orders.{action}'), options);
      const validator = OrderEventsPayloadModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          const parameters = OrderLifecycleParameters.createFromChannel(msg.subject, 'orders.{action}', /^orders.([^.]*)$/)
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = OrderEventsPayloadModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, msg); continue;
    }
  }
onDataCallback(undefined, OrderEventsPayloadModule.unmarshal(receivedData), parameters, msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
}
}};