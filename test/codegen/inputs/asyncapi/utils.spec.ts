/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/no-jasmine-globals */

import { ChannelFunctionTypes } from "../../../../src/codegen/generators/typescript/channels";
import { shouldRenderFunctionType } from "../../../../src/codegen/generators/typescript/channels/asyncapi";

describe('utils', () => {
  describe('shouldRenderFunctionType', () => {
    describe('should render sending operation correctly', () => {
      it('should render publish when send', async () => {
        const renderPublish = shouldRenderFunctionType(undefined, ChannelFunctionTypes.NATS_PUBLISH, 'send', false);
        expect(renderPublish).toEqual(true);
      });
      it('should render publish when subscribe', async () => {
        const renderPublish = shouldRenderFunctionType(undefined, ChannelFunctionTypes.NATS_PUBLISH, 'subscribe', false);
        expect(renderPublish).toEqual(true);
      });
      it('should not render publish when send on reverse', async () => {
        const renderPublish = shouldRenderFunctionType(undefined, ChannelFunctionTypes.NATS_PUBLISH, 'send', true);
        expect(renderPublish).toEqual(false);
      });
      it('should not render publish when subscribe on reverse', async () => {
        const renderPublish = shouldRenderFunctionType(undefined, ChannelFunctionTypes.NATS_PUBLISH, 'subscribe', true);
        expect(renderPublish).toEqual(false);
      });
      it('should not render publish when publish', async () => {
        const renderPublish = shouldRenderFunctionType(undefined, ChannelFunctionTypes.NATS_PUBLISH, 'publish', false);
        expect(renderPublish).toEqual(false);
      });
      it('should not render publish when recieve', async () => {
        const renderPublish = shouldRenderFunctionType(undefined, ChannelFunctionTypes.NATS_PUBLISH, 'receive', false);
        expect(renderPublish).toEqual(false);
      });
      it('should render publish when publish on reverse', async () => {
        const renderPublish = shouldRenderFunctionType(undefined, ChannelFunctionTypes.NATS_PUBLISH, 'publish', true);
        expect(renderPublish).toEqual(true);
      });
      it('should render publish when recieve on reverse', async () => {
        const renderPublish = shouldRenderFunctionType(undefined, ChannelFunctionTypes.NATS_PUBLISH, 'receive', true);
        expect(renderPublish).toEqual(true);
      });
      it('should not render publish when send with no type mapping', async () => {
        const renderPublish = shouldRenderFunctionType([], ChannelFunctionTypes.NATS_PUBLISH, 'send', false);
        expect(renderPublish).toEqual(false);
      });
      it('should not render publish when subscribe with no type mapping', async () => {
        const renderPublish = shouldRenderFunctionType([], ChannelFunctionTypes.NATS_PUBLISH, 'subscribe', false);
        expect(renderPublish).toEqual(false);
      });
      it('should render publish when send and type mapping match', async () => {
        const renderPublish = shouldRenderFunctionType([ChannelFunctionTypes.NATS_PUBLISH], ChannelFunctionTypes.NATS_PUBLISH, 'send', false);
        expect(renderPublish).toEqual(true);
      });
      it('should render publish when subscribe and type mapping match', async () => {
        const renderPublish = shouldRenderFunctionType([ChannelFunctionTypes.NATS_PUBLISH], ChannelFunctionTypes.NATS_PUBLISH, 'subscribe', false);
        expect(renderPublish).toEqual(true);
      });
    });
    describe('should render receiving operation correctly', () => {
      it('should not render receiving when send', async () => {
        const renderReceiving = shouldRenderFunctionType(undefined, ChannelFunctionTypes.NATS_SUBSCRIBE, 'send', false);
        expect(renderReceiving).toEqual(false);
      });
      it('should not render receiving when subscribe', async () => {
        const renderReceiving = shouldRenderFunctionType(undefined, ChannelFunctionTypes.NATS_SUBSCRIBE, 'subscribe', false);
        expect(renderReceiving).toEqual(false);
      });
      it('should render receiving when send on reverse', async () => {
        const renderReceiving = shouldRenderFunctionType(undefined, ChannelFunctionTypes.NATS_SUBSCRIBE, 'send', true);
        expect(renderReceiving).toEqual(true);
      });
      it('should render receiving when subscribe on reverse', async () => {
        const renderReceiving = shouldRenderFunctionType(undefined, ChannelFunctionTypes.NATS_SUBSCRIBE, 'subscribe', true);
        expect(renderReceiving).toEqual(true);
      });
      it('should render receiving when receive', async () => {
        const renderReceiving = shouldRenderFunctionType(undefined, ChannelFunctionTypes.NATS_SUBSCRIBE, 'receive', false);
        expect(renderReceiving).toEqual(true);
      });
      it('should not render receiving when publish on reverse', async () => {
        const renderReceiving = shouldRenderFunctionType(undefined, ChannelFunctionTypes.NATS_SUBSCRIBE, 'publish', true);
        expect(renderReceiving).toEqual(false);
      });
      it('should not render receiving when receive on reverse', async () => {
        const renderReceiving = shouldRenderFunctionType(undefined, ChannelFunctionTypes.NATS_SUBSCRIBE, 'receive', true);
        expect(renderReceiving).toEqual(false);
      });
      it('should not render receiving when send with no type mapping', async () => {
        const renderReceiving = shouldRenderFunctionType([], ChannelFunctionTypes.NATS_SUBSCRIBE, 'send', false);
        expect(renderReceiving).toEqual(false);
      });
      it('should not render receiving when subscribe with no type mapping', async () => {
        const renderReceiving = shouldRenderFunctionType([], ChannelFunctionTypes.NATS_SUBSCRIBE, 'subscribe', false);
        expect(renderReceiving).toEqual(false);
      });
      it('should not render receiving when send and type mapping match', async () => {
        const renderReceiving = shouldRenderFunctionType([ChannelFunctionTypes.NATS_SUBSCRIBE], ChannelFunctionTypes.NATS_SUBSCRIBE, 'send', false);
        expect(renderReceiving).toEqual(false);
      });
      it('should render receiving when subscribe and type mapping match', async () => {
        const renderReceiving = shouldRenderFunctionType([ChannelFunctionTypes.NATS_SUBSCRIBE], ChannelFunctionTypes.NATS_SUBSCRIBE, 'subscribe', false);
        expect(renderReceiving).toEqual(false);
      });
    });
  });
});
