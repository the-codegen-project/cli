import {OrderCreatedHeaders} from './OrderCreatedHeaders';
import {OrderUpdatedHeaders} from './OrderUpdatedHeaders';
import {OrderCancelledHeaders} from './OrderCancelledHeaders';
type OrderLifecycleHeaders = OrderCreatedHeaders | OrderUpdatedHeaders | OrderCancelledHeaders;
export { OrderLifecycleHeaders };