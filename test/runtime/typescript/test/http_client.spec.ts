/* eslint-disable no-console */
import { Protocols } from '../src/request-reply/channels/index';
import { Ping } from "../src/request-reply/payloads/Ping";
import { Pong } from "../src/request-reply/payloads/Pong";
import express, { Router } from 'express';
const {http_client } = Protocols;
const {getPingRequest } = http_client;

jest.setTimeout(10000);
describe('http_fetch', () => {
  const portToUse = Math.floor(Math.random() * (9875 - 5779 + 1)) + 5779;
  describe('channels', () => {
    let server;
    afterEach(() => {
      server?.close();
    });
    it('should be able to make GET request', async () => {
      return new Promise<void>(async (resolve, reject) => {
        const router = Router();
        const app = express();
        app.use(express.json({ limit: '3000kb' }));
        app.use(express.urlencoded({ extended: true }));
        app.use(router);
        const requestMessage = new Ping({});
        const replyMessage = new Pong({additionalProperties: new Map([['test', true]])});

        router.post('/ping', (req, res) => {
          res.write(replyMessage.marshal());
          res.end();
        });
        server = app.listen(portToUse, async () => {
          const receivedReplyMessage = await getPingRequest({payload: requestMessage, basePath: `http://localhost:${ portToUse}`});
          expect(receivedReplyMessage?.marshal()).toEqual(replyMessage.marshal());
          resolve();
        });
      });
    });
  });
});
