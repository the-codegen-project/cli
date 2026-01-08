import {UserSignedUp} from './../payloads/UserSignedUp';
import * as StringMessageModule from './../payloads/StringMessage';
import * as ArrayMessageModule from './../payloads/ArrayMessage';
import * as UnionMessageModule from './../payloads/UnionMessage';
import {AnonymousSchema_9} from './../payloads/AnonymousSchema_9';
import {UserSignedupParameters} from './../parameters/UserSignedupParameters';
import {UserSignedUpHeaders} from './../headers/UserSignedUpHeaders';
import * as Amqp from 'amqplib';

/**
 * AMQP publish operation for exchange `user/signedup/{my_parameter}/{enum_parameter}`
 *
  * @param message to publish
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish exchange operation
 */
function publishToSendUserSignedupExchange({
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
}): Promise<void> {
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
}

/**
 * AMQP publish operation for queue `user/signedup/{my_parameter}/{enum_parameter}`
 *
  * @param message to publish
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish queue operation
 */
function publishToSendUserSignedupQueue({
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
}): Promise<void> {
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
}

/**
 * AMQP subscribe operation for queue `user/signedup/{my_parameter}/{enum_parameter}`
 *
  * @param {subscribeToReceiveUserSignedupQueueCallback} onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param amqp the AMQP connection to receive from
 * @param options for the AMQP subscribe queue operation
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveUserSignedupQueue({
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
}): Promise<Amqp.Channel> {
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
}

/**
 * AMQP publish operation for exchange `noparameters`
 *
  * @param message to publish
 * @param headers optional headers to include with the message
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish exchange operation
 */
function publishToNoParameterExchange({
  message, 
  headers, 
  amqp, 
  options
}: {
  message: UserSignedUp, 
  headers?: UserSignedUpHeaders, 
  amqp: Amqp.Connection, 
  options?: {exchange: string | undefined} & Amqp.Options.Publish
}): Promise<void> {
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
}

/**
 * AMQP publish operation for queue `noparameters`
 *
  * @param message to publish
 * @param headers optional headers to include with the message
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish queue operation
 */
function publishToNoParameterQueue({
  message, 
  headers, 
  amqp, 
  options
}: {
  message: UserSignedUp, 
  headers?: UserSignedUpHeaders, 
  amqp: Amqp.Connection, 
  options?: Amqp.Options.Publish
}): Promise<void> {
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
}

/**
 * AMQP subscribe operation for queue `noparameters`
 *
  * @param {subscribeToNoParameterQueueCallback} onDataCallback to call when messages are received
 * @param amqp the AMQP connection to receive from
 * @param options for the AMQP subscribe queue operation
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToNoParameterQueue({
  onDataCallback, 
  amqp, 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: UserSignedUp, headers?: UserSignedUpHeaders, amqpMsg?: Amqp.ConsumeMessage}) => void, 
  amqp: Amqp.Connection, 
  options?: Amqp.Options.Consume, 
  skipMessageValidation?: boolean
}): Promise<Amqp.Channel> {
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

/**
 * AMQP publish operation for exchange `string/payload`
 *
  * @param message to publish
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish exchange operation
 */
