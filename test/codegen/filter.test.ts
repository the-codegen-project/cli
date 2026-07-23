import {matchesFilter} from '../../src/codegen/filter';

describe('matchesFilter', () => {
  describe('no-filter passthrough', () => {
    it('returns true when include and exclude are both empty', () => {
      expect(
        matchesFilter({
          candidates: ['user/created'],
          include: [],
          exclude: []
        })
      ).toBe(true);
    });

    it('returns true for empty candidates when no filter is set', () => {
      expect(matchesFilter({candidates: [], include: [], exclude: []})).toBe(
        true
      );
    });
  });

  describe('include only', () => {
    it('matches when a candidate matches an include glob', () => {
      expect(
        matchesFilter({
          candidates: ['user/created'],
          include: ['user/**'],
          exclude: []
        })
      ).toBe(true);
    });

    it('does not match when no candidate matches any include glob', () => {
      expect(
        matchesFilter({
          candidates: ['orders/created'],
          include: ['user/**'],
          exclude: []
        })
      ).toBe(false);
    });

    it('matches an exact string include', () => {
      expect(
        matchesFilter({
          candidates: ['orders/created'],
          include: ['orders/created'],
          exclude: []
        })
      ).toBe(true);
    });
  });

  describe('exclude only', () => {
    it('returns false when a candidate matches an exclude glob', () => {
      expect(
        matchesFilter({
          candidates: ['user/internal'],
          include: [],
          exclude: ['**/internal']
        })
      ).toBe(false);
    });

    it('returns true when no candidate matches any exclude glob', () => {
      expect(
        matchesFilter({
          candidates: ['user/created'],
          include: [],
          exclude: ['**/internal']
        })
      ).toBe(true);
    });
  });

  describe('include + exclude (exclude wins)', () => {
    it('returns false when a candidate matches both include and exclude', () => {
      expect(
        matchesFilter({
          candidates: ['user/internal'],
          include: ['user/**'],
          exclude: ['**/internal']
        })
      ).toBe(false);
    });

    it('returns true when a candidate matches include and none matches exclude', () => {
      expect(
        matchesFilter({
          candidates: ['user/created'],
          include: ['user/**'],
          exclude: ['**/internal']
        })
      ).toBe(true);
    });
  });

  describe('multiple candidates (match against any)', () => {
    it('matches when any one of several candidates matches include', () => {
      expect(
        matchesFilter({
          candidates: ['createUser', 'user/created', 'user'],
          include: ['user'],
          exclude: []
        })
      ).toBe(true);
    });

    it('excludes when any one of several candidates matches exclude', () => {
      expect(
        matchesFilter({
          candidates: ['createUser', 'user/created', 'user'],
          include: [],
          exclude: ['createUser']
        })
      ).toBe(false);
    });
  });

  describe('glob forms', () => {
    it('supports single-level wildcards with **', () => {
      expect(
        matchesFilter({
          candidates: ['orders/created/internal'],
          include: ['orders/**'],
          exclude: []
        })
      ).toBe(true);
    });

    it('matches literal braces in path templates', () => {
      expect(
        matchesFilter({
          candidates: ['/users/{id}'],
          include: ['/users/{id}'],
          exclude: []
        })
      ).toBe(true);
    });

    it('matches path templates with wildcards', () => {
      expect(
        matchesFilter({
          candidates: ['/users/{id}/audit'],
          include: ['/users/**'],
          exclude: ['/users/{id}/audit']
        })
      ).toBe(false);
    });
  });
});
