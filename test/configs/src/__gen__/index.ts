import * as PingPayloadModule from './../../../../src/__gen__/payload/PingPayload';
import {Pong} from './../../../../src/__gen__/payload/Pong';
import {Ping} from './../../../../src/__gen__/payload/Ping';
import * as Nats from 'nats';
export const Protocols = {
nats: {
  /**
 * Callback for when receiving messages
 *
 * @callback subscribeToPingCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param natsMsg
 */

/**
 * Core subscription for `ping`
 * 
  * @param {subscribeToPingCallback} onDataCallback to call when messages are received
 * @param nc the NATS client to subscribe through
 * @param codec the serialization codec to use while receiving the message
 * @param options when setting up the subscription
 */
subscribeToPing: (
  onDataCallback: (err?: Error, msg?: PingPayloadModule.PingPayload, natsMsg?: Nats.Msg) => void, nc: Nats.NatsConnection, codec: any = Nats.JSONCodec(), options?: Nats.SubscriptionOptions
): Promise<Nats.Subscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = nc.subscribe('ping', options);

      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
onDataCallback(undefined, PingPayloadModule.unmarshal(receivedData), msg);
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
 * @callback jetStreamPullSubscribeToPingCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param jetstreamMsg
 */

/**
 * JetStream pull subscription for `ping`
 * 
  * @param {jetStreamPullSubscribeToPingCallback} onDataCallback to call when messages are received
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while receiving the message
 */
jetStreamPullSubscribeToPing: (
  onDataCallback: (err?: Error, msg?: PingPayloadModule.PingPayload, jetstreamMsg?: Nats.JsMsg) => void, js: Nats.JetStreamClient, options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, codec: any = Nats.JSONCodec()
): Promise<Nats.JetStreamPullSubscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.pullSubscribe('ping', options);

      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
onDataCallback(undefined, PingPayloadModule.unmarshal(receivedData), msg);
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
 * @callback jetStreamPushSubscriptionFromPingCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param jetstreamMsg
 */

/**
 * JetStream push subscription for `ping`
 * 
  * @param {jetStreamPushSubscriptionFromPingCallback} onDataCallback to call when messages are received
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while receiving the message
 */
jetStreamPushSubscriptionFromPing: (
  onDataCallback: (err?: Error, msg?: PingPayloadModule.PingPayload, jetstreamMsg?: Nats.JsMsg) => void, js: Nats.JetStreamClient, options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, codec: any = Nats.JSONCodec()
): Promise<Nats.JetStreamSubscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.subscribe('ping', options);

      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
onDataCallback(undefined, PingPayloadModule.unmarshal(receivedData), msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
},
/**
 * Callback for when receiving the request
 *
 * @callback replyToPingCallback
  * @param err if any error occurred this will be sat
 * @param requestMessage that was received from the request
 */

/**
 * Reply for `ping`
 * 
  * @param {replyToPingCallback} onDataCallback to call when the request is received
 * @param nc the nats client to setup the reply for
 * @param codec the serialization codec to use when receiving and transmitting reply
 * @param options when setting up the reply
 */
replyToPing: (
  onDataCallback: (err?: Error, requestMessage?: PingPayloadModule.PingPayload) => Pong | Promise<Pong>, 
  nc: Nats.NatsConnection, 
  codec: any = Nats.JSONCodec(), 
  options?: Nats.SubscriptionOptions
): Promise<Nats.Subscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      let subscription = nc.subscribe('ping', options);
      (async () => {
        for await (const msg of subscription) {
          

          let receivedData : any = codec.decode(msg.data);
const replyMessage = await onDataCallback(undefined, PingPayloadModule.unmarshal(receivedData) );

          if (msg.reply) {
            let dataToSend : any = replyMessage.marshal();
dataToSend = codec.encode(dataToSend);
msg.respond(dataToSend);
          } else {
            onDataCallback(new Error('Expected request to need a reply, did not..'))
          }
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
}
}};