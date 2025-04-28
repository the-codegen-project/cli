export function renderJetStreamPublish({
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
  const functionParameters = [
    {
      parameter: `message`,
      parameterType: `message: ${messageType}`,
      jsDoc: ' * @param message to publish'
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
      parameter: 'options: Partial<Nats.JetStreamPublishOptions> = {}',
      jsDoc: ' * @param options to use while publishing the message'
    }
  ];

  const functionCallParameters = [
    'message',
    ...(channelParameterType ? ['parameters'] : []),
    'js: this.js',
    'codec: this.codec',
    'options'
  ];
  return `
  /**
   * ${description}
   * 
  ${functionParameters.map((param) => param.jsDoc).join('\n')}
   */
  public async ${channelName}(
    ${functionParameters.map((param) => param.parameter).join(', ')}
  ): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined && this.js !== undefined) {
      return nats.${channelName}({${functionCallParameters.join(', ')}});
    } else {
      Promise.reject('Nats client not available yet, please connect or set the client');
    }
  }
  `;
}
