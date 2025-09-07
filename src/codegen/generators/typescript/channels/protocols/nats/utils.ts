import {ConstrainedObjectModel} from '@asyncapi/modelina';

/**
 * Generates the header setup code for NATS publish operations
 */
export function generateHeaderSetupCode(
  channelHeaders: ConstrainedObjectModel | undefined
): string {
  if (!channelHeaders) {
    return '';
  }

  return `// Set up headers if provided
      if (headers) {
        const natsHeaders = Nats.headers();
        const headerData = headers.marshal();
        const parsedHeaders = typeof headerData === 'string' ? JSON.parse(headerData) : headerData;
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (value !== undefined) {
            natsHeaders.append(key, String(value));
          }
        }
        options = { ...options, headers: natsHeaders };
      }`;
}

/**
 * Generates the header extraction code for NATS subscribe operations
 */
export function generateHeaderExtractionCode(
  channelHeaders: ConstrainedObjectModel | undefined
): string {
  if (!channelHeaders) {
    return '';
  }

  return `// Extract headers if present
          let extractedHeaders: ${channelHeaders.type} | undefined = undefined;
          if (msg.headers) {
            const headerObj: Record<string, any> = {};
            // NATS headers support both iteration and get() method
            if (typeof msg.headers.keys === 'function') {
              // Use keys() method if available (NATS MsgHdrs)
              for (const key of msg.headers.keys()) {
                headerObj[key] = msg.headers.get(key);
              }
            } else {
              // Fallback to Object.entries for plain objects
              for (const [key, value] of Object.entries(msg.headers)) {
                headerObj[key] = value;
              }
            }
            extractedHeaders = ${channelHeaders.type}.unmarshal(headerObj);
          }`;
}

/**
 * Generates the function parameter for headers
 */
export function generateHeaderParameter(
  channelHeaders: ConstrainedObjectModel | undefined
): {
  parameter: string;
  parameterType: string;
  jsDoc: string;
} | null {
  if (!channelHeaders) {
    return null;
  }

  return {
    parameter: 'headers',
    parameterType: `headers?: ${channelHeaders.type}`,
    jsDoc: ' * @param headers optional headers to include with the message'
  };
}

/**
 * Generates the callback parameter for headers in subscribe functions
 */
export function generateHeaderCallbackParameter(
  channelHeaders: ConstrainedObjectModel | undefined
): {
  parameter: string;
  jsDoc: string;
} | null {
  if (!channelHeaders) {
    return null;
  }

  return {
    parameter: `headers?: ${channelHeaders.type}`,
    jsDoc: ' * @param headers that were received with the message'
  };
}

/**
 * Generates the message receiving code for NATS subscribe operations
 */
export function generateMessageReceivingCode({
  channelParameters,
  channelHeaders,
  messageType,
  messageUnmarshalling,
  headerExtraction,
  potentialValidationFunction
}: {
  channelParameters: ConstrainedObjectModel | undefined;
  channelHeaders: ConstrainedObjectModel | undefined;
  messageType: string;
  messageUnmarshalling: string;
  headerExtraction: string;
  potentialValidationFunction: string;
}): string {
  const hasParameters = !!channelParameters;
  const hasHeaders = !!channelHeaders;
  const isNullMessage = messageType === 'null';

  // Build callback parameters
  const callbackParams = ['undefined'];

  if (isNullMessage) {
    callbackParams.push('null');
  } else {
    callbackParams.push(messageUnmarshalling);
  }

  if (hasParameters) {
    callbackParams.push('parameters');
  }

  if (hasHeaders) {
    callbackParams.push('extractedHeaders');
  }

  callbackParams.push('msg');

  const callbackInvocation = `onDataCallback(${callbackParams.join(', ')});`;

  // Generate message processing code
  if (isNullMessage) {
    return hasHeaders
      ? `${headerExtraction}\n          ${callbackInvocation}`
      : callbackInvocation;
  }

  // Non-null message processing
  const messageDecoding = 'let receivedData: any = codec.decode(msg.data);';
  const parts = [messageDecoding];

  if (hasHeaders) {
    parts.push(headerExtraction);
  }

  if (potentialValidationFunction) {
    parts.push(potentialValidationFunction);
  }

  parts.push(callbackInvocation);

  return parts.join('\n');
}
