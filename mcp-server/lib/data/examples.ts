/**
 * Usage examples for generated code from The Codegen Project.
 * These examples help users understand how to integrate generated code into their projects.
 */

import type { GeneratorPreset, Protocol } from './generators';

export interface UsageExample {
  title: string;
  description: string;
  code: string;
  dependencies?: string[];
}

/**
 * Examples for each generator type
 */
export const generatorExamples: Record<GeneratorPreset, UsageExample[]> = {
  payloads: [
    {
      title: 'Creating and validating a payload',
      description: 'Create a message payload instance and validate it before sending',
      code: `import { UserSignedUp } from './payloads/UserSignedUp';

// Create a new payload instance
const message = new UserSignedUp({
  displayName: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date().toISOString(),
});

// Validate the payload (throws if invalid)
message.validate();

// Serialize to JSON string for sending
const json = message.marshal();
console.log(json);`,
      dependencies: ['ajv', 'ajv-formats'],
    },
    {
      title: 'Deserializing a received payload',
      description: 'Parse and validate an incoming message',
      code: `import { UserSignedUp } from './payloads/UserSignedUp';

// Received JSON string from message broker
const receivedJson = '{"display_name":"John Doe","email":"john@example.com"}';

// Unmarshal and validate
const message = UserSignedUp.unmarshal(receivedJson);
message.validate();

// Access typed properties
console.log(message.displayName); // "John Doe"
console.log(message.email);       // "john@example.com"`,
      dependencies: ['ajv', 'ajv-formats'],
    },
  ],

  parameters: [
    {
      title: 'Working with channel parameters',
      description: 'Create parameters and substitute them into channel topics',
      code: `import { UserEventsParameters } from './parameters/UserEventsParameters';

// Create parameters instance
const params = new UserEventsParameters({
  userId: '12345',
  eventType: 'signup',
});

// Get the channel with parameters substituted
const channel = params.getChannelWithParameters('users/{userId}/events/{eventType}');
console.log(channel); // "users/12345/events/signup"`,
    },
    {
      title: 'Extracting parameters from a topic',
      description: 'Parse parameters from an incoming message topic',
      code: `import { UserEventsParameters } from './parameters/UserEventsParameters';

// Extract parameters from an actual topic
const topic = 'users/12345/events/signup';
const pattern = 'users/{userId}/events/{eventType}';
const params = UserEventsParameters.createFromChannel(topic, pattern);

console.log(params.userId);    // "12345"
console.log(params.eventType); // "signup"`,
    },
  ],

  headers: [
    {
      title: 'Creating message headers',
      description: 'Create and validate message headers',
      code: `import { MessageHeaders } from './headers/MessageHeaders';

// Create headers instance
const headers = new MessageHeaders({
  correlationId: 'abc-123',
  contentType: 'application/json',
  timestamp: Date.now(),
});

// Validate headers
headers.validate();

// Marshal for sending
const headerData = headers.marshal();`,
      dependencies: ['ajv', 'ajv-formats'],
    },
  ],

  types: [
    {
      title: 'Using topic type definitions',
      description: 'Work with strongly-typed topic identifiers',
      code: `import { Topics, TopicIds, ToTopicIds, ToTopics } from './Types';

// Get all available topics
const allTopics: Topics[] = ['users/signup', 'users/login', 'orders/created'];

// Convert between topic string and ID
const topicId: TopicIds = ToTopicIds('users/signup'); // 'usersSignup'
const topic: Topics = ToTopics('usersSignup');        // 'users/signup'

// Type-safe topic handling
function handleTopic(topic: Topics) {
  switch (ToTopicIds(topic)) {
    case 'usersSignup':
      console.log('Handling user signup');
      break;
    case 'usersLogin':
      console.log('Handling user login');
      break;
  }
}`,
    },
  ],

  channels: [
    {
      title: 'Publishing a message (NATS)',
      description: 'Publish a typed message to a NATS subject',
      code: `import { connect } from 'nats';
import { publishToUserSignup } from './channels/nats';
import { UserSignedUp } from './payloads/UserSignedUp';

const nc = await connect({ servers: 'nats://localhost:4222' });

const message = new UserSignedUp({
  displayName: 'John Doe',
  email: 'john@example.com',
});

await publishToUserSignup(nc, message);
console.log('Message published');

await nc.close();`,
      dependencies: ['nats'],
    },
    {
      title: 'Subscribing to messages (NATS)',
      description: 'Subscribe to a channel and receive typed messages',
      code: `import { connect } from 'nats';
import { subscribeToUserSignup } from './channels/nats';

const nc = await connect({ servers: 'nats://localhost:4222' });

await subscribeToUserSignup(nc, {
  callback: (err, msg, parameters, headers, natsMsg) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    console.log('Received:', msg?.displayName, msg?.email);
  },
});

console.log('Subscribed, waiting for messages...');`,
      dependencies: ['nats'],
    },
  ],

  client: [
    {
      title: 'Using the NATS client',
      description: 'High-level client for NATS messaging',
      code: `import { NatsClient } from './client/NatsClient';
import { UserSignedUp } from './payloads/UserSignedUp';

// Create and connect the client
const client = new NatsClient();
await client.connectToHost('nats://localhost:4222');

// Publish a message
const message = new UserSignedUp({
  displayName: 'John Doe',
  email: 'john@example.com',
});
await client.publishToUserSignup({ message });

// Subscribe to messages
await client.subscribeToUserSignup({
  onDataCallback: (err, msg) => {
    if (!err && msg) {
      console.log('Received:', msg.displayName);
    }
  },
});

// Disconnect when done
await client.disconnect();`,
      dependencies: ['nats'],
    },
  ],

  models: [
    {
      title: 'Using generated models',
      description: 'Work with data models generated from JSON Schema',
      code: `import { User } from './models/User';

// Create a new model instance
const user = new User({
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  roles: ['admin', 'user'],
});

// Access properties
console.log(user.name);  // "John Doe"
console.log(user.roles); // ["admin", "user"]

// Models are plain classes - use as needed
const users: User[] = [user];`,
    },
  ],

  custom: [
    {
      title: 'Custom generator configuration',
      description: 'Define a custom generator with a render function',
      code: `// codegen.config.mjs
export default {
  inputType: 'asyncapi',
  inputPath: './asyncapi.json',
  generators: [
    {
      preset: 'custom',
      outputPath: './src/custom',
      renderFunction: (context) => {
        const { asyncapiDocument } = context;
        const channels = asyncapiDocument.channels();

        // Generate custom code based on the spec
        let code = '// Custom generated code\\n';
        for (const [name, channel] of Object.entries(channels)) {
          code += \`export const \${name}Channel = '\${channel.address()}';\n\`;
        }

        return {
          files: [
            {
              fileName: 'channels.ts',
              content: code,
            },
          ],
        };
      },
    },
  ],
};`,
    },
  ],
};

