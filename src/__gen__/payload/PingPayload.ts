import {Ping} from './Ping';
import {Pong} from './Pong';
type PingPayload = Ping | Pong;


export function unmarshal(json: any): PingPayload {
  if(typeof json === 'object') {
    if(json.event === 'ping') {
  return Ping.unmarshal(json);
  }
  if(json.event === 'pong') {
  return Pong.unmarshal(json);
  }
  }
  return JSON.parse(json);
}
export function marshal(payload: PingPayload) {
  if(payload instanceof Ping) {
  return payload.marshal();
}
if(payload instanceof Pong) {
  return payload.marshal();
}
  return JSON.stringify(payload);
}
export { PingPayload };