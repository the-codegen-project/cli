import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {GenericCodegenContext, GenericGeneratorOptions} from '../../types';
import {z} from 'zod';

export interface CustomContext extends GenericCodegenContext {
  inputType: 'asyncapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  generator: CustomGenerator;
}

export interface CustomGenerator extends GenericGeneratorOptions {
  preset: 'custom';
  renderFunction: (context: CustomContext, options: any) => any;
  options?: any;
}

export const zodCustomGenerator = z.object({
  id: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  preset: z.literal('custom'),
  options: z.any().optional(),
  renderFunction: z
    .function()
    .args(
      z
        .object({
          inputType: z.enum(['asyncapi']),
          generator: z.any(),
          options: z.any()
        })
        .optional(),
      z.any().optional()
    )
    .returns(z.any())
});

export const defaultCustomGenerator: CustomGenerator = {
  preset: 'custom',
  id: 'custom',
  renderFunction: () => {}
};
