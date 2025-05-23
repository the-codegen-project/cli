/* eslint-disable no-console */
import { JetStreamClient, JetStreamManager, NatsConnection, connect, JSONCodec } from "nats";
import { Protocols } from '../../../src/request-reply/channels/index';
import { Ping } from '../../../src/request-reply/payloads/Ping';
import { Pong } from '../../../src/request-reply/payloads/Pong';
const { nats } = Protocols;
const { requestToRegularRequest, replyToRegularReply } = nats;

describe('nats', () => {
  describe('channels', () => {
    describe('without parameters', () => {
      let nc: NatsConnection;
      let js: JetStreamClient;
      let jsm: JetStreamManager;
      const test_stream = 'noparameters_stream';
      const test_subj = 'noparameters';
      beforeAll(async () => {
        nc = await connect({ servers: "nats://localhost:4443" });
        js = nc.jetstream();
        jsm = await nc.jetstreamManager();
        await jsm.streams.add({ name: test_stream, subjects: [test_subj] });
      });
      afterEach(async () => {
        await jsm.streams.purge(test_stream);
      });
      afterAll(async () => {
        await jsm.streams.delete(test_stream);
        // close the connection
        const done = nc.closed();
        await nc.close();
        // check if the close was OK
        const err = await done;
        if (err) {
          console.log(`error closing:`, err);
        }
      });

      it('should be able to setup reply', async () => {
        const requestMessage = new Ping({})
        const replyMessage = new Pong({ additionalProperties: new Map([['test', true]]) })
        const replyCallback = jest.fn().mockReturnValue(replyMessage);
        await replyToRegularReply({ onDataCallback: replyCallback, nc });
        const reply = await nc.request('ping', requestMessage.marshal());
        const decodedMsg = JSONCodec().decode(reply.data);
        const msg = Pong.unmarshal(decodedMsg as any);
        const expectedJson = msg.marshal();
        const actualJson = replyMessage.marshal();
        expect(expectedJson).toEqual(actualJson);
      });

      it('should be able to make request', async () => {
        return new Promise<void>(async (resolve, reject) => {
          const requestMessage = new Ping({})
          const replyMessage = new Pong({ additionalProperties: new Map([['test', true]]) })
          let subscription = nc.subscribe('ping');
          (async () => {
            for await (const msg of subscription) {
              if (msg.reply) {
                msg.respond(JSONCodec().encode(replyMessage.marshal()));
              } else {
                reject('expected reply')
              }
            }
          })();
          const receivedReplyMessage = await requestToRegularRequest({ requestMessage: requestMessage, nc })
          expect(receivedReplyMessage.marshal()).toEqual(replyMessage.marshal())
          resolve();
        });
      });
    });
  });
});
