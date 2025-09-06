import { ConstrainedObjectModel } from '@asyncapi/modelina';

/**
 * Generates the header setup code for NATS publish operations
 */
export function generateHeaderSetupCode(channelHeaders: ConstrainedObjectModel | undefined): string {
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
export function generateHeaderExtractionCode(channelHeaders: ConstrainedObjectModel | undefined): string {
  if (!channelHeaders) {
    return '';
  }

  return `// Extract headers if present
          let extractedHeaders: ${channelHeaders.type} | undefined = undefined;
          if (msg.headers) {
            const headerObj: Record<string, any> = {};
            for (const [key, value] of Array.from(msg.headers.entries())) {
              headerObj[key] = value;
            }
            extractedHeaders = ${channelHeaders.type}.unmarshal(headerObj);
          }`;
}

/**
 * Generates the function parameter for headers
 */
export function generateHeaderParameter(channelHeaders: ConstrainedObjectModel | undefined): {
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
export function generateHeaderCallbackParameter(channelHeaders: ConstrainedObjectModel | undefined): {
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
