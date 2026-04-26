import {EventCatalogPing} from './../payloads/EventCatalogPing';
import * as Nats from 'nats';

/**
 * NATS publish operation for `eventcatalog.ping`
 *
 * @param message to publish
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function publishToSendEventcatalogPing({
  message, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: EventCatalogPing, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      
dataToSend = codec.encode(dataToSend);
nc.publish('eventcatalog.ping', dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * JetStream publish operation for `eventcatalog.ping`
 *
 * @param message to publish over jetstream
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function jetStreamPublishToSendEventcatalogPing({
  message, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: EventCatalogPing, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      
dataToSend = codec.encode(dataToSend);
await js.publish('eventcatalog.ping', dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback subscribeToReceiveEventcatalogPingCallback
 * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param natsMsg
 */

/**
 * Core subscription for `eventcatalog.ping`
 *
 * @param {subscribeToReceiveEventcatalogPingCallback} onDataCallback to call when messages are received
 * @param nc the nats client to setup the subscribe for
 * @param codec the serialization codec to use while receiving the message
 * @param options when setting up the subscription
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveEventcatalogPing({
  onDataCallback, 
  nc, 
  codec = Nats.JSONCodec(), 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: EventCatalogPing, natsMsg?: Nats.Msg) => void, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.SubscriptionOptions, 
  skipMessageValidation?: boolean
}): Promise<Nats.Subscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = nc.subscribe('eventcatalog.ping', options);
      const validator = EventCatalogPing.createValidator();
      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = EventCatalogPing.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, EventCatalogPing.unmarshal(receivedData), msg);
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
 * @callback jetStreamPullSubscribeToReceiveEventcatalogPingCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param jetstreamMsg
 */

/**
 * JetStream pull subscription for `eventcatalog.ping`
 *
 * @param {jetStreamPullSubscribeToReceiveEventcatalogPingCallback} onDataCallback to call when messages are received
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function jetStreamPullSubscribeToReceiveEventcatalogPing({
  onDataCallback, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: EventCatalogPing, jetstreamMsg?: Nats.JsMsg) => void, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamPullSubscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.pullSubscribe('eventcatalog.ping', options);
      const validator = EventCatalogPing.createValidator();
      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = EventCatalogPing.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, EventCatalogPing.unmarshal(receivedData), msg);
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
 * @callback jetStreamPushSubscriptionFromReceiveEventcatalogPingCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param jetstreamMsg
 */

/**
 * JetStream push subscription for `eventcatalog.ping`
 *
 * @param {jetStreamPushSubscriptionFromReceiveEventcatalogPingCallback} onDataCallback to call when messages are received
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function jetStreamPushSubscriptionFromReceiveEventcatalogPing({
  onDataCallback, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: EventCatalogPing, jetstreamMsg?: Nats.JsMsg) => void, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamSubscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.subscribe('eventcatalog.ping', options);
      const validator = EventCatalogPing.createValidator();
      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = EventCatalogPing.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, EventCatalogPing.unmarshal(receivedData), msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
}

export { publishToSendEventcatalogPing, jetStreamPublishToSendEventcatalogPing, subscribeToReceiveEventcatalogPing, jetStreamPullSubscribeToReceiveEventcatalogPing, jetStreamPushSubscriptionFromReceiveEventcatalogPing };
