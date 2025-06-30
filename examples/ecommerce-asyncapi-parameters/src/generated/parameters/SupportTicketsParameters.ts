import {Priority} from './Priority';
import {Department} from './Department';
class SupportTicketsParameters {
  private _priority: Priority;
  private _department: Department;
  private _ticketId: string;

  constructor(input: {
    priority: Priority,
    department: Department,
    ticketId: string,
  }) {
    this._priority = input.priority;
    this._department = input.department;
    this._ticketId = input.ticketId;
  }

  /**
   * Ticket priority for routing
   */
  get priority(): Priority { return this._priority; }
  set priority(priority: Priority) { this._priority = priority; }

  /**
   * Support department
   */
  get department(): Department { return this._department; }
  set department(department: Department) { this._department = department; }

  /**
   * Support ticket identifier (format TICKET-00000000)
   * @example TICKET-12345678
   */
  get ticketId(): string { return this._ticketId; }
  set ticketId(ticketId: string) { this._ticketId = ticketId; }


  /**
   * Realize the channel/topic with the parameters added to this class.
   */
  public getChannelWithParameters(channel: string) {
    channel = channel.replace(/\{priority\}/g, this.priority);
    channel = channel.replace(/\{department\}/g, this.department);
    channel = channel.replace(/\{ticketId\}/g, this.ticketId);
    return channel;
  }
  
  public static createFromChannel(msgSubject: string, channel: string, regex: RegExp): SupportTicketsParameters {
    const parameters = new SupportTicketsParameters({priority: "low", department: "technical", ticketId: ''});
  const match = msgSubject.match(regex);
  const sequentialParameters: string[] = channel.match(/\{(\w+)\}/g) || [];

  if (match) {
    const priorityMatch = match[sequentialParameters.indexOf('{priority}')+1];
        if(priorityMatch && priorityMatch !== '') {
          parameters.priority = priorityMatch as any
        } else {
          throw new Error(`Parameter: 'priority' is not valid. Abort! `) 
        }
  const departmentMatch = match[sequentialParameters.indexOf('{department}')+1];
        if(departmentMatch && departmentMatch !== '') {
          parameters.department = departmentMatch as any
        } else {
          throw new Error(`Parameter: 'department' is not valid. Abort! `) 
        }
  const ticketIdMatch = match[sequentialParameters.indexOf('{ticketId}')+1];
        if(ticketIdMatch && ticketIdMatch !== '') {
          parameters.ticketId = ticketIdMatch as any
        } else {
          throw new Error(`Parameter: 'ticketId' is not valid. Abort! `) 
        }
  } else {
    throw new Error(`Unable to find parameters in channel/topic, topic was ${channel}`)
  }
  return parameters;
  }
}
export { SupportTicketsParameters };