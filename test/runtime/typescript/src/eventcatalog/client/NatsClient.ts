import {EventCatalogPing} from './../payloads/EventCatalogPing';
export {EventCatalogPing};

//Import channel functions
import * as nats from './../channels/nats';

import * as Nats from 'nats';

/**
 * @class NatsClient
 */
export class NatsClient {
  public nc?: Nats.NatsConnection;
  public js?: Nats.JetStreamClient;
  public codec?: Nats.Codec<any>;
  public options?: Nats.ConnectionOptions;

  /**
   * Disconnect all clients from the server and drain subscriptions.
   * 
   * This is a gentle disconnect and make take a little.
   */
  async disconnect() {
    if (!this.isClosed() && this.nc !== undefined) {
      await this.nc.drain();
    }
  }
  /**
   * Returns whether or not any of the clients are closed
   */
  isClosed() {
    if (!this.nc || this.nc.isClosed()) {
      return true;
    }
    return false;
  }
  /**
   * Try to connect to the NATS server with user credentials
   *
   * @param userCreds to use
   * @param options to connect with
   */
  async connectWithUserCreds(userCreds: string, options?: Nats.ConnectionOptions, codec?: Nats.Codec<any> ) {
    return await this.connect({
      user: userCreds,
      ...options
    }, codec);
  }
  /**
   * Try to connect to the NATS server with user and password
   * 
   * @param user username to use
   * @param pass password to use
   * @param options to connect with
   */
  async connectWithUserPass(user: string, pass: string, options?: Nats.ConnectionOptions, codec?: Nats.Codec<any> ) {
    return await this.connect({
      user: user,
      pass: pass,
      ...options
    }, codec);
  }
  /**
   * Try to connect to the NATS server which has no authentication
   
    * @param host to connect to
    * @param options to connect with
    */
  async connectToHost(host: string, options?: Nats.ConnectionOptions, codec?: Nats.Codec<any> ) {
    return await this.connect({
      servers: [host],
      ...options
    }, codec);
  }

  /**
   * Try to connect to the NATS server with the different payloads.
   * @param options to use, payload is omitted if sat in the AsyncAPI document.
   */
  connect(options: Nats.ConnectionOptions, codec?: Nats.Codec<any>): Promise<{nc: Nats.NatsConnection, js: Nats.JetStreamClient}> {
    return new Promise(async (resolve, reject: (error: any) => void) => {
      if (!this.isClosed()) {
        return reject('Client is still connected, please close it first.');
      }
      this.options = options;
      if (codec) {
        this.codec = codec;
      } else {
        this.codec = Nats.JSONCodec();
      }
      try {
        this.nc = await Nats.connect(this.options);
        this.js = this.nc.jetstream();
        resolve({nc: this.nc, js: this.js});
      } catch (e: any) {
        reject('Could not connect to NATS server');
      }
    })
  }
  
  /**
   * 
   * 
   * @param message to publish
   * @param options to use while publishing the message
   */
  public async publishToSendEventcatalogPing({
    message, 
    options
  }: {
    message: EventCatalogPing, 
    options?: Nats.PublishOptions
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined) {
      await nats.publishToSendEventcatalogPing({
        message, 
        nc: this.nc, 
        codec: this.codec, 
        options
      });
    } else {
      Promise.reject('Nats client not available yet, please connect or set the client');
    }
  }

  /**
   * 
   * 
   * @param message to publish
 * @param options to use while publishing the message
   */
  public async jetStreamPublishToSendEventcatalogPing({
    message, 
    options = {}
  }: {
    message: EventCatalogPing, 
    options?: Partial<Nats.JetStreamPublishOptions>
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
      return nats.jetStreamPublishToSendEventcatalogPing({
        message, 
        js: this.js, 
        codec: this.codec, 
        options
      });
    } else {
      Promise.reject('Nats client not available yet, please connect or set the client');
    }
  }
  

  /** 
   * 
   * 
    * @param {subscribeToReceiveEventcatalogPingCallback} onDataCallback to call when messages are received
    * @param options when setting up the subscription
    * @param options when setting up the subscription
   */
  public subscribeToReceiveEventcatalogPing({
    onDataCallback, 
    options, 
    flush
  }: {
    onDataCallback: (err?: Error, msg?: EventCatalogPing, natsMsg?: Nats.Msg) => void, 
    options?: Nats.SubscriptionOptions, 
    flush?: boolean
  }): Promise<Nats.Subscription> {
  return new Promise(async (resolve, reject) => {
    if(!this.isClosed() && this.nc !== undefined && this.codec !== undefined){
      try {
        const sub = await nats.subscribeToReceiveEventcatalogPing({
          onDataCallback, 
          nc: this.nc, 
          codec: this.codec, 
          options
        });
        if(flush){
          await this.nc.flush();
        }
        resolve(sub);
      }catch(e: any){
        reject(e);
      }
    } else {
      Promise.reject('Nats client not available yet, please connect or set the client');
    }
  });
}

  /**
  * 
  * 
   * @param {jetStreamPullSubscribeToReceiveEventcatalogPingCallback} onDataCallback to call when messages are received
   * @param options when setting up the subscription
  */
  public jetStreamPullSubscribeToReceiveEventcatalogPing({
    onDataCallback, 
    options = {}
  }: {
    onDataCallback: (err?: Error, msg?: EventCatalogPing, jetstreamMsg?: Nats.JsMsg) => void, 
    options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
  }): Promise<Nats.JetStreamPullSubscription> {
      return new Promise(async (resolve, reject) => {
        if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
          try {
            const sub = await nats.jetStreamPullSubscribeToReceiveEventcatalogPing({
              onDataCallback, 
              js: this.js, 
              codec: this.codec, 
              options
            });
            resolve(sub);
          } catch (e: any) {
            reject(e);
          }
        } else {
          Promise.reject('Nats client not available yet, please connect or set the client');
        }
      });
    }
  

  /**
  * 
  * 
   * @param {jetStreamPushSubscriptionFromReceiveEventcatalogPingCallback} onDataCallback to call when messages are received
   * @param options when setting up the subscription
  */
  public jetStreamPushSubscriptionFromReceiveEventcatalogPing({
    onDataCallback, 
    options = {}
  }: {
    onDataCallback: (err?: Error, msg?: EventCatalogPing, jetstreamMsg?: Nats.JsMsg) => void, 
    options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
  }): Promise<Nats.JetStreamSubscription> {
    return new Promise(async (resolve, reject) => {
      if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
        try {
          const sub = await nats.jetStreamPushSubscriptionFromReceiveEventcatalogPing({
            onDataCallback, 
            js: this.js, 
            codec: this.codec, 
            options
          });
          resolve(sub);
        } catch (e: any) {
          reject(e);
        }
      } else {
        Promise.reject('Nats client not available yet, please connect or set the client');
      }
    });
  }
}