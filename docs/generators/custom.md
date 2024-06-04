# `custom` preset

This generator is simple, it's a callback that enable you to write any file or do any operation in the code generation process. This preset is available for all languages.

## Dependencies

The dependencies you have access to is any native `node` dependency and all dependencies listed in [the codegen project](https://github.com/the-codegen-project/cli/blob/8b8fa6f0c5b0c0c63515a8ca439f72872815f491/package.json#L9). Here is an example:

```ts
import { JavaFileGenerator } from "@asyncapi/modelina";
export default {
    ...
	generators: [
		{
			preset: 'custom',
            ...
			renderFunction: ({generator, inputType, asyncapiDocument, dependencyOutputs}) => {
				const modelinaGenerator = new JavaFileGenerator({});
				modelinaGenerator.generateCompleteModels(...)
			}
		}
	]
};
```

## Arguments
In the `renderFunction` you have access to a bunch of arguments to help you create the callback;

- `generator` - is the generator configuration, where you have access to the `options` and all other information.
- `inputType` - is the root `inputType` for the input document
- `asyncapiDocument` - is the parsed AsyncAPI document input (according to the [AsyncAPI parser](https://github.com/asyncapi/parser-js/)), undefined if the `inputType` is not `asyncapi`
- `dependencyOutputs` - if you have defined any `dependencies`, this is where you can access the output. Checkout the [dependency documentation](../dependencies.md) for more information.