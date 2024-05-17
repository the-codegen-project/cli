import { SingleFunctionRenderType } from "../../../../types.js";
import { camelCase, pascalCase, realizeChannelName, realizeParametersForChannelWrapper, renderJSDocParameters, unwrap } from "../../../utils.js"
import { ConstrainedMetaModel, ConstrainedObjectModel } from "@asyncapi/modelina"

export function renderJetstreamFetch({
	topic, 
	message, 
	messageDescription, 
	channelParameters, 
	functionName = `jetStreamFetch${pascalCase(topic)}`
  }: {
  topic: string, 
  message: ConstrainedMetaModel, 
  messageDescription: string, 
  channelParameters: ConstrainedObjectModel, 
  functionName?: string
}): SingleFunctionRenderType {
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
	const code = `/**
* JetStream fetch function for \`${topic}\`
* 
* ${messageDescription}
* 
* @param onDataCallback to call when messages are received
${renderJSDocParameters(channelParameters)}
* @param options to pull message with, bindings from the AsyncAPI document overwrite these if specified
*/
public ${functionName}(
	onDataCallback: (
	  err?: NatsTypescriptTemplateError,
	  msg?: ${message.type}
	  parameters?: ${channelParameters.type},
	  jetstreamMsg?: Nats.JsMsg) => void
	${realizeParametersForChannelWrapper(channelParameters)},
	durable: string, 
	js: Nats.JetStreamClient,
	codec?: any = Nats.JSONCodec(),
	options?: Partial<Nats.PullOptions>
): void {
	if (codec !== undefined && js !== undefined) {
	  const stream = ${realizeChannelName(topic, channelParameters)};
	  (async () => {
      let msgs = await js.fetch(stream, durable, options);
      for await (const msg of msgs) {
        ${unwrap(topic, channelParameters)}
    
        ${whenReceivingMessage}
      }
	  })();
	} else {
	  throw NatsTypescriptTemplateError.errorForCode(ErrorCode.NOT_CONNECTED);
	}
}`
  return {
    code,
    functionName
  }
}