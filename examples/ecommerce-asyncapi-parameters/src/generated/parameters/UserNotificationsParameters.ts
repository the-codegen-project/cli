import {Region} from './Region';
import {NotificationType} from './NotificationType';
class UserNotificationsParameters {
  private _region: Region;
  private _userId: string;
  private _notificationType: NotificationType;

  constructor(input: {
    region: Region,
    userId: string,
    notificationType: NotificationType,
  }) {
    this._region = input.region;
    this._userId = input.userId;
    this._notificationType = input.notificationType;
  }

  /**
   * Geographic region for routing
   */
  get region(): Region { return this._region; }
  set region(region: Region) { this._region = region; }

  /**
   * User identifier (UUID format)
   * @example 987fcdeb-51a2-43d1-9c4f-123456789abc
   */
  get userId(): string { return this._userId; }
  set userId(userId: string) { this._userId = userId; }

  /**
   * Type of notification
   */
  get notificationType(): NotificationType { return this._notificationType; }
  set notificationType(notificationType: NotificationType) { this._notificationType = notificationType; }


  /**
   * Realize the channel/topic with the parameters added to this class.
   */
  public getChannelWithParameters(channel: string) {
    channel = channel.replace(/\{region\}/g, this.region);
    channel = channel.replace(/\{userId\}/g, this.userId);
    channel = channel.replace(/\{notificationType\}/g, this.notificationType);
    return channel;
  }
  
  public static createFromChannel(msgSubject: string, channel: string, regex: RegExp): UserNotificationsParameters {
    const parameters = new UserNotificationsParameters({region: "us-east", userId: '', notificationType: "email"});
  const match = msgSubject.match(regex);
  const sequentialParameters: string[] = channel.match(/\{(\w+)\}/g) || [];

  if (match) {
    const regionMatch = match[sequentialParameters.indexOf('{region}')+1];
        if(regionMatch && regionMatch !== '') {
          parameters.region = regionMatch as any
        } else {
          throw new Error(`Parameter: 'region' is not valid. Abort! `) 
        }
  const userIdMatch = match[sequentialParameters.indexOf('{userId}')+1];
        if(userIdMatch && userIdMatch !== '') {
          parameters.userId = userIdMatch as any
        } else {
          throw new Error(`Parameter: 'userId' is not valid. Abort! `) 
        }
  const notificationTypeMatch = match[sequentialParameters.indexOf('{notificationType}')+1];
        if(notificationTypeMatch && notificationTypeMatch !== '') {
          parameters.notificationType = notificationTypeMatch as any
        } else {
          throw new Error(`Parameter: 'notificationType' is not valid. Abort! `) 
        }
  } else {
    throw new Error(`Unable to find parameters in channel/topic, topic was ${channel}`)
  }
  return parameters;
  }
}
export { UserNotificationsParameters };