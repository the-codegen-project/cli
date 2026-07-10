import * as internal_http_client from './http_client';

export const http_client = {
  pet: {
    post: internal_http_client.addPet,
    put: internal_http_client.updatePet,
    findByStatus: {
      get: internal_http_client.findPetsByStatusAndCategory
    }
  }
} as const;
