import {
  chooseComponentModelNames,
  deriveOperationId,
  reflectComponentSchemaNames
} from '../../../../src/codegen/inputs/openapi/utils';
import {OpenAPIV3} from 'openapi-types';

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

describe('OpenAPI component schema naming', () => {
  describe('chooseComponentModelNames', () => {
    it('shortens namespaced names to their last segment when unambiguous', () => {
      const chosen = chooseComponentModelNames([
        'GetTransactions.Model.TransactionModel',
        'GetUsers.Model.UserModel'
      ]);
      expect(chosen.get('GetTransactions.Model.TransactionModel')).toEqual(
        'TransactionModel'
      );
      expect(chosen.get('GetUsers.Model.UserModel')).toEqual('UserModel');
    });

    it('keeps the full name when the last segment is shared', () => {
      const chosen = chooseComponentModelNames([
        'GetTransactions.Model',
        'GetUsers.Model'
      ]);
      expect(chosen.get('GetTransactions.Model')).toEqual(
        'GetTransactions.Model'
      );
      expect(chosen.get('GetUsers.Model')).toEqual('GetUsers.Model');
    });

    it('keeps the full name when the short name equals another full name', () => {
      const chosen = chooseComponentModelNames([
        'Transaction',
        'Legacy.Transaction'
      ]);
      expect(chosen.get('Transaction')).toEqual('Transaction');
      expect(chosen.get('Legacy.Transaction')).toEqual('Legacy.Transaction');
    });
  });

  describe('reflectComponentSchemaNames', () => {
    it('tags component schemas without overriding existing name hints', () => {
      const preTagged = {
        type: 'object',
        'x-modelgen-inferred-name': 'AlreadyNamed'
      };
      const document = {
        openapi: '3.0.0',
        info: {title: 'Test', version: '1.0.0'},
        paths: {},
        components: {
          schemas: {
            'GetTransactions.Model.TransactionModel': {type: 'object'},
            Existing: preTagged
          }
        }
      } as unknown as OpenAPIV3.Document;

      reflectComponentSchemaNames(document);

      const schemas = document.components?.schemas as Record<string, any>;
      expect(
        schemas['GetTransactions.Model.TransactionModel'][
          'x-modelgen-inferred-name'
        ]
      ).toEqual('TransactionModel');
      expect(schemas['Existing']['x-modelgen-inferred-name']).toEqual(
        'AlreadyNamed'
      );
    });
  });
});
