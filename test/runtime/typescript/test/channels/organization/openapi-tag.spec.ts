import * as fs from 'fs';
import * as path from 'path';
import {http_client} from '../../../src/openapi-tag-organization/channels';
import * as rawHttpClient from '../../../src/openapi-tag-organization/channels/http_client';

const normalize = (source: string): string => source.replace(/\s+/g, '');

describe('channels organization: openapi tag', () => {
  it('groups http_client operations under their tag with verbatim leaf names', () => {
    expect(typeof http_client.pet).toBe('object');
    expect(typeof http_client.pet.addPet).toBe('function');
    expect(typeof http_client.pet.updatePet).toBe('function');
    expect(typeof http_client.pet.findPetsByStatusAndCategory).toBe('function');
  });

  it('leaves reference the same underlying flat functions', () => {
    expect(http_client.pet.addPet).toBe(rawHttpClient.addPet);
    expect(http_client.pet.updatePet).toBe(rawHttpClient.updatePet);
    expect(http_client.pet.findPetsByStatusAndCategory).toBe(
      rawHttpClient.findPetsByStatusAndCategory
    );
  });

  it('generated barrel matches the expected reference', () => {
    const generated = fs.readFileSync(
      path.join(__dirname, '../../../src/openapi-tag-organization/channels/index.ts'),
      'utf-8'
    );
    const expected = fs.readFileSync(
      path.join(__dirname, 'expected/openapi-tag.index.txt'),
      'utf-8'
    );
    expect(normalize(generated)).toBe(normalize(expected));
  });
});
