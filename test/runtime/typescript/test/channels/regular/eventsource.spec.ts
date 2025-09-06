/* eslint-disable no-console */
import { Protocols } from '../../../src/channels/index';
import { UserSignedupParameters } from '../../../src/parameters/UserSignedupParameters';
import { UserSignedUp } from '../../../src/payloads/UserSignedUp';
import express, { Router } from 'express'
require('jest-fetch-mock').dontMock()
const { event_source } = Protocols;
const { listenForNoParameter, registerNoParameter, registerSendUserSignedup, listenForReceiveUserSignedup } = event_source;

describe('event source', () => {
  const testPort = () => Math.floor(Math.random() * (9875 - 5779 + 1)) + 5779;
  const testMessage = new UserSignedUp({ displayName: 'test', email: 'test@test.dk' });
  const invalidMessage = new UserSignedUp({ displayName: 'test', email: '123' });
  const testParameters = new UserSignedupParameters({ myParameter: 'test', enumParameter: 'asyncapi' });
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
            const cleanup = listenForNoParameter({callback: (err, msg) => {
              try {
                expect(msg?.marshal()).toEqual(testMessage.marshal());
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
            const cleanup = listenForReceiveUserSignedup({callback: (err, msg) => {
              try {
                expect(msg?.marshal()).toEqual(testMessage.marshal());
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
              callback: (err) => {
                try {
                  expect(err).toBeDefined();
                  expect(err?.message).toBeDefined();
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
    });
  });
});
