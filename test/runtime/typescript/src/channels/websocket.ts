import {UserSignedUp} from './../payloads/UserSignedUp';
import * as StringMessageModule from './../payloads/StringMessage';
import * as ArrayMessageModule from './../payloads/ArrayMessage';
import * as UnionMessageModule from './../payloads/UnionMessage';
import {AnonymousSchema_9} from './../payloads/AnonymousSchema_9';
import {UserSignedupParameters} from './../parameters/UserSignedupParameters';
import {UserSignedUpHeaders} from './../headers/UserSignedUpHeaders';
import * as WebSocket from 'ws';
import { IncomingMessage } from 'http';

/**
 * WebSocket client-side function to publish messages to `/user/signedup/{my_parameter}/{enum_parameter}`
 *
 * @param message to publish
 * @param ws the WebSocket connection (assumed to be already connected)
 */
function publishToSendUserSignedup({
  message,
  ws
}: {
  message: UserSignedUp,
  ws: WebSocket.WebSocket
}): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if WebSocket is open
    if (ws.readyState !== WebSocket.WebSocket.OPEN) {
      reject(new Error('WebSocket is not open'));
      return;
    }

    // Send message directly
    ws.send(message.marshal(), (err) => {
      if (err) {
        reject(new Error(`Failed to send message: ${err.message}`));
      }
      resolve();
    });
  });
}

/**
 * WebSocket server-side function to handle messages for `/user/signedup/{my_parameter}/{enum_parameter}`
 *
 * @param wss the WebSocket server instance
 * @param onConnection callback when a client connects to this channel
 * @param onMessage callback when a message is received on this channel
 */
function registerSendUserSignedup({
  wss,
  onConnection,
  onMessage
}: {
  wss: WebSocket.WebSocketServer,
  onConnection: (params: {parameters: UserSignedupParameters, ws: WebSocket.WebSocket, request: IncomingMessage}) => void,
  onMessage: (params: {message: UserSignedUp, ws: WebSocket.WebSocket}) => void
}): void {
  const channelPattern = /^\/user\/signedup\/([^\\/]*)\/([^\\/]*)(?:\?.*)?$/;
  
  wss.on('connection', (ws: WebSocket.WebSocket, request: IncomingMessage) => {
    try {
      const url = request.url || '';
      const match = url.match(channelPattern);
      if (match) {
        try {
          const channelPath = url.startsWith('/') ? url.slice(1) : url;
              const parameters = UserSignedupParameters.createFromChannel(channelPath, 'user/signedup/{my_parameter}/{enum_parameter}', /^user\/signedup\/([^\\/]*)\/([^\\/]*)$/);
          onConnection({
            parameters,
            ws,
            request
          });
        } catch (connectionError) {
          console.error('Error in onConnection callback:', connectionError);
          ws.close(1011, 'Connection error');
          return;
        }
        
        ws.on('message', (data: WebSocket.RawData) => {
          try {
            const receivedData = data.toString();
            const parsedMessage = UserSignedUp.unmarshal(receivedData);
            onMessage({
              message: parsedMessage,
              ws
            });
          } catch (error: any) {
            // Ignore parsing errors
          }
        });
      }
    } catch (error: any) {
      ws.close(1011, 'Server error');
    }
  });
}

