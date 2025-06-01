/**
 * E-commerce Topic Types Usage Example
 * 
 * This file demonstrates how to use the generated TypeScript topic types
 * from the AsyncAPI specification for an e-commerce messaging system.
 * 
 * This example showcases all the patterns mentioned in the accompanying blog post:
 * - Type-Safe Event Publisher
 * - Type-Safe Event Router  
 * - Message Broker Integration (NATS, Kafka)
 * - Environment-Specific Channel Mapping
 * - Channel Health Monitoring
 * 
 * Run: npm run demo
 */

// Import generated types and utility functions
import { Topics, TopicIds, ToTopicIds, ToTopics } from './generated/types/Types';

console.log('🚀 E-commerce Topic Types Demo - Blog Post Examples\n');

// ============================================================================
// 1. Basic Topic Types (Foundation)
// ============================================================================
console.log('=== 1. Available Topic Types ===');

const allTopics: Topics[] = [
  'ecommerce.orders.{orderId}',
  'ecommerce.payments.{paymentId}',
  'ecommerce.inventory.{productId}',
  'ecommerce.notifications.{customerId}',
  'ecommerce.analytics.events'
];

const allTopicIds: TopicIds[] = [
  'order-events',
  'payment-events',
  'inventory-events',
  'customer-notifications',
  'analytics-events'
];

console.log('Topics:', allTopics);
console.log('Topic IDs:', allTopicIds);

// ============================================================================
// 2. Type-Safe Event Publisher (Blog Example)
// ============================================================================
console.log('\n=== 2. Type-Safe Event Publisher ===');

// Mock messaging client for demonstration
class MockMessagingClient {
  async publish(address: string, data: any) {
    console.log(`📨 Publishing to: ${address}`, JSON.stringify(data, null, 2));
  }
}

export class EventPublisher {
  constructor(private messagingClient: MockMessagingClient) {}

  async publish(topicId: TopicIds, data: any, parameters?: Record<string, string>) {
    let address = ToTopics(topicId);
    
    // Replace parameters in address template
    if (parameters) {
      for (const [key, value] of Object.entries(parameters)) {
        address = address.replace(`{${key}}`, value) as any;
      }
    }
    
    await this.messagingClient.publish(address, data);
  }
}

// Demo the EventPublisher
const messagingClient = new MockMessagingClient();
const publisher = new EventPublisher(messagingClient);

console.log('Publishing events with type safety:');
await publisher.publish('order-events', { orderId: '123', status: 'created' }, { orderId: '123' });
await publisher.publish('payment-events', { paymentId: 'pay-456', amount: 100 }, { paymentId: 'pay-456' });
await publisher.publish('analytics-events', { userId: '789', action: 'purchase' });

// ============================================================================
// 3. Type-Safe Event Router (Blog Example)  
// ============================================================================
console.log('\n=== 3. Type-Safe Event Router ===');

type EventHandler = (data: any) => Promise<void>;

export class EventRouter {
  private handlers = new Map<TopicIds, EventHandler[]>();

  register(topicId: TopicIds, handler: EventHandler) {
    if (!this.handlers.has(topicId)) {
      this.handlers.set(topicId, []);
    }
    this.handlers.get(topicId)!.push(handler);
  }

  async route(topicId: TopicIds, data: any) {
    const handlers = this.handlers.get(topicId) || [];
    console.log(`🔀 Routing ${topicId} to ${handlers.length} handlers`);
    await Promise.all(handlers.map(handler => handler(data)));
  }
}

// Demo the EventRouter
const router = new EventRouter();

router.register('order-events', async (data) => {
  console.log('📦 Processing order event:', data);
});

router.register('payment-events', async (data) => {
  console.log('💳 Processing payment event:', data);
});

router.register('inventory-events', async (data) => {
  console.log('📊 Processing inventory event:', data);
});

// Route some events
await router.route('order-events', { orderId: 'order-123', status: 'shipped' });
await router.route('payment-events', { paymentId: 'pay-789', status: 'completed' });

// ============================================================================
// 4. Message Broker Integration Examples (Blog Examples)
// ============================================================================
console.log('\n=== 4. Message Broker Integration ===');

// NATS Integration Example
class NATSEventService {
  constructor(private nc: any) {}

  async subscribe(topicId: TopicIds, handler: (data: any) => void) {
    const addressTemplate = ToTopics(topicId);
    // Convert template to NATS subject pattern
    const subject = addressTemplate.replace(/\{[^}]+\}/g, '*');
    
    console.log(`🔗 NATS: Subscribing to ${subject} for ${topicId}`);
    
