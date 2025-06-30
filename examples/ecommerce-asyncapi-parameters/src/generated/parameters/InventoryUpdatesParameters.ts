
class InventoryUpdatesParameters {
  private _warehouseId: string;
  private _zone: string;
  private _productId: string;

  constructor(input: {
    warehouseId: string,
    zone: string,
    productId: string,
  }) {
    this._warehouseId = input.warehouseId;
    this._zone = input.zone;
    this._productId = input.productId;
  }

  /**
   * Warehouse identifier (format WH-XX-000)
   * @example WH-US-001, WH-EU-042
   */
  get warehouseId(): string { return this._warehouseId; }
  set warehouseId(warehouseId: string) { this._warehouseId = warehouseId; }

  /**
   * Zone within warehouse (format X-00)
   * @example A-01, B-15, C-23
   */
  get zone(): string { return this._zone; }
  set zone(zone: string) { this._zone = zone; }

  /**
   * Product being updated (format PROD-XXXXXXXX)
   * @example PROD-12AB34CD
   */
  get productId(): string { return this._productId; }
  set productId(productId: string) { this._productId = productId; }


  /**
   * Realize the channel/topic with the parameters added to this class.
   */
  public getChannelWithParameters(channel: string) {
    channel = channel.replace(/\{warehouseId\}/g, this.warehouseId);
    channel = channel.replace(/\{zone\}/g, this.zone);
    channel = channel.replace(/\{productId\}/g, this.productId);
    return channel;
  }
  
  public static createFromChannel(msgSubject: string, channel: string, regex: RegExp): InventoryUpdatesParameters {
    const parameters = new InventoryUpdatesParameters({warehouseId: '', zone: '', productId: ''});
  const match = msgSubject.match(regex);
  const sequentialParameters: string[] = channel.match(/\{(\w+)\}/g) || [];

  if (match) {
    const warehouseIdMatch = match[sequentialParameters.indexOf('{warehouseId}')+1];
        if(warehouseIdMatch && warehouseIdMatch !== '') {
          parameters.warehouseId = warehouseIdMatch as any
        } else {
          throw new Error(`Parameter: 'warehouseId' is not valid. Abort! `) 
        }
  const zoneMatch = match[sequentialParameters.indexOf('{zone}')+1];
        if(zoneMatch && zoneMatch !== '') {
          parameters.zone = zoneMatch as any
        } else {
          throw new Error(`Parameter: 'zone' is not valid. Abort! `) 
        }
  const productIdMatch = match[sequentialParameters.indexOf('{productId}')+1];
        if(productIdMatch && productIdMatch !== '') {
          parameters.productId = productIdMatch as any
        } else {
          throw new Error(`Parameter: 'productId' is not valid. Abort! `) 
        }
  } else {
    throw new Error(`Unable to find parameters in channel/topic, topic was ${channel}`)
  }
  return parameters;
  }
}
export { InventoryUpdatesParameters };