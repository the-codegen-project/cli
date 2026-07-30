import {OrderCreated, OrderCreatedInterface} from './payload/OrderCreated';
import {OrderUpdated, OrderUpdatedInterface} from './payload/OrderUpdated';
import {OrderCancelled, OrderCancelledInterface} from './payload/OrderCancelled';
import * as OrderEventsPayloadModule from './payload/OrderEventsPayload';
import * as OrderLifecyclePayloadModule from './payload/OrderLifecyclePayload';
import {OrderItem, OrderItemInterface} from './payload/OrderItem';
import {Money, MoneyInterface} from './payload/Money';
import {Currency} from './payload/Currency';
import {Address, AddressInterface} from './payload/Address';
import {OrderStatus} from './payload/OrderStatus';
import {OrderLifecycleParameters, OrderLifecycleParametersInterface} from './parameter/OrderLifecycleParameters';
import * as OrderLifecycleHeadersModule from './headers/OrderLifecycleHeaders';
import * as Nats from 'nats';

/**
 * NATS publish operation for `orders.{action}`
 *
 * @param message to publish
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function publishToOrderCreated({
  message, 
  parameters, 
  headers, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: OrderCreatedInterface | OrderCreated, 
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters, 
  headers?: OrderLifecycleHeadersModule.OrderLifecycleHeaders, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = (message instanceof OrderCreated ? message : new OrderCreated(message)).marshal();
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
nc.publish((parameters instanceof OrderLifecycleParameters ? parameters : new OrderLifecycleParameters(parameters)).getChannelWithParameters('orders.{action}'), dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * JetStream publish operation for `orders.{action}`
 *
 * @param message to publish over jetstream
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function jetStreamPublishToOrderCreated({
  message, 
  parameters, 
  headers, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: OrderCreatedInterface | OrderCreated, 
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters, 
  headers?: OrderLifecycleHeadersModule.OrderLifecycleHeaders, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = (message instanceof OrderCreated ? message : new OrderCreated(message)).marshal();
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
await js.publish((parameters instanceof OrderLifecycleParameters ? parameters : new OrderLifecycleParameters(parameters)).getChannelWithParameters('orders.{action}'), dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * NATS publish operation for `orders.{action}`
 *
 * @param message to publish
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function publishToOrderUpdated({
  message, 
  parameters, 
  headers, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: OrderUpdatedInterface | OrderUpdated, 
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters, 
  headers?: OrderLifecycleHeadersModule.OrderLifecycleHeaders, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = (message instanceof OrderUpdated ? message : new OrderUpdated(message)).marshal();
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
nc.publish((parameters instanceof OrderLifecycleParameters ? parameters : new OrderLifecycleParameters(parameters)).getChannelWithParameters('orders.{action}'), dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * JetStream publish operation for `orders.{action}`
 *
 * @param message to publish over jetstream
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function jetStreamPublishToOrderUpdated({
  message, 
  parameters, 
  headers, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: OrderUpdatedInterface | OrderUpdated, 
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters, 
  headers?: OrderLifecycleHeadersModule.OrderLifecycleHeaders, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = (message instanceof OrderUpdated ? message : new OrderUpdated(message)).marshal();
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
await js.publish((parameters instanceof OrderLifecycleParameters ? parameters : new OrderLifecycleParameters(parameters)).getChannelWithParameters('orders.{action}'), dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * NATS publish operation for `orders.{action}`
 *
 * @param message to publish
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function publishToOrderCancelled({
  message, 
  parameters, 
  headers, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: OrderCancelledInterface | OrderCancelled, 
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters, 
  headers?: OrderLifecycleHeadersModule.OrderLifecycleHeaders, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = (message instanceof OrderCancelled ? message : new OrderCancelled(message)).marshal();
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
nc.publish((parameters instanceof OrderLifecycleParameters ? parameters : new OrderLifecycleParameters(parameters)).getChannelWithParameters('orders.{action}'), dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * JetStream publish operation for `orders.{action}`
 *
 * @param message to publish over jetstream
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function jetStreamPublishToOrderCancelled({
  message, 
  parameters, 
  headers, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: OrderCancelledInterface | OrderCancelled, 
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters, 
  headers?: OrderLifecycleHeadersModule.OrderLifecycleHeaders, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = (message instanceof OrderCancelled ? message : new OrderCancelled(message)).marshal();
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
await js.publish((parameters instanceof OrderLifecycleParameters ? parameters : new OrderLifecycleParameters(parameters)).getChannelWithParameters('orders.{action}'), dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback subscribeToOrderEventsCallback
 * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param headers that were received with the message
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
function subscribeToOrderEvents({
  onDataCallback, 
  parameters, 
  nc, 
  codec = Nats.JSONCodec(), 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: OrderEventsPayloadModule.OrderEventsPayload, parameters?: OrderLifecycleParameters, headers?: OrderLifecycleHeadersModule.OrderLifecycleHeaders, natsMsg?: Nats.Msg) => void, 
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.SubscriptionOptions, 
  skipMessageValidation?: boolean
}): Promise<Nats.Subscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = nc.subscribe((parameters instanceof OrderLifecycleParameters ? parameters : new OrderLifecycleParameters(parameters)).getChannelWithParameters('orders.{action}'), options);
      const validator = OrderEventsPayloadModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          const parameters = OrderLifecycleParameters.createFromChannel(msg.subject, 'orders.{action}', /^orders.([^.]*)$/)
          let receivedData: any = codec.decode(msg.data);
// Extract headers if present
          let extractedHeaders: OrderLifecycleHeadersModule.OrderLifecycleHeaders | undefined = undefined;
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
            extractedHeaders = OrderLifecycleHeadersModule.unmarshal(headerObj);
          }
if(!skipMessageValidation) {
    const {valid, errors} = OrderEventsPayloadModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined,parameters, extractedHeaders,  msg); continue;
    }
  }
onDataCallback(undefined, OrderEventsPayloadModule.unmarshal(receivedData), parameters, extractedHeaders, msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback jetStreamPullSubscribeToOrderEventsCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param headers that was received with the message
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
function jetStreamPullSubscribeToOrderEvents({
  onDataCallback, 
  parameters, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: OrderEventsPayloadModule.OrderEventsPayload, parameters?: OrderLifecycleParameters, headers?: OrderLifecycleHeadersModule.OrderLifecycleHeaders, jetstreamMsg?: Nats.JsMsg) => void, 
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamPullSubscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.pullSubscribe((parameters instanceof OrderLifecycleParameters ? parameters : new OrderLifecycleParameters(parameters)).getChannelWithParameters('orders.{action}'), options);
      const validator = OrderEventsPayloadModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          const parameters = OrderLifecycleParameters.createFromChannel(msg.subject, 'orders.{action}', /^orders.([^.]*)$/)
          let receivedData: any = codec.decode(msg.data);
// Extract headers if present
          let extractedHeaders: OrderLifecycleHeadersModule.OrderLifecycleHeaders | undefined = undefined;
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
            extractedHeaders = OrderLifecycleHeadersModule.unmarshal(headerObj);
          }
if(!skipMessageValidation) {
    const {valid, errors} = OrderEventsPayloadModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined,parameters, extractedHeaders,  msg); continue;
    }
  }
onDataCallback(undefined, OrderEventsPayloadModule.unmarshal(receivedData), parameters, extractedHeaders, msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback jetStreamPushSubscriptionFromOrderEventsCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param headers that was received with the message
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
function jetStreamPushSubscriptionFromOrderEvents({
  onDataCallback, 
  parameters, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: OrderEventsPayloadModule.OrderEventsPayload, parameters?: OrderLifecycleParameters, headers?: OrderLifecycleHeadersModule.OrderLifecycleHeaders, jetstreamMsg?: Nats.JsMsg) => void, 
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamSubscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.subscribe((parameters instanceof OrderLifecycleParameters ? parameters : new OrderLifecycleParameters(parameters)).getChannelWithParameters('orders.{action}'), options);
      const validator = OrderEventsPayloadModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          const parameters = OrderLifecycleParameters.createFromChannel(msg.subject, 'orders.{action}', /^orders.([^.]*)$/)
          let receivedData: any = codec.decode(msg.data);
// Extract headers if present
          let extractedHeaders: OrderLifecycleHeadersModule.OrderLifecycleHeaders | undefined = undefined;
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
            extractedHeaders = OrderLifecycleHeadersModule.unmarshal(headerObj);
          }
if(!skipMessageValidation) {
    const {valid, errors} = OrderEventsPayloadModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined,parameters, extractedHeaders,  msg); continue;
    }
  }
onDataCallback(undefined, OrderEventsPayloadModule.unmarshal(receivedData), parameters, extractedHeaders, msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
}

export { publishToOrderCreated, jetStreamPublishToOrderCreated, publishToOrderUpdated, jetStreamPublishToOrderUpdated, publishToOrderCancelled, jetStreamPublishToOrderCancelled, subscribeToOrderEvents, jetStreamPullSubscribeToOrderEvents, jetStreamPushSubscriptionFromOrderEvents };
