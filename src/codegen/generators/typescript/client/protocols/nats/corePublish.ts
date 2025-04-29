export function renderCorePublish({
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
            parameter: `parameters`,
            parameterType: `parameters: ${channelParameterType}`,
            jsDoc: ' * @param parameters for topic substitution'
          }
        ]
      : []),
    {
      parameter: 'options',
      parameterType: 'options?: Nats.PublishOptions',
      jsDoc: ' * @param options to use while publishing the message'
    }
  ];

  const functionCallParameters = [
    'message',
    ...(channelParameterType ? ['parameters'] : []),
    'nc: this.nc',
    'codec: this.codec',
    'options'
  ];
  return `
  /**
   * ${description}
   * 
  ${functionParameters.map((param) => param.jsDoc).join('\n  ')}
   */
  public async ${channelName}({
    ${functionParameters.map((param) => param.parameter).join(', \n    ')}
  }: {
    ${functionParameters.map((param) => param.parameterType).join(', \n    ')}
  }): Promise<void> {
    if (!this.isClosed() && this.nc !== undefined && this.codec !== undefined) {
      await nats.${channelName}({
        ${functionCallParameters.join(', \n        ')}
      });
    } else {
      Promise.reject('Nats client not available yet, please connect or set the client');
    }
  }`;
}
