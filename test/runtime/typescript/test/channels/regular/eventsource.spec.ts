/* eslint-disable no-console */
import { Protocols } from '../../../src/channels/index';
import { UserSignedupParameters } from '../../../src/parameters/UserSignedupParameters';
import { UserSignedUp } from '../../../src/payloads/UserSignedUp';
import { UserSignedUpHeaders } from '../../../src/headers/UserSignedUpHeaders';
import express, { Router } from 'express'
require('jest-fetch-mock').dontMock()
const { event_source } = Protocols;
const { listenForNoParameter, registerNoParameter, registerSendUserSignedup, listenForReceiveUserSignedup } = event_source;

describe('event source', () => {
  const testPort = () => Math.floor(Math.random() * (9875 - 5779 + 1)) + 5779;
  const testMessage = new UserSignedUp({ displayName: 'test', email: 'test@test.dk' });
  const invalidMessage = new UserSignedUp({ displayName: 'test', email: '123' });
  const testParameters = new UserSignedupParameters({ myParameter: 'test', enumParameter: 'asyncapi' });
  const testHeaders = new UserSignedUpHeaders({ xTestHeader: 'test-header-value' });
  describe('channels', () => {
    describe('without parameters', () => {
      let server;
      afterEach(() => {
        server?.close()
      })
      it('should be able to send events and receive them', () => {
        return new Promise<void>(async (resolve, reject) => {
          const router = Router()
          const app = express()
          app.use(express.json({ limit: '3000kb' }))
          app.use(express.urlencoded({ extended: true }))
          registerNoParameter({router, callback: (req, res, next, sendEvent) => {
            sendEvent(testMessage);
            res.end();
          }})
          app.use(router)
          const portToUse = testPort()
          server = app.listen(portToUse, async () => {
            const cleanup = listenForNoParameter({callback: ({error, messageEvent}) => {
              try {
                expect(messageEvent?.marshal()).toEqual(testMessage.marshal());
                cleanup();
                resolve();
              } catch (e) {
                cleanup();
                reject(e);
              }
            }, options: {
              baseUrl: 'http://localhost:' + portToUse,
            }})
          })
        });
      });

      it('should be able to send events and receive them with headers', () => {
        return new Promise<void>(async (resolve, reject) => {
          const router = Router()
          const app = express()
          app.use(express.json({ limit: '3000kb' }))
          app.use(express.urlencoded({ extended: true }))
          registerNoParameter({router, callback: (req, res, next, sendEvent) => {
            // Verify headers were received in the HTTP request
            expect(req.headers['x-test-header']).toEqual('test-header-value');
            sendEvent(testMessage);
            res.end();
          }})
          app.use(router)
          const portToUse = testPort()
          server = app.listen(portToUse, async () => {
            const cleanup = listenForNoParameter({callback: ({error, messageEvent}) => {
              try {
                expect(messageEvent?.marshal()).toEqual(testMessage.marshal());
                cleanup();
                resolve();
              } catch (e) {
                cleanup();
                reject(e);
              }
            }, headers: testHeaders, options: {
              baseUrl: 'http://localhost:' + portToUse,
            }})
          })
        });
      });
    });
    describe('with parameters', () => {
      let server;
      afterEach(() => {
        server?.close()
      })
      it('should be able to send events and receive them', () => {
        return new Promise<void>(async (resolve, reject) => {
          const router = Router()
          const app = express()
          app.use(express.json({ limit: '3000kb' }))
          app.use(express.urlencoded({ extended: true }))
          registerSendUserSignedup({router, callback: (req, res, next, parameters, sendEvent) => {
            sendEvent(testMessage);
            res.end();
          }})
          app.use(router)
          const portToUse = testPort()
          server = app.listen(portToUse, async () => {
            const cleanup = listenForReceiveUserSignedup({callback: ({error, messageEvent}) => {
              try {
                expect(messageEvent?.marshal()).toEqual(testMessage.marshal());
                cleanup();
                resolve();
              } catch (e) {
                cleanup();
                reject(e);
              }
            },
              parameters: testParameters,
              options: {
                baseUrl: 'http://localhost:' + portToUse,
              }})
          })
        });
      });

      it('should be able to send events and receive them with headers', () => {
        return new Promise<void>(async (resolve, reject) => {
          const router = Router()
          const app = express()
          app.use(express.json({ limit: '3000kb' }))
          app.use(express.urlencoded({ extended: true }))
          registerSendUserSignedup({router, callback: (req, res, next, parameters, sendEvent) => {
            // Verify headers were received in the HTTP request
            expect(req.headers['x-test-header']).toEqual('test-header-value');
            sendEvent(testMessage);
            res.end();
          }})
          app.use(router)
          const portToUse = testPort()
          server = app.listen(portToUse, async () => {
            const cleanup = listenForReceiveUserSignedup({callback: ({error, messageEvent}) => {
              try {
                expect(messageEvent?.marshal()).toEqual(testMessage.marshal());
                cleanup();
                resolve();
              } catch (e) {
                cleanup();
                reject(e);
              }
            },
              parameters: testParameters,
              headers: testHeaders,
              options: {
                baseUrl: 'http://localhost:' + portToUse,
              }})
          })
        });
      });
      it('should be able to catch validation errors', () => {
        return new Promise<void>(async (resolve, reject) => {
          const router = Router()
          const app = express()
          app.use(express.json({ limit: '3000kb' }))
          app.use(express.urlencoded({ extended: true }))
          registerSendUserSignedup({router, callback: (req, res, next, parameters, sendEvent) => {
            sendEvent(invalidMessage);
            res.end();
          }})
          app.use(router)
          const portToUse = testPort()
          server = app.listen(portToUse, async () => {
            const cleanup = listenForReceiveUserSignedup({
              callback: ({error}) => {
                try {
                  expect(error).toBeDefined();
                  expect(error?.message).toBeDefined();
                  cleanup();
                  resolve();
                } catch (e) {
                  cleanup();
                  reject(e);
                }
              },
              parameters: testParameters,
              options: {
                baseUrl: 'http://localhost:' + portToUse,
              }}
            )
          })
        });
      });
      
      it('should be able to abort connection using cleanup function', () => {
        return new Promise<void>(async (resolve, reject) => {
          const router = Router()
          const app = express()
          app.use(express.json({ limit: '3000kb' }))
          app.use(express.urlencoded({ extended: true }))
          
          let sendEventCallback: ((message: UserSignedUp) => void) | null = null;
          registerSendUserSignedup({router, callback: (req, res, next, parameters, sendEvent) => {
            sendEventCallback = sendEvent;
            // Don't end the response, keep the connection open
          }})
          app.use(router)
          const portToUse = testPort()
          server = app.listen(portToUse, async () => {
            let messageCount = 0;
            let connectionAborted = false;
            
            const cleanup = listenForReceiveUserSignedup({
              callback: ({error, messageEvent}) => {
                if (connectionAborted) {
                  // Should not receive messages after abort
                  reject(new Error('Received message after connection was aborted'));
                  return;
                }
                
                messageCount++;
                if (messageCount === 1) {
                  // First message received, verify it's correct
                  try {
                    expect(messageEvent?.marshal()).toEqual(testMessage.marshal());
                    
                    // Abort the connection
                    connectionAborted = true;
                    cleanup();
                    
                    // Try to send another message after abort - this should not be received
                    setTimeout(() => {
                      if (sendEventCallback) {
                        sendEventCallback(testMessage);
                      }
                      // Wait a bit to ensure no message is received after abort
                      setTimeout(() => {
                        resolve();
                      }, 100);
                    }, 50);
                  } catch (e) {
                    cleanup();
                    reject(e);
                  }
                } else {
                  // Should not receive more than one message due to abort
                  cleanup();
                  reject(new Error('Received unexpected additional message after first message'));
                }
              },
              parameters: testParameters,
              options: {
                baseUrl: 'http://localhost:' + portToUse,
                onClose: () => {
                  // Connection closed as expected after abort
                }
              }}
            );
            
            // Verify cleanup function is returned
            expect(typeof cleanup).toBe('function');
            
            // Send first message after a short delay to ensure connection is established
            setTimeout(() => {
              if (sendEventCallback) {
                sendEventCallback(testMessage);
              }
            }, 50);
          })
        });
      });
    });
  });
});
