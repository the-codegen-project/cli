import { ChannelFunctionTypes } from "./types";

export function shouldRenderRequestReply(
  functionTypeMapping: string[] | undefined,
  action: string,
  reverseOperation: boolean
) {
  const hasRequestOperation = action === 'send' || action === 'subscribe';
  const hasReplyOperation = action === 'receive' || action === 'publish';
  const hasFunctionMapping = functionTypeMapping !== undefined;
  const hasRequestFunctionTypeMapping = hasFunctionMapping ? functionTypeMapping.includes(ChannelFunctionTypes.NATS_REQUEST) : true;
  const hasResponseFunctionTypeMapping = hasFunctionMapping ? functionTypeMapping.includes(ChannelFunctionTypes.NATS_REPLY) : true;
  const shouldRenderRequest =
    (hasRequestOperation && hasRequestFunctionTypeMapping && reverseOperation === false) ||
    (hasReplyOperation && hasResponseFunctionTypeMapping && reverseOperation === true);
  const shouldRenderReply =
    (hasReplyOperation && hasResponseFunctionTypeMapping && reverseOperation === false) ||
    (hasRequestOperation && hasRequestFunctionTypeMapping && reverseOperation === true);
  return { shouldRenderRequest, shouldRenderReply };
}

export function shouldRenderSubscribe(
  functionTypeMapping: string[] | undefined,
  action: string,
  reverseOperation: boolean
) {
  const hasPublishOperation = action === 'send' || action === 'subscribe';
  const hasSubscribeOperation = action === 'receive' || action === 'publish';
  const hasFunctionMapping = functionTypeMapping !== undefined;
  const hasFunctionTypeMapping = hasFunctionMapping ? functionTypeMapping.includes(ChannelFunctionTypes.NATS_PUBLISH) : true;
  const hasSubFunctionTypeMapping = hasFunctionMapping ? functionTypeMapping.includes(ChannelFunctionTypes.NATS_SUBSCRIBE) : true;
  return (hasPublishOperation && hasFunctionTypeMapping && reverseOperation === true) || (hasSubscribeOperation && hasSubFunctionTypeMapping && reverseOperation === false);
}

export function shouldRenderPublish(
  functionTypeMapping: string[] | undefined,
  action: string,
  reverseOperation: boolean
) {
  const hasPublishOperation = action === 'send' || action === 'subscribe';
  const hasSubscribeOperation = action === 'receive' || action === 'publish';
  const hasFunctionMapping = functionTypeMapping !== undefined;
  const hasFunctionTypeMapping = hasFunctionMapping ? functionTypeMapping.includes(ChannelFunctionTypes.NATS_PUBLISH) : true;
  const hasSubFunctionTypeMapping = hasFunctionMapping ? functionTypeMapping.includes(ChannelFunctionTypes.NATS_SUBSCRIBE) : true;
  return (hasPublishOperation && hasFunctionTypeMapping && reverseOperation === false) || (hasSubscribeOperation && hasSubFunctionTypeMapping && reverseOperation === true);
}
