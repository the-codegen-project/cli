import * as fs from 'fs';
import * as path from 'path';
import {http_client} from '../../../src/openapi-path-organization/channels';
import * as rawHttpClient from '../../../src/openapi-path-organization/channels/http_client';

const normalize = (source: string): string => source.replace(/\s+/g, '');

describe('channels organization: openapi path', () => {
  it('nests http_client operations by path segment with the HTTP method as the leaf', () => {
    expect(typeof http_client.pet).toBe('object');
    expect(typeof http_client.pet.post).toBe('function');
    expect(typeof http_client.pet.put).toBe('function');
    expect(typeof http_client.pet.findByStatus).toBe('object');
    expect(typeof http_client.pet.findByStatus.get).toBe('function');
  });

  it('leaves reference the same underlying flat functions', () => {
    expect(http_client.pet.post).toBe(rawHttpClient.addPet);
    expect(http_client.pet.put).toBe(rawHttpClient.updatePet);
    expect(http_client.pet.findByStatus.get).toBe(
      rawHttpClient.findPetsByStatusAndCategory
    );
  });

  it('generated barrel matches the expected reference', () => {
    const generated = fs.readFileSync(
      path.join(__dirname, '../../../src/openapi-path-organization/channels/index.ts'),
      'utf-8'
    );
    const expected = fs.readFileSync(
      path.join(__dirname, 'expected/openapi-path.index.txt'),
      'utf-8'
    );
    expect(normalize(generated)).toBe(normalize(expected));
  });
});