/**
 * WebSocket client-side function to subscribe to messages from `/user/signedup/{my_parameter}/{enum_parameter}`
 *
 * @param onDataCallback callback when messages are received
 * @param parameters for URL path substitution
 * @param ws the WebSocket connection (assumed to be already connected)
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveUserSignedup({
  onDataCallback,
  parameters,
  ws,
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: UserSignedUp, parameters?: UserSignedupParameters, ws?: WebSocket.WebSocket}) => void,
  parameters: UserSignedupParameters,
  ws: WebSocket.WebSocket,
  skipMessageValidation?: boolean
}): void {
  try {
    // Check if WebSocket is open
    if (ws.readyState !== WebSocket.WebSocket.OPEN) {
      onDataCallback({
        err: new Error('WebSocket is not open'),
        msg: undefined,
        parameters,
        ws
      });
      return;
    }

    const validator = UserSignedUp.createValidator();

    ws.on('message', (data: WebSocket.RawData) => {
      try {
        const receivedData = data.toString();
        const parsedMessage = UserSignedUp.unmarshal(receivedData);
        
        // Validate message if validation is enabled
        if (!skipMessageValidation) {
          const messageToValidate = parsedMessage.marshal();
          const {valid, errors} = UserSignedUp.validate({data: messageToValidate, ajvValidatorFunction: validator});
          if (!valid) {
            onDataCallback({
              err: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`),
              msg: undefined,
              parameters,
              ws
            });
            return;
          }
        }

        onDataCallback({
          err: undefined,
          msg: parsedMessage,
          parameters,
          ws
        });

      } catch (error: any) {
        onDataCallback({
          err: new Error(`Failed to parse message: ${error.message}`),
          msg: undefined,
          parameters,
          ws
        });
      }
    });

    ws.on('error', (error: Error) => {
      onDataCallback({
        err: new Error(`WebSocket error: ${error.message}`),
        msg: undefined,
        parameters,
        ws
      });
    });

    ws.on('close', (code: number, reason: Buffer) => {
      // Only report as error if it's not a normal closure (1000) or going away (1001)
      if (code !== 1000 && code !== 1001 && code !== 1005) { // 1005 is no status received
        onDataCallback({
          err: new Error(`WebSocket closed unexpectedly: ${code} ${reason.toString()}`),
          msg: undefined,
          parameters,
          ws
        });
      }
    });

  } catch (error: any) {
    onDataCallback({
      err: new Error(`Failed to set up WebSocket subscription: ${error.message}`),
      msg: undefined,
      parameters,
      ws
    });
  }
}

/**
 * WebSocket client-side function to publish messages to `/noparameters`
 *
 * @param message to publish
 * @param ws the WebSocket connection (assumed to be already connected)
 */
function publishToNoParameter({
  message,
  ws
}: {
  message: UserSignedUp,
  ws: WebSocket.WebSocket
}): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if WebSocket is open
    if (ws.readyState !== WebSocket.WebSocket.OPEN) {
      reject(new Error('WebSocket is not open'));
      return;
    }

    // Send message directly
    ws.send(message.marshal(), (err) => {
      if (err) {
        reject(new Error(`Failed to send message: ${err.message}`));
      }
      resolve();
    });
  });
}

/**
 * WebSocket client-side function to subscribe to messages from `/noparameters`
 *
 * @param onDataCallback callback when messages are received
 * @param ws the WebSocket connection (assumed to be already connected)
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToNoParameter({
  onDataCallback,
  ws,
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: UserSignedUp, ws?: WebSocket.WebSocket}) => void,
  ws: WebSocket.WebSocket,
  skipMessageValidation?: boolean
}): void {
  try {
    // Check if WebSocket is open
    if (ws.readyState !== WebSocket.WebSocket.OPEN) {
      onDataCallback({
        err: new Error('WebSocket is not open'),
        msg: undefined,
        ws
      });
      return;
    }

    const validator = UserSignedUp.createValidator();

    ws.on('message', (data: WebSocket.RawData) => {
      try {
        const receivedData = data.toString();
        const parsedMessage = UserSignedUp.unmarshal(receivedData);
        
        // Validate message if validation is enabled
        if (!skipMessageValidation) {
          const messageToValidate = parsedMessage.marshal();
          const {valid, errors} = UserSignedUp.validate({data: messageToValidate, ajvValidatorFunction: validator});
          if (!valid) {
            onDataCallback({
              err: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`),
              msg: undefined,
              ws
            });
            return;
          }
        }

        onDataCallback({
          err: undefined,
          msg: parsedMessage,
          ws
        });

      } catch (error: any) {
        onDataCallback({
          err: new Error(`Failed to parse message: ${error.message}`),
          msg: undefined,
          ws
        });
      }
    });

    ws.on('error', (error: Error) => {
      onDataCallback({
        err: new Error(`WebSocket error: ${error.message}`),
        msg: undefined,
        ws
      });
    });

    ws.on('close', (code: number, reason: Buffer) => {
      // Only report as error if it's not a normal closure (1000) or going away (1001)
      if (code !== 1000 && code !== 1001 && code !== 1005) { // 1005 is no status received
        onDataCallback({
          err: new Error(`WebSocket closed unexpectedly: ${code} ${reason.toString()}`),
          msg: undefined,
          ws
        });
      }
    });

  } catch (error: any) {
    onDataCallback({
      err: new Error(`Failed to set up WebSocket subscription: ${error.message}`),
      msg: undefined,
      ws
    });
  }
}

/**
 * WebSocket server-side function to handle messages for `/noparameters`
 *
 * @param wss the WebSocket server instance
 * @param onConnection callback when a client connects to this channel
 * @param onMessage callback when a message is received on this channel
 */
