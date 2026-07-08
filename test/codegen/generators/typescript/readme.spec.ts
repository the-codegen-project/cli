import {
  ConstrainedAnyModel,
  ConstrainedObjectModel,
  OutputModel
} from '@asyncapi/modelina';
import {
  generateTypescriptReadme,
  zodTypescriptReadmeGenerator
} from '../../../../src/codegen/generators/typescript/readme';
import {
  ChannelFunctionTypes,
  defaultTypeScriptChannelsGenerator,
  TypeScriptChannelRenderType,
  TypeScriptChannelRenderedFunctionType
} from '../../../../src/codegen/generators/typescript/channels';
import {
  defaultTypeScriptPayloadGenerator,
  TypeScriptPayloadRenderType
} from '../../../../src/codegen/generators/typescript/payloads';
import {TypeScriptClientRenderType} from '../../../../src/codegen/generators/typescript/client';
import {TypeScriptReadmeGenerator} from '../../../../src/codegen/generators/typescript/readme';

function makeGenerator(overrides: Partial<TypeScriptReadmeGenerator> = {}) {
  return zodTypescriptReadmeGenerator.parse({outputPath: '.', ...overrides});
}

async function render(
  overrides: Partial<TypeScriptReadmeGenerator> = {},
  dependencyOutputs: Record<string, any> = {}
): Promise<string> {
  const result = await generateTypescriptReadme({
    generator: makeGenerator(overrides),
    inputType: 'asyncapi',
    dependencyOutputs
  });
  return result.content;
}

function makeChannelsOutput(
  renderedFunctions: Record<string, TypeScriptChannelRenderedFunctionType[]>
): TypeScriptChannelRenderType {
  return {
    payloadRender: {
      channelModels: {},
      operationModels: {},
      otherModels: [],
      generator: {outputPath: './src/payloads'} as any,
      files: []
    },
    parameterRender: {
      channelModels: {},
      generator: {outputPath: './src/parameters'} as any,
      files: []
    },
    generator: {
      ...defaultTypeScriptChannelsGenerator,
      outputPath: './src/channels'
    },
    renderedFunctions,
    result: '',
    protocolFiles: {},
    files: []
  };
}

