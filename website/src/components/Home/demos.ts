/**
 * Content for the homepage "spec in -> code out" stage.
 *
 * Everything here is checked against reality rather than written from memory:
 * the specs and configs below are run through the CLI, the generated snippets
 * must appear verbatim in what it emits, and the hand-written `index.ts`
 * snippets must compile against that output. Long bodies are elided with
 * `// ...`; nothing is invented.
 *
 * Keep it that way. This is the first API surface most people ever read, so a
 * signature that drifts from what the generator emits is a broken promise. Note
 * how specific the output is to the document: drop the `headers` off a message
 * and the `headers` parameter disappears from every channel function, so a
 * snippet cannot be copied across from another spec.
 */

/**
 * Languages the code panes can highlight.
 *
 * Limited to what `prism-react-renderer` bundles - notably there is no `bash`
 * grammar, so shell snippets use `plaintext` rather than being mislabelled as
 * something that highlights `#` as an operator.
 */
export type Language = 'yaml' | 'json' | 'typescript' | 'plaintext';

export interface CodeFile {
  /** Path shown in the pane's tab strip. */
  path: string;
  /** Short tab label - the file name is often too long to fit. */
  label: string;
  language: Language;
  code: string;
  /**
   * Marks a tab as hand-written rather than generated, so the stage can label it
   * "you write this" - and so the verification script knows to compile it rather
   * than match it line-for-line against generated output.
   */
  handWritten?: boolean;
}

/** A switchable output flavour: a protocol for AsyncAPI, a preset for OpenAPI. */
export interface Variant {
  id: string;
  label: string;
  /** What the generated code talks to, shown next to the pills. */
  runtime: string;
  config: string;
  outputs: CodeFile[];
}

export interface Demo {
  id: 'asyncapi' | 'openapi' | 'jsonschema';
  label: string;
  /** Versions supported for this input, shown as a caption under the tabs. */
  versions: string;
  spec: CodeFile;
  /** What the pill row is selecting - "Protocol" or "Preset". */
  variantLabel: string;
  variants: Variant[];
}

// ---------------------------------------------------------------------------
// AsyncAPI
// ---------------------------------------------------------------------------

const ASYNCAPI_SPEC: CodeFile = {
  path: 'asyncapi.yaml',
  label: 'asyncapi.yaml',
  language: 'yaml',
  code: `asyncapi: 3.0.0
info:
  title: E-commerce Order Events
  version: 1.0.0

channels:
  order-lifecycle:
    address: orders.{action}
    parameters:
      action:
        enum: [created, updated, cancelled]
        description: Order lifecycle action
    messages:
      OrderCreated:
        payload:
          type: object
          required: [orderId, customerId, items, totalAmount]
          properties:
            orderId:
              type: string
              format: uuid
            customerId:
              type: string
              format: uuid
            items:
              type: array
              items:
                $ref: '#/components/schemas/OrderItem'
            totalAmount:
              $ref: '#/components/schemas/Money'
            createdAt:
              type: string
              format: date-time

operations:
  publishOrderCreated:
    action: send
    channel:
      $ref: '#/channels/order-lifecycle'
  subscribeToOrderEvents:
    action: receive
    channel:
      $ref: '#/channels/order-lifecycle'

components:
  schemas:
    Money:
      type: object
      required: [amount, currency]
      properties:
        amount:
          type: number
        currency:
          type: string
          enum: [USD, EUR, GBP]
    OrderItem:
      type: object
      required: [productId, quantity, unitPrice]
      properties:
        productId:
          type: string
        quantity:
          type: integer
        unitPrice:
          $ref: '#/components/schemas/Money'`
};

function asyncapiConfig(protocol: string): string {
  return `export default {
  inputType: 'asyncapi',
  inputPath: './asyncapi.yaml',
  generators: [
    {
      preset: 'channels',
      outputPath: './src/__gen__',
      language: 'typescript',
      protocols: ['${protocol}']
    }
  ]
};`;
}

