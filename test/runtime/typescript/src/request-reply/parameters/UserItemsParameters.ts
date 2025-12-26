
class UserItemsParameters {
  private _userId: string;
  private _itemId: string;

  constructor(input: {
    userId: string,
    itemId: string,
  }) {
    this._userId = input.userId;
    this._itemId = input.itemId;
  }

  /**
   * The unique identifier of the user
   */
  get userId(): string { return this._userId; }
  set userId(userId: string) { this._userId = userId; }

  /**
   * The unique identifier of the item
   */
  get itemId(): string { return this._itemId; }
  set itemId(itemId: string) { this._itemId = itemId; }


  /**
   * Realize the channel/topic with the parameters added to this class.
   */
  public getChannelWithParameters(channel: string) {
    channel = channel.replace(/\{userId\}/g, this.userId);
    channel = channel.replace(/\{itemId\}/g, this.itemId);
    return channel;
  }
  
  public static createFromChannel(msgSubject: string, channel: string, regex: RegExp): UserItemsParameters {
    const parameters = new UserItemsParameters({userId: '', itemId: ''});
  const match = msgSubject.match(regex);
  const sequentialParameters: string[] = channel.match(/\{(\w+)\}/g) || [];

  if (match) {
    const userIdMatch = match[sequentialParameters.indexOf('{userId}')+1];
        if(userIdMatch && userIdMatch !== '') {
          parameters.userId = userIdMatch as any
        } else {
          throw new Error(`Parameter: 'userId' is not valid in UserItemsParameters. Aborting parameter extracting! `) 
        }
  const itemIdMatch = match[sequentialParameters.indexOf('{itemId}')+1];
        if(itemIdMatch && itemIdMatch !== '') {
          parameters.itemId = itemIdMatch as any
        } else {
          throw new Error(`Parameter: 'itemId' is not valid in UserItemsParameters. Aborting parameter extracting! `) 
        }
  } else {
    throw new Error(`Unable to find parameters in channel/topic, topic was ${channel}`)
  }
  return parameters;
  }
}
export { UserItemsParameters };