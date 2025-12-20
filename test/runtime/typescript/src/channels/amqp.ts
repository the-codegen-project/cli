import {UserSignedUp} from './../payloads/UserSignedUp';
import {UserSignedupParameters} from './../parameters/UserSignedupParameters';
import {UserSignedUpHeaders} from './../headers/UserSignedUpHeaders';
import * as Amqp from 'amqplib';

export /**
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

export /**
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

export /**
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

export /**
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

export /**
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

export /**
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
