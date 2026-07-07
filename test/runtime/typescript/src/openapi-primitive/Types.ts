export type Paths = '/echo' | '/count';
export type OperationIds = 'getEcho' | 'getCount';
export function ToPath(operationId: OperationIds): Paths {
  switch (operationId) {
    case 'getEcho':
    return '/echo';
  case 'getCount':
    return '/count';
    default:
      throw new Error('Unknown operation ID: ' + operationId);
  }
}
export function ToOperationIds(path: Paths): OperationIds[] {
  switch (path) {
    case '/echo':
    return ['getEcho'];
  case '/count':
    return ['getCount'];
    default:
      throw new Error('Unknown path: ' + path);
  }
}
export const PathsMap: Record<OperationIds, Paths> = {
  'getEcho': '/echo',
  'getCount': '/count'
};
