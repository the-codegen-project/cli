/**
 * Demo script showing usage of generated protocol-specific messaging functions
 */

// Import the generated protocols and types
import { Protocols } from './generated/index';
import { OrderCreated } from './generated/payload/OrderCreated';
import { OrderUpdated } from './generated/payload/OrderUpdated';
import { OrderCancelled } from './generated/payload/OrderCancelled';
import { OrderLifecycleParameters } from './generated/parameter/OrderLifecycleParameters';
import { Currency } from './generated/payload/Currency';
import { Money } from './generated/payload/Money';
import { OrderItem } from './generated/payload/OrderItem';
import { Address } from './generated/payload/Address';
import { OrderStatus } from './generated/payload/OrderStatus';

// Mock NATS connection
const createMockNatsConnection = () => {
  return {
    publish: (subject: string, data: Uint8Array, options?: any) => {
      console.log(`[NATS] Publishing to ${subject}:`, new TextDecoder().decode(data));
    },
    subscribe: (subject: string, options?: any) => {
      console.log(`[NATS] Subscribing to ${subject}`);
      return {
        unsubscribe: () => console.log(`[NATS] Unsubscribed from ${subject}`),
        [Symbol.asyncIterator]: async function* () {
          // Mock subscription - in real usage this would yield actual messages
        }
      } as any;
    }
  } as any;
};

// Mock Kafka client
const createMockKafka = () => {
  return {
    producer: () => ({
      connect: async () => console.log('[Kafka] Producer connected'),
      send: async (batch: any) => {
        console.log(`[Kafka] Publishing to ${batch.topic}:`, batch.messages?.[0]?.value);
        return [] as any;
      },
      disconnect: async () => console.log('[Kafka] Producer disconnected')
    }),
    consumer: (config: any) => ({
      connect: async () => console.log(`[Kafka] Consumer connected with group: ${config.groupId}`),
      subscribe: async (subscription: any) => {
        console.log(`[Kafka] Subscribing to topics:`, subscription.topics || subscription.topic);
      },
      run: async (config: any) => {
        console.log('[Kafka] Consumer running - ready to receive messages');
      },
      disconnect: async () => console.log('[Kafka] Consumer disconnected')
    })
  } as any;
};

