/**
 * E-commerce Payload Models Usage Example
 * 
 * This file demonstrates how to use the generated TypeScript payload models
 * from the AsyncAPI specification for an e-commerce order system.
 * 
 * Run: npm run demo
 */

// Import generated payload models
import { OrderCreated } from './generated/models/OrderCreated.js';
import { PaymentProcessed } from './generated/models/PaymentProcessed.js';
import { OrderStatusChanged } from './generated/models/OrderStatusChanged.js';
import { validate as validateNotification } from './generated/models/NotificationSent.js';
import { Address } from './generated/models/Address.js';
import { OrderStatus } from './generated/models/OrderStatus.js';
import { Currency } from './generated/models/Currency.js';
import { OrderItem } from './generated/models/OrderItem.js';
import { PaymentStatus } from './generated/models/PaymentStatus.js';
import { EmailNotification } from './generated/models/EmailNotification.js';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`${title}`, colors.bright);
  log(`${'='.repeat(60)}`, colors.cyan);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function demonstrateOrderCreation() {
  logSection('1. Creating and Validating Order Data');
  
  try {
    // Create a shipping address
    const shippingAddress = new Address({
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'US'
    });
    
    logSuccess('Shipping address created');
    
    // Create order items using the correct OrderItem structure
    const items: OrderItem[] = [
      new OrderItem({
        productId: 'LAPTOP-001',
        quantity: 1,
        unitPrice: 249900
      }),
      new OrderItem({
        productId: 'MOUSE-001',
        quantity: 2,
        unitPrice: 7900
      })
    ];
    
    // Create an order with complex nested data
    const orderData = {
      orderId: '123e4567-e89b-12d3-a456-426614174000',
      customerId: '987fcdeb-51a2-43d1-9f12-345678901234',
      items: items,
      totalAmount: 265700,
      currency: Currency.USD,
      shippingAddress: shippingAddress
    };
    
    const order = new OrderCreated(orderData);
    logSuccess('Order created with nested items and address');
    
    // Validate the order data
    const validation = OrderCreated.validate({ data: order.marshal() });
    if (validation.valid) {
      logSuccess('Order validation passed ✨');
    } else {
      logError('Order validation failed');
      console.log('Validation errors:', validation.errors);
      return;
    }
    
    // Display order details
    logInfo('Order Details:');
    console.log(`  Order ID: ${order.orderId}`);
    console.log(`  Customer ID: ${order.customerId}`);
    console.log(`  Items: ${order.items?.length || 0}`);
    console.log(`  Total: $${(order.totalAmount / 100).toFixed(2)} ${order.currency}`);
    console.log(`  Shipping to: ${order.shippingAddress?.city}, ${order.shippingAddress?.state}`);
    
    return order;
    
  } catch (error) {
    logError(`Failed to create order: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function demonstratePaymentProcessing(order: OrderCreated) {
  logSection('2. Processing Payment');
  
  try {
    const paymentData = {
      paymentId: 'pay_' + Math.random().toString(36).substr(2, 9),
      orderId: order.orderId,
      amount: order.totalAmount,
      currency: Currency.USD,
      status: PaymentStatus.SUCCESS
    };
    
    const payment = new PaymentProcessed(paymentData);
    logSuccess('Payment processed');
    
    // Validate payment
    const validation = PaymentProcessed.validate({ data: payment.marshal() });
    if (validation.valid) {
      logSuccess('Payment validation passed ✨');
    } else {
      logError('Payment validation failed');
      console.log('Validation errors:', validation.errors);
      return;
    }
    
    logInfo('Payment Details:');
    console.log(`  Payment ID: ${payment.paymentId}`);
    console.log(`  Amount: $${(payment.amount / 100).toFixed(2)} ${payment.currency}`);
    console.log(`  Status: ${payment.status}`);
    
    return payment;
    
  } catch (error) {
    logError(`Failed to process payment: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function demonstrateOrderStatusUpdate(order: OrderCreated) {
  logSection('3. Updating Order Status');
  
  try {
    const statusUpdateData = {
      orderId: order.orderId,
      previousStatus: OrderStatus.PENDING,
      newStatus: OrderStatus.PROCESSING,
      timestamp: new Date().toISOString()
    };
    
    const statusUpdate = new OrderStatusChanged(statusUpdateData);
    logSuccess('Order status updated');
    
    // Validate status update
    const validation = OrderStatusChanged.validate({ data: statusUpdate.marshal() });
    if (validation.valid) {
      logSuccess('Status update validation passed ✨');
    } else {
      logError('Status update validation failed');
      console.log('Validation errors:', validation.errors);
      return;
    }
    
    logInfo('Status Update Details:');
    console.log(`  Order ID: ${statusUpdate.orderId}`);
    console.log(`  Status: ${statusUpdate.previousStatus} → ${statusUpdate.newStatus}`);
    console.log(`  Timestamp: ${statusUpdate.timestamp}`);
    
    return statusUpdate;
    
  } catch (error) {
    logError(`Failed to update order status: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function demonstrateNotificationSending(order: OrderCreated) {
  logSection('4. Sending Notifications');
  
  try {
    // Create an email notification using EmailNotification
    const emailNotification = new EmailNotification({
      recipientId: order.customerId,
      subject: 'Order Confirmation',
      body: `Your order ${order.orderId} has been confirmed.`
    });
    
    logSuccess('Email notification created');
    
    // Validate notification
    const validation = validateNotification({ data: emailNotification.marshal() });
    if (validation.valid) {
      logSuccess('Notification validation passed ✨');
    } else {
      logError('Notification validation failed');
      console.log('Validation errors:', validation.errors);
      return;
    }
    
    logInfo('Notification Details:');
    console.log(`  Type: ${emailNotification.type}`);
    console.log(`  Recipient: ${emailNotification.recipientId}`);
    console.log(`  Subject: ${emailNotification.subject}`);
    
    return emailNotification;
    
  } catch (error) {
    logError(`Failed to send notification: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function demonstrateSerialization() {
  logSection('5. Serialization and Deserialization');
  
  try {
    // Create a simple order
    const items = [new OrderItem({
      productId: 'TEST-001',
      quantity: 1,
      unitPrice: 1000
    })];
    
    const originalOrder = new OrderCreated({
      orderId: 'test-order-123',
      customerId: 'test-customer-456',
      items: items,
      totalAmount: 1000,
      currency: Currency.USD
    });
    
    // Serialize to JSON
    const serialized = originalOrder.marshal();
    logSuccess('Order serialized to JSON');
    logInfo('Serialized data preview:');
    console.log(JSON.stringify(JSON.parse(serialized), null, 2).substring(0, 200) + '...');
    
    // Deserialize from JSON
    const deserializedOrder = OrderCreated.unmarshal(serialized);
    logSuccess('Order deserialized from JSON');
    
    // Verify data integrity
    if (deserializedOrder.orderId === originalOrder.orderId && 
        deserializedOrder.customerId === originalOrder.customerId) {
      logSuccess('Data integrity verified ✨');
    } else {
      logError('Data integrity check failed');
    }
    
  } catch (error) {
    logError(`Serialization demo failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function demonstrateMessagingIntegration() {
  logSection('6. Messaging Integration Examples');
  
  logInfo('Here\'s how you can integrate these models with popular messaging systems:');
  
  console.log(`
${colors.yellow}// NATS Integration${colors.reset}
import { connect } from 'nats';

const nc = await connect({ servers: 'nats://localhost:4222' });

// Publish order created event
const order = new OrderCreated({ /* ... */ });
await nc.publish('orders.created', order.marshal());

// Subscribe to order events
const sub = nc.subscribe('orders.*');
for await (const msg of sub) {
  const orderData = OrderCreated.unmarshal(msg.data.toString());
  console.log('Received order:', orderData.orderId);
}

${colors.yellow}// Apache Kafka Integration${colors.reset}
import { Kafka } from 'kafkajs';

const kafka = new Kafka({ clientId: 'ecommerce-app', brokers: ['localhost:9092'] });
const producer = kafka.producer();

// Send order event
const order = new OrderCreated({ /* ... */ });
await producer.send({
  topic: 'order-events',
  messages: [{
    key: order.orderId,
    value: order.marshal(),
    headers: { eventType: 'OrderCreated' }
  }]
});

${colors.yellow}// Redis Streams Integration${colors.reset}
import Redis from 'ioredis';

const redis = new Redis();

// Add order to stream
const order = new OrderCreated({ /* ... */ });
await redis.xadd('order-stream', '*', 'data', order.marshal());

// Read from stream
const messages = await redis.xread('STREAMS', 'order-stream', '0');
for (const [stream, msgs] of messages) {
  for (const [id, fields] of msgs) {
    const orderData = OrderCreated.unmarshal(fields[1]);
    console.log('Processing order:', orderData.orderId);
  }
}

${colors.yellow}// RabbitMQ Integration${colors.reset}
import amqp from 'amqplib';

const connection = await amqp.connect('amqp://localhost');
const channel = await connection.createChannel();

// Publish order event
const order = new OrderCreated({ /* ... */ });
await channel.publish('order-exchange', 'order.created', Buffer.from(order.marshal()));

// Consume order events
await channel.consume('order-queue', (msg) => {
  if (msg) {
    const orderData = OrderCreated.unmarshal(msg.content.toString());
    console.log('Processing order:', orderData.orderId);
    channel.ack(msg);
  }
});
  `);
}

async function main() {
  log(`${colors.bright}🚀 E-commerce Payload Models Demo${colors.reset}`);
  log(`${colors.cyan}Demonstrating generated TypeScript payload models from AsyncAPI${colors.reset}\n`);
  
  try {
    // Run through the complete workflow
    const order = await demonstrateOrderCreation();
    if (!order) {
      logError('Failed to create order, stopping demo');
      return;
    }
    
    const payment = await demonstratePaymentProcessing(order);
    const statusUpdate = await demonstrateOrderStatusUpdate(order);
    const notification = await demonstrateNotificationSending(order);
    
    await demonstrateSerialization();
    await demonstrateMessagingIntegration();
    
    logSection('Demo Complete');
    logSuccess('All demonstrations completed successfully! 🎉');
    
    logSection('Key Features Demonstrated');
    log('✨ Type-safe TypeScript classes with getters/setters', colors.green);
    log('✨ JSON Schema validation with AJV', colors.green);
    log('✨ Marshal/unmarshal for serialization', colors.green);
    log('✨ Complex nested objects and arrays', colors.green);
    log('✨ Union types for polymorphic messages', colors.green);
    log('✨ Enum support for constrained values', colors.green);
    log('✨ Data integrity and validation', colors.green);
    log('✨ Integration with messaging systems', colors.green);
    
    logSection('Next Steps');
    logInfo('1. Explore the generated models in src/generated/models/');
    logInfo('2. Integrate with your preferred messaging system');
    logInfo('3. Add custom business logic around the payload models');
    logInfo('4. Set up automated validation in your message handlers');
    
  } catch (error) {
    logError(`Demo failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the demo
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
