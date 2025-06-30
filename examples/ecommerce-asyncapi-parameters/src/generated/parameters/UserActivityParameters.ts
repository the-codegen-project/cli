
class UserActivityParameters {
  private _userId: string;

  constructor(input: {
    userId: string,
  }) {
    this._userId = input.userId;
  }

  /**
   * User performing the activity (UUID format)
   * @example 550e8400-e29b-41d4-a716-446655440000
   */
  get userId(): string { return this._userId; }
  set userId(userId: string) { this._userId = userId; }


  /**
   * Realize the channel/topic with the parameters added to this class.
   */
  public getChannelWithParameters(channel: string) {
    channel = channel.replace(/\{userId\}/g, this.userId);
    return channel;
  }
  
  public static createFromChannel(msgSubject: string, channel: string, regex: RegExp): UserActivityParameters {
    const parameters = new UserActivityParameters({userId: ''});
  const match = msgSubject.match(regex);
  const sequentialParameters: string[] = channel.match(/\{(\w+)\}/g) || [];

  if (match) {
    const userIdMatch = match[sequentialParameters.indexOf('{userId}')+1];
        if(userIdMatch && userIdMatch !== '') {
          parameters.userId = userIdMatch as any
        } else {
          throw new Error(`Parameter: 'userId' is not valid. Abort! `) 
        }
  } else {
    throw new Error(`Unable to find parameters in channel/topic, topic was ${channel}`)
  }
  return parameters;
  }
}
export { UserActivityParameters };