    // Mock subscription for demo
    setTimeout(() => {
      handler({ mockData: `NATS message for ${topicId}` });
    }, 100);
  }

  async publish(topicId: TopicIds, data: any, parameters: Record<string, string>) {
    let subject = ToTopics(topicId);
    for (const [key, value] of Object.entries(parameters)) {
      subject = subject.replace(`{${key}}`, value) as any;
    }
    console.log(`📡 NATS: Publishing to ${subject}:`, data);
  }
}

// Kafka Integration Example  
class KafkaEventService {
  async publishToChannel(topicId: TopicIds, key: string, data: any) {
    // Map topic IDs to Kafka topics
    const topicMap: Record<TopicIds, string> = {
      'order-events': 'ecommerce-orders',
      'payment-events': 'ecommerce-payments', 
      'inventory-events': 'ecommerce-inventory',
      'customer-notifications': 'ecommerce-notifications',
      'analytics-events': 'ecommerce-analytics'
    };

    const topic = topicMap[topicId];
    console.log(`🚀 Kafka: Publishing to ${topic} (${topicId}) with key ${key}:`, data);
  }
}

// Demo broker integrations
const natsService = new NATSEventService(null); // Mock connection
const kafkaService = new KafkaEventService();

await natsService.subscribe('order-events', (data) => {
  console.log('📥 NATS received:', data);
});

await natsService.publish('order-events', { orderId: 'nats-123' }, { orderId: 'nats-123' });
await kafkaService.publishToChannel('payment-events', 'customer-456', { amount: 99.99 });

// ============================================================================
// 5. Environment-Specific Channel Mapping (Blog Example)
// ============================================================================
console.log('\n=== 5. Environment-Specific Channel Mapping ===');

class EnvironmentAwarePublisher {
  constructor(private messagingClient: MockMessagingClient) {}

  private getEnvironmentPrefix(): string {
    return process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
  }

  async publish(topicId: TopicIds, data: any, parameters?: Record<string, string>) {
    let address = ToTopics(topicId);
    
    // Add environment prefix
    const envPrefix = this.getEnvironmentPrefix();
    address = `${envPrefix}.${address}` as any;
    
    // Replace parameters
    if (parameters) {
      for (const [key, value] of Object.entries(parameters)) {
        address = address.replace(`{${key}}`, value) as any;
      }
    }
    
    await this.messagingClient.publish(address, data);
  }
}

// Demo environment-aware publishing
const envPublisher = new EnvironmentAwarePublisher(messagingClient);
console.log('Publishing with environment prefix:');
await envPublisher.publish('order-events', { orderId: 'env-123' }, { orderId: 'env-123' });

// ============================================================================
// 6. Channel Health Monitoring (Blog Example)
// ============================================================================
console.log('\n=== 6. Channel Health Monitoring ===');

export class ChannelMonitor {
  private metrics = new Map<TopicIds, { published: number; errors: number }>();

  constructor() {
    // Initialize metrics for all known channels
    const channels: TopicIds[] = [
      'order-events', 
      'payment-events', 
      'inventory-events',
      'customer-notifications', 
      'analytics-events'
    ];
    
    channels.forEach(channel => {
      this.metrics.set(channel, { published: 0, errors: 0 });
    });
  }

  recordPublish(topicId: TopicIds) {
    const metric = this.metrics.get(topicId)!;
    metric.published++;
  }

  recordError(topicId: TopicIds) {
    const metric = this.metrics.get(topicId)!;
    metric.errors++;
  }

  getHealthReport() {
    const report: Record<string, any> = {};
    this.metrics.forEach((metric, topicId) => {
      report[topicId] = {
        published: metric.published,
        errors: metric.errors,
        errorRate: metric.published > 0 ? metric.errors / metric.published : 0
      };
    });
    return report;
  }
}

// Demo channel monitoring
const monitor = new ChannelMonitor();

// Simulate some activity
monitor.recordPublish('order-events');
monitor.recordPublish('order-events');
monitor.recordPublish('payment-events');
monitor.recordError('payment-events');
monitor.recordPublish('analytics-events');

console.log('📊 Channel Health Report:');
console.log(JSON.stringify(monitor.getHealthReport(), null, 2));

// ============================================================================
// 7. Topic Conversion & Parameter Handling
// ============================================================================
console.log('\n=== 7. Topic Conversion & Parameter Handling ===');

console.log('Topics → Topic IDs:');
allTopics.forEach(topic => {
  const topicId = ToTopicIds(topic);
  console.log(`  ${topic} → ${topicId}`);
});

console.log('\nTopic IDs → Topics:');
allTopicIds.forEach(topicId => {
  const topic = ToTopics(topicId);
  console.log(`  ${topicId} → ${topic}`);
});

// Parameter substitution examples
console.log('\nParameter Substitution:');
function buildActualTopic(topicTemplate: Topics, params: Record<string, string>): string {
  let actualTopic = topicTemplate;
  for (const [key, value] of Object.entries(params)) {
    actualTopic = actualTopic.replace(`{${key}}`, value) as Topics;
  }
  return actualTopic;
}

