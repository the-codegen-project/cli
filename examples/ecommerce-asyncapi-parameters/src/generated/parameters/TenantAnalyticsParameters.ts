import {EnvironmentType} from './EnvironmentType';
import {MetricType} from './MetricType';
import {AggregationPeriod} from './AggregationPeriod';
class TenantAnalyticsParameters {
  private _tenantId: string;
  private _environmentType: EnvironmentType;
  private _metricType: MetricType;
  private _aggregationPeriod: AggregationPeriod;

  constructor(input: {
    tenantId: string,
    environmentType: EnvironmentType,
    metricType: MetricType,
    aggregationPeriod: AggregationPeriod,
  }) {
    this._tenantId = input.tenantId;
    this._environmentType = input.environmentType;
    this._metricType = input.metricType;
    this._aggregationPeriod = input.aggregationPeriod;
  }

  /**
   * Tenant identifier for data isolation (format tenant-xxxxxxxx)
   * @example tenant-abc123, tenant-xyz789def
   */
  get tenantId(): string { return this._tenantId; }
  set tenantId(tenantId: string) { this._tenantId = tenantId; }

  /**
   * Environment for proper data segregation
   */
  get environmentType(): EnvironmentType { return this._environmentType; }
  set environmentType(environmentType: EnvironmentType) { this._environmentType = environmentType; }

  /**
   * Type of metric being tracked
   */
  get metricType(): MetricType { return this._metricType; }
  set metricType(metricType: MetricType) { this._metricType = metricType; }

  /**
   * Time period for metric aggregation
   */
  get aggregationPeriod(): AggregationPeriod { return this._aggregationPeriod; }
  set aggregationPeriod(aggregationPeriod: AggregationPeriod) { this._aggregationPeriod = aggregationPeriod; }


  /**
   * Realize the channel/topic with the parameters added to this class.
   */
  public getChannelWithParameters(channel: string) {
    channel = channel.replace(/\{tenantId\}/g, this.tenantId);
    channel = channel.replace(/\{environmentType\}/g, this.environmentType);
    channel = channel.replace(/\{metricType\}/g, this.metricType);
    channel = channel.replace(/\{aggregationPeriod\}/g, this.aggregationPeriod);
    return channel;
  }
  
  public static createFromChannel(msgSubject: string, channel: string, regex: RegExp): TenantAnalyticsParameters {
    const parameters = new TenantAnalyticsParameters({tenantId: '', environmentType: "production", metricType: "sales", aggregationPeriod: "minute"});
  const match = msgSubject.match(regex);
  const sequentialParameters: string[] = channel.match(/\{(\w+)\}/g) || [];

  if (match) {
    const tenantIdMatch = match[sequentialParameters.indexOf('{tenantId}')+1];
        if(tenantIdMatch && tenantIdMatch !== '') {
          parameters.tenantId = tenantIdMatch as any
        } else {
          throw new Error(`Parameter: 'tenantId' is not valid. Abort! `) 
        }
  const environmentTypeMatch = match[sequentialParameters.indexOf('{environmentType}')+1];
        if(environmentTypeMatch && environmentTypeMatch !== '') {
          parameters.environmentType = environmentTypeMatch as any
        } else {
          throw new Error(`Parameter: 'environmentType' is not valid. Abort! `) 
        }
  const metricTypeMatch = match[sequentialParameters.indexOf('{metricType}')+1];
        if(metricTypeMatch && metricTypeMatch !== '') {
          parameters.metricType = metricTypeMatch as any
        } else {
          throw new Error(`Parameter: 'metricType' is not valid. Abort! `) 
        }
  const aggregationPeriodMatch = match[sequentialParameters.indexOf('{aggregationPeriod}')+1];
        if(aggregationPeriodMatch && aggregationPeriodMatch !== '') {
          parameters.aggregationPeriod = aggregationPeriodMatch as any
        } else {
          throw new Error(`Parameter: 'aggregationPeriod' is not valid. Abort! `) 
        }
  } else {
    throw new Error(`Unable to find parameters in channel/topic, topic was ${channel}`)
  }
  return parameters;
  }
}
export { TenantAnalyticsParameters };