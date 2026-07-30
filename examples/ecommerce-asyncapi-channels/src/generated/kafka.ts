import {OrderCreated, OrderCreatedInterface} from './payload/OrderCreated';
import {OrderUpdated, OrderUpdatedInterface} from './payload/OrderUpdated';
import {OrderCancelled, OrderCancelledInterface} from './payload/OrderCancelled';
import * as SubscribeToOrderEventsPayloadModule from './payload/SubscribeToOrderEventsPayload';
import * as OrderLifecyclePayloadModule from './payload/OrderLifecyclePayload';
import {OrderItem, OrderItemInterface} from './payload/OrderItem';
import {Money, MoneyInterface} from './payload/Money';
import {Currency} from './payload/Currency';
import {Address, AddressInterface} from './payload/Address';
import {OrderStatus} from './payload/OrderStatus';
import {OrderLifecycleParameters, OrderLifecycleParametersInterface} from './parameter/OrderLifecycleParameters';
import * as OrderLifecycleHeadersModule from './headers/OrderLifecycleHeaders';
import * as Kafka from 'kafkajs';

/**
 * Kafka publish operation for `orders.{action}`
 *
 * @param message to publish
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param kafka the KafkaJS client to publish from
 */
function produceToPublishOrderCreated({
  message, 
  parameters, 
  headers, 
  kafka
}: {
  message: OrderCreatedInterface | OrderCreated, 
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters, 
  headers?: OrderLifecycleHeadersModule.OrderLifecycleHeaders, 
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> {
  return new Promise(async (resolve, reject) => {
    try {
      let dataToSend: any = (message instanceof OrderCreated ? message : new OrderCreated(message)).marshal();
      const producer = kafka.producer();
      await producer.connect();
      // Set up headers if provided
      let messageHeaders: Record<string, string> | undefined = undefined;
      if (headers) {
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        messageHeaders = {};
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            messageHeaders[key] = String(value);
          }
        }
      }

      await producer.send({
        topic: (parameters instanceof OrderLifecycleParameters ? parameters : new OrderLifecycleParameters(parameters)).getChannelWithParameters('orders.{action}'),
        messages: [
          {
            value: dataToSend,
            headers: messageHeaders
          },
        ],
      });
      resolve(producer);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Kafka publish operation for `orders.{action}`
 *
 * @param message to publish
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param kafka the KafkaJS client to publish from
 */
function produceToPublishOrderUpdated({
  message, 
  parameters, 
  headers, 
  kafka
}: {
  message: OrderUpdatedInterface | OrderUpdated, 
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters, 
  headers?: OrderLifecycleHeadersModule.OrderLifecycleHeaders, 
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> {
  return new Promise(async (resolve, reject) => {
    try {
      let dataToSend: any = (message instanceof OrderUpdated ? message : new OrderUpdated(message)).marshal();
      const producer = kafka.producer();
      await producer.connect();
      // Set up headers if provided
      let messageHeaders: Record<string, string> | undefined = undefined;
      if (headers) {
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        messageHeaders = {};
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            messageHeaders[key] = String(value);
          }
        }
      }

      await producer.send({
        topic: (parameters instanceof OrderLifecycleParameters ? parameters : new OrderLifecycleParameters(parameters)).getChannelWithParameters('orders.{action}'),
        messages: [
          {
            value: dataToSend,
            headers: messageHeaders
          },
        ],
      });
      resolve(producer);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Kafka publish operation for `orders.{action}`
 *
 * @param message to publish
 * @param parameters for topic substitution
 * @param headers optional headers to include with the message
 * @param kafka the KafkaJS client to publish from
 */
function produceToPublishOrderCancelled({
  message, 
  parameters, 
  headers, 
  kafka
}: {
  message: OrderCancelledInterface | OrderCancelled, 
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters, 
  headers?: OrderLifecycleHeadersModule.OrderLifecycleHeaders, 
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> {
  return new Promise(async (resolve, reject) => {
    try {
      let dataToSend: any = (message instanceof OrderCancelled ? message : new OrderCancelled(message)).marshal();
      const producer = kafka.producer();
      await producer.connect();
      // Set up headers if provided
      let messageHeaders: Record<string, string> | undefined = undefined;
      if (headers) {
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        messageHeaders = {};
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            messageHeaders[key] = String(value);
          }
        }
      }

      await producer.send({
        topic: (parameters instanceof OrderLifecycleParameters ? parameters : new OrderLifecycleParameters(parameters)).getChannelWithParameters('orders.{action}'),
        messages: [
          {
            value: dataToSend,
            headers: messageHeaders
          },
        ],
      });
      resolve(producer);
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Callback for when receiving messages
 *
 * @callback consumeFromSubscribeToOrderEventsCallback
 * @param err if any error occurred this will be sat
 * @param msg that was received
 * @param parameters that was received in the topic
 * @param headers that was received with the message
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
function consumeFromSubscribeToOrderEvents({
  onDataCallback, 
  parameters, 
  kafka, 
  options = {fromBeginning: true, groupId: ''}, 
  skipMessageValidation = false
}: {
  onDataCallback: (err?: Error, msg?: SubscribeToOrderEventsPayloadModule.SubscribeToOrderEventsPayload, parameters?: OrderLifecycleParameters, headers?: OrderLifecycleHeadersModule.OrderLifecycleHeaders, kafkaMsg?: Kafka.EachMessagePayload) => void, 
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters, 
  kafka: Kafka.Kafka, 
  options: {fromBeginning: boolean, groupId: string}, 
  skipMessageValidation?: boolean
}): Promise<Kafka.Consumer> {
  return new Promise(async (resolve, reject) => {
    try {
      if(!options.groupId) {
        return reject('No group ID provided');
      }
      const consumer = kafka.consumer({ groupId: options.groupId });

      const validator = SubscribeToOrderEventsPayloadModule.createValidator();
      await consumer.connect();
      await consumer.subscribe({ topic: (parameters instanceof OrderLifecycleParameters ? parameters : new OrderLifecycleParameters(parameters)).getChannelWithParameters('orders.{action}'), fromBeginning: options.fromBeginning });
      await consumer.run({
        eachMessage: async (kafkaMessage: Kafka.EachMessagePayload) => {
          const { topic, message } = kafkaMessage;
          const receivedData = message.value?.toString()!;
          const parameters = OrderLifecycleParameters.createFromChannel(topic, 'orders.{action}', /^orders.([^.]*)$/);
          
          // Extract headers if present
          let extractedHeaders: OrderLifecycleHeadersModule.OrderLifecycleHeaders | undefined = undefined;
          if (message.headers) {
            const headerObj: Record<string, any> = {};
            for (const [key, value] of Object.entries(message.headers)) {
              if (value !== undefined) {
                headerObj[key] = value.toString();
              }
            }
            extractedHeaders = OrderLifecycleHeadersModule.unmarshal(headerObj);
          }
if(!skipMessageValidation) {
    const {valid, errors} = SubscribeToOrderEventsPayloadModule.validate({data: receivedData, ajvValidatorFunction: validator});
    if(!valid) {
      return onDataCallback(new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`), undefined, parameters, extractedHeaders, kafkaMessage);
    }
  }
const callbackData = SubscribeToOrderEventsPayloadModule.unmarshal(receivedData);
onDataCallback(undefined, callbackData, parameters, extractedHeaders, kafkaMessage);
        }
      });
      resolve(consumer);
    } catch (e: any) {
      reject(e);
    }
  });
}

export { produceToPublishOrderCreated, produceToPublishOrderUpdated, produceToPublishOrderCancelled, consumeFromSubscribeToOrderEvents };
