import {OrderCreatedHeaders} from './OrderCreatedHeaders';
import {OrderStatusChangedHeaders} from './OrderStatusChangedHeaders';
type OrderEventsHeaders = OrderCreatedHeaders | OrderStatusChangedHeaders;
export { OrderEventsHeaders };