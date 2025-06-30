import {Category} from './Category';
class ProductUpdatesParameters {
  private _category: Category;
  private _productId: string;

  constructor(input: {
    category: Category,
    productId: string,
  }) {
    this._category = input.category;
    this._productId = input.productId;
  }

  /**
   * Product category for efficient routing
   */
  get category(): Category { return this._category; }
  set category(category: Category) { this._category = category; }

  /**
   * Product identifier (format PROD-XXXXXXXX)
   * @example PROD-12AB34CD
   */
  get productId(): string { return this._productId; }
  set productId(productId: string) { this._productId = productId; }


  /**
   * Realize the channel/topic with the parameters added to this class.
   */
  public getChannelWithParameters(channel: string) {
    channel = channel.replace(/\{category\}/g, this.category);
    channel = channel.replace(/\{productId\}/g, this.productId);
    return channel;
  }
  
  public static createFromChannel(msgSubject: string, channel: string, regex: RegExp): ProductUpdatesParameters {
    const parameters = new ProductUpdatesParameters({category: "electronics", productId: ''});
  const match = msgSubject.match(regex);
  const sequentialParameters: string[] = channel.match(/\{(\w+)\}/g) || [];

  if (match) {
    const categoryMatch = match[sequentialParameters.indexOf('{category}')+1];
        if(categoryMatch && categoryMatch !== '') {
          parameters.category = categoryMatch as any
        } else {
          throw new Error(`Parameter: 'category' is not valid. Abort! `) 
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
export { ProductUpdatesParameters };