/**
 * Protocol-specific examples
 */
export const protocolExamples: Record<Protocol, UsageExample[]> = {
  nats: [
    {
      title: 'NATS Core Publish/Subscribe',
      description: 'Basic publish/subscribe with NATS core',
      code: `import { connect } from 'nats';
import { publishToOrders, subscribeToOrders } from './channels/nats';

const nc = await connect({ servers: 'nats://localhost:4222' });

// Subscribe
await subscribeToOrders(nc, {
  callback: (err, msg) => {
    console.log('Order received:', msg);
  },
});

// Publish
await publishToOrders(nc, orderPayload);`,
      dependencies: ['nats'],
    },
    {
      title: 'NATS JetStream',
      description: 'Persistent messaging with JetStream',
      code: `import { connect } from 'nats';
import { jetStreamPublishToOrders, jetStreamPullSubscribeToOrders } from './channels/nats';

const nc = await connect({ servers: 'nats://localhost:4222' });
const js = nc.jetstream();

// Publish to JetStream
await jetStreamPublishToOrders(js, orderPayload);

// Pull subscribe from JetStream
const subscription = await jetStreamPullSubscribeToOrders(js, {
  stream: 'ORDERS',
  consumer: 'order-processor',
  callback: (err, msg) => {
    console.log('Processing order:', msg);
  },
});`,
      dependencies: ['nats'],
    },
  ],

  kafka: [
    {
      title: 'Kafka Publish/Subscribe',
      description: 'Produce and consume Kafka messages',
      code: `import { Kafka } from 'kafkajs';
import { publishToOrders, subscribeToOrders } from './channels/kafka';

const kafka = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'my-group' });

await producer.connect();
await consumer.connect();

// Publish
await publishToOrders(producer, orderPayload);

// Subscribe
await subscribeToOrders(consumer, {
  callback: (err, msg) => {
    console.log('Order received:', msg);
  },
});`,
      dependencies: ['kafkajs'],
    },
  ],

  mqtt: [
    {
      title: 'MQTT Publish/Subscribe',
      description: 'IoT-style messaging with MQTT',
      code: `import mqtt from 'mqtt';
import { publishToSensors, subscribeToSensors } from './channels/mqtt';

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', async () => {
  // Subscribe
  await subscribeToSensors(client, {
    callback: (err, msg) => {
      console.log('Sensor data:', msg);
    },
  });

  // Publish
  await publishToSensors(client, sensorPayload, { qos: 1 });
});`,
      dependencies: ['mqtt'],
    },
  ],

  amqp: [
    {
      title: 'AMQP Queue Operations',
      description: 'RabbitMQ queue publish/subscribe',
      code: `import amqp from 'amqplib';
import { publishToOrderQueue, subscribeToOrderQueue } from './channels/amqp';

const connection = await amqp.connect('amqp://localhost');
const channel = await connection.createChannel();

// Subscribe to queue
await subscribeToOrderQueue(channel, {
  callback: (err, msg) => {
    console.log('Order from queue:', msg);
  },
});

// Publish to queue
await publishToOrderQueue(channel, orderPayload);`,
      dependencies: ['amqplib'],
    },
  ],

  websocket: [
    {
      title: 'WebSocket Messaging',
      description: 'Bidirectional WebSocket communication',
      code: `import WebSocket from 'ws';
import { publishToChat, subscribeToChat } from './channels/websocket';

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  // Subscribe to incoming messages
  subscribeToChat(ws, {
    callback: (err, msg) => {
      console.log('Chat message:', msg);
    },
  });

  // Send a message
  publishToChat(ws, chatPayload);
});`,
      dependencies: ['ws'],
    },
  ],

  http_client: [
    {
      title: 'HTTP Client Requests',
      description: 'Make typed HTTP API calls',
      code: `import { createOrder, getOrder } from './channels/http_client';

// POST request
const newOrder = await createOrder({
  body: { items: ['item1', 'item2'], total: 99.99 },
  headers: { Authorization: 'Bearer token' },
});

// GET request with path parameters
const order = await getOrder({
  parameters: { orderId: '123' },
  headers: { Authorization: 'Bearer token' },
});

console.log('Order:', order);`,
    },
  ],

  event_source: [
    {
      title: 'Server-Sent Events',
      description: 'Subscribe to SSE streams',
      code: `import { subscribeToNotifications } from './channels/event_source';

// Subscribe to SSE stream
const unsubscribe = await subscribeToNotifications({
  url: 'https://api.example.com/notifications',
  callback: (err, msg) => {
    if (!err) {
      console.log('Notification:', msg);
    }
  },
  headers: {
    Authorization: 'Bearer token',
  },
});

// Later: stop listening
unsubscribe();`,
      dependencies: ['@microsoft/fetch-event-source'],
    },
  ],
};

/**
 * Get examples for a generator type
 */
export function getExamplesForGenerator(preset: GeneratorPreset): UsageExample[] {
  return generatorExamples[preset] || [];
}

/**
 * Get examples for a protocol
 */
export function getExamplesForProtocol(protocol: Protocol): UsageExample[] {
  return protocolExamples[protocol] || [];
}

/**
 * Get all examples for a generator, including protocol-specific if applicable.
 * For channels/client generators, returns only protocol-specific examples when a protocol is specified.
 */
export function getAllExamples(
  preset: GeneratorPreset,
  protocol?: Protocol
): UsageExample[] {
  // For channels/client, return protocol-specific examples when a protocol is specified
  if ((preset === 'channels' || preset === 'client') && protocol) {
    return getExamplesForProtocol(protocol);
  }

  // For other generators or when no protocol specified, return generic examples
  return getExamplesForGenerator(preset);
}
