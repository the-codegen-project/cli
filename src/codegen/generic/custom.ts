import { AsyncAPIDocumentInterface } from '@asyncapi/parser';
import { GenericCodegenContext, GenericGeneratorOptions } from '../types';
export interface CustomGenerator extends GenericGeneratorOptions {
  preset: 'custom',
  renderFunction: (context: CustomContext) => any, 
  options: any
}
export interface CustomContext extends GenericCodegenContext {
  inputType: 'asyncapi',
	asyncapiDocument?: AsyncAPIDocumentInterface,
	generator: CustomGenerator
}

export const defaultCustomGenerator: CustomGenerator = {
  preset: 'custom',
  options: {},
  id: 'custom',
  renderFunction: () => {}
};
