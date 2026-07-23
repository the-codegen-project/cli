/* eslint-disable sonarjs/no-duplicate-string */
import {loadOpenapiFromMemory} from '../../../../src/codegen/inputs/openapi';
import {filterOpenapiDocument} from '../../../../src/codegen/inputs/openapi/filter';

async function loadV3(): Promise<any> {
  return loadOpenapiFromMemory({
    specString: JSON.stringify(v3Spec)
  });
}

async function loadV2(): Promise<any> {
  return loadOpenapiFromMemory({
    specString: JSON.stringify(v2Spec)
  });
}

const filtered = async (
  load: () => Promise<any>,
  filter: {include?: string[]; exclude?: string[]}
): Promise<any> => {
  const document = await load();
  filterOpenapiDocument({
    document,
    filter: {include: [], exclude: [], ...filter}
  });
  return document;
};

const v3Spec = {
  openapi: '3.0.0',
  info: {title: 'v3', version: '1.0.0'},
  paths: {
    '/users': {
      get: {
        operationId: 'listUsers',
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {schema: {$ref: '#/components/schemas/User'}}
            }
          }
        }
      }
    },
    '/orders': {
      get: {
        operationId: 'listOrders',
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {schema: {$ref: '#/components/schemas/Order'}}
            }
          }
        }
      }
    },
    '/items': {
      // No operationId → derived id `getItems`.
      get: {
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {schema: {$ref: '#/components/schemas/Item'}}
            }
          }
        }
      }
    },
    '/pets': {
      summary: 'Pets resource',
      parameters: [
        {name: 'trace', in: 'query', schema: {type: 'string'}}
      ],
      get: {
        operationId: 'getPets',
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {schema: {$ref: '#/components/schemas/Pet'}}
            }
          }
        }
      },
      post: {
        operationId: 'addPet',
        responses: {201: {description: 'created'}}
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {type: 'string'},
          address: {$ref: '#/components/schemas/Address'}
        }
      },
      Address: {type: 'object', properties: {city: {type: 'string'}}},
      Order: {type: 'object', properties: {total: {type: 'number'}}},
      Item: {type: 'object', properties: {sku: {type: 'string'}}},
      Pet: {type: 'object', properties: {name: {type: 'string'}}},
      Unused: {type: 'object', properties: {x: {type: 'string'}}}
    }
  }
};

const v2Spec = {
  swagger: '2.0',
  info: {title: 'v2', version: '1.0.0'},
  paths: {
    '/users': {
      get: {
        operationId: 'listUsers',
        responses: {
          200: {
            description: 'ok',
            schema: {$ref: '#/definitions/User'}
          }
        }
      }
    },
    '/orders': {
      get: {
        operationId: 'listOrders',
        responses: {
          200: {
            description: 'ok',
            schema: {$ref: '#/definitions/Order'}
          }
        }
      }
    }
  },
  definitions: {
    User: {type: 'object', properties: {id: {type: 'string'}}},
    Order: {type: 'object', properties: {total: {type: 'number'}}}
  }
};

const pathKeys = (d: any): string[] => Object.keys(d.paths).sort();
const schemaKeys = (d: any): string[] =>
  Object.keys(d.components?.schemas ?? d.definitions ?? {}).sort();

describe('filterOpenapiDocument (v3)', () => {
  it('includes by path template', async () => {
    const d = await filtered(loadV3, {include: ['/users']});
    expect(pathKeys(d)).toEqual(['/users']);
  });

  it('excludes by path template', async () => {
    const d = await filtered(loadV3, {exclude: ['/orders']});
    expect(pathKeys(d)).not.toContain('/orders');
    expect(pathKeys(d)).toEqual(expect.arrayContaining(['/users', '/items']));
  });

  it('includes by operationId', async () => {
    const d = await filtered(loadV3, {include: ['listUsers']});
    expect(pathKeys(d)).toEqual(['/users']);
  });

  it('includes by derived operationId (no explicit operationId)', async () => {
    const d = await filtered(loadV3, {include: ['getItems']});
    expect(pathKeys(d)).toEqual(['/items']);
  });

  it('filters methods but preserves non-method path keys on retained paths', async () => {
    const d = await filtered(loadV3, {include: ['/pets'], exclude: ['addPet']});
    expect(pathKeys(d)).toEqual(['/pets']);
    expect(d.paths['/pets'].get).toBeDefined();
    expect(d.paths['/pets'].post).toBeUndefined();
    // Non-method keys survive.
    expect(d.paths['/pets'].summary).toBe('Pets resource');
    expect(d.paths['/pets'].parameters).toBeDefined();
  });

  it('removes a path with no retained methods and no direct path match', async () => {
    const d = await filtered(loadV3, {include: ['/users']});
    expect(pathKeys(d)).not.toContain('/pets');
  });

  it('prunes a component schema referenced only by a removed operation', async () => {
    const d = await filtered(loadV3, {include: ['/users']});
    // Order/Item/Pet referenced only by removed ops; Unused never referenced.
    expect(schemaKeys(d)).not.toContain('Order');
    expect(schemaKeys(d)).not.toContain('Item');
    expect(schemaKeys(d)).not.toContain('Unused');
  });

  it('keeps a component schema referenced by a retained operation (and its nested refs)', async () => {
    const d = await filtered(loadV3, {include: ['/users']});
    expect(schemaKeys(d)).toEqual(expect.arrayContaining(['User', 'Address']));
  });

  it('no-filter passthrough leaves paths and components untouched', async () => {
    const d = await filtered(loadV3, {include: [], exclude: []});
    expect(pathKeys(d)).toEqual(['/items', '/orders', '/pets', '/users']);
    expect(schemaKeys(d)).toEqual([
      'Address',
      'Item',
      'Order',
      'Pet',
      'Unused',
      'User'
    ]);
  });
});

describe('filterOpenapiDocument (v2)', () => {
  it('filters paths and prunes orphaned definitions', async () => {
    const d = await filtered(loadV2, {include: ['/users']});
    expect(pathKeys(d)).toEqual(['/users']);
    expect(schemaKeys(d)).toEqual(['User']);
  });

  it('no-filter passthrough leaves definitions untouched', async () => {
    const d = await filtered(loadV2, {include: [], exclude: []});
    expect(pathKeys(d)).toEqual(['/orders', '/users']);
    expect(schemaKeys(d)).toEqual(['Order', 'User']);
  });
});
