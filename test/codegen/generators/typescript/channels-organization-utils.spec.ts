import {
  splitAddressSegments,
  groupByTag,
  groupByPath,
  renderObjectLiteral,
  renderChannelIndex
} from '../../../../src/codegen/generators/typescript/channels/utils';
import {ChannelFunctionTypes} from '../../../../src/codegen/generators/typescript/channels/types';
import {TypeScriptChannelRenderedFunctionType} from '../../../../src/codegen/generators/typescript/channels/types';

const fn = (
  functionName: string,
  extra: Partial<TypeScriptChannelRenderedFunctionType> = {}
): TypeScriptChannelRenderedFunctionType => ({
  functionType: ChannelFunctionTypes.HTTP_CLIENT,
  functionName,
  messageType: 'Message',
  ...extra
});

describe('channels organization utils', () => {
  describe('splitAddressSegments', () => {
    it('drops empty segments and {param} placeholders', () => {
      expect(splitAddressSegments('user/signedup/{my_parameter}/{enum}')).toEqual([
        'user',
        'signedup'
      ]);
      expect(splitAddressSegments('/pet/findByStatus/{status}')).toEqual([
        'pet',
        'findByStatus'
      ]);
      expect(splitAddressSegments('noparameters')).toEqual(['noparameters']);
      expect(splitAddressSegments('{onlyParam}')).toEqual([]);
    });
  });

  describe('groupByTag', () => {
    it('groups by first tag and routes untagged functions to the untagged bucket', () => {
      const tree = groupByTag([
        fn('addPet', {tags: ['pet']}),
        fn('updatePet', {tags: ['pet']}),
        fn('ping', {tags: []}),
        fn('pong')
      ]);
      expect(tree).toEqual({
        pet: {addPet: 'addPet', updatePet: 'updatePet'},
        untagged: {ping: 'ping', pong: 'pong'}
      });
    });
  });

  describe('groupByPath', () => {
    it('nests by path segments with the HTTP method as the leaf when present', () => {
      const tree = groupByPath([
        fn('addPet', {pathSegments: ['pet'], method: 'post'}),
        fn('updatePet', {pathSegments: ['pet'], method: 'put'}),
        fn('findPets', {pathSegments: ['pet', 'findByStatus'], method: 'get'})
      ]);
      expect(tree).toEqual({
        pet: {
          post: 'addPet',
          put: 'updatePet',
          findByStatus: {get: 'findPets'}
        }
      });
    });

    it('uses a clean action verb as the leaf when no method is present (AsyncAPI)', () => {
      const tree = groupByPath([
        fn('publishToSendUserSignedup', {
          pathSegments: ['user', 'signedup'],
          functionType: ChannelFunctionTypes.NATS_PUBLISH
        }),
        fn('jetStreamPublishToSendUserSignedup', {
          pathSegments: ['user', 'signedup'],
          functionType: ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH
        }),
        fn('publishToNoParameter', {
          pathSegments: ['noparameters'],
          functionType: ChannelFunctionTypes.NATS_PUBLISH
        })
      ]);
      expect(tree).toEqual({
        user: {
          signedup: {
            publish: 'publishToSendUserSignedup',
            jetStreamPublish: 'jetStreamPublishToSendUserSignedup'
          }
        },
        noparameters: {publish: 'publishToNoParameter'}
      });
    });

    it('falls back to the function name when the action leaf collides (no drop)', () => {
      const tree = groupByPath([
        fn('publishToA', {
          pathSegments: ['pet'],
          functionType: ChannelFunctionTypes.NATS_PUBLISH
        }),
        fn('publishToB', {
          pathSegments: ['pet'],
          functionType: ChannelFunctionTypes.NATS_PUBLISH
        })
      ]);
      expect(tree).toEqual({
        pet: {publish: 'publishToA', publishToB: 'publishToB'}
      });
    });

    it('falls back to the function name on a method-leaf collision (OpenAPI)', () => {
      const tree = groupByPath([
        fn('first', {pathSegments: ['pet'], method: 'get'}),
        fn('second', {pathSegments: ['pet'], method: 'get'})
      ]);
      expect(tree).toEqual({pet: {get: 'first', second: 'second'}});
    });

    it('skips a function whose path segment collides with an existing leaf', () => {
      const tree = groupByPath([
        fn('getPet', {pathSegments: ['pet'], method: 'get'}),
        fn('getPetGet', {pathSegments: ['pet', 'get'], method: 'get'})
      ]);
      expect(tree).toEqual({pet: {get: 'getPet'}});
    });
  });

  describe('renderObjectLiteral', () => {
    it('renders a nested literal referencing the internal namespace', () => {
      const literal = renderObjectLiteral({
        tree: {pet: {post: 'addPet'}},
        internalName: 'internal_http_client'
      });
      expect(literal).toBe(
        `{\n  pet: {\n    post: internal_http_client.addPet\n  }\n}`
      );
    });

    it('quotes keys that are not valid identifiers', () => {
      const literal = renderObjectLiteral({
        tree: {'bank-accounts': {get: 'getBankAccounts'}},
        internalName: 'internal_http_client'
      });
      expect(literal).toContain(`'bank-accounts': {`);
    });
  });

  describe('renderChannelIndex', () => {
    const functions: Record<string, TypeScriptChannelRenderedFunctionType[]> = {
      http_client: [
        fn('addPet', {tags: ['pet'], pathSegments: ['pet'], method: 'post'})
      ]
    };

    it('flat emits the namespace re-export barrel unchanged', () => {
      const result = renderChannelIndex({
        generatedProtocols: ['http_client'],
        externalProtocolFunctionInformation: functions,
        organization: 'flat',
        importExtension: 'none'
      });
      expect(result).toBe(
        `import * as http_client from './http_client';\n\nexport {http_client};\n`
      );
    });

    it('tag emits a grouped const object literal per protocol', () => {
      const result = renderChannelIndex({
        generatedProtocols: ['http_client'],
        externalProtocolFunctionInformation: functions,
        organization: 'tag',
        importExtension: 'none'
      });
      expect(result).toContain(
        `import * as internal_http_client from './http_client';`
      );
      expect(result).toContain('export const http_client = {');
      expect(result).toContain('pet: {');
      expect(result).toContain('addPet: internal_http_client.addPet');
      expect(result).toContain('} as const;');
    });

    it('returns the empty-protocols placeholder when nothing is generated', () => {
      const result = renderChannelIndex({
        generatedProtocols: [],
        externalProtocolFunctionInformation: {},
        organization: 'tag',
        importExtension: 'none'
      });
      expect(result).toBe('// No protocols generated\n');
    });
  });
});
