import {UserSignedUp} from './../payloads/UserSignedUp';
import * as StringMessageModule from './../payloads/StringMessage';
import * as ArrayMessageModule from './../payloads/ArrayMessage';
import * as UnionMessageModule from './../payloads/UnionMessage';
import {AnonymousSchema_9} from './../payloads/AnonymousSchema_9';
export {UserSignedUp};
export {StringMessageModule};
export {ArrayMessageModule};
export {UnionMessageModule};
export {AnonymousSchema_9};
import {UserSignedupParameters} from './../parameters/UserSignedupParameters';
export {UserSignedupParameters};

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
   * @param parameters for topic substitution
   * @param options to use while publishing the message
   */
  public async publishToSendUserSignedup({
    message, 
    parameters, 
    options
  }: {
    message: UserSignedUp, 
    parameters: UserSignedupParameters, 
    options?: Nats.PublishOptions
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined) {
      await nats.publishToSendUserSignedup({
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
  public async jetStreamPublishToSendUserSignedup({
    message, 
    parameters, 
    options = {}
  }: {
    message: UserSignedUp, 
    parameters: UserSignedupParameters, 
    options?: Partial<Nats.JetStreamPublishOptions>
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
      return nats.jetStreamPublishToSendUserSignedup({
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
    * @param {subscribeToReceiveUserSignedupCallback} onDataCallback to call when messages are received
    * @param parameters for topic substitution
    * @param options when setting up the subscription
    * @param options when setting up the subscription
   */
  public subscribeToReceiveUserSignedup({
    onDataCallback, 
    parameters, 
    options, 
    flush
  }: {
    onDataCallback: (err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, natsMsg?: Nats.Msg) => void, 
    parameters: UserSignedupParameters, 
    options?: Nats.SubscriptionOptions, 
    flush?: boolean
  }): Promise<Nats.Subscription> {
  return new Promise(async (resolve, reject) => {
    if(!this.isClosed() && this.nc !== undefined && this.codec !== undefined){
      try {
        const sub = await nats.subscribeToReceiveUserSignedup({
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
   * @param {jetStreamPullSubscribeToReceiveUserSignedupCallback} onDataCallback to call when messages are received
   * @param parameters for topic substitution
   * @param options when setting up the subscription
  */
  public jetStreamPullSubscribeToReceiveUserSignedup({
    onDataCallback, 
    parameters, 
    options = {}
  }: {
    onDataCallback: (err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, jetstreamMsg?: Nats.JsMsg) => void, 
    parameters: UserSignedupParameters, 
    options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
  }): Promise<Nats.JetStreamPullSubscription> {
      return new Promise(async (resolve, reject) => {
        if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
          try {
            const sub = await nats.jetStreamPullSubscribeToReceiveUserSignedup({
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
   * @param {jetStreamPushSubscriptionFromReceiveUserSignedupCallback} onDataCallback to call when messages are received
   * @param parameters for topic substitution
   * @param options when setting up the subscription
  */
  public jetStreamPushSubscriptionFromReceiveUserSignedup({
    onDataCallback, 
    parameters, 
    options = {}
  }: {
    onDataCallback: (err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, jetstreamMsg?: Nats.JsMsg) => void, 
    parameters: UserSignedupParameters, 
    options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
  }): Promise<Nats.JetStreamSubscription> {
    return new Promise(async (resolve, reject) => {
      if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
        try {
          const sub = await nats.jetStreamPushSubscriptionFromReceiveUserSignedup({
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
   * @param message to publish
   * @param options to use while publishing the message
   */
  public async publishToNoParameter({
    message, 
    options
  }: {
    message: UserSignedUp, 
    options?: Nats.PublishOptions
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined) {
      await nats.publishToNoParameter({
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
    * @param {subscribeToNoParameterCallback} onDataCallback to call when messages are received
    * @param options when setting up the subscription
    * @param options when setting up the subscription
   */
  public subscribeToNoParameter({
    onDataCallback, 
    options, 
    flush
  }: {
    onDataCallback: (err?: Error, msg?: UserSignedUp, natsMsg?: Nats.Msg) => void, 
    options?: Nats.SubscriptionOptions, 
    flush?: boolean
  }): Promise<Nats.Subscription> {
  return new Promise(async (resolve, reject) => {
    if(!this.isClosed() && this.nc !== undefined && this.codec !== undefined){
      try {
        const sub = await nats.subscribeToNoParameter({
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
   * @param {jetStreamPullSubscribeToNoParameterCallback} onDataCallback to call when messages are received
   * @param options when setting up the subscription
  */
  public jetStreamPullSubscribeToNoParameter({
    onDataCallback, 
    options = {}
  }: {
    onDataCallback: (err?: Error, msg?: UserSignedUp, jetstreamMsg?: Nats.JsMsg) => void, 
    options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
  }): Promise<Nats.JetStreamPullSubscription> {
      return new Promise(async (resolve, reject) => {
        if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
          try {
            const sub = await nats.jetStreamPullSubscribeToNoParameter({
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
   * @param {jetStreamPushSubscriptionFromNoParameterCallback} onDataCallback to call when messages are received
   * @param options when setting up the subscription
  */
  public jetStreamPushSubscriptionFromNoParameter({
    onDataCallback, 
    options = {}
  }: {
    onDataCallback: (err?: Error, msg?: UserSignedUp, jetstreamMsg?: Nats.JsMsg) => void, 
    options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
  }): Promise<Nats.JetStreamSubscription> {
    return new Promise(async (resolve, reject) => {
      if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
        try {
          const sub = await nats.jetStreamPushSubscriptionFromNoParameter({
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
   * @param message to publish
 * @param options to use while publishing the message
   */
  public async jetStreamPublishToNoParameter({
    message, 
    options = {}
  }: {
    message: UserSignedUp, 
    options?: Partial<Nats.JetStreamPublishOptions>
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
      return nats.jetStreamPublishToNoParameter({
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
   * @param message to publish
   * @param options to use while publishing the message
   */
  public async publishToSendStringPayload({
    message, 
    options
  }: {
    message: StringMessageModule.StringMessage, 
    options?: Nats.PublishOptions
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined) {
      await nats.publishToSendStringPayload({
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
  public async jetStreamPublishToSendStringPayload({
    message, 
    options = {}
  }: {
    message: StringMessageModule.StringMessage, 
    options?: Partial<Nats.JetStreamPublishOptions>
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
      return nats.jetStreamPublishToSendStringPayload({
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
    * @param {subscribeToReceiveStringPayloadCallback} onDataCallback to call when messages are received
    * @param options when setting up the subscription
    * @param options when setting up the subscription
   */
  public subscribeToReceiveStringPayload({
    onDataCallback, 
    options, 
    flush
  }: {
    onDataCallback: (err?: Error, msg?: StringMessageModule.StringMessage, natsMsg?: Nats.Msg) => void, 
    options?: Nats.SubscriptionOptions, 
    flush?: boolean
  }): Promise<Nats.Subscription> {
  return new Promise(async (resolve, reject) => {
    if(!this.isClosed() && this.nc !== undefined && this.codec !== undefined){
      try {
        const sub = await nats.subscribeToReceiveStringPayload({
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
   * @param {jetStreamPullSubscribeToReceiveStringPayloadCallback} onDataCallback to call when messages are received
   * @param options when setting up the subscription
  */
  public jetStreamPullSubscribeToReceiveStringPayload({
    onDataCallback, 
    options = {}
  }: {
    onDataCallback: (err?: Error, msg?: StringMessageModule.StringMessage, jetstreamMsg?: Nats.JsMsg) => void, 
    options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
  }): Promise<Nats.JetStreamPullSubscription> {
      return new Promise(async (resolve, reject) => {
        if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
          try {
            const sub = await nats.jetStreamPullSubscribeToReceiveStringPayload({
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
   * @param {jetStreamPushSubscriptionFromReceiveStringPayloadCallback} onDataCallback to call when messages are received
   * @param options when setting up the subscription
  */
  public jetStreamPushSubscriptionFromReceiveStringPayload({
    onDataCallback, 
    options = {}
  }: {
    onDataCallback: (err?: Error, msg?: StringMessageModule.StringMessage, jetstreamMsg?: Nats.JsMsg) => void, 
    options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
  }): Promise<Nats.JetStreamSubscription> {
    return new Promise(async (resolve, reject) => {
      if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
        try {
          const sub = await nats.jetStreamPushSubscriptionFromReceiveStringPayload({
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
   * @param message to publish
   * @param options to use while publishing the message
   */
  public async publishToSendArrayPayload({
    message, 
    options
  }: {
    message: ArrayMessageModule.ArrayMessage, 
    options?: Nats.PublishOptions
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined) {
      await nats.publishToSendArrayPayload({
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
  public async jetStreamPublishToSendArrayPayload({
    message, 
    options = {}
  }: {
    message: ArrayMessageModule.ArrayMessage, 
    options?: Partial<Nats.JetStreamPublishOptions>
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
      return nats.jetStreamPublishToSendArrayPayload({
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
    * @param {subscribeToReceiveArrayPayloadCallback} onDataCallback to call when messages are received
    * @param options when setting up the subscription
    * @param options when setting up the subscription
   */
  public subscribeToReceiveArrayPayload({
    onDataCallback, 
    options, 
    flush
  }: {
    onDataCallback: (err?: Error, msg?: ArrayMessageModule.ArrayMessage, natsMsg?: Nats.Msg) => void, 
    options?: Nats.SubscriptionOptions, 
    flush?: boolean
  }): Promise<Nats.Subscription> {
  return new Promise(async (resolve, reject) => {
    if(!this.isClosed() && this.nc !== undefined && this.codec !== undefined){
      try {
        const sub = await nats.subscribeToReceiveArrayPayload({
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
   * @param {jetStreamPullSubscribeToReceiveArrayPayloadCallback} onDataCallback to call when messages are received
   * @param options when setting up the subscription
  */
  public jetStreamPullSubscribeToReceiveArrayPayload({
    onDataCallback, 
    options = {}
  }: {
    onDataCallback: (err?: Error, msg?: ArrayMessageModule.ArrayMessage, jetstreamMsg?: Nats.JsMsg) => void, 
    options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
  }): Promise<Nats.JetStreamPullSubscription> {
      return new Promise(async (resolve, reject) => {
        if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
          try {
            const sub = await nats.jetStreamPullSubscribeToReceiveArrayPayload({
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
   * @param {jetStreamPushSubscriptionFromReceiveArrayPayloadCallback} onDataCallback to call when messages are received
   * @param options when setting up the subscription
  */
  public jetStreamPushSubscriptionFromReceiveArrayPayload({
    onDataCallback, 
    options = {}
  }: {
    onDataCallback: (err?: Error, msg?: ArrayMessageModule.ArrayMessage, jetstreamMsg?: Nats.JsMsg) => void, 
    options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
  }): Promise<Nats.JetStreamSubscription> {
    return new Promise(async (resolve, reject) => {
      if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
        try {
          const sub = await nats.jetStreamPushSubscriptionFromReceiveArrayPayload({
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
   * @param message to publish
   * @param options to use while publishing the message
   */
  public async publishToSendUnionPayload({
    message, 
    options
  }: {
    message: UnionMessageModule.UnionMessage, 
    options?: Nats.PublishOptions
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined) {
      await nats.publishToSendUnionPayload({
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
  public async jetStreamPublishToSendUnionPayload({
    message, 
    options = {}
  }: {
    message: UnionMessageModule.UnionMessage, 
    options?: Partial<Nats.JetStreamPublishOptions>
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
      return nats.jetStreamPublishToSendUnionPayload({
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
    * @param {subscribeToReceiveUnionPayloadCallback} onDataCallback to call when messages are received
    * @param options when setting up the subscription
    * @param options when setting up the subscription
   */
  public subscribeToReceiveUnionPayload({
    onDataCallback, 
    options, 
    flush
  }: {
    onDataCallback: (err?: Error, msg?: UnionMessageModule.UnionMessage, natsMsg?: Nats.Msg) => void, 
    options?: Nats.SubscriptionOptions, 
    flush?: boolean
  }): Promise<Nats.Subscription> {
  return new Promise(async (resolve, reject) => {
    if(!this.isClosed() && this.nc !== undefined && this.codec !== undefined){
      try {
        const sub = await nats.subscribeToReceiveUnionPayload({
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
   * @param {jetStreamPullSubscribeToReceiveUnionPayloadCallback} onDataCallback to call when messages are received
   * @param options when setting up the subscription
  */
  public jetStreamPullSubscribeToReceiveUnionPayload({
    onDataCallback, 
    options = {}
  }: {
    onDataCallback: (err?: Error, msg?: UnionMessageModule.UnionMessage, jetstreamMsg?: Nats.JsMsg) => void, 
    options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
  }): Promise<Nats.JetStreamPullSubscription> {
      return new Promise(async (resolve, reject) => {
        if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
          try {
            const sub = await nats.jetStreamPullSubscribeToReceiveUnionPayload({
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
   * @param {jetStreamPushSubscriptionFromReceiveUnionPayloadCallback} onDataCallback to call when messages are received
   * @param options when setting up the subscription
  */
  public jetStreamPushSubscriptionFromReceiveUnionPayload({
    onDataCallback, 
    options = {}
  }: {
    onDataCallback: (err?: Error, msg?: UnionMessageModule.UnionMessage, jetstreamMsg?: Nats.JsMsg) => void, 
    options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
  }): Promise<Nats.JetStreamSubscription> {
    return new Promise(async (resolve, reject) => {
      if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
        try {
          const sub = await nats.jetStreamPushSubscriptionFromReceiveUnionPayload({
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