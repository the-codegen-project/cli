/**
 * E-commerce Header Models Usage Example
 * 
 * This file demonstrates how to use the generated TypeScript header models
 * from the AsyncAPI specification for an e-commerce messaging system.
 * 
 * Run: npm run demo
 */

// Import generated header models
import { OrderCreatedHeaders } from './generated/headers/OrderCreatedHeaders';
import { PaymentProcessedHeaders } from './generated/headers/PaymentProcessedHeaders';
import { InventoryUpdatedHeaders } from './generated/headers/InventoryUpdatedHeaders';
import { NotificationSentHeaders } from './generated/headers/NotificationSentHeaders';
import { UserBehaviorTrackedHeaders } from './generated/headers/UserBehaviorTrackedHeaders';
import { AdminActionPerformedHeaders } from './generated/headers/AdminActionPerformedHeaders';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  log(`\n${'='.repeat(70)}`, colors.cyan);
  log(`${title}`, colors.bright);
  log(`${'='.repeat(70)}`, colors.cyan);
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

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function demonstrateOrderCreationHeaders() {
  logSection('1. Order Creation Headers - Authentication & Tracing');
  
  try {
    // Create headers for order creation with authentication and tracing
    const orderHeaders = new OrderCreatedHeaders({
      xCorrelationId: '123e4567-e89b-12d3-a456-426614174000',
      xUserId: '987fcdeb-51a2-43d1-9f12-345678901234',
      xTenantId: 'tenant-ecommerce-prod',
      xSourceService: 'web-app',
      xApiVersion: 'v1',
      xRequestId: 'req_' + Math.random().toString(36).substr(2, 9),
      xTimestamp: new Date().toISOString(),
      authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    });
    
    logSuccess('Order creation headers created with authentication');
    
    // Display header details
    logInfo('Order Creation Headers:');
    console.log(`  Correlation ID: ${orderHeaders.xCorrelationId}`);
    console.log(`  User ID: ${orderHeaders.xUserId}`);
    console.log(`  Tenant: ${orderHeaders.xTenantId}`);
    console.log(`  Source: ${orderHeaders.xSourceService}`);
    console.log(`  API Version: ${orderHeaders.xApiVersion}`);
    console.log(`  Request ID: ${orderHeaders.xRequestId}`);
    console.log(`  Timestamp: ${orderHeaders.xTimestamp}`);
    console.log(`  Has Auth: ${orderHeaders.authorization ? 'Yes' : 'No'}`);
    
    // Serialize headers for message transmission
    const serializedHeaders = orderHeaders.marshal();
    logSuccess('Headers serialized for transmission');
    logInfo(`Serialized size: ${serializedHeaders.length} bytes`);
    
    // Deserialize headers (simulating message reception)
    const deserializedHeaders = OrderCreatedHeaders.unmarshal(serializedHeaders);
    logSuccess('Headers deserialized successfully');
    
    return orderHeaders;
    
  } catch (error) {
    logError(`Failed to create order headers: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function demonstratePaymentHeaders(correlationId: string) {
  logSection('2. Payment Processing Headers - Provider & Security');
  
  try {
    // Create headers for payment processing with provider and security info
    const paymentHeaders = new PaymentProcessedHeaders({
      xCorrelationId: correlationId,
      xPaymentProvider: 'stripe',
      xTenantId: 'tenant-ecommerce-prod',
      xPaymentMethod: 'credit-card',
      xRiskScore: 15.5,
      xProcessorTransactionId: 'txn_1234567890abcdef',
      xRetryCount: 0,
      xIdempotencyKey: 'idem_' + Math.random().toString(36).substr(2, 16),
      xWebhookSignature: 'sha256=5d41402abc4b2a76b9719d911017c592'
    });
    
    logSuccess('Payment processing headers created');
    
    logInfo('Payment Headers:');
    console.log(`  Correlation ID: ${paymentHeaders.xCorrelationId}`);
    console.log(`  Provider: ${paymentHeaders.xPaymentProvider}`);
    console.log(`  Method: ${paymentHeaders.xPaymentMethod}`);
    console.log(`  Risk Score: ${paymentHeaders.xRiskScore}/100`);
    console.log(`  Processor TXN: ${paymentHeaders.xProcessorTransactionId}`);
    console.log(`  Retry Count: ${paymentHeaders.xRetryCount}`);
    console.log(`  Idempotency Key: ${paymentHeaders.xIdempotencyKey}`);
    console.log(`  Webhook Signature: ${paymentHeaders.xWebhookSignature?.substring(0, 20)}...`);
    
    return paymentHeaders;
    
  } catch (error) {
    logError(`Failed to create payment headers: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function demonstrateInventoryHeaders() {
  logSection('3. Inventory Management Headers - Warehouse & Audit');
  
  try {
    // Create headers for inventory updates with warehouse and audit info
    const inventoryHeaders = new InventoryUpdatedHeaders({
      xCorrelationId: 'inv_' + Math.random().toString(36).substr(2, 16),
      xWarehouseId: 'warehouse-sf-01',
      xTenantId: 'tenant-ecommerce-prod',
      xUpdateType: 'sale',
      xBatchId: 'batch_' + Math.random().toString(36).substr(2, 12),
      xOperatorId: 'op_' + Math.random().toString(36).substr(2, 8),
      xLocation: 'A-12-B-03',
      xAuditRequired: true
    });
    
    logSuccess('Inventory update headers created');
    
    logInfo('Inventory Headers:');
    console.log(`  Correlation ID: ${inventoryHeaders.xCorrelationId}`);
    console.log(`  Warehouse: ${inventoryHeaders.xWarehouseId}`);
    console.log(`  Update Type: ${inventoryHeaders.xUpdateType}`);
    console.log(`  Batch ID: ${inventoryHeaders.xBatchId}`);
    console.log(`  Operator: ${inventoryHeaders.xOperatorId}`);
    console.log(`  Location: ${inventoryHeaders.xLocation}`);
    console.log(`  Audit Required: ${inventoryHeaders.xAuditRequired ? 'Yes' : 'No'}`);
    
    return inventoryHeaders;
    
  } catch (error) {
    logError(`Failed to create inventory headers: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function demonstrateNotificationHeaders(correlationId: string) {
  logSection('4. Notification Headers - Multi-channel & Localization');
  
  try {
    // Create headers for notifications with channel and localization info
    const notificationHeaders = new NotificationSentHeaders({
      xCorrelationId: correlationId,
      xNotificationType: 'email',
      xTenantId: 'tenant-ecommerce-prod',
      xTemplateId: 'order-confirmation-v2',
      xLanguage: 'en-US',
      xChannelPreference: 'email',
      xDeliveryAttempt: 1,
      xScheduledTime: new Date().toISOString(),
      xProvider: 'sendgrid'
    });
    
    logSuccess('Notification headers created');
    
    logInfo('Notification Headers:');
    console.log(`  Correlation ID: ${notificationHeaders.xCorrelationId}`);
    console.log(`  Type: ${notificationHeaders.xNotificationType}`);
    console.log(`  Template: ${notificationHeaders.xTemplateId}`);
    console.log(`  Language: ${notificationHeaders.xLanguage}`);
    console.log(`  Preferred Channel: ${notificationHeaders.xChannelPreference}`);
    console.log(`  Delivery Attempt: ${notificationHeaders.xDeliveryAttempt}`);
    console.log(`  Provider: ${notificationHeaders.xProvider}`);
    console.log(`  Scheduled: ${notificationHeaders.xScheduledTime}`);
    
    return notificationHeaders;
    
  } catch (error) {
    logError(`Failed to create notification headers: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function demonstrateAnalyticsHeaders() {
  logSection('5. Analytics Headers - User Tracking & Privacy');
  
  try {
    // Create headers for analytics with user tracking and privacy info
    const analyticsHeaders = new UserBehaviorTrackedHeaders({
      xCorrelationId: 'analytics_' + Math.random().toString(36).substr(2, 16),
      xSessionId: 'sess_' + Math.random().toString(36).substr(2, 20),
      xTenantId: 'tenant-ecommerce-prod',
      xUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      xDeviceType: 'desktop',
      xPlatform: 'web',
      xAbTestGroups: ['checkout-v2', 'pricing-experiment-a'],
      xFeatureFlags: ['new-ui', 'enhanced-search'],
      xGdprConsent: true,
      xDataRetentionDays: 365
    });
    
    logSuccess('Analytics headers created');
    
    logInfo('Analytics Headers:');
    console.log(`  Correlation ID: ${analyticsHeaders.xCorrelationId}`);
    console.log(`  Session ID: ${analyticsHeaders.xSessionId}`);
    console.log(`  Device: ${analyticsHeaders.xDeviceType} (${analyticsHeaders.xPlatform})`);
    console.log(`  A/B Tests: ${analyticsHeaders.xAbTestGroups?.join(', ')}`);
    console.log(`  Feature Flags: ${analyticsHeaders.xFeatureFlags?.join(', ')}`);
    console.log(`  GDPR Consent: ${analyticsHeaders.xGdprConsent ? 'Yes' : 'No'}`);
    console.log(`  Data Retention: ${analyticsHeaders.xDataRetentionDays} days`);
    
    return analyticsHeaders;
    
  } catch (error) {
    logError(`Failed to create analytics headers: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function demonstrateAdminHeaders() {
  logSection('6. Admin Action Headers - Security & Compliance');
  
  try {
    // Create headers for admin actions with security and compliance info
    const adminHeaders = new AdminActionPerformedHeaders({
      xCorrelationId: 'admin_' + Math.random().toString(36).substr(2, 16),
      xAdminId: 'admin_' + Math.random().toString(36).substr(2, 12),
      xTenantId: 'tenant-ecommerce-prod',
      xActionType: 'user-management',
      xPermissionLevel: 'admin',
      xIpAddress: '10.0.1.50',
      xAuditLevel: 'high',
      xApprovalRequired: false,
      xComplianceTags: ['gdpr', 'sox', 'pci-dss']
    });
    
    logSuccess('Admin action headers created');
    
    logInfo('Admin Headers:');
    console.log(`  Correlation ID: ${adminHeaders.xCorrelationId}`);
    console.log(`  Admin ID: ${adminHeaders.xAdminId}`);
    console.log(`  Action Type: ${adminHeaders.xActionType}`);
    console.log(`  Permission Level: ${adminHeaders.xPermissionLevel}`);
    console.log(`  IP Address: ${adminHeaders.xIpAddress}`);
    console.log(`  Audit Level: ${adminHeaders.xAuditLevel}`);
    console.log(`  Approval Required: ${adminHeaders.xApprovalRequired ? 'Yes' : 'No'}`);
    console.log(`  Compliance Tags: ${adminHeaders.xComplianceTags?.join(', ')}`);
    
    return adminHeaders;
    
  } catch (error) {
    logError(`Failed to create admin headers: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function demonstrateHeaderSerialization() {
  logSection('7. Header Serialization & Deserialization');
  
  try {
    // Create a complex header object
    const originalHeaders = new PaymentProcessedHeaders({
      xCorrelationId: 'test-correlation-123',
      xPaymentProvider: 'stripe',
      xTenantId: 'test-tenant',
      xPaymentMethod: 'credit-card',
      xRiskScore: 25.7,
      xRetryCount: 2,
      xIdempotencyKey: 'test-idempotency-key'
    });
    
    logInfo('Original Headers:');
    console.log(`  Provider: ${originalHeaders.xPaymentProvider}`);
    console.log(`  Risk Score: ${originalHeaders.xRiskScore}`);
    console.log(`  Retry Count: ${originalHeaders.xRetryCount}`);
    
    // Serialize to JSON
    const serialized = originalHeaders.marshal();
    logSuccess('Headers serialized to JSON');
    logInfo(`Serialized JSON: ${serialized}`);
    
    // Deserialize from JSON
    const deserialized = PaymentProcessedHeaders.unmarshal(serialized);
    logSuccess('Headers deserialized from JSON');
    
    // Verify data integrity
    const isValid = 
      deserialized.xCorrelationId === originalHeaders.xCorrelationId &&
      deserialized.xPaymentProvider === originalHeaders.xPaymentProvider &&
      deserialized.xRiskScore === originalHeaders.xRiskScore &&
      deserialized.xRetryCount === originalHeaders.xRetryCount;
    
    if (isValid) {
      logSuccess('✨ Data integrity verified - serialization/deserialization works perfectly!');
    } else {
      logError('Data integrity check failed');
    }
    
    logInfo('Deserialized Headers:');
    console.log(`  Provider: ${deserialized.xPaymentProvider}`);
    console.log(`  Risk Score: ${deserialized.xRiskScore}`);
    console.log(`  Retry Count: ${deserialized.xRetryCount}`);
    
  } catch (error) {
    logError(`Serialization demo failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function demonstrateMessagingIntegration() {
  logSection('8. Real-World Messaging Integration Examples');
  
  try {
    logInfo('🚀 NATS Integration Example:');
    console.log(`
// Publishing with headers
const orderHeaders = new OrderCreatedHeaders({
  xCorrelationId: '123e4567-e89b-12d3-a456-426614174000',
  xUserId: 'user-123',
  xTenantId: 'tenant-prod',
  authorization: 'Bearer token...'
});

const nc = await connect({ servers: 'nats://localhost:4222' });
await nc.publish('orders.created', JSON.stringify(payload), {
  headers: JSON.parse(orderHeaders.marshal())
});

// Consuming with header validation
const sub = nc.subscribe('orders.created');
for await (const msg of sub) {
  const headers = OrderCreatedHeaders.unmarshal(msg.headers);
  
  // Validate required headers
  if (!headers.xCorrelationId || !headers.xUserId) {
    console.error('Missing required headers');
    continue;
  }
  
  // Process message with typed headers
  await processOrder(msg.data, headers);
}
    `);
    
    logInfo('🚀 Kafka Integration Example:');
    console.log(`
// Publishing with headers
const paymentHeaders = new PaymentProcessedHeaders({
  xCorrelationId: 'payment-correlation-456',
  xPaymentProvider: 'stripe',
  xTenantId: 'tenant-prod'
});

const producer = kafka.producer();
await producer.send({
  topic: 'payments.processed',
  messages: [{
    key: paymentId,
    value: JSON.stringify(payload),
    headers: JSON.parse(paymentHeaders.marshal())
  }]
});

// Consuming with header extraction
const consumer = kafka.consumer({ groupId: 'payment-processor' });
await consumer.run({
  eachMessage: async ({ message }) => {
    const headers = PaymentProcessedHeaders.unmarshal(message.headers);
    
    // Route based on payment provider
    switch (headers.xPaymentProvider) {
      case 'stripe':
        await processStripePayment(message.value, headers);
        break;
      case 'paypal':
        await processPayPalPayment(message.value, headers);
        break;
    }
  }
});
    `);
    
    logInfo('🚀 HTTP API Integration Example:');
    console.log(`
// Express.js middleware for header extraction
app.use('/api/webhooks', (req, res, next) => {
  try {
    const headers = PaymentProcessedHeaders.unmarshal(req.headers);
    req.typedHeaders = headers;
    
    // Validate webhook signature
    if (!headers.xWebhookSignature) {
      return res.status(401).json({ error: 'Missing webhook signature' });
    }
    
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid headers' });
  }
});

// Route handler with typed headers
app.post('/api/webhooks/payment', (req, res) => {
  const headers = req.typedHeaders as PaymentProcessedHeaders;
  
  // Access typed header properties
  console.log(\`Payment from \${headers.xPaymentProvider}\`);
  console.log(\`Risk score: \${headers.xRiskScore}\`);
  
  // Process webhook with full type safety
  processPaymentWebhook(req.body, headers);
  res.json({ success: true });
});
    `);
    
    logSuccess('Integration examples demonstrated');
    
  } catch (error) {
    logError(`Integration demo failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function demonstrateHeaderValidation() {
  logSection('9. Header Validation & Error Handling');
  
  try {
    logInfo('✅ Testing valid headers...');
    
    logInfo('✅ Testing validation with complete valid data...');
    const validValidation = OrderCreatedHeaders.validate({
      data: {
        'x-correlation-id': '123e4567-e89b-12d3-a456-426614174000',
        'x-user-id': '987fcdeb-51a2-43d1-9f12-345678901234',
        'x-tenant-id': 'tenant-prod',
        'x-source-service': 'web-app',
        'x-api-version': 'v1'
      }
    });

    if(validValidation.valid) {
      logSuccess(`Valid data validation passed: ${JSON.stringify(validValidation)}`);
    } else {
      logError(`Valid data validation failed: ${JSON.stringify(validValidation.errors)}`);
    }
    
    logInfo('✅ Testing validation with invalid data...');
    const invalidValidation = OrderCreatedHeaders.validate({
      data: {
        'x-correlation-id': 123,
        'x-user-id': '987fcdeb-51a2-43d1-9f12-345678901234',
        'x-tenant-id': 'tenant-prod',
        'x-source-service': 'web-app',
        'x-api-version': 'v1'
      }
    });

    if(invalidValidation.valid) {
      logError(`Validation should have caught the error: ${JSON.stringify(invalidValidation.errors)}`);
    } else {
      logSuccess(`Validation caught the error: ${JSON.stringify(invalidValidation.errors)}`);
    }
    
    logSuccess('✨ Validation tests completed!');
    logInfo('The validate() function provides comprehensive validation of header data before model instantiation');
    
  } catch (error) {
    logError(`Validation demo failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function main() {
  try {
    log('\n🎯 E-commerce Header Models Demo', colors.magenta);
    log('Demonstrating type-safe header management for event-driven systems\n', colors.cyan);
    
    // Run all demonstrations
    const orderHeaders = await demonstrateOrderCreationHeaders();
    await demonstratePaymentHeaders(orderHeaders.xCorrelationId!);
    await demonstrateInventoryHeaders();
    await demonstrateNotificationHeaders(orderHeaders.xCorrelationId!);
    await demonstrateAnalyticsHeaders();
    await demonstrateAdminHeaders();
    await demonstrateHeaderSerialization();
    await demonstrateMessagingIntegration();
    await demonstrateHeaderValidation();
    
    logSection('🎉 Demo Complete!');
    log('Key Benefits Demonstrated:', colors.bright);
    log('✅ Type-safe header models with full TypeScript support', colors.green);
    log('✅ Automatic serialization/deserialization', colors.green);
    log('✅ Support for complex header patterns (auth, tracing, metadata)', colors.green);
    log('✅ Integration with popular messaging systems (NATS, Kafka)', colors.green);
    log('✅ Validation and error handling', colors.green);
    log('✅ Multi-tenant and compliance support', colors.green);
    log('✅ Performance optimization with reusable models', colors.green);
    
    log('\n🚀 Ready to implement in your own project!', colors.magenta);
    log('Check out the generated header models in ./src/generated/headers/', colors.cyan);
    
  } catch (error) {
    logError(`Demo failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run the demo
main().catch(console.error); 