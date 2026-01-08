import {UserSignedUp} from './../payloads/UserSignedUp';
import * as StringMessageModule from './../payloads/StringMessage';
import * as ArrayMessageModule from './../payloads/ArrayMessage';
import * as UnionMessageModule from './../payloads/UnionMessage';
import {AnonymousSchema_9} from './../payloads/AnonymousSchema_9';
import {UserSignedupParameters} from './../parameters/UserSignedupParameters';
import {UserSignedUpHeaders} from './../headers/UserSignedUpHeaders';
import * as Nats from 'nats';

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
function publishToSendUserSignedup({
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
}): Promise<void> {
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
}

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
function jetStreamPublishToSendUserSignedup({
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
}): Promise<void> {
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
}

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
function subscribeToReceiveUserSignedup({
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
}): Promise<Nats.Subscription> {
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
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined,parameters, extractedHeaders,  msg); continue;
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
}

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
function jetStreamPullSubscribeToReceiveUserSignedup({
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
}): Promise<Nats.JetStreamPullSubscription> {
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
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined,parameters, extractedHeaders,  msg); continue;
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
}

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
function jetStreamPushSubscriptionFromReceiveUserSignedup({
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
}): Promise<Nats.JetStreamSubscription> {
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
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined,parameters, extractedHeaders,  msg); continue;
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
}

/**
 * NATS publish operation for `noparameters`
 *
  * @param message to publish
 * @param headers optional headers to include with the message
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function publishToNoParameter({
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
}): Promise<void> {
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
}

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
function subscribeToNoParameter({
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
}): Promise<Nats.Subscription> {
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
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined,extractedHeaders,  msg); continue;
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
}

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
function jetStreamPullSubscribeToNoParameter({
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
}): Promise<Nats.JetStreamPullSubscription> {
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
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined,extractedHeaders,  msg); continue;
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
}

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
function jetStreamPushSubscriptionFromNoParameter({
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
}): Promise<Nats.JetStreamSubscription> {
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
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined,extractedHeaders,  msg); continue;
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
}

/**
 * JetStream publish operation for `noparameters`
 *
  * @param message to publish over jetstream
 * @param headers optional headers to include with the message
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function jetStreamPublishToNoParameter({
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
}): Promise<void> {
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

/**
 * NATS publish operation for `string.payload`
 *
  * @param message to publish
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function publishToSendStringPayload({
  message, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: StringMessageModule.StringMessage, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = StringMessageModule.marshal(message);
      
dataToSend = codec.encode(dataToSend);
nc.publish('string.payload', dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * JetStream publish operation for `string.payload`
 *
  * @param message to publish over jetstream
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function jetStreamPublishToSendStringPayload({
  message, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: StringMessageModule.StringMessage, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = StringMessageModule.marshal(message);
      
dataToSend = codec.encode(dataToSend);
await js.publish('string.payload', dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback subscribeToReceiveStringPayloadCallback
 * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param natsMsg
 */

/**
 * Core subscription for `string.payload`
 *
 * @param {subscribeToReceiveStringPayloadCallback} onDataCallback to call when messages are received
 * @param nc the nats client to setup the subscribe for
 * @param codec the serialization codec to use while receiving the message
 * @param options when setting up the subscription
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveStringPayload({
  onDataCallback, 
  nc, 
  codec = Nats.JSONCodec(), 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: StringMessageModule.StringMessage, natsMsg?: Nats.Msg) => void, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.SubscriptionOptions, 
  skipMessageValidation?: boolean
}): Promise<Nats.Subscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = nc.subscribe('string.payload', options);
      const validator = StringMessageModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = StringMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, StringMessageModule.unmarshal(receivedData), msg);
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
 * @callback jetStreamPullSubscribeToReceiveStringPayloadCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param jetstreamMsg
 */

/**
 * JetStream pull subscription for `string.payload`
 *
  * @param {jetStreamPullSubscribeToReceiveStringPayloadCallback} onDataCallback to call when messages are received
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function jetStreamPullSubscribeToReceiveStringPayload({
  onDataCallback, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: StringMessageModule.StringMessage, jetstreamMsg?: Nats.JsMsg) => void, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamPullSubscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.pullSubscribe('string.payload', options);
      const validator = StringMessageModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = StringMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, StringMessageModule.unmarshal(receivedData), msg);
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
 * @callback jetStreamPushSubscriptionFromReceiveStringPayloadCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param jetstreamMsg
 */

