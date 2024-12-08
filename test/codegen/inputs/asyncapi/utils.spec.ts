/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/no-jasmine-globals */

import { ChannelFunctionTypes } from "../../../../src/codegen/generators/typescript/channels";
import { shouldRenderPublish, shouldRenderRequestReply } from "../../../../src/codegen/generators/typescript/channels/asyncapi";

describe('Testing', () => {
  describe('shouldRenderRequestReply', () => {
    it('should not render anything when no type mapping', async () => {
      const { shouldRenderReply, shouldRenderRequest } = shouldRenderRequestReply([], 'send', false);
      expect(shouldRenderReply).toEqual(false);
      expect(shouldRenderRequest).toEqual(false);
    });
    it('should render request when type mapping', async () => {
      const { shouldRenderReply, shouldRenderRequest } = shouldRenderRequestReply([ChannelFunctionTypes.NATS_REQUEST], 'send', false);
      expect(shouldRenderReply).toEqual(false);
      expect(shouldRenderRequest).toEqual(true);
    });
    it('should render request when send', async () => {
      const { shouldRenderReply, shouldRenderRequest } = shouldRenderRequestReply(undefined, 'send', false);
      expect(shouldRenderReply).toEqual(false);
      expect(shouldRenderRequest).toEqual(true);
    });
    it('should render reply when send on reverse', async () => {
      const { shouldRenderReply, shouldRenderRequest } = shouldRenderRequestReply(undefined, 'send', true);
      expect(shouldRenderReply).toEqual(true);
      expect(shouldRenderRequest).toEqual(false);
    });
    it('should render reply when receive', async () => {
      const { shouldRenderReply, shouldRenderRequest } = shouldRenderRequestReply(undefined, 'receive', false);
      expect(shouldRenderReply).toEqual(true);
      expect(shouldRenderRequest).toEqual(false);
    });
    it('should render request when receive on reverse', async () => {
      const { shouldRenderReply, shouldRenderRequest } = shouldRenderRequestReply(undefined, 'receive', true);
      expect(shouldRenderReply).toEqual(false);
      expect(shouldRenderRequest).toEqual(true);
    });
    it('should render request when subscribe', async () => {
      const { shouldRenderReply, shouldRenderRequest } = shouldRenderRequestReply(undefined, 'subscribe', false);
      expect(shouldRenderReply).toEqual(false);
      expect(shouldRenderRequest).toEqual(true);
    });
    it('should render reply when subscribe on reverse', async () => {
      const { shouldRenderReply, shouldRenderRequest } = shouldRenderRequestReply(undefined, 'subscribe', true);
      expect(shouldRenderReply).toEqual(true);
      expect(shouldRenderRequest).toEqual(false);
    });
    it('should render reply when publish', async () => {
      const { shouldRenderReply, shouldRenderRequest } = shouldRenderRequestReply(undefined, 'publish', false);
      expect(shouldRenderReply).toEqual(true);
      expect(shouldRenderRequest).toEqual(false);
    });
    it('should render request when publish on reverse', async () => {
      const { shouldRenderReply, shouldRenderRequest } = shouldRenderRequestReply(undefined, 'publish', true);
      expect(shouldRenderReply).toEqual(false);
      expect(shouldRenderRequest).toEqual(true);
    });
  });
  describe('shouldRenderPublish', () => {
    it('should render publish when send', async () => {
      const renderPublish = shouldRenderPublish(undefined, 'send', false);
      expect(renderPublish).toEqual(true);
    });
    it('should render publish when subscribe', async () => {
      const renderPublish = shouldRenderPublish(undefined, 'subscribe', false);
      expect(renderPublish).toEqual(true);
    });
    it('should not render publish when send on reverse', async () => {
      const renderPublish = shouldRenderPublish(undefined, 'send', true);
      expect(renderPublish).toEqual(false);
    });
    it('should not render publish when subscribe on reverse', async () => {
      const renderPublish = shouldRenderPublish(undefined, 'subscribe', true);
      expect(renderPublish).toEqual(false);
    });
    it('should not render publish when publish', async () => {
      const renderPublish = shouldRenderPublish(undefined, 'publish', false);
      expect(renderPublish).toEqual(false);
    });
    it('should not render publish when recieve', async () => {
      const renderPublish = shouldRenderPublish(undefined, 'receive', false);
      expect(renderPublish).toEqual(false);
    });
    it('should render publish when publish on reverse', async () => {
      const renderPublish = shouldRenderPublish(undefined, 'publish', true);
      expect(renderPublish).toEqual(true);
    });
    it('should render publish when recieve on reverse', async () => {
      const renderPublish = shouldRenderPublish(undefined, 'receive', true);
      expect(renderPublish).toEqual(true);
    });
    it('should not render publish when send with no type mapping', async () => {
      const renderPublish = shouldRenderPublish([], 'send', false);
      expect(renderPublish).toEqual(false);
    });
    it('should not render publish when subscribe with no type mapping', async () => {
      const renderPublish = shouldRenderPublish([], 'subscribe', false);
      expect(renderPublish).toEqual(false);
    });
    it('should render publish when send and type mapping match', async () => {
      const renderPublish = shouldRenderPublish([ChannelFunctionTypes.NATS_PUBLISH], 'send', false);
      expect(renderPublish).toEqual(true);
    });
    it('should render publish when subscribe and type mapping match', async () => {
      const renderPublish = shouldRenderPublish([ChannelFunctionTypes.NATS_PUBLISH], 'subscribe', false);
      expect(renderPublish).toEqual(true);
    });
  });
});
