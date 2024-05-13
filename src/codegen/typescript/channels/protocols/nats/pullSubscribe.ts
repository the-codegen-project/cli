import { camelCase, pascalCase, realizeParametersForChannelWrapper, renderJSDocParameters, unwrap } from "../../../utils.js"
import { ConstrainedMetaModel, ConstrainedObjectModel } from "@asyncapi/modelina"

export function JetstreamPullSubscribe({
	topic, 
	message, 
	messageDescription, 
	channelParameters, 
	functionName = `jetStreamPullSubscribeTo${pascalCase(topic)}`
  }: {
  topic: string, 
  message: ConstrainedMetaModel, 
  messageDescription: string, 
  channelParameters: ConstrainedObjectModel, 
  functionName: string
}) {
	let parameters = [];
	parameters = Object.entries(channelParameters.properties).map(([parameterName]) => {
	  return `${camelCase(parameterName)}Param`;
	});
	const hasNullPayload = message.type === 'null';
  
	//Determine the callback process when receiving messages.
	//If the message payload is null no hooks are called to process the received data.
	let whenReceivingMessage = `onDataCallback(undefined, null ${parameters.length > 0 && `, ${parameters.join(',')}`});`;
	if (!hasNullPayload) {
	  whenReceivingMessage =  `let receivedData: any = codec.decode(msg.data);
onDataCallback(undefined, ${message.type}.unmarshal(receivedData) ${parameters.length > 0 && `, ${parameters.join(',')}`}, msg);`;
	}
	return `/**
* JetStream pull subscription for \`${topic}\`
* 
* ${messageDescription}
* 
* @param onDataCallback to call when messages are received
${renderJSDocParameters(channelParameters)}
* @param flush ensure client is force flushed after subscribing
* @param options to subscribe with, bindings from the AsyncAPI document overwrite these if specified
*/
public ${functionName}(
  onDataCallback: (
    err ? : NatsTypescriptTemplateError,
    msg?: ${message.type}
    ${realizeParametersForChannelWrapper(channelParameters, false)},
    jetstreamMsg?: Nats.JsMsg) => void
  ${realizeParametersForChannelWrapper(channelParameters)},
	js: Nats.JetStreamClient,
	codec?: any = Nats.JSONCodec(),
  options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>
): Promise<Nats.JetStreamPullSubscription> {
  return new Promise(async (resolve, reject) => {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
      try {
        const subscription = await js.pullSubscribe(${topic}, options);
  
        (async () => {
          for await (const msg of subscription) {
            ${unwrap(topic, channelParameters)}

            ${whenReceivingMessage}
          }
        })();
        resolve(subscription);
      } catch (e: any) {
        reject(e);
      }
    } else {
      reject(NatsTypescriptTemplateError.errorForCode(ErrorCode.NOT_CONNECTED));
    }
  });
}`
}