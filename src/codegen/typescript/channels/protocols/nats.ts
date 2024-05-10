// import { camelCase, pascalCase, realizeChannelName, realizeParametersForChannelWithoutType, realizeParametersForChannelWrapper, renderJSDocParameters, unwrap } from "../../utils.js"
// import { ConstrainedMetaModel, ConstrainedObjectModel } from "@asyncapi/modelina"

// export function JetstreamPull(channelName, message, messageDescription, channelParameters) {
//   return `
//   /**
//     * JetStream pull function.
//     * 
//     * Pull message from \`${channelName}\`
//     * 
//     * ${messageDescription}
//     * 
//     * @param onDataCallback to call when messages are received
//     ${renderJSDocParameters(channelParameters)}
//     * @param options to pull message with, bindings from the AsyncAPI document overwrite these if specified
//     */
//     public jetStreamPull${pascalCase(channelName)}(
//       onDataCallback: (
//         err ? : NatsTypescriptTemplateError,
//         msg?: ${getMessageType(message)}
//         ${realizeParametersForChannelWrapper(channelParameters, false)},
//         jetstreamMsg?: Nats.JsMsg) => void
//       ${realizeParametersForChannelWrapper(channelParameters)}
//     ): void {
//       if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
//         ${camelCase(channelName)}Channel.jetStreamPull(
//           onDataCallback,
//           this.js,
//           this.codec 
//           ${
//             Object.keys(channelParameters).length
//               ? ` ,${realizeParametersForChannelWithoutType(channelParameters)},`
//               : ''
//           }
//         );
//       } else {
//         throw NatsTypescriptTemplateError.errorForCode(ErrorCode.NOT_CONNECTED);
//       }
//     }
//     `
// }

// /**
//  * Component which returns a subscribe to function for the client
//  *
//  * @param {string} defaultContentType
//  * @param {string} channelName to publish to
//  * @param {Message} message which is being received
//  * @param {string} messageDescription
//  * @param {Object.<string, ChannelParameter>} channelParameters parameters to the channel
//  */
// export function JetstreamPushSubscription(channelName, message, messageDescription, channelParameters) {
//   return `
//   /**
//     * Push subscription to the \`${channelName}\`
//     * 
//     * ${messageDescription}
//     * 
//     * @param onDataCallback to call when messages are received
//     ${renderJSDocParameters(channelParameters)}
//     * @param flush ensure client is force flushed after subscribing
//     * @param options to subscribe with, bindings from the AsyncAPI document overwrite these if specified
//     */
//     public jetStreamPushSubscribeTo${pascalCase(channelName)}(
//       onDataCallback: (
//         err?: NatsTypescriptTemplateError,
//         msg?: ${getMessageType(message)}
//         ${realizeParametersForChannelWrapper(channelParameters, false)},
//         jetstreamMsg?: Nats.JsMsg) => void
//       ${realizeParametersForChannelWrapper(channelParameters)},
//       options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
//     ): Promise<Nats.JetStreamSubscription> {
//       return new Promise(async (resolve, reject) => {
//         if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
//           try {
//             const sub = await ${camelCase(channelName)}Channel.jetStreamPushSubscribe(
//               onDataCallback,
//               this.js,
//               this.codec,
//               ${
//                 Object.keys(channelParameters).length
//                   ? `${realizeParametersForChannelWithoutType(channelParameters)},`
//                   : ''
//               }
//               options
//             );
//             resolve(sub);
//           } catch (e: any) {
//             reject(e);
//           }
//         } else {
//           reject(NatsTypescriptTemplateError.errorForCode(ErrorCode.NOT_CONNECTED));
//         }
//       });
//     }
//   `
// }

// /**
//  * Component which returns a publish to function for the client
//  *
//  * @param {string} defaultContentType
//  * @param {string} channelName to publish to
//  * @param {Message} message which is being published
//  * @param {string} messageDescription
//  * @param {Object.<string, ChannelParameter>} channelParameters parameters to the channel
//  */
// export function Publish(channelName, message, messageDescription, channelParameters) {
//   return `
//   /**
//    * Publish to the \`${channelName}\` channel 
//    * 
//    * ${messageDescription}
//    * 
//    * @param message to publish
//    ${renderJSDocParameters(channelParameters)}
//    */
//     public publishTo${pascalCase(channelName)}(
//       message: ${getMessageType(message)} 
//       ${realizeParametersForChannelWrapper(channelParameters)},
//       options?: Nats.PublishOptions
//     ): Promise<void> {
//       if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined) {
//         return ${camelCase(channelName)}Channel.publish(
//           message, 
//           this.nc,
//           this.codec
//           ${
//             Object.keys(channelParameters).length ? `,${realizeParametersForChannelWithoutType(channelParameters)}` : ''
//           },
//           options
//         );
//       }else{
//         return Promise.reject(NatsTypescriptTemplateError.errorForCode(ErrorCode.NOT_CONNECTED));
//       }
//     }
//   `
// }

// /**
//  * @typedef TemplateParameters
//  * @type {object}
//  * @property {boolean|string} generateTestClient - whether or not test client should be generated.
//  * @property {boolean|string} promisifyReplyCallback - whether or not reply callbacks should be promisify.
//  */

