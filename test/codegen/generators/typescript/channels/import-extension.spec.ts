/**
 * Tests for import extension in channels generator.
 * Verifies that channels generator properly uses importExtension for payload/parameter/header imports.
 */
import {
  addPayloadsToDependencies,
  addParametersToDependencies,
  addHeadersToDependencies
} from '../../../../../src/codegen/generators/typescript/channels/utils';
import {
  ConstrainedObjectModel,
  ConstrainedEnumModel,
  ConstrainedStringModel,
  ConstrainedAnyModel,
  OutputModel
} from '@asyncapi/modelina';
import {ChannelPayload} from '../../../../../src/codegen/types';

describe('Channels Import Extension', () => {
  // Create test fixtures
  const createObjectPayload = (name: string): ChannelPayload => ({
    messageModel: new OutputModel(
      '',
      new ConstrainedObjectModel(name, undefined, {}, 'object', {}),
      name,
      {models: {}, originalInput: undefined},
      []
    ),
    messageType: name
  });

  const createEnumPayload = (name: string): ChannelPayload => ({
    messageModel: new OutputModel(
      '',
      new ConstrainedEnumModel(name, undefined, {}, 'enum', []),
      name,
      {models: {}, originalInput: undefined},
      []
    ),
    messageType: name
  });

  const createPrimitivePayload = (name: string): ChannelPayload => ({
    messageModel: new OutputModel(
      '',
      new ConstrainedAnyModel(name, undefined, {}, 'any'),
      name,
      {models: {}, originalInput: undefined},
      []
    ),
    messageType: name
  });

  const createParameterModel = (name: string): OutputModel => {
    return new OutputModel(
      '',
      new ConstrainedObjectModel(name, undefined, {}, 'object', {
        id: new ConstrainedStringModel('id', undefined, {}, 'string')
      }),
      name,
      {models: {}, originalInput: undefined},
      []
    );
  };

  const createHeaderModel = (name: string): OutputModel => {
    return new OutputModel(
      '',
      new ConstrainedObjectModel(name, undefined, {}, 'object', {
        contentType: new ConstrainedStringModel('contentType', undefined, {}, 'string')
      }),
      name,
      {models: {}, originalInput: undefined},
      []
    );
  };

  describe('addPayloadsToDependencies', () => {
    it('should generate imports without extension when importExtension is "none"', () => {
      const deps: string[] = [];
      const payloads = [createObjectPayload('UserPayload')];

      addPayloadsToDependencies(
        payloads,
        {outputPath: './payloads'},
        {outputPath: './channels'},
        deps,
        'none'
      );

      expect(deps).toHaveLength(1);
      // path.relative produces ./../payloads/... for these relative paths
      expect(deps[0]).toContain('payloads/UserPayload');
      expect(deps[0]).not.toContain('.ts');
      expect(deps[0]).not.toContain('.js');
    });

    it('should generate imports with .ts extension when importExtension is ".ts"', () => {
      const deps: string[] = [];
      const payloads = [createObjectPayload('UserPayload')];

      addPayloadsToDependencies(
        payloads,
        {outputPath: './payloads'},
        {outputPath: './channels'},
        deps,
        '.ts'
      );

      expect(deps).toHaveLength(1);
      expect(deps[0]).toContain('payloads/UserPayload.ts');
    });

    it('should generate imports with .js extension when importExtension is ".js"', () => {
      const deps: string[] = [];
      const payloads = [createObjectPayload('UserPayload')];

      addPayloadsToDependencies(
        payloads,
        {outputPath: './payloads'},
        {outputPath: './channels'},
        deps,
        '.js'
      );

      expect(deps).toHaveLength(1);
      expect(deps[0]).toContain('payloads/UserPayload.js');
    });

    it('should default to "none" when importExtension is not provided', () => {
      const deps: string[] = [];
      const payloads = [createObjectPayload('UserPayload')];

      // Call without the importExtension parameter (using default)
      addPayloadsToDependencies(
        payloads,
        {outputPath: './payloads'},
        {outputPath: './channels'},
        deps
      );

      expect(deps).toHaveLength(1);
      expect(deps[0]).toContain('payloads/UserPayload');
      expect(deps[0]).not.toContain('.ts');
      expect(deps[0]).not.toContain('.js');
    });

    it('should handle enum payloads with importExtension', () => {
      const deps: string[] = [];
      const payloads = [createEnumPayload('StatusEnum')];

      addPayloadsToDependencies(
        payloads,
        {outputPath: './payloads'},
        {outputPath: './channels'},
        deps,
        '.ts'
      );

      expect(deps).toHaveLength(1);
      expect(deps[0]).toContain('payloads/StatusEnum.ts');
    });

    it('should handle primitive payloads with module import and importExtension', () => {
      const deps: string[] = [];
      const payloads = [createPrimitivePayload('PrimitivePayload')];

      addPayloadsToDependencies(
        payloads,
        {outputPath: './payloads'},
        {outputPath: './channels'},
        deps,
        '.ts'
      );

      expect(deps).toHaveLength(1);
      expect(deps[0]).toContain('payloads/PrimitivePayload.ts');
      expect(deps[0]).toContain('import * as PrimitivePayloadModule');
    });
  });

  describe('addParametersToDependencies', () => {
    it('should generate imports without extension when importExtension is "none"', () => {
      const deps: string[] = [];
      const parameters = {
        TestChannel: createParameterModel('TestChannelParameters')
      };

      addParametersToDependencies(
        parameters,
        {outputPath: './parameters'},
        {outputPath: './channels'},
        deps,
        'none'
      );

      expect(deps).toHaveLength(1);
      expect(deps[0]).toContain('parameters/TestChannelParameters');
      expect(deps[0]).not.toContain('.ts');
      expect(deps[0]).not.toContain('.js');
    });

    it('should generate imports with .ts extension when importExtension is ".ts"', () => {
      const deps: string[] = [];
      const parameters = {
        TestChannel: createParameterModel('TestChannelParameters')
      };

      addParametersToDependencies(
        parameters,
        {outputPath: './parameters'},
        {outputPath: './channels'},
        deps,
        '.ts'
      );

      expect(deps).toHaveLength(1);
      expect(deps[0]).toContain('parameters/TestChannelParameters.ts');
    });

    it('should generate imports with .js extension when importExtension is ".js"', () => {
      const deps: string[] = [];
      const parameters = {
        TestChannel: createParameterModel('TestChannelParameters')
      };

      addParametersToDependencies(
        parameters,
        {outputPath: './parameters'},
        {outputPath: './channels'},
        deps,
        '.js'
      );

      expect(deps).toHaveLength(1);
      expect(deps[0]).toContain('parameters/TestChannelParameters.js');
    });

    it('should default to "none" when importExtension is not provided', () => {
      const deps: string[] = [];
      const parameters = {
        TestChannel: createParameterModel('TestChannelParameters')
      };

      addParametersToDependencies(
        parameters,
        {outputPath: './parameters'},
        {outputPath: './channels'},
        deps
      );

      expect(deps).toHaveLength(1);
      expect(deps[0]).toContain('parameters/TestChannelParameters');
      expect(deps[0]).not.toContain('.ts');
      expect(deps[0]).not.toContain('.js');
    });
  });

  describe('addHeadersToDependencies', () => {
    it('should generate imports without extension when importExtension is "none"', () => {
      const deps: string[] = [];
      const headers = {
        TestChannel: createHeaderModel('TestChannelHeaders')
      };

      addHeadersToDependencies(
        headers,
        {outputPath: './headers'},
        {outputPath: './channels'},
        deps,
        'none'
      );

      expect(deps).toHaveLength(1);
      expect(deps[0]).toContain('headers/TestChannelHeaders');
      expect(deps[0]).not.toContain('.ts');
      expect(deps[0]).not.toContain('.js');
    });

    it('should generate imports with .ts extension when importExtension is ".ts"', () => {
      const deps: string[] = [];
      const headers = {
        TestChannel: createHeaderModel('TestChannelHeaders')
      };

      addHeadersToDependencies(
        headers,
        {outputPath: './headers'},
        {outputPath: './channels'},
        deps,
        '.ts'
      );

      expect(deps).toHaveLength(1);
      expect(deps[0]).toContain('headers/TestChannelHeaders.ts');
    });

    it('should generate imports with .js extension when importExtension is ".js"', () => {
      const deps: string[] = [];
      const headers = {
        TestChannel: createHeaderModel('TestChannelHeaders')
      };

      addHeadersToDependencies(
        headers,
        {outputPath: './headers'},
        {outputPath: './channels'},
        deps,
        '.js'
      );

      expect(deps).toHaveLength(1);
      expect(deps[0]).toContain('headers/TestChannelHeaders.js');
    });

    it('should default to "none" when importExtension is not provided', () => {
      const deps: string[] = [];
      const headers = {
        TestChannel: createHeaderModel('TestChannelHeaders')
      };

      addHeadersToDependencies(
        headers,
        {outputPath: './headers'},
        {outputPath: './channels'},
        deps
      );

      expect(deps).toHaveLength(1);
      expect(deps[0]).toContain('headers/TestChannelHeaders');
      expect(deps[0]).not.toContain('.ts');
      expect(deps[0]).not.toContain('.js');
    });
  });
});
