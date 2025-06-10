import {Action} from './Action';
class OrderLifecycleParameters {
  private _action: Action;

  constructor(input: {
    action: Action,
  }) {
    this._action = input.action;
  }

  /**
   * Order lifecycle action
   */
  get action(): Action { return this._action; }
  set action(action: Action) { this._action = action; }


  /**
   * Realize the channel/topic with the parameters added to this class.
   */
  public getChannelWithParameters(channel: string) {
    channel = channel.replace(/\{action\}/g, this.action);
    return channel;
  }
  
  public static createFromChannel(msgSubject: string, channel: string, regex: RegExp): OrderLifecycleParameters {
    const parameters = new OrderLifecycleParameters({action: "created"});
  const match = msgSubject.match(regex);
  const sequentialParameters: string[] = channel.match(/\{(\w+)\}/g) || [];

  if (match) {
    const actionMatch = match[sequentialParameters.indexOf('{action}')+1];
        if(actionMatch && actionMatch !== '') {
          parameters.action = actionMatch as any
        } else {
          throw new Error(`Parameter: 'action' is not valid. Abort! `) 
        }
  } else {
    throw new Error(`Unable to find parameters in channel/topic, topic was ${channel}`)
  }
  return parameters;
  }
}
export { OrderLifecycleParameters };