function publishToSendStringPayloadExchange({
  message, 
  amqp, 
  options
}: {
  message: StringMessageModule.StringMessage, 
  amqp: Amqp.Connection, 
  options?: {exchange: string | undefined} & Amqp.Options.Publish
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    const exchange = options?.exchange ?? 'undefined';
    if(!exchange) {
      return reject('No exchange value found, please provide one')
    }
    try {
      let dataToSend: any = StringMessageModule.marshal(message);
const channel = await amqp.createChannel();
const routingKey = 'string/payload';
let publishOptions = { ...options };
channel.publish(exchange, routingKey, Buffer.from(dataToSend), publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * AMQP publish operation for queue `string/payload`
 *
  * @param message to publish
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish queue operation
 */
function publishToSendStringPayloadQueue({
  message, 
  amqp, 
  options
}: {
  message: StringMessageModule.StringMessage, 
  amqp: Amqp.Connection, 
  options?: Amqp.Options.Publish
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = StringMessageModule.marshal(message);
const channel = await amqp.createChannel();
const queue = 'string/payload';
let publishOptions = { ...options };
channel.sendToQueue(queue, Buffer.from(dataToSend), publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * AMQP subscribe operation for queue `string/payload`
 *
  * @param {subscribeToReceiveStringPayloadQueueCallback} onDataCallback to call when messages are received
 * @param amqp the AMQP connection to receive from
 * @param options for the AMQP subscribe queue operation
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveStringPayloadQueue({
  onDataCallback, 
  amqp, 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: StringMessageModule.StringMessage, amqpMsg?: Amqp.ConsumeMessage}) => void, 
  amqp: Amqp.Connection, 
  options?: Amqp.Options.Consume, 
  skipMessageValidation?: boolean
}): Promise<Amqp.Channel> {
  return new Promise(async (resolve, reject) => {
    try {
      const channel = await amqp.createChannel();
const queue = 'string/payload';
await channel.assertQueue(queue, { durable: true });
const validator = StringMessageModule.createValidator();
channel.consume(queue, (msg) => {
  if (msg !== null) {
    const receivedData = msg.content.toString()
    
    if(!skipMessageValidation) {
    const {valid, errors} = StringMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback({err: new Error(`Invalid message payload received ${JSON.stringify({cause: errors})}`), msg: undefined, amqpMsg: msg}); return;
    }
  }
    const message = StringMessageModule.unmarshal(receivedData);
    onDataCallback({err: undefined, msg: message, amqpMsg: msg});
  }
}, options);
      resolve(channel);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * AMQP publish operation for exchange `array/payload`
 *
  * @param message to publish
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish exchange operation
 */
function publishToSendArrayPayloadExchange({
  message, 
  amqp, 
  options
}: {
  message: ArrayMessageModule.ArrayMessage, 
  amqp: Amqp.Connection, 
  options?: {exchange: string | undefined} & Amqp.Options.Publish
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    const exchange = options?.exchange ?? 'undefined';
    if(!exchange) {
      return reject('No exchange value found, please provide one')
    }
    try {
      let dataToSend: any = ArrayMessageModule.marshal(message);
const channel = await amqp.createChannel();
const routingKey = 'array/payload';
let publishOptions = { ...options };
channel.publish(exchange, routingKey, Buffer.from(dataToSend), publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * AMQP publish operation for queue `array/payload`
 *
  * @param message to publish
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish queue operation
 */
function publishToSendArrayPayloadQueue({
  message, 
  amqp, 
  options
}: {
  message: ArrayMessageModule.ArrayMessage, 
  amqp: Amqp.Connection, 
  options?: Amqp.Options.Publish
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = ArrayMessageModule.marshal(message);
const channel = await amqp.createChannel();
const queue = 'array/payload';
let publishOptions = { ...options };
channel.sendToQueue(queue, Buffer.from(dataToSend), publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * AMQP subscribe operation for queue `array/payload`
 *
  * @param {subscribeToReceiveArrayPayloadQueueCallback} onDataCallback to call when messages are received
 * @param amqp the AMQP connection to receive from
 * @param options for the AMQP subscribe queue operation
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveArrayPayloadQueue({
  onDataCallback, 
  amqp, 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: ArrayMessageModule.ArrayMessage, amqpMsg?: Amqp.ConsumeMessage}) => void, 
  amqp: Amqp.Connection, 
  options?: Amqp.Options.Consume, 
  skipMessageValidation?: boolean
}): Promise<Amqp.Channel> {
  return new Promise(async (resolve, reject) => {
    try {
      const channel = await amqp.createChannel();
const queue = 'array/payload';
await channel.assertQueue(queue, { durable: true });
const validator = ArrayMessageModule.createValidator();
channel.consume(queue, (msg) => {
  if (msg !== null) {
    const receivedData = msg.content.toString()
    
    if(!skipMessageValidation) {
    const {valid, errors} = ArrayMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback({err: new Error(`Invalid message payload received ${JSON.stringify({cause: errors})}`), msg: undefined, amqpMsg: msg}); return;
    }
  }
    const message = ArrayMessageModule.unmarshal(receivedData);
    onDataCallback({err: undefined, msg: message, amqpMsg: msg});
  }
}, options);
      resolve(channel);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * AMQP publish operation for exchange `union/payload`
 *
  * @param message to publish
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish exchange operation
 */
function publishToSendUnionPayloadExchange({
  message, 
  amqp, 
  options
}: {
  message: UnionMessageModule.UnionMessage, 
  amqp: Amqp.Connection, 
  options?: {exchange: string | undefined} & Amqp.Options.Publish
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    const exchange = options?.exchange ?? 'undefined';
    if(!exchange) {
      return reject('No exchange value found, please provide one')
    }
    try {
      let dataToSend: any = UnionMessageModule.marshal(message);
const channel = await amqp.createChannel();
const routingKey = 'union/payload';
let publishOptions = { ...options };
channel.publish(exchange, routingKey, Buffer.from(dataToSend), publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * AMQP publish operation for queue `union/payload`
 *
  * @param message to publish
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish queue operation
 */
function publishToSendUnionPayloadQueue({
  message, 
  amqp, 
  options
}: {
  message: UnionMessageModule.UnionMessage, 
  amqp: Amqp.Connection, 
  options?: Amqp.Options.Publish
}): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      let dataToSend: any = UnionMessageModule.marshal(message);
const channel = await amqp.createChannel();
const queue = 'union/payload';
let publishOptions = { ...options };
channel.sendToQueue(queue, Buffer.from(dataToSend), publishOptions);
      resolve();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * AMQP subscribe operation for queue `union/payload`
 *
  * @param {subscribeToReceiveUnionPayloadQueueCallback} onDataCallback to call when messages are received
 * @param amqp the AMQP connection to receive from
 * @param options for the AMQP subscribe queue operation
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveUnionPayloadQueue({
  onDataCallback, 
  amqp, 
  options, 
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: UnionMessageModule.UnionMessage, amqpMsg?: Amqp.ConsumeMessage}) => void, 
  amqp: Amqp.Connection, 
  options?: Amqp.Options.Consume, 
  skipMessageValidation?: boolean
}): Promise<Amqp.Channel> {
  return new Promise(async (resolve, reject) => {
    try {
      const channel = await amqp.createChannel();
const queue = 'union/payload';
await channel.assertQueue(queue, { durable: true });
const validator = UnionMessageModule.createValidator();
channel.consume(queue, (msg) => {
  if (msg !== null) {
    const receivedData = msg.content.toString()
    
    if(!skipMessageValidation) {
    const {valid, errors} = UnionMessageModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      onDataCallback({err: new Error(`Invalid message payload received ${JSON.stringify({cause: errors})}`), msg: undefined, amqpMsg: msg}); return;
    }
  }
    const message = UnionMessageModule.unmarshal(receivedData);
    onDataCallback({err: undefined, msg: message, amqpMsg: msg});
  }
}, options);
      resolve(channel);
    } catch (e: any) {
      reject(e);
    }
  });
}

export { publishToSendUserSignedupExchange, publishToSendUserSignedupQueue, subscribeToReceiveUserSignedupQueue, publishToNoParameterExchange, publishToNoParameterQueue, subscribeToNoParameterQueue, publishToSendStringPayloadExchange, publishToSendStringPayloadQueue, subscribeToReceiveStringPayloadQueue, publishToSendArrayPayloadExchange, publishToSendArrayPayloadQueue, subscribeToReceiveArrayPayloadQueue, publishToSendUnionPayloadExchange, publishToSendUnionPayloadQueue, subscribeToReceiveUnionPayloadQueue };
