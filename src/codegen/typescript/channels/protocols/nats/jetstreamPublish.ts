import { pascalCase, realizeChannelName, realizeParametersForChannelWrapper, renderJSDocParameters } from "../../../utils.js"
import { ConstrainedMetaModel, ConstrainedObjectModel } from "@asyncapi/modelina"

export function JetstreamPublish({
	topic, 
	message, 
	messageDescription, 
	channelParameters, 
	functionName = `jetStreamPublishTo${pascalCase(topic)}`
}: {
  topic: string, 
  message: ConstrainedMetaModel, 
  messageDescription: string, 
  channelParameters: ConstrainedObjectModel, 
  functionName: string
}) {
	const hasNullPayload = message.type === 'null';
  //Determine the publish operation based on whether the message type is null
  let publishOperation = `await js.publish(${realizeChannelName(topic, channelParameters)}, Nats.Empty);`;
  if (!hasNullPayload) {
    publishOperation = `let dataToSend : any = message.marshal();
dataToSend = codec.encode(dataToSend);
js.publish(${realizeChannelName(topic, channelParameters)}, dataToSend, options);`;
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
  message: ${message.type},
  ${realizeParametersForChannelWrapper(channelParameters)},
	js: Nats.JetStreamClient,
	codec?: any = Nats.JSONCodec(),
  options?: Nats.PublishOptions
): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try{
      ${publishOperation}
      resolve();
    }catch(e: any){
      reject(NatsTypescriptTemplateError.errorForCode(ErrorCode.INTERNAL_NATS_TS_ERROR, e));
    }
  });
}`
}