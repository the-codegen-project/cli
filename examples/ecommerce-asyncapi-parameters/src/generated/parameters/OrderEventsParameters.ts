import {EventType} from './EventType';
class OrderEventsParameters {
  private _orderId: string;
  private _eventType: EventType;

  constructor(input: {
    orderId: string,
    eventType: EventType,
  }) {
    this._orderId = input.orderId;
    this._eventType = input.eventType;
  }

  /**
   * Unique order identifier (UUID format)
   * @example 123e4567-e89b-12d3-a456-426614174000
   */
  get orderId(): string { return this._orderId; }
  set orderId(orderId: string) { this._orderId = orderId; }

  /**
   * Type of order event
   */
  get eventType(): EventType { return this._eventType; }
  set eventType(eventType: EventType) { this._eventType = eventType; }


  /**
   * Realize the channel/topic with the parameters added to this class.
   */
  public getChannelWithParameters(channel: string) {
    channel = channel.replace(/\{orderId\}/g, this.orderId);
    channel = channel.replace(/\{eventType\}/g, this.eventType);
    return channel;
  }
  
  public static createFromChannel(msgSubject: string, channel: string, regex: RegExp): OrderEventsParameters {
    const parameters = new OrderEventsParameters({orderId: '', eventType: "created"});
  const match = msgSubject.match(regex);
  const sequentialParameters: string[] = channel.match(/\{(\w+)\}/g) || [];

  if (match) {
    const orderIdMatch = match[sequentialParameters.indexOf('{orderId}')+1];
        if(orderIdMatch && orderIdMatch !== '') {
          parameters.orderId = orderIdMatch as any
        } else {
          throw new Error(`Parameter: 'orderId' is not valid. Abort! `) 
        }
  const eventTypeMatch = match[sequentialParameters.indexOf('{eventType}')+1];
        if(eventTypeMatch && eventTypeMatch !== '') {
          parameters.eventType = eventTypeMatch as any
        } else {
          throw new Error(`Parameter: 'eventType' is not valid. Abort! `) 
        }
  } else {
    throw new Error(`Unable to find parameters in channel/topic, topic was ${channel}`)
  }
  return parameters;
  }
}
export { OrderEventsParameters };