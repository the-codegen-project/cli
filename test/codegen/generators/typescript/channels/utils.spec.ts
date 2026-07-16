import {
  ConstrainedAnyModel,
  ConstrainedEnumModel,
  ConstrainedObjectModel,
  OutputModel
} from '@asyncapi/modelina';
import {
  addParametersToDependencies,
  addPayloadsToDependencies,
  parameterInstanceExpression,
  parameterUnionType,
  payloadInstanceExpression,
  payloadUnionType,
  renderParameterNormalization,
  renderPayloadNormalization
} from '../../../../../src/codegen/generators/typescript/channels/utils';
import {ChannelPayload} from '../../../../../src/codegen/types';

const objectPayload = (name: string): ChannelPayload => ({
  messageModel: new OutputModel(
    '',
    new ConstrainedObjectModel(name, undefined, {}, 'object', {}),
    name,
    {models: {}, originalInput: undefined} as any,
    []
  ),
  messageType: name
});

const enumPayload = (name: string): ChannelPayload => ({
  messageModel: new OutputModel(
    '',
    new ConstrainedEnumModel(name, undefined, {}, 'enum', []),
    name,
    {models: {}, originalInput: undefined} as any,
    []
  ),
  messageType: name
});

const primitivePayload = (name: string): ChannelPayload => ({
  messageModel: new OutputModel(
    '',
    new ConstrainedAnyModel(name, undefined, {}, 'any'),
    name,
    {models: {}, originalInput: undefined} as any,
    []
  ),
  messageType: name
});

describe('channels utils', () => {
  describe('addPayloadsToDependencies (companion interface)', () => {
    it('should import both the payload class and its companion interface for object payloads', () => {
      const dependencies: string[] = [];
      addPayloadsToDependencies(
        [objectPayload('UserSignedUp')],
        {outputPath: './payloads'},
        {outputPath: './channels'},
        dependencies
      );
      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]).toMatch(
        /^import \{UserSignedUp, UserSignedUpInterface\} from '.+';$/
      );
    });

    it('should NOT import a companion interface for enum payloads', () => {
      const dependencies: string[] = [];
      addPayloadsToDependencies(
        [enumPayload('StatusEnum')],
        {outputPath: './payloads'},
        {outputPath: './channels'},
        dependencies
      );
      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]).toMatch(/^import \{StatusEnum\} from '.+';$/);
      expect(dependencies[0]).not.toContain('Interface');
    });

    it('should import non-object payloads as a namespace module (unchanged)', () => {
      const dependencies: string[] = [];
      addPayloadsToDependencies(
        [primitivePayload('PrimitivePayload')],
        {outputPath: './payloads'},
        {outputPath: './channels'},
        dependencies
      );
      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]).toContain('import * as PrimitivePayloadModule');
      expect(dependencies[0]).not.toContain('Interface');
    });
  });

  describe('payloadUnionType', () => {
    it('should widen an object payload to an interface | class union', () => {
      expect(payloadUnionType({messageType: 'UserSignedUp'})).toEqual(
        'UserSignedUpInterface | UserSignedUp'
      );
    });

    it('should leave a non-object (module-qualified) payload type unchanged', () => {
      expect(
        payloadUnionType({
          messageType: 'StringMessage',
          messageModule: 'StringMessageModule'
        })
      ).toEqual('StringMessageModule.StringMessage');
    });
  });

  describe('payloadInstanceExpression', () => {
    it('should resolve an object payload source to a class instance inline', () => {
      expect(
        payloadInstanceExpression({messageType: 'UserSignedUp', source: 'message'})
      ).toEqual(
        '(message instanceof UserSignedUp ? message : new UserSignedUp(message))'
      );
    });

    it('should return a non-object payload source unchanged (no new)', () => {
      expect(
        payloadInstanceExpression({
          messageType: 'StringMessage',
          messageModule: 'StringMessageModule',
          source: 'message'
        })
      ).toEqual('message');
    });
  });

  describe('renderPayloadNormalization', () => {
    it('should normalize an object payload source to a class instance via instanceof guard', () => {
      expect(
        renderPayloadNormalization({
          messageType: 'UserSignedUp',
          source: 'context.payload',
          target: 'payload'
        })
      ).toEqual(
        'const payload = context.payload instanceof UserSignedUp ? context.payload : new UserSignedUp(context.payload);'
      );
    });

    it('should pass a non-object payload source through unchanged', () => {
      expect(
        renderPayloadNormalization({
          messageType: 'StringMessage',
          messageModule: 'StringMessageModule',
          source: 'context.payload',
          target: 'payload'
        })
      ).toEqual('const payload = context.payload;');
    });
  });

  describe('addParametersToDependencies', () => {
    it('should import both the parameter class and its companion interface', () => {
      const parameterModel = new OutputModel(
        '',
        new ConstrainedObjectModel('TestParameters', undefined, {}, 'Parameter', {}),
        'TestParameters',
        {models: {}, originalInput: undefined} as any,
        []
      );
      const dependencies: string[] = [];
      addParametersToDependencies(
        {channel: parameterModel},
        {outputPath: './parameters'},
        {outputPath: './channels'},
        dependencies
      );
      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]).toContain('TestParameters, TestParametersInterface');
      expect(dependencies[0]).toMatch(
        /^import \{TestParameters, TestParametersInterface\} from '.+';$/
      );
    });
  });

  describe('parameterUnionType', () => {
    it('should widen a parameter model name to an interface | class union', () => {
      expect(parameterUnionType('FindPetsByStatusAndCategoryParameters')).toEqual(
        'FindPetsByStatusAndCategoryParametersInterface | FindPetsByStatusAndCategoryParameters'
      );
    });
  });

  describe('parameterInstanceExpression', () => {
    it('should resolve a source value to a class instance inline', () => {
      expect(
        parameterInstanceExpression({
          modelName: 'UserSignedupParameters',
          source: 'parameters'
        })
      ).toEqual(
        '(parameters instanceof UserSignedupParameters ? parameters : new UserSignedupParameters(parameters))'
      );
    });
  });

  describe('renderParameterNormalization', () => {
    it('should normalize a source value to a class instance via instanceof guard', () => {
      expect(
        renderParameterNormalization({
          modelName: 'FindPetsByStatusAndCategoryParameters',
          source: 'context.parameters',
          target: 'parameters'
        })
      ).toEqual(
        'const parameters = context.parameters instanceof FindPetsByStatusAndCategoryParameters ? context.parameters : new FindPetsByStatusAndCategoryParameters(context.parameters);'
      );
    });
  });
});
