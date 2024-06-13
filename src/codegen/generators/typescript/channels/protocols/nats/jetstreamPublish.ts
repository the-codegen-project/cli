import { SingleFunctionRenderType } from "../../../../../types";
import { pascalCase } from "../../../utils";
import { ConstrainedMetaModel, ConstrainedObjectModel } from "@asyncapi/modelina";

export function renderJetstreamPublish({
	topic, 
	message, 
	channelParameters, 
	functionName = `jetStreamPublishTo${pascalCase(topic)}`
}: {
  topic: string, 
  message: ConstrainedMetaModel,
  channelParameters: ConstrainedObjectModel | undefined, 
  functionName?: string
}): SingleFunctionRenderType {
	const hasNullPayload = message.type === 'null';
  const addressToUse = channelParameters !== undefined ? `parameters.getChannelWithParameters('${topic}')` : topic;
  const dependencies = [`import * as Nats from 'nats';`];
  // Determine the publish operation based on whether the message type is null
  let publishOperation = `await js.publish(${addressToUse}, Nats.Empty);`;
  if (!hasNullPayload) {
    publishOperation = `let dataToSend : any = message.marshal();
dataToSend = codec.encode(dataToSend);
js.publish(${addressToUse}, dataToSend, options);`;
  }

  const functionParameters = [
    {parameter: `message: ${message.type}`, jsDoc: '* @param message to publish over jetstream'},
  ];
  if (channelParameters !== undefined) {
    functionParameters.push({parameter: `parameters: ${channelParameters.type}`, jsDoc: '* @param parameters for topic substitution'});
  }
  functionParameters.push(...[
    {parameter: 'js: Nats.JetStreamClient', jsDoc: '* @param js the JetStream client to publish from'},
    {parameter: 'codec: any = Nats.JSONCodec()', jsDoc: '* @param codec the serialization codec to use while transmitting the message'},
    {parameter: 'options: Partial<Nats.JetStreamPublishOptions> = {}', jsDoc: '* @param options to use while publishing the message'},
  ]);

  const jsDocParameters = functionParameters.map((parameter) => parameter.jsDoc);
  const parameters = functionParameters.map((parameter) => parameter.parameter);

	const code = `/**
* JetStream publish operation for \`${topic}\`
* 
${jsDocParameters.join('\n')}
*/
export function ${functionName}(
  ${parameters.join(', ')}
): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      ${publishOperation}
      resolve();
    }catch(e: any){
      reject(e);
    }
  });
}`;
  return {
    code,
    functionName,
    dependencies
  };
}