function registerNoParameter({
  wss,
  onConnection,
  onMessage
}: {
  wss: WebSocket.WebSocketServer,
  onConnection: (params: {ws: WebSocket.WebSocket, request: IncomingMessage}) => void,
  onMessage: (params: {message: UserSignedUp, ws: WebSocket.WebSocket}) => void
}): void {
  const channelPattern = /^\/noparameters(?:\?.*)?$/;
  
  wss.on('connection', (ws: WebSocket.WebSocket, request: IncomingMessage) => {
    try {
      const url = request.url || '';
      const match = url.match(channelPattern);
      if (match) {
        try {
          
          onConnection({
            ws,
            request
          });
        } catch (connectionError) {
          console.error('Error in onConnection callback:', connectionError);
          ws.close(1011, 'Connection error');
          return;
        }
        
        ws.on('message', (data: WebSocket.RawData) => {
          try {
            const receivedData = data.toString();
            const parsedMessage = UserSignedUp.unmarshal(receivedData);
            onMessage({
              message: parsedMessage,
              ws
            });
          } catch (error: any) {
            // Ignore parsing errors
          }
        });
      }
    } catch (error: any) {
      ws.close(1011, 'Server error');
    }
  });
}

/**
 * WebSocket client-side function to publish messages to `/string/payload`
 *
 * @param message to publish
 * @param ws the WebSocket connection (assumed to be already connected)
 */
function publishToSendStringPayload({
  message,
  ws
}: {
  message: StringMessageModule.StringMessage,
  ws: WebSocket.WebSocket
}): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if WebSocket is open
    if (ws.readyState !== WebSocket.WebSocket.OPEN) {
      reject(new Error('WebSocket is not open'));
      return;
    }

    // Send message directly
    ws.send(StringMessageModule.marshal(message), (err) => {
      if (err) {
        reject(new Error(`Failed to send message: ${err.message}`));
      }
      resolve();
    });
  });
}

/**
 * WebSocket server-side function to handle messages for `/string/payload`
 *
 * @param wss the WebSocket server instance
 * @param onConnection callback when a client connects to this channel
 * @param onMessage callback when a message is received on this channel
 */
function registerSendStringPayload({
  wss,
  onConnection,
  onMessage
}: {
  wss: WebSocket.WebSocketServer,
  onConnection: (params: {ws: WebSocket.WebSocket, request: IncomingMessage}) => void,
  onMessage: (params: {message: StringMessageModule.StringMessage, ws: WebSocket.WebSocket}) => void
}): void {
  const channelPattern = /^\/string\/payload(?:\?.*)?$/;
  
  wss.on('connection', (ws: WebSocket.WebSocket, request: IncomingMessage) => {
    try {
      const url = request.url || '';
      const match = url.match(channelPattern);
      if (match) {
        try {
          
          onConnection({
            ws,
            request
          });
        } catch (connectionError) {
          console.error('Error in onConnection callback:', connectionError);
          ws.close(1011, 'Connection error');
          return;
        }
        
        ws.on('message', (data: WebSocket.RawData) => {
          try {
            const receivedData = data.toString();
            const parsedMessage = StringMessageModule.unmarshal(receivedData);
            onMessage({
              message: parsedMessage,
              ws
            });
          } catch (error: any) {
            // Ignore parsing errors
          }
        });
      }
    } catch (error: any) {
      ws.close(1011, 'Server error');
    }
  });
}