const paramExamples = [
  { template: 'ecommerce.orders.{orderId}' as Topics, params: { orderId: 'order-123' } as Record<string, string>},
  { template: 'ecommerce.payments.{paymentId}' as Topics, params: { paymentId: 'pay-abc456' } as Record<string, string>},
  { template: 'ecommerce.notifications.{customerId}' as Topics, params: { customerId: 'cust-def123' } as Record<string, string>}
];

paramExamples.forEach(example => {
  const actualTopic = buildActualTopic(example.template, example.params);
  console.log(`  ${example.template} → ${actualTopic}`);
});

// ============================================================================
// 8. Error Handling & Type Safety
// ============================================================================
console.log('\n=== 8. Error Handling & Type Safety ===');

try {
  // This would be caught at compile time in real usage
  const invalidTopicId = 'invalid-topic-id' as TopicIds;
  ToTopics(invalidTopicId);
} catch (error) {
  console.log('✅ Caught expected error for invalid topic ID');
}

try {
  // This would be caught at compile time in real usage
  const invalidTopic = 'invalid.topic' as Topics;
  ToTopicIds(invalidTopic);
} catch (error) {
  console.log('✅ Caught expected error for invalid topic');
}

// ============================================================================
// 9. Comprehensive Integration Example
// ============================================================================
console.log('\n=== 9. Comprehensive Integration Example ===');

class ECommerceEventSystem {
  private publisher: EventPublisher;
  private router: EventRouter;
  private monitor: ChannelMonitor;

  constructor() {
    this.publisher = new EventPublisher(new MockMessagingClient());
    this.router = new EventRouter();
    this.monitor = new ChannelMonitor();
    this.setupHandlers();
  }

  private setupHandlers() {
    this.router.register('order-events', async (data) => {
      console.log('🛒 Order handler:', data);
      this.monitor.recordPublish('order-events');
    });

    this.router.register('payment-events', async (data) => {
      console.log('💰 Payment handler:', data);
      this.monitor.recordPublish('payment-events');
    });

    this.router.register('inventory-events', async (data) => {
      console.log('📦 Inventory handler:', data);
      this.monitor.recordPublish('inventory-events');
    });
  }

  async processOrderWorkflow() {
    console.log('\n🔄 Processing order workflow:');
    
    // Create order
    await this.publisher.publish('order-events', 
      { orderId: 'order-789', status: 'created', amount: 150 }, 
      { orderId: 'order-789' }
    );
    
    // Process payment
    await this.publisher.publish('payment-events', 
      { paymentId: 'pay-789', orderId: 'order-789', amount: 150 }, 
      { paymentId: 'pay-789' }
    );
    
    // Update inventory
    await this.publisher.publish('inventory-events', 
      { productId: 'prod-456', oldQuantity: 10, newQuantity: 9 }, 
      { productId: 'prod-456' }
    );

    // Route the events
    await this.router.route('order-events', { orderId: 'order-789', status: 'confirmed' });
    await this.router.route('payment-events', { paymentId: 'pay-789', status: 'completed' });
    await this.router.route('inventory-events', { productId: 'prod-456', quantity: 9 });
  }

  getSystemHealth() {
    return this.monitor.getHealthReport();
  }
}

// Demo the complete system
const ecommerceSystem = new ECommerceEventSystem();
await ecommerceSystem.processOrderWorkflow();

console.log('\n📊 Final System Health:');
console.log(JSON.stringify(ecommerceSystem.getSystemHealth(), null, 2));

// ============================================================================
// Summary
// ============================================================================
console.log('\n✨ Demo Complete! This example showcases:');
console.log('');
console.log('📚 Blog Post Examples Demonstrated:');
console.log('  • Type-Safe Event Publisher');
console.log('  • Type-Safe Event Router');
console.log('  • NATS & Kafka Integration');
console.log('  • Environment-Specific Channel Mapping');
console.log('  • Channel Health Monitoring');
console.log('  • Comprehensive Integration Example');
console.log('');
console.log('🔑 Key Benefits:');
console.log('  • Strong TypeScript typing prevents errors at compile time');
console.log('  • Bidirectional conversion between topic formats');
console.log('  • Runtime error handling for invalid inputs');
console.log('  • Type-safe integration with messaging systems');
console.log('  • Dynamic parameter substitution for entity-specific topics');
console.log('  • Production-ready patterns for real-world applications');
console.log('');
console.log('🎯 Try making changes to see TypeScript catch errors:');
console.log('  • Change a topic ID to an invalid value');
console.log('  • Try to publish to a non-existent channel');
console.log('  • See how IDE autocomplete helps with valid options'); 