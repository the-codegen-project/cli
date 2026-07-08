import * as internal_http_client from './http_client';

export const http_client = {
  pet: {
    addPet: internal_http_client.addPet,
    updatePet: internal_http_client.updatePet,
    findPetsByStatusAndCategory: internal_http_client.findPetsByStatusAndCategory
  }
} as const;