describe('readme', () => {
  describe('typescript', () => {
    it('writes README.md at the configured output path', async () => {
      const result = await generateTypescriptReadme({
        generator: makeGenerator({packageName: 'my-sdk'}),
        inputType: 'asyncapi',
        dependencyOutputs: {}
      });
      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toBe('README.md');
    });

    it('keeps the introduction first and appends generated content after', async () => {
      const introduction = '# Custom\n\nHello.';
      const content = await render({
        introduction,
        packageName: 'my-sdk',
        packageVersion: '1.0.0'
      });
      expect(content.startsWith(introduction)).toBe(true);
      expect(content.indexOf('# Custom')).toBeLessThan(
        content.indexOf('## Install')
      );
      expect(content).toContain('npm install my-sdk');
    });

    it('renders title, version and install when packageName is set', async () => {
      const content = await render({
        packageName: 'my-sdk',
        packageVersion: '2.5.7'
      });
      expect(content).toContain('# my-sdk');
      expect(content).toContain('Version 2.5.7');
      expect(content).toContain('npm install my-sdk');
      expect(content).toContain('yarn add my-sdk');
      expect(content).toContain('pnpm add my-sdk');
    });

    it('skips the install section when packageName is not set', async () => {
      const content = await render({packageVersion: '1.0.0'});
      expect(content).not.toContain('## Install');
      expect(content).toContain('# Generated Code');
    });

    it('renders the default attribution suffix when none is provided', async () => {
      const content = await render({packageName: 'my-sdk'});
      expect(content).toMatch(/@the-codegen-project\/cli` v/);
    });

    it('renders a custom suffix instead of the attribution when provided', async () => {
      const content = await render({
        packageName: 'my-sdk',
        suffix: '> Built by Acme.'
      });
      expect(content).toContain('> Built by Acme.');
      expect(content).not.toContain('@the-codegen-project/cli');
    });

    it('renders an HTTP usage section derived from channel functions', async () => {
      const channels = makeChannelsOutput({
        http_client: [
          {
            functionName: 'getUser',
            functionType: ChannelFunctionTypes.HTTP_CLIENT,
            messageType: '',
            replyType: 'User',
            parameterType: 'GetUserParameters'
          },
          {
            functionName: 'createUser',
            functionType: ChannelFunctionTypes.HTTP_CLIENT,
            messageType: 'NewUser',
            replyType: 'User'
          }
        ]
      });
      const content = await render(
        {packageName: 'my-sdk'},
        {'channels-typescript': channels}
      );
      expect(content).toContain('## Usage');
      expect(content).toContain('### HTTP operations');
      expect(content).toContain("import { getUser } from 'my-sdk'");
      expect(content).toContain('await getUser({');
      expect(content).toContain('#### Available operations');
      expect(content).toContain('`createUser`');
    });

    it('prefers an operation without body or parameters for the primary HTTP example', async () => {
      const channels = makeChannelsOutput({
        http_client: [
          {
            functionName: 'createUser',
            functionType: ChannelFunctionTypes.HTTP_CLIENT,
            messageType: 'NewUser',
            replyType: 'User'
          },
          {
            functionName: 'listUsers',
            functionType: ChannelFunctionTypes.HTTP_CLIENT,
            messageType: '',
            replyType: 'User'
          }
        ]
      });
      const content = await render(
        {packageName: 'my-sdk'},
        {'channels-typescript': channels}
      );
      expect(content).toContain('await listUsers({');
      expect(content).not.toContain('await createUser({');
    });

    it('omits the usage section when no documented generators produce output', async () => {
      const content = await render({packageName: 'my-sdk'}, {});
      expect(content).not.toContain('## Usage');
    });

    it('renders a NATS messaging section from channel functions', async () => {
      const channels = makeChannelsOutput({
        nats: [
          {
            functionName: 'publishToUserSignup',
            functionType: ChannelFunctionTypes.NATS_PUBLISH,
            messageType: 'UserSignedUp'
          },
          {
            functionName: 'subscribeToUserSignup',
            functionType: ChannelFunctionTypes.NATS_SUBSCRIBE,
            messageType: 'UserSignedUp'
          }
        ]
      });
      const content = await render(
        {packageName: 'my-sdk'},
        {'channels-typescript': channels}
      );
      expect(content).toContain('### NATS');
      expect(content).toContain('`publishToUserSignup`');
      expect(content).toContain('sends');
      expect(content).toContain('receives');
    });

    it('renders a payloads section referencing a real model name', async () => {
      const objectModel = new OutputModel(
        '',
        new ConstrainedObjectModel('', undefined, {}, 'UserSignedUp', {}),
        '',
        {models: {}, originalInput: undefined},
        []
      );
      const payloads: TypeScriptPayloadRenderType = {
        channelModels: {
          'user/signedup': {
            messageModel: objectModel,
            messageType: 'UserSignedUp'
          }
        },
        operationModels: {},
        otherModels: [],
        generator: {
          ...defaultTypeScriptPayloadGenerator,
          outputPath: './src/payloads'
        },
        files: []
      };
      const content = await render(
        {packageName: 'my-sdk'},
        {'payloads-typescript': payloads}
      );
      expect(content).toContain('### Message payloads');
      expect(content).toContain("import { UserSignedUp } from 'my-sdk'");
      expect(content).toContain('UserSignedUp.unmarshal(json)');
    });

    it('skips the payloads section when no importable model exists', async () => {
      const anyModel = new OutputModel(
        '',
        new ConstrainedAnyModel('', undefined, {}, 'Payload'),
        '',
        {models: {}, originalInput: undefined},
        []
      );
      const payloads: TypeScriptPayloadRenderType = {
        channelModels: {
          'user/signedup': {
            messageModel: anyModel,
            messageType: 'string'
          }
        },
        operationModels: {},
        otherModels: [],
        generator: {
          ...defaultTypeScriptPayloadGenerator,
          outputPath: './src/payloads'
        },
        files: []
      };
      const content = await render(
        {packageName: 'my-sdk'},
        {'payloads-typescript': payloads}
      );
      expect(content).not.toContain('### Message payloads');
    });

    it('renders a types section listing exported names', async () => {
      const types = {
        result:
          'export type Channels = string;\nexport enum Topics { A = "a" }\n',
        generator: {outputPath: './src/types'} as any,
        files: []
      };
      const content = await render(
        {packageName: 'my-sdk'},
        {'types-typescript': types}
      );
      expect(content).toContain('### Types');
      expect(content).toContain('`Channels`');
      expect(content).toContain('`Topics`');
      expect(content).toContain("import { Channels } from 'my-sdk'");
    });

    it('renders a client section for a NATS client', async () => {
      const client: TypeScriptClientRenderType = {
        protocolResult: {nats: 'export class NatsClient {}'},
        files: [{path: 'src/clients/NatsClient.ts', content: ''}]
      };
      const channels = makeChannelsOutput({
        nats: [
          {
            functionName: 'publishToUserSignup',
            functionType: ChannelFunctionTypes.NATS_PUBLISH,
            messageType: 'UserSignedUp'
          }
        ]
      });
      const content = await render(
        {packageName: 'my-sdk'},
        {
          'client-typescript': client,
          'channels-typescript': channels
        }
      );
      expect(content).toContain('### Client');
      expect(content).toContain("import { NatsClient } from 'my-sdk'");
      expect(content).toContain('await client.publishToUserSignup({ message })');
    });

    it('uses relative import paths when no packageName is set', async () => {
      const channels = makeChannelsOutput({
        nats: [
          {
            functionName: 'publishToUserSignup',
            functionType: ChannelFunctionTypes.NATS_PUBLISH,
            messageType: 'UserSignedUp'
          }
        ]
      });
      const content = await render({}, {'channels-typescript': channels});
      expect(content).toContain("from './src/channels/nats'");
    });
  });
});