/**
 * WebSocket client-side function to subscribe to messages from `/string/payload`
 *
 * @param onDataCallback callback when messages are received
 * @param ws the WebSocket connection (assumed to be already connected)
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveStringPayload({
  onDataCallback,
  ws,
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: StringMessageModule.StringMessage, ws?: WebSocket.WebSocket}) => void,
  ws: WebSocket.WebSocket,
  skipMessageValidation?: boolean
}): void {
  try {
    // Check if WebSocket is open
    if (ws.readyState !== WebSocket.WebSocket.OPEN) {
      onDataCallback({
        err: new Error('WebSocket is not open'),
        msg: undefined,
        ws
      });
      return;
    }

    const validator = StringMessageModule.createValidator();

    ws.on('message', (data: WebSocket.RawData) => {
      try {
        const receivedData = data.toString();
        const parsedMessage = StringMessageModule.unmarshal(receivedData);
        
        // Validate message if validation is enabled
        if (!skipMessageValidation) {
          const messageToValidate = StringMessageModule.marshal(parsedMessage);
          const {valid, errors} = StringMessageModule.validate({data: messageToValidate, ajvValidatorFunction: validator});
          if (!valid) {
            onDataCallback({
              err: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`),
              msg: undefined,
              ws
            });
            return;
          }
        }

        onDataCallback({
          err: undefined,
          msg: parsedMessage,
          ws
        });

      } catch (error: any) {
        onDataCallback({
          err: new Error(`Failed to parse message: ${error.message}`),
          msg: undefined,
          ws
        });
      }
    });

    ws.on('error', (error: Error) => {
      onDataCallback({
        err: new Error(`WebSocket error: ${error.message}`),
        msg: undefined,
        ws
      });
    });

    ws.on('close', (code: number, reason: Buffer) => {
      // Only report as error if it's not a normal closure (1000) or going away (1001)
      if (code !== 1000 && code !== 1001 && code !== 1005) { // 1005 is no status received
        onDataCallback({
          err: new Error(`WebSocket closed unexpectedly: ${code} ${reason.toString()}`),
          msg: undefined,
          ws
        });
      }
    });

  } catch (error: any) {
    onDataCallback({
      err: new Error(`Failed to set up WebSocket subscription: ${error.message}`),
      msg: undefined,
      ws
    });
  }
}

/**
 * WebSocket client-side function to publish messages to `/array/payload`
 *
 * @param message to publish
 * @param ws the WebSocket connection (assumed to be already connected)
 */
function publishToSendArrayPayload({
  message,
  ws
}: {
  message: ArrayMessageModule.ArrayMessage,
  ws: WebSocket.WebSocket
}): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if WebSocket is open
    if (ws.readyState !== WebSocket.WebSocket.OPEN) {
      reject(new Error('WebSocket is not open'));
      return;
    }

    // Send message directly
    ws.send(ArrayMessageModule.marshal(message), (err) => {
      if (err) {
        reject(new Error(`Failed to send message: ${err.message}`));
      }
      resolve();
    });
  });
}

/**
 * WebSocket server-side function to handle messages for `/array/payload`
 *
 * @param wss the WebSocket server instance
 * @param onConnection callback when a client connects to this channel
 * @param onMessage callback when a message is received on this channel
 */
function registerSendArrayPayload({
  wss,
  onConnection,
  onMessage
}: {
  wss: WebSocket.WebSocketServer,
  onConnection: (params: {ws: WebSocket.WebSocket, request: IncomingMessage}) => void,
  onMessage: (params: {message: ArrayMessageModule.ArrayMessage, ws: WebSocket.WebSocket}) => void
}): void {
  const channelPattern = /^\/array\/payload(?:\?.*)?$/;
  
  wss.on('connection', (ws: WebSocket.WebSocket, request: IncomingMessage) => {
    try {
      const url = request.url || '';
      const match = url.match(channelPattern);
      if (match) {
        try {
          
          onConnection({
            ws,
            request
          });
        } catch (connectionError) {
          console.error('Error in onConnection callback:', connectionError);
          ws.close(1011, 'Connection error');
          return;
        }
        
        ws.on('message', (data: WebSocket.RawData) => {
          try {
            const receivedData = data.toString();
            const parsedMessage = ArrayMessageModule.unmarshal(receivedData);
            onMessage({
              message: parsedMessage,
              ws
            });
          } catch (error: any) {
            // Ignore parsing errors
          }
        });
      }
    } catch (error: any) {
      ws.close(1011, 'Server error');
    }
  });
}

