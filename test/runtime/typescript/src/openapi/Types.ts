export type Paths = '/pet' | '/pet/findByStatus/{status}/{categoryId}';
export type OperationIds = 'addPet' | 'updatePet' | 'findPetsByStatusAndCategory';
export function ToPath(operationId: OperationIds): Paths {
  switch (operationId) {
    case 'addPet':
    return '/pet';
  case 'updatePet':
    return '/pet';
  case 'findPetsByStatusAndCategory':
    return '/pet/findByStatus/{status}/{categoryId}';
    default:
      throw new Error('Unknown operation ID: ' + operationId);
  }
}
export function ToOperationIds(path: Paths): OperationIds[] {
  switch (path) {
    case '/pet':
    return ['addPet', 'updatePet'];
  case '/pet/findByStatus/{status}/{categoryId}':
    return ['findPetsByStatusAndCategory'];
    default:
      throw new Error('Unknown path: ' + path);
  }
}