/**
 * JetStream push subscription for `string.payload`
 *
  * @param {jetStreamPushSubscriptionFromReceiveStringPayloadCallback} onDataCallback to call when messages are received
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function jetStreamPushSubscriptionFromReceiveStringPayload({
  onDataCallback, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: StringMessageModule.StringMessage, jetstreamMsg?: Nats.JsMsg) => void, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamSubscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.subscribe('string.payload', options);
      const validator = StringMessageModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = StringMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, StringMessageModule.unmarshal(receivedData), msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * NATS publish operation for `array.payload`
 *
  * @param message to publish
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function publishToSendArrayPayload({
  message, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: ArrayMessageModule.ArrayMessage, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = ArrayMessageModule.marshal(message);
      
dataToSend = codec.encode(dataToSend);
nc.publish('array.payload', dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * JetStream publish operation for `array.payload`
 *
  * @param message to publish over jetstream
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function jetStreamPublishToSendArrayPayload({
  message, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: ArrayMessageModule.ArrayMessage, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = ArrayMessageModule.marshal(message);
      
dataToSend = codec.encode(dataToSend);
await js.publish('array.payload', dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback subscribeToReceiveArrayPayloadCallback
 * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param natsMsg
 */

/**
 * Core subscription for `array.payload`
 *
 * @param {subscribeToReceiveArrayPayloadCallback} onDataCallback to call when messages are received
 * @param nc the nats client to setup the subscribe for
 * @param codec the serialization codec to use while receiving the message
 * @param options when setting up the subscription
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveArrayPayload({
  onDataCallback, 
  nc, 
  codec = Nats.JSONCodec(), 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: ArrayMessageModule.ArrayMessage, natsMsg?: Nats.Msg) => void, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.SubscriptionOptions, 
  skipMessageValidation?: boolean
}): Promise<Nats.Subscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = nc.subscribe('array.payload', options);
      const validator = ArrayMessageModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = ArrayMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, ArrayMessageModule.unmarshal(receivedData), msg);
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
 * @callback jetStreamPullSubscribeToReceiveArrayPayloadCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param jetstreamMsg
 */

/**
 * JetStream pull subscription for `array.payload`
 *
  * @param {jetStreamPullSubscribeToReceiveArrayPayloadCallback} onDataCallback to call when messages are received
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function jetStreamPullSubscribeToReceiveArrayPayload({
  onDataCallback, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: ArrayMessageModule.ArrayMessage, jetstreamMsg?: Nats.JsMsg) => void, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamPullSubscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.pullSubscribe('array.payload', options);
      const validator = ArrayMessageModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = ArrayMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, ArrayMessageModule.unmarshal(receivedData), msg);
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
 * @callback jetStreamPushSubscriptionFromReceiveArrayPayloadCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param jetstreamMsg
 */

/**
 * JetStream push subscription for `array.payload`
 *
  * @param {jetStreamPushSubscriptionFromReceiveArrayPayloadCallback} onDataCallback to call when messages are received
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function jetStreamPushSubscriptionFromReceiveArrayPayload({
  onDataCallback, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: ArrayMessageModule.ArrayMessage, jetstreamMsg?: Nats.JsMsg) => void, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamSubscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.subscribe('array.payload', options);
      const validator = ArrayMessageModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = ArrayMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, ArrayMessageModule.unmarshal(receivedData), msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * NATS publish operation for `union.payload`
 *
  * @param message to publish
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function publishToSendUnionPayload({
  message, 
  nc, 
  codec = Nats.JSONCodec(), 
  options
}: {
  message: UnionMessageModule.UnionMessage, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.PublishOptions
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = UnionMessageModule.marshal(message);
      
dataToSend = codec.encode(dataToSend);
nc.publish('union.payload', dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * JetStream publish operation for `union.payload`
 *
  * @param message to publish over jetstream
 * @param js the JetStream client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function jetStreamPublishToSendUnionPayload({
  message, 
  js, 
  codec = Nats.JSONCodec(), 
  options = {}
}: {
  message: UnionMessageModule.UnionMessage, 
  js: Nats.JetStreamClient, 
  codec?: Nats.Codec<any>, 
  options?: Partial<Nats.JetStreamPublishOptions>
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = UnionMessageModule.marshal(message);
      
dataToSend = codec.encode(dataToSend);
await js.publish('union.payload', dataToSend, options);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback subscribeToReceiveUnionPayloadCallback
 * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param natsMsg
 */