/** Shared by every protocol - the payload model does not vary with transport. */
const ORDER_CREATED_MODEL: CodeFile = {
  path: 'src/__gen__/payload/OrderCreated.ts',
  label: 'OrderCreated.ts',
  language: 'typescript',
  code: `import {OrderItem} from './OrderItem';
import {Money} from './Money';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormatsModule from 'ajv-formats';
interface OrderCreatedInterface {
  orderId: string
  customerId: string
  items: OrderItem[]
  totalAmount: Money
  createdAt?: Date
  additionalProperties?: Record<string, any>
}
class OrderCreated {
  private _orderId: string;
  private _customerId: string;
  private _items: OrderItem[];
  private _totalAmount: Money;
  private _createdAt?: Date;
  private _additionalProperties?: Record<string, any>;

  constructor(input: OrderCreatedInterface) {
    this._orderId = input.orderId;
    this._customerId = input.customerId;
    this._items = input.items;
    this._totalAmount = input.totalAmount;
    // ...
  }

  get orderId(): string { return this._orderId; }
  set orderId(orderId: string) { this._orderId = orderId; }
  // ...

  public toJson(): Record<string, unknown> {
  // ...
  public marshal(): string {
  // ...
  public static unmarshal(json: string | object): OrderCreated {
  // ...
  public static createValidator(context?: {ajvInstance?: Ajv, ajvOptions?: AjvOptions}): ValidateFunction {
  // ...
}
export { OrderCreated };
export type { OrderCreatedInterface };`
};

/** Shared by every protocol - parameters come from the channel address. */
const ORDER_PARAMETERS_MODEL: CodeFile = {
  path: 'src/__gen__/parameter/OrderLifecycleParameters.ts',
  label: 'OrderLifecycleParameters.ts',
  language: 'typescript',
  code: `import {Action} from './Action';
interface OrderLifecycleParametersInterface {
  action: Action
}
class OrderLifecycleParameters {
  private _action: Action;

  constructor(input: OrderLifecycleParametersInterface) {
    this._action = input.action;
  }

  /**
   * Order lifecycle action
   */
  get action(): Action { return this._action; }
  set action(action: Action) { this._action = action; }


  /**
   * Realize the channel/topic with the parameters added to this class.
   */
  public getChannelWithParameters(channel: string) {
    channel = channel.replace(/\\{action\\}/g, this.action);
    return channel;
  }

  public static createFromChannel(msgSubject: string, channel: string, regex: RegExp): OrderLifecycleParameters {
  // ...
}
export { OrderLifecycleParameters };
export type { OrderLifecycleParametersInterface };`
};

/**
 * The publish payload every AsyncAPI usage snippet builds.
 *
 * `items` and `totalAmount` are typed as the generated *classes*, so they have
 * to be constructed - an object literal will not satisfy a type with private
 * fields. That is the kind of detail these snippets exist to show.
 */
const ORDER_MESSAGE_LITERAL = `  message: {
    orderId: '3f0c9e1a-6f1e-4a5b-9c22-8c0a7f1d2e33',
    customerId: '9ab1c7d4-2e55-4f01-8a0f-1d4b6e9c0a12',
    items: [
      new OrderItem({productId: 'CG-1', quantity: 2, unitPrice: eur(21)})
    ],
    totalAmount: eur(42)
  },
  // type Action = 'created' | 'updated' | 'cancelled'
  parameters: {action: 'created'},`;

const PAYLOAD_IMPORTS = `import {OrderItem} from './__gen__/payload/OrderItem';
import {Money} from './__gen__/payload/Money';
import {MoneyCurrencyEnum} from './__gen__/payload/MoneyCurrencyEnum';`;

/** Keeps the nested model construction from burying the call being demonstrated. */
const MONEY_HELPER = `// \`items\` and \`totalAmount\` are typed as the generated models, not as plain
// objects - a type with private fields will not accept an object literal.
const eur = (amount: number) =>
  new Money({amount, currency: MoneyCurrencyEnum.EUR});`;