// /**
//  * Component which returns a reply to function for the client
//  *
//  * @param {string} channelName to setup reply to
//  * @param {Message} replyMessage used to reply to request
//  * @param {Message} receiveMessage which is received by the request
//  * @param {string} messageDescription
//  * @param {Object.<string, ChannelParameter>} channelParameters parameters to the channel
//  * @param {TemplateParameters} params passed template parameters
//  */
// export function Reply(channelName, replyMessage, receiveMessage, messageDescription, channelParameters, params) {
//   return `
//   /**
//    * Reply to the \`${channelName}\` channel 
//    * 
//    * ${messageDescription}
//    * 
//    * @param onRequest called when request is received
//    * @param onReplyError called when it was not possible to send the reply
//    ${renderJSDocParameters(channelParameters)}
//    * @param flush ensure client is force flushed after subscribing
//    * @param options to subscribe with, bindings from the AsyncAPI document overwrite these if specified
//    */
//     public replyTo${pascalCase(channelName)}(
//         onRequest : (
//           err?: NatsTypescriptTemplateError, 
//           msg?: ${getMessageType(receiveMessage)}
//           ${realizeParametersForChannelWrapper(channelParameters, false)}
//         ) => ${params.promisifyReplyCallback.length && 'Promise<'}${getMessageType(replyMessage)}${
//     params.promisifyReplyCallback.length && '>'
//   }, 
//         onReplyError : (err: NatsTypescriptTemplateError) => void 
//         ${realizeParametersForChannelWrapper(channelParameters)}, 
//         flush?: boolean,
//         options?: Nats.SubscriptionOptions
//       ): Promise<Nats.Subscription> {
//       return new Promise(async (resolve, reject) => {
//         if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined) {
//           try {
//             const sub = await ${camelCase(channelName)}Channel.reply(
//               onRequest, 
//               onReplyError, 
//               this.nc,
//               this.codec
//               ${
//                 Object.keys(channelParameters).length
//                   ? `,${realizeParametersForChannelWithoutType(channelParameters)}`
//                   : ''
//               },
//               options
//             );
//             if(flush){
//               await this.nc!.flush();
//             }
//             resolve(sub);
//           } catch (e: any) {
//             reject(e);
//           }
//         } else {
//           reject(NatsTypescriptTemplateError.errorForCode(ErrorCode.NOT_CONNECTED));
//         }
//       });
//     }
//   `
// }

// /**
//  * Component which returns a request to function for the client
//  *
//  * @param {string} channelName to request to
//  * @param {Message} requestMessage used to send the request
//  * @param {Message} replyMessage which is receive in the reply
//  * @param {string} messageDescription
//  * @param {Object.<string, ChannelParameter>} channelParameters parameters to the channel
//  */
// export function Request(channelName, requestMessage, replyMessage, messageDescription, channelParameters) {
//   return `
//     /**
//      * Reply to the \`${channelName}\` channel 
//      * 
//      * ${messageDescription}
//      * 
//      * @param requestMessage to send
//      ${renderJSDocParameters(channelParameters)}
//      */
//     public request${pascalCase(channelName)}(
//       requestMessage:${getMessageType(requestMessage)} 
//       ${realizeParametersForChannelWrapper(channelParameters)},
//       options?: Nats.RequestOptions
//     ): Promise<${getMessageType(replyMessage)}> {
//       if(!this.isClosed() && this.nc !== undefined && this.codec !== undefined){
//         return ${camelCase(channelName)}Channel.request(
//           requestMessage, 
//           this.nc,
//           this.codec
//           ${
//             Object.keys(channelParameters).length ? `,${realizeParametersForChannelWithoutType(channelParameters)}` : ''
//           },
//           options
//         );
//       }else{
//         return Promise.reject(NatsTypescriptTemplateError.errorForCode(ErrorCode.NOT_CONNECTED));
//       }
//     }
//     `
// }

// /**
//  * Component which returns a subscribe to function for the client
//  *
//  * @param {string} defaultContentType
//  * @param {string} channelName to publish to
//  * @param {Message} message which is being received
//  * @param {string} messageDescription
//  * @param {Object.<string, ChannelParameter>} channelParameters parameters to the channel
//  */
// export function Subscribe(channelName, message, messageDescription, channelParameters) {
//   return `
//   /**
//     * Subscribe to the \`${channelName}\`
//     * 
//     * ${messageDescription}
//     * 
//     * @param onDataCallback to call when messages are received
//     ${renderJSDocParameters(channelParameters)}
//     * @param flush ensure client is force flushed after subscribing
//     * @param options to subscribe with, bindings from the AsyncAPI document overwrite these if specified
//     */
//   public subscribeTo${pascalCase(channelName)}(
//       onDataCallback : (
//         err?: NatsTypescriptTemplateError, 
//         msg?: ${getMessageType(message)}
//         ${realizeParametersForChannelWrapper(channelParameters, false)}) => void
//       ${realizeParametersForChannelWrapper(channelParameters)},
//       flush?: boolean,
//       options?: Nats.SubscriptionOptions
//     ): Promise<Nats.Subscription> {
//     return new Promise(async (resolve, reject) => {
//       if(!this.isClosed() && this.nc !== undefined && this.codec !== undefined){
//         try{
//           const sub = await ${camelCase(channelName)}Channel.subscribe(
//             onDataCallback, 
//             this.nc,
//             this.codec
//             ${
//               Object.keys(channelParameters).length
//                 ? ` ,${realizeParametersForChannelWithoutType(channelParameters)},`
//                 : ''
//             }
//             options
//           );
//           if(flush){
//             await this.nc.flush();
//           }
//           resolve(sub);
//         }catch(e: any){
//           reject(e);
//         }
//       }else{
//         reject(NatsTypescriptTemplateError.errorForCode(ErrorCode.NOT_CONNECTED));
//       }
//     });
//   }
//   `
// }