async function demonstrateProtocolFunctions() {
  console.log('=== Order Lifecycle Events Demo (Generated Protocols) ===\n');

  // Create mock connections
  const natsConnection = createMockNatsConnection();
  const kafkaClient = createMockKafka();

  console.log('1. Order Creation Event\n');

  // Create order created message
  const orderCreatedMessage = new OrderCreated({
    orderId: '123e4567-e89b-12d3-a456-426614174000',
    customerId: '987fcdeb-51a2-43d1-9f12-345678901234',
    items: [
      new OrderItem({
        productId: 'abc123e4-5678-90ab-cdef-123456789012',
        quantity: 2,
        unitPrice: new Money({
          amount: 124950, // $1249.50 in cents
          currency: Currency.USD
        }),
        productName: 'Wireless Headphones Pro',
        productCategory: 'Electronics'
      })
    ],
    totalAmount: new Money({
      amount: 249900, // $2499.00 in cents
      currency: Currency.USD
    }),
    shippingAddress: new Address({
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      postalCode: '94102'
    }),
    createdAt: new Date().toISOString()
  })

  // Create parameters for order lifecycle
  const orderCreatedParams = new OrderLifecycleParameters({ action: 'created' });

  // Publish order created with NATS
  await Protocols.nats.publishToPublishOrderCreated({
    message: orderCreatedMessage,
    parameters: orderCreatedParams,
    nc: natsConnection
  });

  console.log('\n2. Order Update Event\n');

  // Create order updated message
  const orderUpdatedMessage = new OrderUpdated({
    orderId: '123e4567-e89b-12d3-a456-426614174000',
    status: OrderStatus.PROCESSING,
    updatedAt: new Date().toISOString(),
    reason: 'Payment confirmed, order being processed',
    updatedFields: ['status']
  });

  const orderUpdatedParams = new OrderLifecycleParameters({ action: 'updated' });

  // Publish order updated with Kafka
  await Protocols.kafka.produceToPublishOrderUpdated({
    message: orderUpdatedMessage,
    parameters: orderUpdatedParams,
    kafka: kafkaClient
  });

  console.log('\n3. Order Cancellation Event\n');

  // Create order cancelled message
  const orderCancelledMessage = new OrderCancelled({
    orderId: '123e4567-e89b-12d3-a456-426614174000',
    reason: 'Customer requested cancellation',
    cancelledAt: new Date().toISOString(),
    refundAmount: new Money({
      amount: 249900, // $2499.00 in cents
      currency: Currency.USD
    })
  });

  const orderCancelledParams = new OrderLifecycleParameters({ action: 'cancelled' });

  // Publish order cancelled with NATS
  await Protocols.nats.publishToPublishOrderCancelled({
    message: orderCancelledMessage,
    parameters: orderCancelledParams,
    nc: natsConnection
  });

  console.log('\n4. Setting up Event Subscriptions\n');

  // Subscribe to order events with NATS (for real-time processing)
  const orderSubscriptionParams = new OrderLifecycleParameters({ action: 'created' });
  await Protocols.nats.subscribeToSubscribeToOrderEvents({
    onDataCallback: (err, message, parameters, natsMsg) => {
      if (err) {
        console.error('[NATS Handler] Error processing order event:', err.message);
        return;
      }
      console.log(`[NATS Handler] Processing order event - Action: ${parameters?.action}, Order: ${message?.orderId}`);

      // Handle different order actions
      switch (parameters?.action) {
        case 'created':
          console.log(`[NATS Handler] New order created: ${message?.orderId}`);
          break;
        case 'updated':
          console.log(`[NATS Handler] Order updated: ${message?.orderId} -> ${(message as any)?.status}`);
          break;
        case 'cancelled':
          console.log(`[NATS Handler] Order cancelled: ${message?.orderId}`);
          break;
        default:
          console.log(`[NATS Handler] Unknown order action: ${parameters?.action}`);
      }
    },
    parameters: orderSubscriptionParams,
    nc: natsConnection
  });

  // Subscribe to order events with Kafka (for analytics and reporting)
  const kafkaSubscriptionParams = new OrderLifecycleParameters({ action: 'created' });
  await Protocols.kafka.consumeFromSubscribeToOrderEvents({
    onDataCallback: (err, message, parameters, kafkaMsg) => {
      if (err) {
        console.error('[Kafka Handler] Error processing order event:', err.message);
        return;
      }
      console.log(`[Kafka Handler] Recording order event for analytics - Action: ${parameters?.action}, Order: ${message?.orderId}`);

      // Analytics processing
      if (parameters?.action === 'created') {
        console.log(`[Kafka Handler] Recording new sale: ${(message as any)?.totalAmount?.amount} ${(message as any)?.totalAmount?.currency}`);
      } else if (parameters?.action === 'cancelled') {
        console.log(`[Kafka Handler] Recording cancellation with refund: ${(message as any)?.refundAmount?.amount} ${(message as any)?.refundAmount?.currency}`);
      }
    },
    parameters: kafkaSubscriptionParams,
    kafka: kafkaClient,
    options: { fromBeginning: true, groupId: 'order-analytics' }
  });

  console.log('\n5. Generated Protocol Features\n');

  console.log('✅ Type-safe order lifecycle messages');
  console.log('✅ Parameter-based topic routing (orders.created, orders.updated, orders.cancelled)');
  console.log('✅ Protocol-specific implementations (NATS/Kafka)');
  console.log('✅ Built-in message validation and serialization');
  console.log('✅ Multiple subscription patterns (Core/JetStream for NATS)');
  console.log('✅ Automatic parameter substitution in channel addresses');
  console.log('✅ Comprehensive order data modeling (items, addresses, money)');

  console.log('\n6. Order Lifecycle Flow Summary\n');

  console.log('📦 Order Created -> Real-time notifications via NATS');
  console.log('🔄 Order Updated -> Status tracking and customer notifications');
  console.log('❌ Order Cancelled -> Refund processing and inventory release');
  console.log('📊 All Events -> Analytics and reporting via Kafka');

  console.log('\n=== Order Lifecycle Demo Completed ===');
}

// Run the demo
demonstrateProtocolFunctions().catch(console.error);

// Export for potential module usage
export { demonstrateProtocolFunctions }; 