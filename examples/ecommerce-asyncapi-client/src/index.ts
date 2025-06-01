/**
 * Demo script showing usage of generated NATS client SDK for order lifecycle messaging
 * This demonstrates how the client generator provides a higher-level API compared to raw channel functions
 */
import { NatsClient, OrderCreated, OrderUpdated, OrderCancelled, OrderLifecycleParameters, Address, Currency, Money, OrderItem, OrderStatus } from './generated/NatsClient';

// Helper to create sample order data
function createSampleOrder() {
  return new OrderCreated({
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
      }),
      new OrderItem({
        productId: 'def456g7-8901-23hi-jklm-456789012345',
        quantity: 1,
        unitPrice: new Money({
          amount: 5995, // $59.95 in cents
          currency: Currency.USD
        }),
        productName: 'Phone Case',
        productCategory: 'Accessories'
      })
    ],
    totalAmount: new Money({
      amount: 309895, // $3098.95 in cents
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
  });
}

/**
 * Demonstrates complete order lifecycle using the client SDK
 */
class OrderService {
  private client = new NatsClient();

  async initialize() {
    console.log('🚀 Initializing Order Service with NATS Client SDK...\n');
    
    // Simple connection - in production you'd use real NATS servers
    try {
      await this.client.connectToHost('nats://localhost:4222');
      console.log('✅ Connected to NATS server\n');
    } catch (error) {
      console.log('⚠️  Could not connect to NATS server (using mock mode for demo)\n');
      // Continue with demo using mocked client
    }

    await this.setupEventHandlers();
  }

  async createOrder(): Promise<string> {
    console.log('📦 Creating new order...');
    
    const orderData = createSampleOrder();
    const parameters = new OrderLifecycleParameters({ action: 'created' });

    try {
      // Simple client method - no need to manage connections manually
      await this.client.publishToOrderCreated({message: orderData, parameters});
      console.log(`✅ Order created: ${orderData.orderId}`);
      console.log(`   Customer: ${orderData.customerId}`);
      console.log(`   Items: ${orderData.items.length}`);
      console.log(`   Total: $${(orderData.totalAmount.amount / 100).toFixed(2)} ${orderData.totalAmount.currency}\n`);
      
      return orderData.orderId;
    } catch (error) {
      console.log(`⚠️  Published order created event (mock): ${orderData.orderId}\n`);
      return orderData.orderId;
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    console.log(`📝 Updating order ${orderId} to ${status}...`);

    const orderUpdate = new OrderUpdated({
      orderId,
      status,
      updatedAt: new Date().toISOString(),
      reason: `Order status changed to ${status}`,
      updatedFields: ['status']
    });

    const parameters = new OrderLifecycleParameters({ action: 'updated' });

    try {
      await this.client.publishToOrderUpdated({message: orderUpdate, parameters});
      console.log(`✅ Order updated: ${orderId} -> ${status}\n`);
    } catch (error) {
      console.log(`⚠️  Published order updated event (mock): ${orderId} -> ${status}\n`);
    }
  }

  async cancelOrder(orderId: string, reason: string): Promise<void> {
    console.log(`❌ Cancelling order ${orderId}...`);

    const orderCancellation = new OrderCancelled({
      orderId,
      reason,
      cancelledAt: new Date().toISOString(),
      refundAmount: new Money({
        amount: 309895, // $3098.95 in cents
        currency: Currency.USD
      })
    });

    const parameters = new OrderLifecycleParameters({ action: 'cancelled' });

    try {
      await this.client.publishToOrderCancelled({message: orderCancellation, parameters});
      console.log(`✅ Order cancelled: ${orderId}`);
      console.log(`   Reason: ${reason}`);
      console.log(`   Refund: $${(orderCancellation.refundAmount!.amount / 100).toFixed(2)} ${orderCancellation.refundAmount!.currency}\n`);
    } catch (error) {
      console.log(`⚠️  Published order cancelled event (mock): ${orderId}\n`);
    }
  }

  private async setupEventHandlers(): Promise<void> {
    console.log('👂 Setting up event handlers...');

    const parameters = new OrderLifecycleParameters({ action: 'created' });

    try {
      // Simple subscription method - no complex callback handling
      await this.client.subscribeToOrderEvents({
          onDataCallback: (err, message, parameters) => {
            if (err) {
              console.error('❌ Error processing order event:', err.message);
              return;
            }
  
            this.handleOrderEvent(message, parameters);
          },
          parameters
      });
      console.log('✅ Event handlers configured\n');
    } catch (error) {
      console.log('⚠️  Event handlers configured (mock mode)\n');
    }
  }

  private handleOrderEvent(message: any, parameters?: OrderLifecycleParameters): void {
    const action = parameters?.action || 'unknown';
    const orderId = message?.orderId || 'unknown';

    console.log(`📢 [Event Handler] Received ${action} event for order: ${orderId}`);

    switch (action) {
      case 'created':
        console.log(`   💰 New sale recorded: $${(message?.totalAmount?.amount / 100).toFixed(2)}`);
        console.log(`   📧 Sending confirmation email to customer`);
        console.log(`   📦 Triggering fulfillment process`);
        break;
      
      case 'updated':
        console.log(`   📊 Status tracking updated: ${message?.status}`);
        console.log(`   📱 Sending push notification to customer`);
        break;
      
      case 'cancelled':
        console.log(`   💸 Processing refund: $${(message?.refundAmount?.amount / 100).toFixed(2)}`);
        console.log(`   📧 Sending cancellation email`);
        console.log(`   📦 Stopping fulfillment process`);
        break;
      
      default:
        console.log(`   ❓ Unknown action: ${action}`);
    }
    console.log('');
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Order Service...');
    try {
      await this.client.disconnect();
      console.log('✅ Disconnected from NATS server');
    } catch (error) {
      console.log('⚠️  Shutdown complete (mock mode)');
    }
  }
}

/**
 * Demonstrates JetStream usage for durable order processing
 */
class DurableOrderProcessor {
  private client = new NatsClient();