/**
 * Core subscription for `union.payload`
 *
 * @param {subscribeToReceiveUnionPayloadCallback} onDataCallback to call when messages are received
 * @param nc the nats client to setup the subscribe for
 * @param codec the serialization codec to use while receiving the message
 * @param options when setting up the subscription
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveUnionPayload({
  onDataCallback, 
  nc, 
  codec = Nats.JSONCodec(), 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UnionMessageModule.UnionMessage, natsMsg?: Nats.Msg) => void, 
  nc: Nats.NatsConnection, 
  codec?: Nats.Codec<any>, 
  options?: Nats.SubscriptionOptions, 
  skipMessageValidation?: boolean
}): Promise<Nats.Subscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = nc.subscribe('union.payload', options);
      const validator = UnionMessageModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = UnionMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, UnionMessageModule.unmarshal(receivedData), msg);
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
 * @callback jetStreamPullSubscribeToReceiveUnionPayloadCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param jetstreamMsg
 */

/**
 * JetStream pull subscription for `union.payload`
 *
  * @param {jetStreamPullSubscribeToReceiveUnionPayloadCallback} onDataCallback to call when messages are received
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function jetStreamPullSubscribeToReceiveUnionPayload({
  onDataCallback, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UnionMessageModule.UnionMessage, jetstreamMsg?: Nats.JsMsg) => void, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamPullSubscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.pullSubscribe('union.payload', options);
      const validator = UnionMessageModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = UnionMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, UnionMessageModule.unmarshal(receivedData), msg);
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
 * @callback jetStreamPushSubscriptionFromReceiveUnionPayloadCallback
  * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param jetstreamMsg
 */

/**
 * JetStream push subscription for `union.payload`
 *
  * @param {jetStreamPushSubscriptionFromReceiveUnionPayloadCallback} onDataCallback to call when messages are received
 * @param js the JetStream client to pull subscribe through
 * @param options when setting up the subscription
 * @param codec the serialization codec to use while transmitting the message
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function jetStreamPushSubscriptionFromReceiveUnionPayload({
  onDataCallback, 
  js, 
  options, 
  codec = Nats.JSONCodec(), 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: UnionMessageModule.UnionMessage, jetstreamMsg?: Nats.JsMsg) => void, 
  js: Nats.JetStreamClient, 
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>, 
  codec?: Nats.Codec<any>, 
  skipMessageValidation?: boolean
}): Promise<Nats.JetStreamSubscription> {
  return new Promise(async (resolve, reject) => {
    try {
      const subscription = await js.subscribe('union.payload', options);
      const validator = UnionMessageModule.createValidator();
      (async () => {
        for await (const msg of subscription) {
          
          let receivedData: any = codec.decode(msg.data);
if(!skipMessageValidation) {
    const {valid, errors} = UnionMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, msg); continue;
    }
  }
onDataCallback(undefined, UnionMessageModule.unmarshal(receivedData), msg);
        }
      })();
      resolve(subscription);
    } catch (e: any) {
      reject(e);
    }
  });
}

export { publishToSendUserSignedup, jetStreamPublishToSendUserSignedup, subscribeToReceiveUserSignedup, jetStreamPullSubscribeToReceiveUserSignedup, jetStreamPushSubscriptionFromReceiveUserSignedup, publishToNoParameter, subscribeToNoParameter, jetStreamPullSubscribeToNoParameter, jetStreamPushSubscriptionFromNoParameter, jetStreamPublishToNoParameter, publishToSendStringPayload, jetStreamPublishToSendStringPayload, subscribeToReceiveStringPayload, jetStreamPullSubscribeToReceiveStringPayload, jetStreamPushSubscriptionFromReceiveStringPayload, publishToSendArrayPayload, jetStreamPublishToSendArrayPayload, subscribeToReceiveArrayPayload, jetStreamPullSubscribeToReceiveArrayPayload, jetStreamPushSubscriptionFromReceiveArrayPayload, publishToSendUnionPayload, jetStreamPublishToSendUnionPayload, subscribeToReceiveUnionPayload, jetStreamPullSubscribeToReceiveUnionPayload, jetStreamPushSubscriptionFromReceiveUnionPayload };
