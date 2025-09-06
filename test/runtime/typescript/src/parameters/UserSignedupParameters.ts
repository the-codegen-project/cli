import {EnumParameter} from './EnumParameter';
class UserSignedupParameters {
  private _myParameter: string;
  private _enumParameter: EnumParameter;

  constructor(input: {
    myParameter: string,
    enumParameter: EnumParameter,
  }) {
    this._myParameter = input.myParameter;
    this._enumParameter = input.enumParameter;
  }

  /**
   * parameter description
   */
  get myParameter(): string { return this._myParameter; }
  set myParameter(myParameter: string) { this._myParameter = myParameter; }

  /**
   * enum parameter
   */
  get enumParameter(): EnumParameter { return this._enumParameter; }
  set enumParameter(enumParameter: EnumParameter) { this._enumParameter = enumParameter; }


  /**
   * Realize the channel/topic with the parameters added to this class.
   */
  public getChannelWithParameters(channel: string) {
    channel = channel.replace(/\{my_parameter\}/g, this.myParameter);
    channel = channel.replace(/\{enum_parameter\}/g, this.enumParameter);
    return channel;
  }
  
  public static createFromChannel(msgSubject: string, channel: string, regex: RegExp): UserSignedupParameters {
    const parameters = new UserSignedupParameters({myParameter: '', enumParameter: "openapi"});
  const match = msgSubject.match(regex);
  const sequentialParameters: string[] = channel.match(/\{(\w+)\}/g) || [];

  if (match) {
    const myParameterMatch = match[sequentialParameters.indexOf('{my_parameter}')+1];
        if(myParameterMatch && myParameterMatch !== '') {
          parameters.myParameter = myParameterMatch as any
        } else {
          throw new Error(`Parameter: 'myParameter' is not valid. Abort! `) 
        }
  const enumParameterMatch = match[sequentialParameters.indexOf('{enum_parameter}')+1];
        if(enumParameterMatch && enumParameterMatch !== '') {
          parameters.enumParameter = enumParameterMatch as any
        } else {
          throw new Error(`Parameter: 'enumParameter' is not valid. Abort! `) 
        }
  } else {
    throw new Error(`Unable to find parameters in channel/topic, topic was ${channel}`)
  }
  return parameters;
  }
}
export { UserSignedupParameters };