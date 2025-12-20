import {Pong} from './../payloads/Pong';
import {Ping} from './../payloads/Ping';
import * as MultiStatusResponseReplyPayloadModule from './../payloads/MultiStatusResponseReplyPayload';
import * as PingPayloadModule from './../payloads/PingPayload';
import {NotFound} from './../payloads/NotFound';
import * as Nats from 'nats';

export /**
 * Core request for `ping`
 *
  * @param requestMessage the message to send
 * @param nc the nats client to setup the request for
 * @param codec the serialization codec to use when transmitting request and receiving reply
 * @param options when sending the request
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function requestToRegularRequest({
  requestMessage, 
  nc, 
  codec = Nats.JSONCodec(), 
  options, 
  skipMessageValidation = false
}: {
  requestMessage: Ping, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.RequestOptions, 
  skipMessageValidation?: boolean
}): Promise<Pong> {
  return new Promise(async (resolve, reject) => {
    try {
      const validator = Pong.createValidator();
      let dataToSend: any = requestMessage.marshal();
      dataToSend = codec.encode(dataToSend);

      const msg = await nc.request('ping', dataToSend, options);
      const receivedData: any = codec.decode(msg.data);
      if(!skipMessageValidation) {
    const {valid, errors} = Pong.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return reject(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`));
    }
  }
      resolve(Pong.unmarshal(receivedData));
    } catch (e: any) {
      reject(e);
    }
  });
}

export /**
 * Callback for when receiving the request
 *
 * @callback replyToRegularReplyCallback
  * @param err if any error occurred this will be sat
 * @param requestMessage that was received from the request
 */

/**
 * Reply for `ping`
 *
  * @param {replyToRegularReplyCallback} onDataCallback to call when the request is received
 * @param nc the nats client to setup the reply for
 * @param codec the serialization codec to use when receiving request and transmitting reply
 * @param options when setting up the reply
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function replyToRegularReply({
  onDataCallback, 
  nc, 
  codec = Nats.JSONCodec(), 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, requestMessage?: Pong) => Ping | Promise<Ping>, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.SubscriptionOptions, 
  skipMessageValidation?: boolean
}): Promise<Nats.Subscription> {
  return new Promise(async (resolve, reject) => {
    try {
      let subscription = nc.subscribe('ping', options);
      const validator = Pong.createValidator();
      (async () => {
        for await (const msg of subscription) {
          

          let receivedData : any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = Pong.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error('Invalid request payload received', JSON.stringify({cause: errors})), undefined); continue;
    }
  }
const replyMessage = await onDataCallback(undefined, Pong.unmarshal(receivedData) );

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