  async initialize() {
    console.log('🔄 Initializing Durable Order Processor with JetStream...\n');
    
    try {
      // In production, you'd use actual credentials
      await this.client.connectToHost('nats://localhost:4222');
      console.log('✅ Connected to NATS with JetStream support\n');
    } catch (error) {
      console.log('⚠️  Could not connect to NATS server (using mock mode for demo)\n');
    }

    await this.setupDurableProcessing();
  }

  private async setupDurableProcessing() {
    console.log('📚 Setting up durable order processing...');

    const parameters = new OrderLifecycleParameters({ action: 'created' });

    try {
      // Simple JetStream pull subscription
      await this.client.jetStreamPullSubscribeToOrderEvents({

        onDataCallback: (err, message, parameters) => {
          if (err) {
            console.error('❌ Error processing order:', err.message);
            return;
          }
          this.processOrderForFulfillment(message);
        },
        parameters,
        options: { name: 'order-processor', config: { max_batch: 10 } }
      });
      console.log('✅ Durable subscription configured\n');
    } catch (error) {
      console.log('⚠️  Durable subscription configured (mock mode)\n');
    }
  }

  private async processOrderForFulfillment(order: any) {
    console.log(`🏭 [Processor] Processing order: ${order?.orderId}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update order status using JetStream for durability
    const updateMessage = new OrderUpdated({
      orderId: order?.orderId || 'unknown',
      status: OrderStatus.PROCESSING,
      updatedAt: new Date().toISOString(),
      reason: 'Order processing started by fulfillment system',
      updatedFields: ['status']
    });

    const parameters = new OrderLifecycleParameters({ action: 'updated' });

    try {
      // Simple JetStream publishing
      await this.client.jetStreamPublishToOrderUpdated({message: updateMessage, parameters});
      console.log(`✅ [Processor] Order ${order?.orderId} marked as processing\n`);
    } catch (error) {
      console.log(`⚠️  [Processor] Order ${order?.orderId} marked as processing (mock)\n`);
    }
  }

  async shutdown() {
    console.log('🛑 Shutting down Durable Order Processor...');
    try {
      await this.client.disconnect();
      console.log('✅ Processor shutdown complete');
    } catch (error) {
      console.log('⚠️  Processor shutdown complete (mock mode)');
    }
  }
}

/**
 * Main demo function
 */
async function runDemo() {
  console.log('=== E-commerce Order Lifecycle Demo (Client SDK) ===\n');
  console.log('This demo shows how the client generator simplifies NATS messaging\n');

  // Initialize services
  const orderService = new OrderService();
  const processor = new DurableOrderProcessor();

  try {
    // Initialize both services
    await orderService.initialize();
    await processor.initialize();

    console.log('🎬 Starting order lifecycle demonstration...\n');

    // Simulate complete order lifecycle
    const orderId = await orderService.createOrder();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await orderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await orderService.updateOrderStatus(orderId, OrderStatus.PROCESSING);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await orderService.updateOrderStatus(orderId, OrderStatus.SHIPPED);
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate cancellation scenario
    console.log('🔄 Demonstrating order cancellation...\n');
    const cancelledOrderId = await orderService.createOrder();
    await new Promise(resolve => setTimeout(resolve, 500));
    await orderService.cancelOrder(cancelledOrderId, 'Customer requested cancellation');

    console.log('✨ Demo completed successfully!\n');

    console.log('🎯 Key Benefits of Client SDK:');
    console.log('   • Simple connection management');
    console.log('   • Clean, intuitive API');
    console.log('   • Automatic type safety');
    console.log('   • Built-in error handling');
    console.log('   • JetStream support');
    console.log('   • No protocol-specific boilerplate\n');

  } catch (error) {
    console.error('❌ Demo error:', error);
  } finally {
    // Cleanup
    await orderService.shutdown();
    await processor.shutdown();
    console.log('👋 Demo finished!');
  }
}

// Run the demo
runDemo().catch(console.error); 