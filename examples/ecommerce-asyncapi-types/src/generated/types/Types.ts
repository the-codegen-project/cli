export type Topics = 'ecommerce.orders.{orderId}' | 'ecommerce.payments.{paymentId}' | 'ecommerce.inventory.{productId}' | 'ecommerce.notifications.{customerId}' | 'ecommerce.analytics.events';
export type TopicIds = 'order-events' | 'payment-events' | 'inventory-events' | 'customer-notifications' | 'analytics-events';
export function ToTopicIds(topic: Topics): TopicIds {
  switch (topic) {
    case 'ecommerce.orders.{orderId}':
    return 'order-events';
  case 'ecommerce.payments.{paymentId}':
    return 'payment-events';
  case 'ecommerce.inventory.{productId}':
    return 'inventory-events';
  case 'ecommerce.notifications.{customerId}':
    return 'customer-notifications';
  case 'ecommerce.analytics.events':
    return 'analytics-events';
    default:
      throw new Error('Unknown topic: ' + topic);
  }
}
export function ToTopics(topicId: TopicIds): Topics {
  switch (topicId) {
    case 'order-events':
    return 'ecommerce.orders.{orderId}';
  case 'payment-events':
    return 'ecommerce.payments.{paymentId}';
  case 'inventory-events':
    return 'ecommerce.inventory.{productId}';
  case 'customer-notifications':
    return 'ecommerce.notifications.{customerId}';
  case 'analytics-events':
    return 'ecommerce.analytics.events';
    default:
      throw new Error('Unknown topic ID: ' + topicId);
  }
}
