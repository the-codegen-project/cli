/**
 * E-commerce Parameter Models Usage Example
 * 
 * This file demonstrates how to use the generated TypeScript parameter models
 * from the AsyncAPI specification for dynamic channel routing.
 * 
 * Run: npm run demo
 */

// Import generated parameter models and types
import { OrderEventsParameters } from './generated/parameters/OrderEventsParameters';
import { UserNotificationsParameters } from './generated/parameters/UserNotificationsParameters';
import { TenantAnalyticsParameters } from './generated/parameters/TenantAnalyticsParameters';
import { ProductUpdatesParameters } from './generated/parameters/ProductUpdatesParameters';
import { InventoryUpdatesParameters } from './generated/parameters/InventoryUpdatesParameters';
import { SupportTicketsParameters } from './generated/parameters/SupportTicketsParameters';
import { UserActivityParameters } from './generated/parameters/UserActivityParameters';

// Import enum types for type-safe parameter values
import { EventType } from './generated/parameters/EventType';
import { Region } from './generated/parameters/Region';
import { NotificationType } from './generated/parameters/NotificationType';
import { EnvironmentType } from './generated/parameters/EnvironmentType';
import { MetricType } from './generated/parameters/MetricType';
import { AggregationPeriod } from './generated/parameters/AggregationPeriod';
import { Category } from './generated/parameters/Category';
import { Priority } from './generated/parameters/Priority';
import { Department } from './generated/parameters/Department';

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