const ASYNCAPI_VARIANTS: Variant[] = [
  {
    id: 'nats',
    label: 'NATS',
    runtime: 'nats',
    config: asyncapiConfig('nats'),
    outputs: [
      {
        path: 'src/__gen__/nats.ts',
        label: 'nats.ts',
        language: 'typescript',
        code: `import {OrderCreated, OrderCreatedInterface} from './payload/OrderCreated';
import {OrderItem, OrderItemInterface} from './payload/OrderItem';
import {Money, MoneyInterface} from './payload/Money';
import {MoneyCurrencyEnum} from './payload/MoneyCurrencyEnum';
import {OrderLifecycleParameters, OrderLifecycleParametersInterface} from './parameter/OrderLifecycleParameters';
import * as Nats from 'nats';

/**
 * NATS publish operation for \`orders.{action}\`
 *
 * @param message to publish
 * @param parameters for topic substitution
 * @param nc the NATS client to publish from
 * @param codec the serialization codec to use while transmitting the message
 * @param options to use while publishing the message
 */
function publishToPublishOrderCreated({
  message,
  parameters,
  nc,
  codec = Nats.JSONCodec(),
  options
}: {
  message: OrderCreatedInterface | OrderCreated,
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters,
  nc: Nats.NatsConnection,
  codec?: Nats.Codec<any>,
  options?: Nats.PublishOptions
}): Promise<void> {
  // ...
}

export { publishToPublishOrderCreated, jetStreamPublishToPublishOrderCreated, subscribeToSubscribeToOrderEvents, jetStreamPullSubscribeToSubscribeToOrderEvents, jetStreamPushSubscriptionFromSubscribeToOrderEvents };`
      },
      ORDER_CREATED_MODEL,
      ORDER_PARAMETERS_MODEL,
      {
        path: 'src/index.ts',
        label: 'index.ts',
        language: 'typescript',
        handWritten: true,
        code: `import {connect} from 'nats';
import {publishToPublishOrderCreated} from './__gen__/nats';
${PAYLOAD_IMPORTS}

${MONEY_HELPER}

const nc = await connect({servers: 'localhost:4222'});

// Fully typed. Rename a field in the spec and this stops compiling.
await publishToPublishOrderCreated({
${ORDER_MESSAGE_LITERAL}
  nc
});`
      }
    ]
  },
  {
    id: 'kafka',
    label: 'Kafka',
    runtime: 'kafkajs',
    config: asyncapiConfig('kafka'),
    outputs: [
      {
        path: 'src/__gen__/kafka.ts',
        label: 'kafka.ts',
        language: 'typescript',
        code: `import {OrderCreated, OrderCreatedInterface} from './payload/OrderCreated';
import {OrderItem, OrderItemInterface} from './payload/OrderItem';
import {Money, MoneyInterface} from './payload/Money';
import {MoneyCurrencyEnum} from './payload/MoneyCurrencyEnum';
import {OrderLifecycleParameters, OrderLifecycleParametersInterface} from './parameter/OrderLifecycleParameters';
import * as Kafka from 'kafkajs';

/**
 * Kafka publish operation for \`orders.{action}\`
 *
 * @param message to publish
 * @param parameters for topic substitution
 * @param kafka the KafkaJS client to publish from
 */
function produceToPublishOrderCreated({
  message,
  parameters,
  kafka
}: {
  message: OrderCreatedInterface | OrderCreated,
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters,
  kafka: Kafka.Kafka
}): Promise<Kafka.Producer> {
  // ...
}

export { produceToPublishOrderCreated, consumeFromSubscribeToOrderEvents };`
      },
      ORDER_CREATED_MODEL,
      ORDER_PARAMETERS_MODEL,
      {
        path: 'src/index.ts',
        label: 'index.ts',
        language: 'typescript',
        handWritten: true,
        code: `import {Kafka} from 'kafkajs';
import {produceToPublishOrderCreated} from './__gen__/kafka';
${PAYLOAD_IMPORTS}

${MONEY_HELPER}

const kafka = new Kafka({brokers: ['localhost:9092']});

// The channel address \`orders.{action}\` becomes the topic \`orders.created\`.
const producer = await produceToPublishOrderCreated({
${ORDER_MESSAGE_LITERAL}
  kafka
});

await producer.disconnect();`
      }
    ]
  },
  {
    id: 'mqtt',
    label: 'MQTT',
    runtime: 'mqtt v5',
    config: asyncapiConfig('mqtt'),
    outputs: [
      {
        path: 'src/__gen__/mqtt.ts',
        label: 'mqtt.ts',
        language: 'typescript',
        code: `import {OrderCreated, OrderCreatedInterface} from './payload/OrderCreated';
import {OrderItem, OrderItemInterface} from './payload/OrderItem';
import {Money, MoneyInterface} from './payload/Money';
import {MoneyCurrencyEnum} from './payload/MoneyCurrencyEnum';
import {OrderLifecycleParameters, OrderLifecycleParametersInterface} from './parameter/OrderLifecycleParameters';
import * as Mqtt from 'mqtt';

/**
 * MQTT subscription for \`orders.{action}\`
 *
 * @param onDataCallback to call when messages are received
 * @param parameters for topic substitution
 * @param mqtt the MQTT client to subscribe with
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToSubscribeToOrderEvents({
  onDataCallback,
  parameters,
  mqtt,
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: OrderCreated, parameters?: OrderLifecycleParameters, mqttMsg?: Mqtt.IPublishPacket}) => void,
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters,
  mqtt: Mqtt.MqttClient,
  skipMessageValidation?: boolean
}): Promise<void> {
    // Check if the received topic matches this subscription's pattern
    const topicPattern = /^orders.([^.]*)$/;
  // ...
}

export { publishToPublishOrderCreated, subscribeToSubscribeToOrderEvents };`
      },
      ORDER_CREATED_MODEL,
      ORDER_PARAMETERS_MODEL,
      {
        path: 'src/index.ts',
        label: 'index.ts',
        language: 'typescript',
        handWritten: true,
        code: `import {connectAsync} from 'mqtt';
import {subscribeToSubscribeToOrderEvents} from './__gen__/mqtt';

// MQTT channel code requires protocol v5.
const mqtt = await connectAsync('mqtt://localhost:1883', {protocolVersion: 5});

await subscribeToSubscribeToOrderEvents({
  onDataCallback: ({err, msg, parameters}) => {
    if (err) {
      return console.error(err);
    }
    // Already unmarshalled into the payload model, and validated on the way in.
    console.log(parameters?.action, msg?.orderId, msg?.totalAmount.amount);
  },
  parameters: {action: 'created'},
  mqtt
});`
      }
    ]
  },
  {
    id: 'amqp',
    label: 'AMQP',
    runtime: 'amqplib',
    config: asyncapiConfig('amqp'),
    outputs: [
      {
        path: 'src/__gen__/amqp.ts',
        label: 'amqp.ts',
        language: 'typescript',
        code: `import {OrderCreated, OrderCreatedInterface} from './payload/OrderCreated';
import {OrderItem, OrderItemInterface} from './payload/OrderItem';
import {Money, MoneyInterface} from './payload/Money';
import {MoneyCurrencyEnum} from './payload/MoneyCurrencyEnum';
import {OrderLifecycleParameters, OrderLifecycleParametersInterface} from './parameter/OrderLifecycleParameters';
import * as Amqp from 'amqplib';

/**
 * AMQP publish operation for exchange \`orders.{action}\`
 *
 * @param message to publish
 * @param parameters for topic substitution
 * @param amqp the AMQP connection to send over
 * @param options for the AMQP publish exchange operation
 */
function publishToPublishOrderCreatedExchange({
  message,
  parameters,
  amqp,
  options
}: {
  message: OrderCreatedInterface | OrderCreated,
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters,
  amqp: Amqp.Connection,
  options?: {exchange: string | undefined} & Amqp.Options.Publish
}): Promise<void> {
  // ...
}

export { publishToPublishOrderCreatedExchange, publishToPublishOrderCreatedQueue, subscribeToSubscribeToOrderEventsQueue };`
      },
      ORDER_CREATED_MODEL,
      ORDER_PARAMETERS_MODEL,
      {
        path: 'src/index.ts',
        label: 'index.ts',
        language: 'typescript',
        handWritten: true,
        code: `import * as Amqp from 'amqplib';
import {publishToPublishOrderCreatedExchange} from './__gen__/amqp';
${PAYLOAD_IMPORTS}

${MONEY_HELPER}

const amqp = await Amqp.connect('amqp://localhost:5672');

// The channel address becomes the routing key; you pick the exchange.
await publishToPublishOrderCreatedExchange({
${ORDER_MESSAGE_LITERAL}
  amqp,
  options: {exchange: 'orders'}
});`
      }
    ]
  },
  {
    id: 'websocket',
    label: 'WebSocket',
    runtime: 'ws',
    config: asyncapiConfig('websocket'),
    outputs: [
      {
        path: 'src/__gen__/websocket.ts',
        label: 'websocket.ts',
        language: 'typescript',
        code: `import {OrderCreated, OrderCreatedInterface} from './payload/OrderCreated';
import {OrderItem, OrderItemInterface} from './payload/OrderItem';
import {Money, MoneyInterface} from './payload/Money';
import {MoneyCurrencyEnum} from './payload/MoneyCurrencyEnum';
import {OrderLifecycleParameters, OrderLifecycleParametersInterface} from './parameter/OrderLifecycleParameters';
import * as WebSocket from 'ws';
import { IncomingMessage } from 'http';

/**
 * WebSocket client-side function to subscribe to messages from \`/orders.{action}\`
 *
 * @param onDataCallback callback when messages are received
 * @param parameters for URL path substitution
 * @param ws the WebSocket connection (assumed to be already connected)
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToSubscribeToOrderEvents({
  onDataCallback,
  parameters,
  ws,
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: OrderCreated, parameters?: OrderLifecycleParameters, ws?: WebSocket.WebSocket}) => void,
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters,
  ws: WebSocket.WebSocket,
  skipMessageValidation?: boolean
}): void {
  // ...
}

export { publishToPublishOrderCreated, registerPublishOrderCreated, subscribeToSubscribeToOrderEvents };`
      },
      ORDER_CREATED_MODEL,
      ORDER_PARAMETERS_MODEL,
      {
        path: 'src/index.ts',
        label: 'index.ts',
        language: 'typescript',
        handWritten: true,
        code: `import * as WebSocket from 'ws';
import {subscribeToSubscribeToOrderEvents} from './__gen__/websocket';

const ws = new WebSocket.WebSocket('ws://localhost:8080/orders.created');

ws.on('open', () => {
  subscribeToSubscribeToOrderEvents({
    onDataCallback: ({err, msg}) => {
      if (err) {
        return console.error(err);
      }
      console.log(msg?.orderId, msg?.totalAmount.amount);
    },
    parameters: {action: 'created'},
    ws
  });
});`
      }
    ]
  },
  {
    id: 'event_source',
    label: 'EventSource',
    runtime: 'fetch-event-source',
    config: asyncapiConfig('event_source'),
    outputs: [
      {
        path: 'src/__gen__/event_source.ts',
        label: 'event_source.ts',
        language: 'typescript',
        code: `import {OrderCreated, OrderCreatedInterface} from './payload/OrderCreated';
import {OrderItem, OrderItemInterface} from './payload/OrderItem';
import {Money, MoneyInterface} from './payload/Money';
import {MoneyCurrencyEnum} from './payload/MoneyCurrencyEnum';
import {OrderLifecycleParameters, OrderLifecycleParametersInterface} from './parameter/OrderLifecycleParameters';
import { NextFunction, Request, Response, Router } from 'express';
import { fetchEventSource, EventStreamContentType, EventSourceMessage } from '@microsoft/fetch-event-source';

/**
 * Event source fetch for \`orders.{action}\`
 *
 * @param callback to call when receiving events
 * @param parameters for listening
 * @param options additionally used to handle the event source
 * @param skipMessageValidation turn off runtime validation of incoming messages
 * @returns A cleanup function to abort the connection
 */
function listenForSubscribeToOrderEvents({
  callback,
  parameters,
  options,
  skipMessageValidation = false
}: {
  callback: (params: {error?: Error, messageEvent?: OrderCreated}) => void,
  parameters: OrderLifecycleParametersInterface | OrderLifecycleParameters,
  options: {authorization?: string, onClose?: (err?: string) => void, baseUrl: string, headers?: Record<string, string>},
  skipMessageValidation?: boolean
}): (() => void) {
  // ...
}

export { registerPublishOrderCreated, listenForSubscribeToOrderEvents };`
      },
      ORDER_CREATED_MODEL,
      ORDER_PARAMETERS_MODEL,
      {
        path: 'src/index.ts',
        label: 'index.ts',
        language: 'typescript',
        handWritten: true,
        code: `import {listenForSubscribeToOrderEvents} from './__gen__/event_source';

// Returns a cleanup function - call it to abort the stream.
const stop = listenForSubscribeToOrderEvents({
  callback: ({error, messageEvent}) => {
    if (error) {
      return console.error(error);
    }
    console.log('order', messageEvent?.orderId);
  },
  parameters: {action: 'created'},
  options: {
    baseUrl: 'https://api.example.com',
    authorization: process.env.API_TOKEN
  }
});

process.on('SIGINT', stop);`
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// OpenAPI
// ---------------------------------------------------------------------------

const OPENAPI_SPEC: CodeFile = {
  path: 'openapi.json',
  label: 'openapi.json',
  language: 'json',
  code: `{
  "openapi": "3.1.0",
  "info": {
    "title": "Orders API",
    "version": "1.0.0"
  },
  "paths": {
    "/orders": {
      "post": {
        "operationId": "createOrder",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["customerId", "items"],
                "properties": {
                  "customerId": {"type": "string", "format": "uuid"},
                  "items": {
                    "type": "array",
                    "items": {"$ref": "#/components/schemas/OrderItem"}
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "The created order",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/Order"}
              }
            }
          }
        }
      }
    },
    "/orders/{orderId}": {
      "get": {
        "operationId": "getOrder",
        "parameters": [
          {
            "name": "orderId",
            "in": "path",
            "required": true,
            "schema": {"type": "string", "format": "uuid"}
          }
        ],
        "responses": {
          "200": {
            "description": "The order",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/Order"}
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "OrderItem": {
        "type": "object",
        "required": ["productId", "quantity"],
        "properties": {
          "productId": {"type": "string"},
          "quantity": {"type": "integer"}
        }
      },
      "Order": {
        "type": "object",
        "required": ["orderId", "status"],
        "properties": {
          "orderId": {"type": "string", "format": "uuid"},
          "status": {
            "type": "string",
            "enum": ["pending", "paid", "shipped"]
          }
        }
      }
    }
  }
}`
};

const OPENAPI_CHANNELS_CONFIG = `export default {
  inputType: 'openapi',
  inputPath: './openapi.json',
  generators: [
    {
      preset: 'channels',
      outputPath: './src/__gen__',
      language: 'typescript',
      protocols: ['http_client']
    }
  ]
};`;

/**
 * The `client` preset wraps the channel functions, so it needs the `channels`
 * generator alongside it and a `channelsGeneratorId` pointing at it. Drop either
 * and the client generator writes "No protocols generated" instead of a class -
 * so both entries have to stay in this snippet.
 */
const OPENAPI_CLIENT_CONFIG = `export default {
  inputType: 'openapi',
  inputPath: './openapi.json',
  generators: [
    {
      preset: 'channels',
      outputPath: './src/__gen__',
      language: 'typescript',
      protocols: ['http_client']
    },
    {
      preset: 'client',
      outputPath: './src/__gen__/client',
      language: 'typescript',
      protocols: ['http'],
      channelsGeneratorId: 'channels-typescript'
    }
  ]
};`;

const OPENAPI_REQUEST_MODEL: CodeFile = {
  path: 'src/__gen__/payload/CreateOrderRequest.ts',
  label: 'CreateOrderRequest.ts',
  language: 'typescript',
  code: `import {OrderItem} from './OrderItem';
import {Ajv, Options as AjvOptions, ErrorObject, ValidateFunction} from 'ajv';
import addFormatsModule from 'ajv-formats';
interface CreateOrderRequestInterface {
  customerId: string
  items: OrderItem[]
  additionalProperties?: Record<string, any>
}
class CreateOrderRequest {
  private _customerId: string;
  private _items: OrderItem[];
  private _additionalProperties?: Record<string, any>;

  constructor(input: CreateOrderRequestInterface) {
    this._customerId = input.customerId;
    this._items = input.items;
    this._additionalProperties = input.additionalProperties;
  }

  get customerId(): string { return this._customerId; }
  set customerId(customerId: string) { this._customerId = customerId; }

  get items(): OrderItem[] { return this._items; }
  set items(items: OrderItem[]) { this._items = items; }
  // ...
}
export { CreateOrderRequest };
export type { CreateOrderRequestInterface };`
};

const OPENAPI_VARIANTS: Variant[] = [
  {
    id: 'client',
    label: 'client (one class)',
    runtime: 'fetch',
    config: OPENAPI_CLIENT_CONFIG,
    outputs: [
      {
        path: 'src/__gen__/client/OrdersClient.ts',
        label: 'OrdersClient.ts',
        language: 'typescript',
        code: `//Import channel functions
import * as http_client from './../http_client';

/**
 * @class OrdersClient
 *
 * A fully-typed HTTP client for the Orders API. Construct it once with the shared request configuration
 * (baseUrl, auth, hooks, ...) and call the operation methods; every method
 * forwards to the underlying channel function with that configuration applied.
 */
export class OrdersClient {
  /**
   * @param config shared HTTP configuration applied to every request. Any field
   * can be overridden per call through the method's context argument.
   */
  constructor(private readonly config: http_client.HttpClientContext = {}) {}

  /**
   * Invokes the \`createOrder\` operation using this client's shared configuration.
   *
   * @param context per-call request context; overrides any field set on the client.
   */
  public async createOrder(context: http_client.CreateOrderContext): Promise<Awaited<ReturnType<typeof http_client.createOrder>>> {
    return http_client.createOrder({...this.config, ...context});
  }

  /**
   * Invokes the \`getOrder\` operation using this client's shared configuration.
   *
   * @param context per-call request context; overrides any field set on the client.
   */
  public async getOrder(context: http_client.GetOrderContext): Promise<Awaited<ReturnType<typeof http_client.getOrder>>> {
    return http_client.getOrder({...this.config, ...context});
  }
}`
      },
      OPENAPI_REQUEST_MODEL,
      {
        path: 'src/index.ts',
        label: 'index.ts',
        language: 'typescript',
        handWritten: true,
        code: `import {OrdersClient} from './__gen__/client/OrdersClient';
import {OrderItem} from './__gen__/payload/OrderItem';

// Configure once - baseUrl, auth, retries and hooks apply to every call.
const client = new OrdersClient({
  baseUrl: 'https://api.example.com',
  auth: {type: 'bearer', token: process.env.API_TOKEN!},
  retry: {maxRetries: 3}
});

const {data, status} = await client.createOrder({
  payload: {
    customerId: '9ab1c7d4-2e55-4f01-8a0f-1d4b6e9c0a12',
    items: [new OrderItem({productId: 'CG-1', quantity: 2})]
  }
});

console.log(status, data.orderId);

// Path parameters go through the generated parameter model.
const order = await client.getOrder({
  parameters: {orderId: data.orderId}
});

console.log(order.data.status);`
      }
    ]
  },
  {
    id: 'channels',
    label: 'channels (functions)',
    runtime: 'fetch',
    config: OPENAPI_CHANNELS_CONFIG,
    outputs: [
      {
        path: 'src/__gen__/http_client.ts',
        label: 'http_client.ts',
        language: 'typescript',
        code: `/**
 * Rich response wrapper returned by HTTP client functions
 */
export interface HttpClientResponse<T> {
  /** The deserialized response payload */
  data: T;
  /** HTTP status code */
  status: number;
  /** HTTP status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Raw JSON response before deserialization */
  rawData: Record<string, any>;
}
  // ...
export interface HttpClientContext {
  baseUrl?: string;

  // Authentication - grouped for better autocomplete
  auth?: AuthConfig;

  // Retry configuration
  retry?: RetryConfig;

  // Hooks for extensibility
  hooks?: HttpHooks;

  // Additional options
  additionalHeaders?: Record<string, string | string[]>;

  // Extra query parameters not covered by the typed parameters interface
  additionalQueryParams?: Record<string, string | number | boolean | undefined>;
}
  // ...
export interface CreateOrderContext extends HttpClientContext {
  payload: CreateOrderRequestInterface | CreateOrderRequest;
}
  // ...
async function createOrder(context: CreateOrderContext): Promise<HttpClientResponse<CreateOrderResponse_200>> {
  // ...
}

export { createOrder, getOrder };`
      },
      OPENAPI_REQUEST_MODEL,
      {
        path: 'src/index.ts',
        label: 'index.ts',
        language: 'typescript',
        handWritten: true,
        code: `import {createOrder, getOrder} from './__gen__/http_client';
import {OrderItem} from './__gen__/payload/OrderItem';

// Standalone functions - each call carries its own context. No client object.
const {data} = await createOrder({
  baseUrl: 'https://api.example.com',
  auth: {type: 'bearer', token: process.env.API_TOKEN!},
  payload: {
    customerId: '9ab1c7d4-2e55-4f01-8a0f-1d4b6e9c0a12',
    items: [new OrderItem({productId: 'CG-1', quantity: 2})]
  }
});

const order = await getOrder({
  baseUrl: 'https://api.example.com',
  parameters: {orderId: data.orderId}
});

console.log(order.data.status);`
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// JSON Schema
// ---------------------------------------------------------------------------

const JSONSCHEMA_SPEC: CodeFile = {
  path: 'user-schema.json',
  label: 'user-schema.json',
  language: 'json',
  code: `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "user-schema",
  "title": "User",
  "description": "A user in the system",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for the user"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "Full name of the user"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "Email address of the user"
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "isActive": {
      "type": "boolean",
      "default": true
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["admin", "user", "moderator", "guest"]
      }
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": ["id", "name", "email", "createdAt"]
}`
};

const JSONSCHEMA_VARIANTS: Variant[] = [
  {
    id: 'models',
    label: 'models',
    runtime: 'zero dependencies',
    config: `export default {
  inputType: 'jsonschema',
  inputPath: './user-schema.json',
  generators: [
    {
      preset: 'models',
      outputPath: './src/models',
      language: 'typescript'
    }
  ]
};`,
    outputs: [
      {
        path: 'src/models/User.ts',
        label: 'User.ts',
        language: 'typescript',
        code: `import {RolesItem} from './RolesItem';
class User {
  private _id: string;
  private _reservedName: string;
  private _email: string;
  private _age?: number;
  private _isActive?: boolean;
  private _roles?: RolesItem[];
  private _createdAt: Date;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    id: string,
    reservedName: string,
    email: string,
    age?: number,
    isActive?: boolean,
    roles?: RolesItem[],
    createdAt: Date,
    additionalProperties?: Map<string, any>,
  }) {
    this._id = input.id;
    this._reservedName = input.reservedName;
    this._email = input.email;
  // ...
  }

  get id(): string { return this._id; }
  set id(id: string) { this._id = id; }

  get reservedName(): string { return this._reservedName; }
  set reservedName(reservedName: string) { this._reservedName = reservedName; }
  // ...
}
export { User };`
      },
      {
        path: 'src/models/RolesItem.ts',
        label: 'RolesItem.ts',
        language: 'typescript',
        code: `enum RolesItem {
  ADMIN = "admin",
  USER = "user",
  MODERATOR = "moderator",
  GUEST = "guest",
}
export { RolesItem };`
      },
      {
        path: 'src/index.ts',
        label: 'index.ts',
        language: 'typescript',
        handWritten: true,
        code: `import {User} from './models/User';
import {RolesItem} from './models/RolesItem';

// \`name\` is a reserved word here, so it is emitted as \`reservedName\`.
const user = new User({
  id: '9ab1c7d4-2e55-4f01-8a0f-1d4b6e9c0a12',
  reservedName: 'Ada Lovelace',
  email: 'ada@example.com',
  roles: [RolesItem.ADMIN],
  createdAt: new Date()
});

// \`models\` is the plain-data preset: typed accessors, no messaging machinery
// and no serialisation helpers. Use \`payloads\` when you want those.
console.log(user.reservedName, user.roles?.[0]);`
      }
    ]
  }
];

/**
 * Puts each variant's hand-written `index.ts` first.
 *
 * The variants above list their generated files in dependency order and end with
 * the `index.ts` a reader would write. On screen the priority is the other way
 * round - what you would actually type is what people came to see, and it is the
 * tab that opens by default - so the lift happens here rather than by shuffling
 * nine literal arrays out of the order they are natural to author in.
 */
function usageFirst(variants: Variant[]): Variant[] {
  return variants.map((variant) => ({
    ...variant,
    outputs: [
      ...variant.outputs.filter((file) => file.handWritten),
      ...variant.outputs.filter((file) => !file.handWritten)
    ]
  }));
}

export const demos: Demo[] = [
  {
    id: 'asyncapi',
    label: 'AsyncAPI',
    versions: 'v2.0 - v3.0',
    spec: ASYNCAPI_SPEC,
    variantLabel: 'Protocol',
    variants: usageFirst(ASYNCAPI_VARIANTS)
  },
  {
    id: 'openapi',
    label: 'OpenAPI',
    versions: '2.0 (Swagger), 3.0, 3.1',
    spec: OPENAPI_SPEC,
    variantLabel: 'Preset',
    variants: usageFirst(OPENAPI_VARIANTS)
  },
  {
    id: 'jsonschema',
    label: 'JSON Schema',
    versions: 'Draft 4, 6, 7',
    spec: JSONSCHEMA_SPEC,
    variantLabel: 'Preset',
    variants: usageFirst(JSONSCHEMA_VARIANTS)
  }
];
