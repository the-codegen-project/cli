/**
 * Sample API specifications for the playground.
 * Users can quickly load these to try the code generator.
 * All examples are in JSON format for schema autocomplete support.
 */

export interface Example {
  id: string;
  name: string;
  description: string;
  inputType: 'asyncapi' | 'openapi' | 'jsonschema';
  spec: string;
}

export const examples: Example[] = [
  {
    id: 'asyncapi-simple',
    name: 'Simple AsyncAPI',
    description: 'Basic pub/sub messaging with user events',
    inputType: 'asyncapi',
    spec: JSON.stringify(
      {
        asyncapi: '3.0.0',
        info: {
          title: 'User Service',
          version: '1.0.0',
          description: 'Simple user events service',
        },
        channels: {
          userCreated: {
            address: 'users/created',
            messages: {
              UserCreated: {
                $ref: '#/components/messages/UserCreated',
              },
            },
          },
          userUpdated: {
            address: 'users/updated',
            messages: {
              UserUpdated: {
                $ref: '#/components/messages/UserUpdated',
              },
            },
          },
        },
        operations: {
          publishUserCreated: {
            action: 'send',
            channel: {
              $ref: '#/channels/userCreated',
            },
          },
          subscribeUserUpdated: {
            action: 'receive',
            channel: {
              $ref: '#/channels/userUpdated',
            },
          },
        },
        components: {
          messages: {
            UserCreated: {
              payload: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string', format: 'email' },
                  name: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
                required: ['id', 'email', 'name'],
              },
            },
            UserUpdated: {
              payload: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
                required: ['id'],
              },
            },
          },
        },
      },
      null,
      2
    ),
  },
  {
    id: 'asyncapi-multi-protocol',
    name: 'Multi-Protocol AsyncAPI',
    description: 'Order processing with NATS and Kafka',
    inputType: 'asyncapi',
    spec: JSON.stringify(
      {
        asyncapi: '3.0.0',
        info: {
          title: 'Order Processing Service',
          version: '2.0.0',
          description: 'Order management with multiple protocols',
        },
        servers: {
          natsServer: {
            host: 'nats://localhost:4222',
            protocol: 'nats',
          },
          kafkaServer: {
            host: 'kafka://localhost:9092',
            protocol: 'kafka',
          },
        },
        channels: {
          orderCreated: {
            address: 'orders/created',
            messages: {
              OrderCreated: {
                $ref: '#/components/messages/OrderCreated',
              },
            },
          },
          orderShipped: {
            address: 'orders/shipped',
            messages: {
              OrderShipped: {
                $ref: '#/components/messages/OrderShipped',
              },
            },
          },
        },
        operations: {
          publishOrderCreated: {
            action: 'send',
            channel: {
              $ref: '#/channels/orderCreated',
            },
          },
          subscribeOrderShipped: {
            action: 'receive',
            channel: {
              $ref: '#/channels/orderShipped',
            },
          },
        },
        components: {
          messages: {
            OrderCreated: {
              payload: {
                type: 'object',
                properties: {
                  orderId: { type: 'string' },
                  customerId: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        productId: { type: 'string' },
                        quantity: { type: 'integer' },
                        price: { type: 'number' },
                      },
                    },
                  },
                  total: { type: 'number' },
                  status: {
                    type: 'string',
                    enum: ['pending', 'processing', 'shipped', 'delivered'],
                  },
                },
                required: ['orderId', 'customerId', 'items', 'total'],
              },
            },
            OrderShipped: {
              payload: {
                type: 'object',
                properties: {
                  orderId: { type: 'string' },
                  trackingNumber: { type: 'string' },
                  carrier: { type: 'string' },
                  shippedAt: { type: 'string', format: 'date-time' },
                },
                required: ['orderId', 'trackingNumber'],
              },
            },
          },
        },
      },
      null,
      2
    ),
  },
  {
    id: 'openapi-rest',
    name: 'OpenAPI REST API',
    description: 'Pet store API with CRUD operations',
    inputType: 'openapi',
    spec: JSON.stringify(
      {
        openapi: '3.0.3',
        info: {
          title: 'Pet Store API',
          version: '1.0.0',
          description: 'Sample pet store REST API',
        },
        paths: {
          '/pets': {
            get: {
              operationId: 'listPets',
              summary: 'List all pets',
              parameters: [
                {
                  name: 'limit',
                  in: 'query',
                  schema: {
                    type: 'integer',
                    maximum: 100,
                  },
                },
              ],
              responses: {
                '200': {
                  description: 'A list of pets',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Pet',
                        },
                      },
                    },
                  },
                },
              },
            },
            post: {
              operationId: 'createPet',
              summary: 'Create a pet',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/CreatePet',
                    },
                  },
                },
              },
              responses: {
                '201': {
                  description: 'Created pet',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/Pet',
                      },
                    },
                  },
                },
              },
            },
          },
          '/pets/{petId}': {
            get: {
              operationId: 'getPet',
              summary: 'Get a pet by ID',
              parameters: [
                {
                  name: 'petId',
                  in: 'path',
                  required: true,
                  schema: {
                    type: 'string',
                  },
                },
              ],
              responses: {
                '200': {
                  description: 'A pet',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/Pet',
                      },
                    },
                  },
                },
                '404': {
                  description: 'Pet not found',
                },
              },
            },
          },
        },
        components: {
          schemas: {
            Pet: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                species: {
                  type: 'string',
                  enum: ['dog', 'cat', 'bird', 'fish'],
                },
                age: { type: 'integer' },
                createdAt: { type: 'string', format: 'date-time' },
              },
              required: ['id', 'name', 'species'],
            },
            CreatePet: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                species: {
                  type: 'string',
                  enum: ['dog', 'cat', 'bird', 'fish'],
                },
                age: { type: 'integer' },
              },
              required: ['name', 'species'],
            },
          },
        },
      },
      null,
      2
    ),
  },
  {
    id: 'jsonschema-complex',
    name: 'JSON Schema Models',
    description: 'Complex e-commerce data models',
    inputType: 'jsonschema',
    spec: JSON.stringify(
      {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'https://example.com/order.schema.json',
        title: 'Order',
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          customer: { $ref: '#/definitions/Customer' },
          items: {
            type: 'array',
            items: { $ref: '#/definitions/OrderItem' },
            minItems: 1,
          },
          total: { type: 'number' },
          currency: { type: 'string', enum: ['USD', 'EUR', 'GBP'] },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'customer', 'items', 'total', 'currency', 'status'],
        definitions: {
          Address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              zipCode: { type: 'string', pattern: '^[0-9]{5}(-[0-9]{4})?$' },
              country: { type: 'string' },
            },
            required: ['street', 'city', 'country'],
          },
          Customer: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              phone: { type: 'string' },
              shippingAddress: { $ref: '#/definitions/Address' },
              billingAddress: { $ref: '#/definitions/Address' },
              createdAt: { type: 'string', format: 'date-time' },
            },
            required: ['id', 'email', 'firstName', 'lastName'],
          },
          Product: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number', minimum: 0 },
              currency: { type: 'string', enum: ['USD', 'EUR', 'GBP'] },
              category: { type: 'string' },
              inStock: { type: 'boolean' },
              tags: { type: 'array', items: { type: 'string' } },
            },
            required: ['id', 'name', 'price', 'currency'],
          },
          OrderItem: {
            type: 'object',
            properties: {
              product: { $ref: '#/definitions/Product' },
              quantity: { type: 'integer', minimum: 1 },
              unitPrice: { type: 'number' },
              subtotal: { type: 'number' },
            },
            required: ['product', 'quantity', 'unitPrice'],
          },
        },
      },
      null,
      2
    ),
  },
];

/**
 * Get an example by ID.
 */
export function getExample(id: string): Example | undefined {
  return examples.find((e) => e.id === id);
}
