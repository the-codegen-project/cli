/* eslint-disable no-console */
import * as WebSocket from 'ws';
import { UserSignedupParameters } from '../../../src/parameters/UserSignedupParameters';
import { UserSignedUp } from '../../../src/payloads/UserSignedUp';
import { UserSignedUpHeaders } from '../../../src/headers/UserSignedUpHeaders';
import {
  publishToSendUserSignedup,
  subscribeToReceiveUserSignedup,
  publishToNoParameter,
  subscribeToNoParameter,
  registerSendUserSignedup,
  registerNoParameter
} from '../../../src/channels/websocket';
import { createServer, Server } from 'http';

describe('websocket', () => {
  const testMessage = new UserSignedUp({displayName: 'test', email: 'test@test.dk'});
  const testParameters = new UserSignedupParameters({myParameter: 'test', enumParameter: 'asyncapi'});

  let server: Server;
  let wss: WebSocket.WebSocketServer;
  const serverPort = 8080;
  const serverUrl = `ws://localhost:${serverPort}`;

  beforeAll((done) => {
    // Create HTTP server for WebSocket server
    server = createServer();
    wss = new WebSocket.WebSocketServer({ server });
    
    server.listen(serverPort, () => {
      console.log(`WebSocket server started on port ${serverPort}`);
      done();
    });
  });

  afterAll((done) => {
    jest.setTimeout(15000);
    
    // Close all connections first
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.WebSocket.OPEN) {
        ws.close();
      }
    });
    
    // Then close the server
    wss.close(() => {
      server.close(() => {
        console.log('WebSocket server stopped');
        done();
      });
    });
  });

  describe('channels', () => {
    describe('with parameters', () => {
      it('should be able to publish and receive messages with external WebSocket connections', (done) => {
        jest.setTimeout(10000);
        
        let serverMessageReceived = false;
        let clientResponseReceived = false;
        
        const checkCompletion = () => {
          if (serverMessageReceived && clientResponseReceived) {
            done();
          }
        };

        // Set up server-side handler
        registerSendUserSignedup({
          wss,
          onConnection: (params) => {
            const { parameters, ws, request } = params;
            
            try {
              // Verify parameters are correctly extracted
              expect(request).toBeDefined();
              expect(ws).toBeDefined();
              expect(parameters?.myParameter).toEqual(testParameters.myParameter);
              expect(parameters?.enumParameter).toEqual(testParameters.enumParameter);
              
              console.log('Server: Client connected with parameters');
            } catch (error) {
              done(error);
            }
          },
          onMessage: (params) => {
            const { message, ws } = params;
            
            try {
              // Verify received message
              expect(message.marshal()).toEqual(testMessage.marshal());
              
              serverMessageReceived = true;
              
              // Send a response message
              const responseMessage = new UserSignedUp({
                displayName: 'server-response', 
                email: 'server@test.dk'
              });
              ws.send(responseMessage.marshal());
            } catch (error) {
              done(error);
            }
          }
        });

        // Create client WebSocket connection externally
        const clientWs = new WebSocket.WebSocket(`${serverUrl}/user/signedup/${testParameters.myParameter}/${testParameters.enumParameter}`);
        
        clientWs.on('open', () => {
          console.log('Client WebSocket connected');
          
          // Set up client-side subscriber using the connected WebSocket
          subscribeToReceiveUserSignedup({
            onDataCallback: (params) => {
              const { err, msg, parameters: receivedParams } = params;
              try {
                if (err) {
                  done(err);
                  return;
                }
                
                expect(msg?.displayName).toEqual('server-response');
                expect(msg?.email).toEqual('server@test.dk');
                expect(receivedParams?.myParameter).toEqual(testParameters.myParameter);
                expect(receivedParams?.enumParameter).toEqual(testParameters.enumParameter);
                
                clientResponseReceived = true;
                clientWs.close();
                checkCompletion();
              } catch (error) {
                done(error);
              }
            },
            parameters: testParameters,
            ws: clientWs
          });

          // After subscriber is set up, publish a message using the same WebSocket
          setTimeout(async () => {
            try {
              await publishToSendUserSignedup({
                message: testMessage,
                ws: clientWs
              });
            } catch (error) {
              done(error);
            }
          }, 100);
        });

        clientWs.on('error', (error) => {
          done(error);
        });
      });
    });

    describe('without parameters', () => {
      it('should be able to publish and receive messages', (done) => {
        jest.setTimeout(10000);
        
        let serverMessageReceived = false;
        let clientResponseReceived = false;
        
        const checkCompletion = () => {
          if (serverMessageReceived && clientResponseReceived) {
            done();
          }
        };

        // Set up server-side handler
        registerNoParameter({
          wss,
          onConnection: (params) => {
            const { ws, request } = params;
            
            try {
              expect(request).toBeDefined();
              expect(ws).toBeDefined();
              console.log('Server: Client connected to noparameters');
            } catch (error) {
              done(error);
            }
          },
          onMessage: (params) => {
            const { message, ws } = params;
            
            try {
              // Verify received message
              expect(message.marshal()).toEqual(testMessage.marshal());
              
              serverMessageReceived = true;
              
              const responseMessage = new UserSignedUp({
                displayName: 'no-param-response', 
                email: 'noparam@test.dk'
              });
              ws.send(responseMessage.marshal());
            } catch (error) {
              done(error);
            }
          }
        });

        // Create client WebSocket connection externally
        const clientWs = new WebSocket.WebSocket(`${serverUrl}/noparameters`);
        
        clientWs.on('open', () => {
          console.log('Client WebSocket connected to noparameters');
          
          subscribeToNoParameter({
            onDataCallback: (params) => {
              const { err, msg, ws } = params;
              try {
                if (err) {
                  done(err);
                  return;
                }
                
                expect(ws).toBeDefined();
                expect(msg?.displayName).toEqual('no-param-response');
                expect(msg?.email).toEqual('noparam@test.dk');
                
                clientResponseReceived = true;
                clientWs.close();
                checkCompletion();
              } catch (error) {
                done(error);
              }
            },
            ws: clientWs
          });

          setTimeout(async () => {
            try {
              await publishToNoParameter({
                message: testMessage,
                ws: clientWs
              });
            } catch (error) {
              done(error);
            }
          }, 100);
        });

        clientWs.on('error', (error) => {
          done(error);
        });
      });
    });

    describe('error handling', () => {
      it('should handle closed WebSocket connections', async () => {
        // Create a WebSocket that will be closed immediately
        const testWs = new WebSocket.WebSocket(`${serverUrl}/test-close`);
        
        // Wait for connection to establish and then close it
        await new Promise((resolve) => {
          testWs.on('open', () => {
            testWs.close();
            resolve(undefined);
          });
          testWs.on('error', () => resolve(undefined));
        });

        // Wait for close to complete
        await new Promise((resolve) => {
          testWs.on('close', () => resolve(undefined));
        });

        // Try to publish to closed WebSocket
        try {
          await publishToNoParameter({
            message: testMessage,
            ws: testWs
          });
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.message).toContain('WebSocket is not open');
        }
      });

      it('should handle subscription to closed WebSocket', (done) => {
        const closedWs = new WebSocket.WebSocket('ws://localhost:9999'); // Non-existent server
        
        closedWs.on('error', () => {
          // WebSocket failed to connect
          subscribeToNoParameter({
            onDataCallback: (params) => {
              const { err } = params;
              expect(err).toBeDefined();
              expect(err?.message).toContain('WebSocket is not open');
              done();
            },
            ws: closedWs
          });
        });
      });
    });
  });
});