import {UserSignedUp} from './payload/UserSignedUp';
import {AdminAlert} from './payload/AdminAlert';
import {SystemPing} from './payload/SystemPing';
import {UserSignedupParameters, UserSignedupParametersInterface} from './parameter/UserSignedupParameters';
import * as Nats from 'nats';

/**
 * Publish a user signup event
 *
 * @param message to publish
 * @param parameters for topic substitution
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function publishToSendUserSignedup({
  message, 
  parameters, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParametersInterface | UserSignedupParameters, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      
dataToSend = codec.encode(dataToSend);
nc.publish((parameters instanceof UserSignedupParameters ? parameters : new UserSignedupParameters(parameters)).getChannelWithParameters('user.signedup.{id}'), dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Publish a user signup event
 *
 * @param message to publish over jetstream
 * @param parameters for topic substitution
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function jetStreamPublishToSendUserSignedup({
  message, 
  parameters, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: UserSignedUp, 
  parameters: UserSignedupParametersInterface | UserSignedupParameters, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      
dataToSend = codec.encode(dataToSend);
await js.publish((parameters instanceof UserSignedupParameters ? parameters : new UserSignedupParameters(parameters)).getChannelWithParameters('user.signedup.{id}'), dataToSend, options);
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
 * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param natsMsg
 */

/**
 * Consume a user signup event
 *
 * @param {subscribeToReceiveUserSignedupCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param nc the nats client to setup the subscribe for
 * @param codec the serialization codec to use while receiving the message
 * @param options when setting up the subscription
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveUserSignedup({
  onDataCallback, 
  parameters, 
  nc, 
  codec = Nats.JSONCodec(), 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, natsMsg?: Nats.Msg) => void, 
  parameters: UserSignedupParametersInterface | UserSignedupParameters, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.SubscriptionOptions, 
  skipMessageValidation?: boolean
}): Promise<Nats.Subscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = nc.subscribe((parameters instanceof UserSignedupParameters ? parameters : new UserSignedupParameters(parameters)).getChannelWithParameters('user.signedup.{id}'), options);
      const validator = UserSignedUp.createValidator();
      (async () => {
        for await (const msg of subscription) {
          const parameters = UserSignedupParameters.createFromChannel(msg.subject, 'user.signedup.{id}', /^user.signedup.([^.]*)$/)
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined,parameters,  msg); continue;
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
}

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
 * Consume a user signup event
 *
 * @param {jetStreamPullSubscribeToReceiveUserSignedupCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function jetStreamPullSubscribeToReceiveUserSignedup({
  onDataCallback, 
  parameters, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, jetstreamMsg?: Nats.JsMsg) => void, 
  parameters: UserSignedupParametersInterface | UserSignedupParameters, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamPullSubscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.pullSubscribe((parameters instanceof UserSignedupParameters ? parameters : new UserSignedupParameters(parameters)).getChannelWithParameters('user.signedup.{id}'), options);
      const validator = UserSignedUp.createValidator();
      (async () => {
        for await (const msg of subscription) {
          const parameters = UserSignedupParameters.createFromChannel(msg.subject, 'user.signedup.{id}', /^user.signedup.([^.]*)$/)
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined,parameters,  msg); continue;
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
}

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
 * Consume a user signup event
 *
 * @param {jetStreamPushSubscriptionFromReceiveUserSignedupCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function jetStreamPushSubscriptionFromReceiveUserSignedup({
  onDataCallback, 
  parameters, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, jetstreamMsg?: Nats.JsMsg) => void, 
  parameters: UserSignedupParametersInterface | UserSignedupParameters, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamSubscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.subscribe((parameters instanceof UserSignedupParameters ? parameters : new UserSignedupParameters(parameters)).getChannelWithParameters('user.signedup.{id}'), options);
      const validator = UserSignedUp.createValidator();
      (async () => {
        for await (const msg of subscription) {
          const parameters = UserSignedupParameters.createFromChannel(msg.subject, 'user.signedup.{id}', /^user.signedup.([^.]*)$/)
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = UserSignedUp.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined,parameters,  msg); continue;
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
}

/**
 * Publish an admin alert
 *
 * @param message to publish
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function publishToSendAdminAlert({
  message, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: AdminAlert, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      
dataToSend = codec.encode(dataToSend);
nc.publish('admin.alert', dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Publish an admin alert
 *
 * @param message to publish over jetstream
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function jetStreamPublishToSendAdminAlert({
  message, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: AdminAlert, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      
dataToSend = codec.encode(dataToSend);
await js.publish('admin.alert', dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Publish a system ping (intentionally untagged)
 *
 * @param message to publish
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function publishToSendSystemPing({
  message, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: SystemPing, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      
dataToSend = codec.encode(dataToSend);
nc.publish('system.ping', dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Publish a system ping (intentionally untagged)
 *
 * @param message to publish over jetstream
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function jetStreamPublishToSendSystemPing({
  message, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: SystemPing, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = message.marshal();
      
dataToSend = codec.encode(dataToSend);
await js.publish('system.ping', dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

export { publishToSendUserSignedup, jetStreamPublishToSendUserSignedup, subscribeToReceiveUserSignedup, jetStreamPullSubscribeToReceiveUserSignedup, jetStreamPushSubscriptionFromReceiveUserSignedup, publishToSendAdminAlert, jetStreamPublishToSendAdminAlert, publishToSendSystemPing, jetStreamPublishToSendSystemPing };
