export function renderJetStreamPullSubscription({
  description,
  messageType,
  channelParameterType,
  channelName
}: {
  description: string;
  messageType: string;
  channelParameterType?: string;
  channelName: string;
}) {
  const callbackFunctionParameters = [
    {
      parameter: 'err?: Error',
      jsDoc: ' * @param err if any error occurred this will be sat'
    },
    {
      parameter: `msg?: ${messageType}`,
      jsDoc: ' * @param msg that was received'
    },
    ...(channelParameterType
      ? [
          {
            parameter: `parameters?: ${channelParameterType}`,
            jsDoc: ' * @param parameters that was received in the topic'
          }
        ]
      : []),
    {
      parameter: `jetstreamMsg?: Nats.JsMsg`,
      jsDoc: ' * @param jetstreamMsg'
    }
  ];

  const functionParameters = [
    {
      parameter: `onDataCallback: (${callbackFunctionParameters.map((param) => param.parameter).join(', ')}) => void`,
      jsDoc: ` * @param {${channelName}Callback} onDataCallback to call when messages are received`
    },
    ...(channelParameterType
      ? [
          {
            parameter: `parameters: ${channelParameterType}`,
            jsDoc: ' * @param parameters for topic substitution'
          }
        ]
      : []),
    {
      parameter:
        'options: Nats.ConsumerOptsBuilder | Partial<Nats.ConsumerOpts>',
      jsDoc: ' * @param options when setting up the subscription'
    }
  ];

  const functionCallParameters = [
    'onDataCallback',
    ...(channelParameterType ? ['parameters'] : []),
    'this.js',
    'options',
    'this.codec'
  ];
  return `
  /**
  * ${description}
  * 
  ${functionParameters.map((param) => param.jsDoc).join('\n')}
  */
  public ${channelName}(${functionParameters.map((param) => param.parameter).join(', ')}): Promise<Nats.JetStreamPullSubscription> {
      return new Promise(async (resolve, reject) => {
        if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
          try {
            const sub = await nats.${channelName}(${functionCallParameters.join(', ')});
            resolve(sub);
          } catch (e: any) {
            reject(e);
          }
        } else {
          Promise.reject('Nats client not available yet, please connect or set the client');
        }
      });
    }
  `;
}