/**
 * WebSocket client-side function to subscribe to messages from `/array/payload`
 *
 * @param onDataCallback callback when messages are received
 * @param ws the WebSocket connection (assumed to be already connected)
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveArrayPayload({
  onDataCallback,
  ws,
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: ArrayMessageModule.ArrayMessage, ws?: WebSocket.WebSocket}) => void,
  ws: WebSocket.WebSocket,
  skipMessageValidation?: boolean
}): void {
  try {
    // Check if WebSocket is open
    if (ws.readyState !== WebSocket.WebSocket.OPEN) {
      onDataCallback({
        err: new Error('WebSocket is not open'),
        msg: undefined,
        ws
      });
      return;
    }

    const validator = ArrayMessageModule.createValidator();

    ws.on('message', (data: WebSocket.RawData) => {
      try {
        const receivedData = data.toString();
        const parsedMessage = ArrayMessageModule.unmarshal(receivedData);
        
        // Validate message if validation is enabled
        if (!skipMessageValidation) {
          const messageToValidate = ArrayMessageModule.marshal(parsedMessage);
          const {valid, errors} = ArrayMessageModule.validate({data: messageToValidate, ajvValidatorFunction: validator});
          if (!valid) {
            onDataCallback({
              err: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`),
              msg: undefined,
              ws
            });
            return;
          }
        }

        onDataCallback({
          err: undefined,
          msg: parsedMessage,
          ws
        });

      } catch (error: any) {
        onDataCallback({
          err: new Error(`Failed to parse message: ${error.message}`),
          msg: undefined,
          ws
        });
      }
    });

    ws.on('error', (error: Error) => {
      onDataCallback({
        err: new Error(`WebSocket error: ${error.message}`),
        msg: undefined,
        ws
      });
    });

    ws.on('close', (code: number, reason: Buffer) => {
      // Only report as error if it's not a normal closure (1000) or going away (1001)
      if (code !== 1000 && code !== 1001 && code !== 1005) { // 1005 is no status received
        onDataCallback({
          err: new Error(`WebSocket closed unexpectedly: ${code} ${reason.toString()}`),
          msg: undefined,
          ws
        });
      }
    });

  } catch (error: any) {
    onDataCallback({
      err: new Error(`Failed to set up WebSocket subscription: ${error.message}`),
      msg: undefined,
      ws
    });
  }
}

/**
 * WebSocket client-side function to publish messages to `/union/payload`
 *
 * @param message to publish
 * @param ws the WebSocket connection (assumed to be already connected)
 */
function publishToSendUnionPayload({
  message,
  ws
}: {
  message: UnionMessageModule.UnionMessage,
  ws: WebSocket.WebSocket
}): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if WebSocket is open
    if (ws.readyState !== WebSocket.WebSocket.OPEN) {
      reject(new Error('WebSocket is not open'));
      return;
    }

    // Send message directly
    ws.send(UnionMessageModule.marshal(message), (err) => {
      if (err) {
        reject(new Error(`Failed to send message: ${err.message}`));
      }
      resolve();
    });
  });
}

/**
 * WebSocket server-side function to handle messages for `/union/payload`
 *
 * @param wss the WebSocket server instance
 * @param onConnection callback when a client connects to this channel
 * @param onMessage callback when a message is received on this channel
 */
