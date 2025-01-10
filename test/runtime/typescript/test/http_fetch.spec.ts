/* eslint-disable no-console */
import { Protocols } from '../src/channels/index';
import { Ping } from "../src/payloads/Ping";
import { Pong } from "../src/payloads/Pong";
const { http_client } = Protocols;
const {  } = http_client;
import http from 'http'

describe('http_fetch', () => {
  describe('channels', () => {
    it('should be able to make POST request', async () => {
      return new Promise<void>(async (resolve, reject) => {
        const requestMessage = new Ping({})
        const replyMessage = new Pong({additionalProperties: new Map([['test', true]])})
        const httpServer = http.createServer((req, res) => {
          let body = ''
          req.on('data', function(data) {
            body += data
          })
          req.on('end', function() {
            try {
              expect(req.method).toEqual('POST');
              expect(Ping.unmarshal(body).marshal()).toEqual(requestMessage.marshal())
            } catch(e) {
              reject(e);
            }
            res.write(replyMessage.marshal());
            res.end();
          })
        }).listen(8080); 
        const receivedReplyMessage = await postPing({payload: requestMessage, basePath: 'http://localhost:8080'})
        expect(receivedReplyMessage.marshal()).toEqual(replyMessage.marshal())
        httpServer.close();
        resolve();
      });
    });
  });
});
