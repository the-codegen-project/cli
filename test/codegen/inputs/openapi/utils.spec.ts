import {deriveOperationId} from '../../../../src/codegen/inputs/openapi/utils';

describe('OpenAPI operation id derivation', () => {
  describe('deriveOperationId', () => {
    it('uses a spec-provided operationId verbatim', () => {
      expect(
        deriveOperationId({
          operationId: 'findPetsByStatus',
          method: 'get',
          path: '/pet/findByStatus'
        })
      ).toEqual('findPetsByStatus');
    });

    it('synthesizes a clean camelCase name from method and path', () => {
      expect(
        deriveOperationId({
          method: 'get',
          path: '/v2/connect/{referenceId}'
        })
      ).toEqual('getV2ConnectReferenceId');
    });

    it('preserves word boundaries across kebab-case path segments', () => {
      expect(
        deriveOperationId({
          method: 'post',
          path: '/v2/users/{safepayAccountId}/bank-accounts/add'
        })
      ).toEqual('postV2UsersSafepayAccountIdBankAccountsAdd');
    });

    it('does not double the HTTP verb when synthesizing', () => {
      const id = deriveOperationId({method: 'get', path: '/v2/users'});
      expect(id).toEqual('getV2Users');
      expect(id).not.toMatch(/getGet/i);
    });
  });
});