function registerSendUnionPayload({
  wss,
  onConnection,
  onMessage
}: {
  wss: WebSocket.WebSocketServer,
  onConnection: (params: {ws: WebSocket.WebSocket, request: IncomingMessage}) => void,
  onMessage: (params: {message: UnionMessageModule.UnionMessage, ws: WebSocket.WebSocket}) => void
}): void {
  const channelPattern = /^\/union\/payload(?:\?.*)?$/;
  
  wss.on('connection', (ws: WebSocket.WebSocket, request: IncomingMessage) => {
    try {
      const url = request.url || '';
      const match = url.match(channelPattern);
      if (match) {
        try {
          
          onConnection({
            ws,
            request
          });
        } catch (connectionError) {
          console.error('Error in onConnection callback:', connectionError);
          ws.close(1011, 'Connection error');
          return;
        }
        
        ws.on('message', (data: WebSocket.RawData) => {
          try {
            const receivedData = data.toString();
            const parsedMessage = UnionMessageModule.unmarshal(receivedData);
            onMessage({
              message: parsedMessage,
              ws
            });
          } catch (error: any) {
            // Ignore parsing errors
          }
        });
      }
    } catch (error: any) {
      ws.close(1011, 'Server error');
    }
  });
}

/**
 * WebSocket client-side function to subscribe to messages from `/union/payload`
 *
 * @param onDataCallback callback when messages are received
 * @param ws the WebSocket connection (assumed to be already connected)
 * @param skipMessageValidation turn off runtime validation of incoming messages
 */
function subscribeToReceiveUnionPayload({
  onDataCallback,
  ws,
  skipMessageValidation = false
}: {
  onDataCallback: (params: {err?: Error, msg?: UnionMessageModule.UnionMessage, ws?: WebSocket.WebSocket}) => void,
  ws: WebSocket.WebSocket,
  skipMessageValidation?: boolean
}): void {
  try {
    // Check if WebSocket is open
    if (ws.readyState !== WebSocket.WebSocket.OPEN) {
      onDataCallback({
        err: new Error('WebSocket is not open'),
        msg: undefined,
        ws
      });
      return;
    }

    const validator = UnionMessageModule.createValidator();

    ws.on('message', (data: WebSocket.RawData) => {
      try {
        const receivedData = data.toString();
        const parsedMessage = UnionMessageModule.unmarshal(receivedData);
        
        // Validate message if validation is enabled
        if (!skipMessageValidation) {
          const messageToValidate = UnionMessageModule.marshal(parsedMessage);
          const {valid, errors} = UnionMessageModule.validate({data: messageToValidate, ajvValidatorFunction: validator});
          if (!valid) {
            onDataCallback({
              err: new Error(`Invalid message payload received; ${JSON.stringify({cause: errors})}`),
              msg: undefined,
              ws
            });
            return;
          }
        }

        onDataCallback({
          err: undefined,
          msg: parsedMessage,
          ws
        });

      } catch (error: any) {
        onDataCallback({
          err: new Error(`Failed to parse message: ${error.message}`),
          msg: undefined,
          ws
        });
      }
    });

    ws.on('error', (error: Error) => {
      onDataCallback({
        err: new Error(`WebSocket error: ${error.message}`),
        msg: undefined,
        ws
      });
    });

    ws.on('close', (code: number, reason: Buffer) => {
      // Only report as error if it's not a normal closure (1000) or going away (1001)
      if (code !== 1000 && code !== 1001 && code !== 1005) { // 1005 is no status received
        onDataCallback({
          err: new Error(`WebSocket closed unexpectedly: ${code} ${reason.toString()}`),
          msg: undefined,
          ws
        });
      }
    });

  } catch (error: any) {
    onDataCallback({
      err: new Error(`Failed to set up WebSocket subscription: ${error.message}`),
      msg: undefined,
      ws
    });
  }
}

export { publishToSendUserSignedup, registerSendUserSignedup, subscribeToReceiveUserSignedup, publishToNoParameter, subscribeToNoParameter, registerNoParameter, publishToSendStringPayload, registerSendStringPayload, subscribeToReceiveStringPayload, publishToSendArrayPayload, registerSendArrayPayload, subscribeToReceiveArrayPayload, publishToSendUnionPayload, registerSendUnionPayload, subscribeToReceiveUnionPayload };
