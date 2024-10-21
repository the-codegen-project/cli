import {SimpleObject} from './SimpleObject';
type UnionPayload = SimpleObject | boolean | string;


export function unmarshal(json: any): UnionPayload {
  if(typeof json === 'object') {
    if(json.type === 'SimpleObject') {
  return SimpleObject.unmarshal(json);
  }
  }
  return JSON.parse(json);
}
export function marshal(payload: UnionPayload) {
  if(payload instanceof SimpleObject) {
  return payload.marshal();
}


  return JSON.stringify(payload);
}
export { UnionPayload };