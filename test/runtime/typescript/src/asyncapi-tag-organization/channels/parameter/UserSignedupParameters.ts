
interface UserSignedupParametersInterface {
  id: string
}
class UserSignedupParameters {
  private _id: string;

  constructor(input: UserSignedupParametersInterface) {
    this._id = input.id;
  }

  /**
   * The id of the user
   */
  get id(): string { return this._id; }
  set id(id: string) { this._id = id; }


  /**
   * Realize the channel/topic with the parameters added to this class.
   */
  public getChannelWithParameters(channel: string) {
    channel = channel.replace(/\{id\}/g, this.id);
    return channel;
  }
  
  public static createFromChannel(msgSubject: string, channel: string, regex: RegExp): UserSignedupParameters {
    const parameters = new UserSignedupParameters({id: ''});
  const match = msgSubject.match(regex);
  const sequentialParameters: string[] = channel.match(/\{(\w+)\}/g) || [];

  if (match) {
    const idMatch = match[sequentialParameters.indexOf('{id}')+1];
        if(idMatch && idMatch !== '') {
          parameters.id = idMatch as any
        } else {
          throw new Error(`Parameter: 'id' is not valid in UserSignedupParameters. Aborting parameter extracting! `) 
        }
  } else {
    throw new Error(`Unable to find parameters in channel/topic, topic was ${channel}`)
  }
  return parameters;
  }
}
export { UserSignedupParameters, UserSignedupParametersInterface };