async function demonstrateOrderParameters() {
  logSection('1. Order Event Parameters - Type-Safe Channel Construction');
  
  try {
    // Create order parameters with type-safe enum values
    const orderParams = new OrderEventsParameters({
      orderId: '123e4567-e89b-12d3-a456-426614174000',
      eventType: 'created' as EventType
    });
    
    // Build channel using the generated method
    const channelTemplate = 'ecommerce.orders.{orderId}.{eventType}';
    const actualChannel = orderParams.getChannelWithParameters(channelTemplate);
    
    logSuccess('Order event parameters created');
    logInfo('Order Parameters:');
    console.log(`  Order ID: ${orderParams.orderId}`);
    console.log(`  Event Type: ${orderParams.eventType}`);
    console.log(`  Channel Template: ${channelTemplate}`);
    console.log(`  Generated Channel: ${actualChannel}`);
    
    // Demonstrate parameter extraction from channel
    const regex = /^ecommerce\.orders\.([^.]+)\.([^.]+)$/;
    const extractedParams = OrderEventsParameters.createFromChannel(
      actualChannel, 
      channelTemplate, 
      regex
    );
    
    logSuccess('Parameters extracted from channel successfully');
    console.log(`  Extracted Order ID: ${extractedParams.orderId}`);
    console.log(`  Extracted Event Type: ${extractedParams.eventType}`);
    
    // Demonstrate parameter modification
    extractedParams.eventType = 'shipped' as EventType;
    const updatedChannel = extractedParams.getChannelWithParameters(channelTemplate);
    console.log(`  Updated Channel: ${updatedChannel}`);
    
  } catch (error) {
    logError(`Failed to demonstrate order parameters: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateUserNotificationParameters() {
  logSection('2. User Notification Parameters - Multi-Parameter Channel Routing');
  
  try {
    // Create notification parameters with type-safe enums
    const notificationParams = new UserNotificationsParameters({
      region: 'us-east' as Region,
      userId: '987fcdeb-51a2-43d1-9f12-345678901234',
      notificationType: 'email' as NotificationType
    });
    
    // Build channel using the generated method
    const channelTemplate = 'ecommerce.users.{region}.{userId}.{notificationType}';
    const actualChannel = notificationParams.getChannelWithParameters(channelTemplate);
    
    logSuccess('User notification parameters created');
    logInfo('Notification Parameters:');
    console.log(`  Region: ${notificationParams.region}`);
    console.log(`  User ID: ${notificationParams.userId}`);
    console.log(`  Notification Type: ${notificationParams.notificationType}`);
    console.log(`  Channel Template: ${channelTemplate}`);
    console.log(`  Generated Channel: ${actualChannel}`);
    
    // Demonstrate parameter extraction from channel
    const regex = /^ecommerce\.users\.([^.]+)\.([^.]+)\.([^.]+)$/;
    const extractedParams = UserNotificationsParameters.createFromChannel(
      actualChannel, 
      channelTemplate, 
      regex
    );
    
    logSuccess('Parameters extracted from channel successfully');
    console.log(`  Extracted Region: ${extractedParams.region}`);
    console.log(`  Extracted User ID: ${extractedParams.userId}`);
    console.log(`  Extracted Type: ${extractedParams.notificationType}`);
    
    // Demonstrate creating different notification types for same user
    const notificationTypes: NotificationType[] = ['email', 'sms', 'push'];
    console.log('\n  Creating multiple notification channels:');
    for (const type of notificationTypes) {
      const params = new UserNotificationsParameters({
        region: 'eu-central' as Region,
        userId: extractedParams.userId,
        notificationType: type
      });
      const channel = params.getChannelWithParameters(channelTemplate);
      console.log(`    ${type}: ${channel}`);
    }
    
  } catch (error) {
    logError(`Failed to demonstrate notification parameters: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateAnalyticsParameters() {
  logSection('3. Analytics Parameters - Complex Multi-dimensional Routing');
  
  try {
    // Create analytics parameters with multiple type-safe enums
    const analyticsParams = new TenantAnalyticsParameters({
      tenantId: 'tenant-abc123',
      environmentType: 'production' as EnvironmentType,
      metricType: 'sales' as MetricType,
      aggregationPeriod: 'hour' as AggregationPeriod
    });
    
    // Build channel using the generated method
    const channelTemplate = 'analytics.{tenantId}.{environmentType}.{metricType}.{aggregationPeriod}';
    const actualChannel = analyticsParams.getChannelWithParameters(channelTemplate);
    
    logSuccess('Analytics parameters created');
    logInfo('Analytics Parameters:');
    console.log(`  Tenant ID: ${analyticsParams.tenantId}`);
    console.log(`  Environment: ${analyticsParams.environmentType}`);
    console.log(`  Metric Type: ${analyticsParams.metricType}`);
    console.log(`  Aggregation Period: ${analyticsParams.aggregationPeriod}`);
    console.log(`  Channel Template: ${channelTemplate}`);
    console.log(`  Generated Channel: ${actualChannel}`);
    
    // Demonstrate parameter extraction from channel
    const regex = /^analytics\.([^.]+)\.([^.]+)\.([^.]+)\.([^.]+)$/;
    const extractedParams = TenantAnalyticsParameters.createFromChannel(
      actualChannel, 
      channelTemplate, 
      regex
    );
    
    logSuccess('Parameters extracted from channel successfully');
    console.log(`  Extracted Tenant: ${extractedParams.tenantId}`);
    console.log(`  Extracted Environment: ${extractedParams.environmentType}`);
    console.log(`  Extracted Metric: ${extractedParams.metricType}`);
    console.log(`  Extracted Period: ${extractedParams.aggregationPeriod}`);
    
    // Demonstrate creating analytics channels for different environments
    const environments: EnvironmentType[] = ['production', 'staging', 'development'];
    console.log('\n  Creating multi-environment analytics channels:');
    for (const env of environments) {
      const params = new TenantAnalyticsParameters({
        tenantId: extractedParams.tenantId,
        environmentType: env,
        metricType: 'performance' as MetricType,
        aggregationPeriod: 'minute' as AggregationPeriod
      });
      const channel = params.getChannelWithParameters(channelTemplate);
      console.log(`    ${env}: ${channel}`);
    }
    
  } catch (error) {
    logError(`Failed to demonstrate analytics parameters: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateInventoryParameters() {
  logSection('4. Inventory Parameters - Location-based Channel Routing');
  
  try {
    // Create inventory parameters
    const inventoryParams = new InventoryUpdatesParameters({
      warehouseId: 'WH-US-001',
      zone: 'A-12',
      productId: 'PROD-ABC12345'
    });
    
    // Build channel using the generated method
    const channelTemplate = 'inventory.{warehouseId}.{zone}.{productId}';
    const actualChannel = inventoryParams.getChannelWithParameters(channelTemplate);
    
    logSuccess('Inventory parameters created');
    logInfo('Inventory Parameters:');
    console.log(`  Warehouse ID: ${inventoryParams.warehouseId}`);
    console.log(`  Zone: ${inventoryParams.zone}`);
    console.log(`  Product ID: ${inventoryParams.productId}`);
    console.log(`  Channel Template: ${channelTemplate}`);
    console.log(`  Generated Channel: ${actualChannel}`);
    
    // Demonstrate parameter extraction from channel
    const regex = /^inventory\.([^.]+)\.([^.]+)\.([^.]+)$/;
    const extractedParams = InventoryUpdatesParameters.createFromChannel(
      actualChannel, 
      channelTemplate, 
      regex
    );
    
    logSuccess('Parameters extracted from channel successfully');
    console.log(`  Extracted Warehouse: ${extractedParams.warehouseId}`);
    console.log(`  Extracted Zone: ${extractedParams.zone}`);
    console.log(`  Extracted Product: ${extractedParams.productId}`);
    
    // Demonstrate creating channels for different zones in same warehouse
    const zones = ['A-01', 'B-15', 'C-23'];
    console.log('\n  Creating zone-specific inventory channels:');
    for (const zone of zones) {
      const params = new InventoryUpdatesParameters({
        warehouseId: extractedParams.warehouseId,
        zone,
        productId: extractedParams.productId
      });
      const channel = params.getChannelWithParameters(channelTemplate);
      console.log(`    Zone ${zone}: ${channel}`);
    }
    
  } catch (error) {
    logError(`Failed to demonstrate inventory parameters: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateSupportParameters() {
  logSection('5. Support Ticket Parameters - Priority-based Channel Routing');
  
  try {
    // Create support parameters with type-safe enums
    const supportParams = new SupportTicketsParameters({
      priority: 'high' as Priority,
      department: 'technical' as Department,
      ticketId: 'TICKET-12345678'
    });
    
    // Build channel using the generated method
    const channelTemplate = 'support.{priority}.{department}.{ticketId}';
    const actualChannel = supportParams.getChannelWithParameters(channelTemplate);
    
    logSuccess('Support ticket parameters created');
    logInfo('Support Parameters:');
    console.log(`  Priority: ${supportParams.priority}`);
    console.log(`  Department: ${supportParams.department}`);
    console.log(`  Ticket ID: ${supportParams.ticketId}`);
    console.log(`  Channel Template: ${channelTemplate}`);
    console.log(`  Generated Channel: ${actualChannel}`);
    
    // Demonstrate parameter extraction from channel
    const regex = /^support\.([^.]+)\.([^.]+)\.([^.]+)$/;
    const extractedParams = SupportTicketsParameters.createFromChannel(
      actualChannel, 
      channelTemplate, 
      regex
    );
    
    logSuccess('Parameters extracted from channel successfully');
    console.log(`  Extracted Priority: ${extractedParams.priority}`);
    console.log(`  Extracted Department: ${extractedParams.department}`);
    console.log(`  Extracted Ticket ID: ${extractedParams.ticketId}`);
    
    // Demonstrate creating support channels by priority
    const priorities: Priority[] = ['low', 'medium', 'high', 'critical'];
    console.log('\n  Creating priority-based support channels:');
    for (const priority of priorities) {
      const params = new SupportTicketsParameters({
        priority,
        department: 'general' as Department,
        ticketId: `TICKET-${priority.toUpperCase()}001`
      });
      const channel = params.getChannelWithParameters(channelTemplate);
      console.log(`    ${priority}: ${channel}`);
    }
    
  } catch (error) {
    logError(`Failed to demonstrate support parameters: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateSimpleParameters() {
  logSection('6. Simple Parameter Usage - Single Parameter Channel');
  
  try {
    // Create simple user activity parameters
    const activityParams = new UserActivityParameters({
      userId: '550e8400-e29b-41d4-a716-446655440000'
    });
    
    // Build channel using the generated method
    const channelTemplate = 'activity.{userId}';
    const actualChannel = activityParams.getChannelWithParameters(channelTemplate);
    
    logSuccess('User activity parameters created');
    logInfo('Activity Parameters:');
    console.log(`  User ID: ${activityParams.userId}`);
    console.log(`  Channel Template: ${channelTemplate}`);
    console.log(`  Generated Channel: ${actualChannel}`);
    
    // Demonstrate parameter extraction from channel
    const regex = /^activity\.([^.]+)$/;
    const extractedParams = UserActivityParameters.createFromChannel(
      actualChannel, 
      channelTemplate, 
      regex
    );
    
    logSuccess('Parameters extracted from channel successfully');
    console.log(`  Extracted User ID: ${extractedParams.userId}`);
    
    // Demonstrate creating activity channels for different users
    const userIds = [
      '111e4567-e89b-12d3-a456-426614174001',
      '222e4567-e89b-12d3-a456-426614174002',
      '333e4567-e89b-12d3-a456-426614174003'
    ];
    
    console.log('\n  Creating activity channels for multiple users:');
    for (const userId of userIds) {
      const params = new UserActivityParameters({ userId });
      const channel = params.getChannelWithParameters(channelTemplate);
      console.log(`    User ${userId.substring(0, 8)}...: ${channel}`);
    }
    
  } catch (error) {
    logError(`Failed to demonstrate simple parameters: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateParameterValidation() {
  logSection('7. Parameter Validation - Error Handling & Type Safety');
  
  try {
    logInfo('Testing parameter validation and type safety...');
    
    // Test valid parameter creation
    try {
      const validParams = new OrderEventsParameters({
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: 'created' as EventType
      });
      logSuccess('✓ Valid parameters created successfully');
      
      const channel = validParams.getChannelWithParameters('ecommerce.orders.{orderId}.{eventType}');
      console.log(`  Generated channel: ${channel}`);
    } catch (error) {
      logError('✗ Valid parameters rejected unexpectedly');
    }
    
    // Test parameter extraction with invalid channel
    try {
      const invalidChannel = 'invalid.channel.format';
      const regex = /^ecommerce\.orders\.([^.]+)\.([^.]+)$/;
      OrderEventsParameters.createFromChannel(
        invalidChannel, 
        'ecommerce.orders.{orderId}.{eventType}', 
        regex
      );
      logError('✗ Invalid channel format accepted');
    } catch (error) {
      logSuccess('✓ Invalid channel format properly rejected');
      console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Test type safety with enum values
    const validEventTypes: EventType[] = ['created', 'updated', 'shipped', 'delivered', 'cancelled', 'refunded'];
    console.log('\n  Valid event types:');
    for (const eventType of validEventTypes) {
      const params = new OrderEventsParameters({
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        eventType
      });
      console.log(`    ✓ ${eventType}: ${params.getChannelWithParameters('ecommerce.orders.{orderId}.{eventType}')}`);
    }
    
    // Test enum validation for regions
    const validRegions: Region[] = ['us-east', 'us-west', 'eu-central', 'ap-southeast'];
    console.log('\n  Valid regions:');
    for (const region of validRegions) {
      const params = new UserNotificationsParameters({
        region,
        userId: '987fcdeb-51a2-43d1-9c4f-123456789abc',
        notificationType: 'email' as NotificationType
      });
      console.log(`    ✓ ${region}: ${params.getChannelWithParameters('ecommerce.users.{region}.{userId}.{notificationType}')}`);
    }
    
  } catch (error) {
    logError(`Failed to demonstrate parameter validation: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateBatchOperations() {
  logSection('8. Batch Operations - Efficient Parameter Management');
  
  try {
    logInfo('Demonstrating batch parameter operations...');
    
    // Create batch of notification parameters
    const notifications = [
      { userId: '111e4567-e89b-12d3-a456-426614174001', region: 'us-east' as Region, type: 'email' as NotificationType },
      { userId: '222e4567-e89b-12d3-a456-426614174002', region: 'us-east' as Region, type: 'sms' as NotificationType },
      { userId: '333e4567-e89b-12d3-a456-426614174003', region: 'eu-central' as Region, type: 'email' as NotificationType },
      { userId: '444e4567-e89b-12d3-a456-426614174004', region: 'us-west' as Region, type: 'push' as NotificationType },
      { userId: '555e4567-e89b-12d3-a456-426614174005', region: 'eu-central' as Region, type: 'email' as NotificationType }
    ];
    
    // Group by region for efficient processing using generated parameter models
    const notificationsByRegion = new Map<Region, Array<{params: UserNotificationsParameters, channel: string}>>();
    const channelTemplate = 'ecommerce.users.{region}.{userId}.{notificationType}';
    
    for (const notification of notifications) {
      const params = new UserNotificationsParameters({
        region: notification.region,
        userId: notification.userId,
        notificationType: notification.type
      });
      
      const channel = params.getChannelWithParameters(channelTemplate);
      
      if (!notificationsByRegion.has(notification.region)) {
        notificationsByRegion.set(notification.region, []);
      }
      
      notificationsByRegion.get(notification.region)!.push({ params, channel });
    }
    
    logSuccess(`Processed ${notifications.length} notifications into ${notificationsByRegion.size} regional batches`);
    
    // Process each region batch using the parameter models
    for (const [region, regionNotifications] of notificationsByRegion) {
      console.log(`\n  Processing ${regionNotifications.length} notifications for region: ${region}`);
      
      for (const notification of regionNotifications) {
        const { params, channel } = notification;
        console.log(`    → ${channel} (User: ${params.userId.substring(0, 8)}..., Type: ${params.notificationType})`);
      }
      
      logSuccess(`  Region ${region} batch processed successfully`);
    }
    
    // Demonstrate bulk analytics parameters
    console.log('\n  Creating bulk analytics parameters:');
    const tenants = ['tenant-abc123', 'tenant-xyz789', 'tenant-def456'];
    const metrics: MetricType[] = ['sales', 'inventory', 'user-behavior'];
    const analyticsChannelTemplate = 'analytics.{tenantId}.{environmentType}.{metricType}.{aggregationPeriod}';
    
    for (const tenantId of tenants) {
      for (const metricType of metrics) {
        const params = new TenantAnalyticsParameters({
          tenantId,
          environmentType: 'production' as EnvironmentType,
          metricType,
          aggregationPeriod: 'hour' as AggregationPeriod
        });
        
        const channel = params.getChannelWithParameters(analyticsChannelTemplate);
        console.log(`    ${tenantId} (${metricType}): ${channel}`);
      }
    }
    
  } catch (error) {
    logError(`Failed to demonstrate batch operations: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateRealWorldScenarios() {
  logSection('9. Real-World Scenarios - Practical Usage Examples');
  
  try {
    logInfo('Demonstrating real-world parameter usage scenarios...');
    
    // Scenario 1: Order processing pipeline
    console.log('\n  📦 Order Processing Pipeline:');
    const orderId = '123e4567-e89b-12d3-a456-426614174000';
    const orderEvents: EventType[] = ['created', 'updated', 'shipped', 'delivered'];
    const orderChannelTemplate = 'ecommerce.orders.{orderId}.{eventType}';
    
    for (const eventType of orderEvents) {
      const params = new OrderEventsParameters({ orderId, eventType });
      const channel = params.getChannelWithParameters(orderChannelTemplate);
      console.log(`    Step ${orderEvents.indexOf(eventType) + 1}: ${channel}`);
    }
    
    // Scenario 2: Multi-region user notifications
    console.log('\n  🌍 Multi-Region User Notifications:');
    const userId = '987fcdeb-51a2-43d1-9c4f-123456789abc';
    const regions: Region[] = ['us-east', 'us-west', 'eu-central'];
    const notificationTypes: NotificationType[] = ['email', 'sms'];
    const notificationChannelTemplate = 'ecommerce.users.{region}.{userId}.{notificationType}';
    
    for (const region of regions) {
      for (const notificationType of notificationTypes) {
        const params = new UserNotificationsParameters({ region, userId, notificationType });
        const channel = params.getChannelWithParameters(notificationChannelTemplate);
        console.log(`    ${region} (${notificationType}): ${channel}`);
      }
    }
    
    // Scenario 3: Inventory management across warehouses
    console.log('\n  🏭 Multi-Warehouse Inventory Management:');
    const productId = 'PROD-ABC12345';
    const warehouses = [
      { id: 'WH-US-001', zones: ['A-01', 'B-12'] },
      { id: 'WH-EU-042', zones: ['C-23', 'D-34'] }
    ];
    const inventoryChannelTemplate = 'inventory.{warehouseId}.{zone}.{productId}';
    
    for (const warehouse of warehouses) {
      console.log(`    Warehouse: ${warehouse.id}`);
      for (const zone of warehouse.zones) {
        const params = new InventoryUpdatesParameters({
          warehouseId: warehouse.id,
          zone,
          productId
        });
        const channel = params.getChannelWithParameters(inventoryChannelTemplate);
        console.log(`      Zone ${zone}: ${channel}`);
      }
    }
    
    // Scenario 4: Support ticket routing
    console.log('\n  🎧 Support Ticket Routing System:');
    const departments: Department[] = ['technical', 'billing', 'general'];
    const priorities: Priority[] = ['low', 'medium', 'high', 'critical'];
    const supportChannelTemplate = 'support.{priority}.{department}.{ticketId}';
    
    let ticketCounter = 1;
    for (const department of departments) {
      for (const priority of priorities) {
        const ticketId = `TICKET-${String(ticketCounter).padStart(8, '0')}`;
        const params = new SupportTicketsParameters({ priority, department, ticketId });
        const channel = params.getChannelWithParameters(supportChannelTemplate);
        console.log(`    ${department} (${priority}): ${channel}`);
        ticketCounter++;
      }
    }
    
    logSuccess('Real-world scenarios demonstrated successfully');
    
  } catch (error) {
    logError(`Failed to demonstrate real-world scenarios: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  log('🚀 E-commerce Parameter Models Demo - Using Generated Classes', colors.bright);
  log('================================================================', colors.cyan);
  
  logInfo('This demo showcases actual usage of generated parameter models from AsyncAPI specification.');
  
  try {
    await demonstrateOrderParameters();
    await demonstrateUserNotificationParameters();
    await demonstrateAnalyticsParameters();
    await demonstrateInventoryParameters();
    await demonstrateSupportParameters();
    await demonstrateSimpleParameters();
    await demonstrateParameterValidation();
    await demonstrateBatchOperations();
    await demonstrateRealWorldScenarios();
    
    logSection('🎉 Demo Completed Successfully');
    log('All parameter models demonstrated with actual generated classes!', colors.green);
    
  } catch (error) {
    logError(`Demo failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run the demo
main().catch(console.error); 