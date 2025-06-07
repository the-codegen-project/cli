import {OrderCreated} from './channels/payload/OrderCreated';
import {OrderUpdated} from './channels/payload/OrderUpdated';
import {OrderCancelled} from './channels/payload/OrderCancelled';
import * as OrderEventsPayloadModule from './channels/payload/OrderEventsPayload';
import * as OrderLifecyclePayloadModule from './channels/payload/OrderLifecyclePayload';
import {OrderItem} from './channels/payload/OrderItem';
import {Money} from './channels/payload/Money';
import {Currency} from './channels/payload/Currency';
import {Address} from './channels/payload/Address';
import {OrderStatus} from './channels/payload/OrderStatus';
export {OrderCreated};
export {OrderUpdated};
export {OrderCancelled};
export {OrderEventsPayloadModule};
export {OrderLifecyclePayloadModule};
export {OrderItem};
export {Money};
export {Currency};
export {Address};
export {OrderStatus};
import {OrderLifecycleParameters} from './channels/parameter/OrderLifecycleParameters';
export {OrderLifecycleParameters};

//Import channel functions
import { Protocols } from './channels/index';
const { nats } = Protocols;

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
   * @param parameters for topic substitution
   * @param options to use while publishing the message
   */
  public async publishToOrderCreated({
    message, 
    parameters, 
    options
  }: {
    message: OrderCreated, 
    parameters: OrderLifecycleParameters, 
    options?: Nats.PublishOptions
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined) {
      await nats.publishToOrderCreated({
        message, 
        parameters, 
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
 * @param parameters for topic substitution
 * @param options to use while publishing the message
   */
  public async jetStreamPublishToOrderCreated({
    message, 
    parameters, 
    options = {}
  }: {
    message: OrderCreated, 
    parameters: OrderLifecycleParameters, 
    options?: Partial<Nats.JetStreamPublishOptions>
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
      return nats.jetStreamPublishToOrderCreated({
        message, 
        parameters, 
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
   * @param message to publish
   * @param parameters for topic substitution
   * @param options to use while publishing the message
   */
  public async publishToOrderUpdated({
    message, 
    parameters, 
    options
  }: {
    message: OrderUpdated, 
    parameters: OrderLifecycleParameters, 
    options?: Nats.PublishOptions
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined) {
      await nats.publishToOrderUpdated({
        message, 
        parameters, 
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
 * @param parameters for topic substitution
 * @param options to use while publishing the message
   */
  public async jetStreamPublishToOrderUpdated({
    message, 
    parameters, 
    options = {}
  }: {
    message: OrderUpdated, 
    parameters: OrderLifecycleParameters, 
    options?: Partial<Nats.JetStreamPublishOptions>
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
      return nats.jetStreamPublishToOrderUpdated({
        message, 
        parameters, 
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
   * @param message to publish
   * @param parameters for topic substitution
   * @param options to use while publishing the message
   */
  public async publishToOrderCancelled({
    message, 
    parameters, 
    options
  }: {
    message: OrderCancelled, 
    parameters: OrderLifecycleParameters, 
    options?: Nats.PublishOptions
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined) {
      await nats.publishToOrderCancelled({
        message, 
        parameters, 
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
 * @param parameters for topic substitution
 * @param options to use while publishing the message
   */
  public async jetStreamPublishToOrderCancelled({
    message, 
    parameters, 
    options = {}
  }: {
    message: OrderCancelled, 
    parameters: OrderLifecycleParameters, 
    options?: Partial<Nats.JetStreamPublishOptions>
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
      return nats.jetStreamPublishToOrderCancelled({
        message, 
        parameters, 
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
    * @param {subscribeToOrderEventsCallback} onDataCallback to call when messages are received
    * @param parameters for topic substitution
    * @param options when setting up the subscription
    * @param options when setting up the subscription
   */
  public subscribeToOrderEvents({
    onDataCallback, 
    parameters, 
    options, 
    flush
  }: {
    onDataCallback: (err?: Error, msg?: OrderEventsPayloadModule.OrderEventsPayload, parameters?: OrderLifecycleParameters, natsMsg?: Nats.Msg) => void, 
    parameters: OrderLifecycleParameters, 
    options?: Nats.SubscriptionOptions, 
    flush?: boolean
  }): Promise<Nats.Subscription> {
  return new Promise(async (resolve, reject) => {
    if(!this.isClosed() && this.nc !== undefined && this.codec !== undefined){
      try {
        const sub = await nats.subscribeToOrderEvents({
          onDataCallback, 
          parameters, 
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
   * @param {jetStreamPullSubscribeToOrderEventsCallback} onDataCallback to call when messages are received
   * @param parameters for topic substitution
   * @param options when setting up the subscription
  */
  public jetStreamPullSubscribeToOrderEvents({
    onDataCallback, 
    parameters, 
    options = {}
  }: {
    onDataCallback: (err?: Error, msg?: OrderEventsPayloadModule.OrderEventsPayload, parameters?: OrderLifecycleParameters, jetstreamMsg?: Nats.JsMsg) => void, 
    parameters: OrderLifecycleParameters, 
    options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
  }): Promise<Nats.JetStreamPullSubscription> {
      return new Promise(async (resolve, reject) => {
        if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
          try {
            const sub = await nats.jetStreamPullSubscribeToOrderEvents({
              onDataCallback, 
              parameters, 
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
   * @param {jetStreamPushSubscriptionFromOrderEventsCallback} onDataCallback to call when messages are received
   * @param parameters for topic substitution
   * @param options when setting up the subscription
  */
  public jetStreamPushSubscriptionFromOrderEvents({
    onDataCallback, 
    parameters, 
    options = {}
  }: {
    onDataCallback: (err?: Error, msg?: OrderEventsPayloadModule.OrderEventsPayload, parameters?: OrderLifecycleParameters, jetstreamMsg?: Nats.JsMsg) => void, 
    parameters: OrderLifecycleParameters, 
    options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
  }): Promise<Nats.JetStreamSubscription> {
    return new Promise(async (resolve, reject) => {
      if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
        try {
          const sub = await nats.jetStreamPushSubscriptionFromOrderEvents({
            onDataCallback, 
            parameters, 
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