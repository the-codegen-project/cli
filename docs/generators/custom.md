---
sidebar_position: 99
---

# `custom` preset

This generator is simple, it's a callback that enable you to write any file or do any operation in the code generation process. This preset is available for all languages.

## Imports

The dependencies you have access to is any native `node` dependency and all dependencies listed in [The Codegen Project](https://github.com/the-codegen-project/cli/blob/8b8fa6f0c5b0c0c63515a8ca439f72872815f491/package.json#L9). Here is an example:

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

# Dependencies

In each generator (don't manually use it unless you use [`preset: custom`](./custom.md)), you can add `dependencies` property, which takes an array of `id`'s that the rendering engine ensures are rendered before the dependant one. 

Each generator has a specific output (except [`custom`](./custom.md) which is dynamic and under your control), they are documented under each [./generators](./). These outputs can be accessed under `dependencyOutputs`.

There are two rules though;

1. You are not allowed to have circular dependencies, i.e. two generators both depending on each other.
2. You are not allowed to have self-dependant generators

## How does it work?

For example, take two generators, you can chain them together and use one's output in the other, as for example below, to have the console print out `Hello World!`.
```js
export default {
	...
	generators: [
		{
			preset: 'custom',
			renderFunction: ({dependencyOutputs}) => {
				console.log(dependencyOutputs['bar'])
			},
			dependencies: ['bar']
		},
		{
			preset: 'custom',
			id: 'bar',
			renderFunction: () => {
				return 'Hello World!'
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
- `dependencyOutputs` - if you have defined any `dependencies`, this is where you can access the output. Checkout the [dependency documentation](#dependencies) for more information.