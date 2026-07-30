/* eslint-disable sonarjs/no-duplicate-string */
import {Parser} from '@asyncapi/parser';
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {filterAsyncapiJson} from '../../../../src/codegen/inputs/asyncapi/filter';

const parser = new Parser({
  ruleset: {core: false, recommended: false}
});

async function parse(spec: unknown): Promise<AsyncAPIDocumentInterface> {
  const {document, diagnostics} = await parser.parse(
    typeof spec === 'string' ? spec : JSON.stringify(spec)
  );
  if (!document) {
    throw new Error(JSON.stringify(diagnostics));
  }
  return document;
}

async function applyFilter(
  spec: unknown,
  filter: {include?: string[]; exclude?: string[]}
): Promise<AsyncAPIDocumentInterface> {
  const document = await parse(spec);
  const filtered = filterAsyncapiJson({
    document,
    filter: {include: [], exclude: [], ...filter}
  });
  return parse(filtered);
}

const channelIds = (d: AsyncAPIDocumentInterface): string[] =>
  d
    .allChannels()
    .all()
    .map((c) => c.id())
    .sort();
const operationIds = (d: AsyncAPIDocumentInterface): string[] =>
  d
    .allOperations()
    .all()
    .map((o) => o.id() ?? '')
    .sort();
const schemaNames = (d: AsyncAPIDocumentInterface): string[] =>
  Object.keys((d.json().components as any)?.schemas ?? {}).sort();

const v3Spec = {
  asyncapi: '3.0.0',
  info: {title: 'v3', version: '1.0.0'},
  channels: {
    userChannel: {$ref: '#/components/channels/userChannel'},
    orderChannel: {$ref: '#/components/channels/orderChannel'}
  },
  operations: {
    sendUser: {$ref: '#/components/operations/sendUser'},
    receiveUser: {$ref: '#/components/operations/receiveUser'},
    sendOrder: {$ref: '#/components/operations/sendOrder'}
  },
  components: {
    channels: {
      userChannel: {
        address: 'user/signedup',
        messages: {UserMessage: {$ref: '#/components/messages/UserMessage'}}
      },
      orderChannel: {
        address: 'order/created',
        messages: {OrderMessage: {$ref: '#/components/messages/OrderMessage'}}
      }
    },
    operations: {
      sendUser: {action: 'send', channel: {$ref: '#/components/channels/userChannel'}},
      receiveUser: {
        action: 'receive',
        channel: {$ref: '#/components/channels/userChannel'}
      },
      sendOrder: {action: 'send', channel: {$ref: '#/components/channels/orderChannel'}}
    },
    messages: {
      UserMessage: {payload: {$ref: '#/components/schemas/User'}},
      OrderMessage: {payload: {$ref: '#/components/schemas/Order'}}
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {type: 'string'},
          address: {$ref: '#/components/schemas/Address'}
        }
      },
      Address: {type: 'object', properties: {city: {type: 'string'}}},
      Order: {type: 'object', properties: {total: {type: 'number'}}}
    }
  }
};

const v2Spec = {
  asyncapi: '2.6.0',
  info: {title: 'v2', version: '1.0.0'},
  channels: {
    'user/signedup': {
      publish: {
        operationId: 'sendUser',
        message: {payload: {$ref: '#/components/schemas/User'}}
      },
      subscribe: {
        operationId: 'receiveUser',
        message: {payload: {$ref: '#/components/schemas/Ack'}}
      }
    },
    'order/created': {
      publish: {
        operationId: 'sendOrder',
        message: {payload: {$ref: '#/components/schemas/Order'}}
      }
    }
  },
  components: {
    schemas: {
      User: {type: 'object', properties: {id: {type: 'string'}}},
      Ack: {type: 'object', properties: {ok: {type: 'boolean'}}},
      Order: {type: 'object', properties: {total: {type: 'number'}}}
    }
  }
};

describe('filterAsyncapiJson (v3)', () => {
  it('includes by channel id', async () => {
    const d = await applyFilter(v3Spec, {include: ['userChannel']});
    expect(channelIds(d)).toEqual(['userChannel']);
    expect(operationIds(d)).toEqual(['receiveUser', 'sendUser']);
  });

  it('includes by channel address', async () => {
    const d = await applyFilter(v3Spec, {include: ['user/signedup']});
    expect(channelIds(d)).toEqual(['userChannel']);
  });

  it('includes by operation id', async () => {
    const d = await applyFilter(v3Spec, {include: ['sendUser']});
    // The operation match retains its parent channel...
    expect(channelIds(d)).toEqual(['userChannel']);
    // ...but only the matched operation, not its siblings.
    expect(operationIds(d)).toEqual(['sendUser']);
  });

  it('exclude removes an operation while the channel and siblings survive', async () => {
    const d = await applyFilter(v3Spec, {
      include: ['userChannel'],
      exclude: ['receiveUser']
    });
    expect(channelIds(d)).toEqual(['userChannel']);
    expect(operationIds(d)).toEqual(['sendUser']);
  });

  it('drops a channel with no retained operations and no direct match', async () => {
    const d = await applyFilter(v3Spec, {include: ['userChannel']});
    expect(channelIds(d)).not.toContain('orderChannel');
    expect(operationIds(d)).not.toContain('sendOrder');
  });

  it('prunes component schemas referenced only by a dropped channel', async () => {
    const d = await applyFilter(v3Spec, {include: ['userChannel']});
    // Order was referenced only by orderChannel (dropped).
    expect(schemaNames(d)).not.toContain('Order');
    // User is kept, and Address is reachable via User (nested).
    expect(schemaNames(d)).toEqual(expect.arrayContaining(['User', 'Address']));
  });

  it('no-filter passthrough keeps every channel and operation', async () => {
    const d = await applyFilter(v3Spec, {include: [], exclude: []});
    expect(channelIds(d)).toEqual(['orderChannel', 'userChannel']);
    expect(operationIds(d)).toEqual(['receiveUser', 'sendOrder', 'sendUser']);
  });
});

describe('filterAsyncapiJson (v2)', () => {
  it('includes by channel address', async () => {
    const d = await applyFilter(v2Spec, {include: ['user/signedup']});
    expect(channelIds(d)).toEqual(['user/signedup']);
    expect(operationIds(d).sort()).toEqual(['receiveUser', 'sendUser']);
  });

  it('excludes a single operation (publish/subscribe) while its channel survives', async () => {
    const d = await applyFilter(v2Spec, {
      include: ['user/signedup'],
      exclude: ['receiveUser']
    });
    expect(channelIds(d)).toEqual(['user/signedup']);
    expect(operationIds(d)).toEqual(['sendUser']);
  });

  it('prunes component schemas orphaned by dropped channels/operations', async () => {
    const d = await applyFilter(v2Spec, {
      include: ['user/signedup'],
      exclude: ['receiveUser']
    });
    // Ack was only on the excluded receiveUser; Order only on dropped order channel.
    expect(schemaNames(d)).toEqual(['User']);
  });

  it('no-filter passthrough keeps everything', async () => {
    const d = await applyFilter(v2Spec, {include: [], exclude: []});
    expect(channelIds(d)).toEqual(['order/created', 'user/signedup']);
    expect(operationIds(d).sort()).toEqual([
      'receiveUser',
      'sendOrder',
      'sendUser'
    ]);
  });
});
