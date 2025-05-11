/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable jest/no-conditional-expect */
import { 
  mergePartialAndDefault, 
  findDuplicatesInArray, 
  getOSType, 
  ensureRelativePath, 
  ensureUniqueValuesInArray,
  findExtensionObject,
  findNameFromChannel,
  findOperationId,
  findNameFromOperation,
  firstLowercase,
  findReplyId
} from '../../src/codegen/utils';
import { platform } from 'process';
import { ChannelInterface, OperationInterface, OperationReplyInterface } from '@asyncapi/parser';

describe('utils', () => {
  describe('mergePartialAndDefault', () => {
    it('should merge objects correctly', () => {
      const defaultObj = { a: 1, b: { c: 2 } };
      const customObj = { b: { c: 3 } };
      const result = mergePartialAndDefault(defaultObj, customObj);
      expect(result).toEqual({ a: 1, b: { c: 3 } });
    });

    it('should return default object if custom object is undefined', () => {
      const defaultObj = { a: 1, b: { c: 2 } };
      const result = mergePartialAndDefault(defaultObj);
      expect(result).toEqual(defaultObj);
    });
  });

  describe('findDuplicatesInArray', () => {
    it('should find duplicates correctly', () => {
      const array = [{ id: 1 }, { id: 2 }, { id: 1 }];
      const result = findDuplicatesInArray(array, 'id');
      expect(result).toEqual([1]);
    });

    it('should return an empty array if no duplicates are found', () => {
      const array = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = findDuplicatesInArray(array, 'id');
      expect(result).toEqual([]);
    });
  });

  describe('getOSType', () => {
    it('should return correct OS type', () => {
      const osType = getOSType();
      if (platform === 'win32') {
        expect(osType).toEqual('windows');
      } else if (platform === 'darwin') {
        expect(osType).toEqual('macos');
      } else {
        expect(osType).toEqual('unix');
      }
    });
  });

  describe('ensureRelativePath', () => {
    it('should convert backslashes to forward slashes on Windows', () => {
      const path = 'some\\path\\to\\file';
      const result = ensureRelativePath(path);
      if (getOSType() === 'windows') {
        expect(result).toEqual('some/path/to/file');
      } else {
        expect(result).toEqual(path);
      }
    });

    it('should return the same path on non-Windows OS', () => {
      const path = 'some/path/to/file';
      const result = ensureRelativePath(path);
      expect(result).toEqual(path);
    });
  });

  describe('ensureUniqueValuesInArray', () => {
    it('should remove duplicates from array', () => {
      const array = [1, 2, 2, 3, 3, 3];
      const result = ensureUniqueValuesInArray(array);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return the same array if no duplicates are found', () => {
      const array = [1, 2, 3];
      const result = ensureUniqueValuesInArray(array);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('findExtensionObject', () => {
    it('should return the extension object if it exists', () => {
      const parsedObj = {
        extensions: () => new Map([['x-the-codegen-project', { value: () => 'extensionValue' }]])
      };
      const result = findExtensionObject(parsedObj);
      expect(result).toEqual('extensionValue');
    });

    it('should return undefined if the extension object does not exist', () => {
      const parsedObj = {
        extensions: () => new Map()
      };
      const result = findExtensionObject(parsedObj);
      expect(result).toBeUndefined();
    });
  });

  describe('findNameFromChannel', () => {
    it('should return the user-specific name if it exists', () => {
      const channel = {
        id: () => 'channelId',
        extensions: () => new Map([['x-the-codegen-project', { value: () => ({ channelName: 'CustomChannelName' }) }]])
      } as unknown as ChannelInterface;
      const result = findNameFromChannel(channel);
      expect(result).toEqual('CustomChannelName');
    });

    it('should return the pascal-cased channel ID if no user-specific name exists', () => {
      const channel = {
        id: () => 'channel-id',
        extensions: () => undefined
      } as unknown as ChannelInterface;
      const result = findNameFromChannel(channel);
      expect(result).toEqual('ChannelId');
    });
  });

  describe('findOperationId', () => {
    it('should return the user-specific name if it exists', () => {
      const operation = {
        id: () => 'operationId',
        hasOperationId: () => true,
        operationId: () => 'CustomOperationId',
        extensions: () => new Map([['x-the-codegen-project', { value: () => ({ channelName: 'CustomOperationName' }) }]])
      } as unknown as OperationInterface;
      const channel = {} as ChannelInterface;
      const result = findOperationId(operation, channel);
      expect(result).toEqual('CustomOperationName');
    });

    it('should return the operation ID if no user-specific name exists', () => {
      const operation = {
        id: () => 'operation-id',
        hasOperationId: () => true,
        operationId: () => 'operation-id',
        extensions: () => undefined
      } as unknown as OperationInterface;
      const channel = {} as ChannelInterface;
      const result = findOperationId(operation, channel);
      expect(result).toEqual('operation-id');
    });
  });

  describe('findNameFromOperation', () => {
    it('should return the pascal-cased operation ID', () => {
      const operation = {
        id: () => 'operation-id',
        hasOperationId: () => true,
        operationId: () => 'operation-id',
        extensions: () => undefined
      } as unknown as OperationInterface;
      const channel = {} as ChannelInterface;
      const result = findNameFromOperation(operation, channel);
      expect(result).toEqual('OperationId');
    });
  });

  describe('firstLowercase', () => {
    it('should convert the first character to lowercase', () => {
      const name = 'TestName';
      const result = firstLowercase(name);
      expect(result).toEqual('testName');
    });
  });

  describe('findReplyId', () => {
    it('should return the correct reply ID', () => {
      const operation = {
        id: () => 'operation-id',
        hasOperationId: () => true,
        operationId: () => 'operation-id',
        extensions: () => undefined
      } as unknown as OperationInterface;
      const reply = {
        channel: () => null
      } as unknown as OperationReplyInterface;
      const channel = {
        id: () => 'channel-id'
      } as unknown as ChannelInterface;
      const result = findReplyId(operation, reply, channel);
      expect(result).toEqual('operation-id_reply');
    });
  });

  // Add more tests for other functions as needed
});
