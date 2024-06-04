# Dependencies

In each generator (don't manually use it unless you use [`preset: custom`](./generators/custom.md)), you can add `dependencies` property, which takes an array of `id`'s that the rendering engine ensures are rendered before the dependant one. 

Each generator has a specific output (except [`custom`](./generators/custom.md) which is dynamic and under your control), they are documented under each [./generators](./generators/). These outputs can be accessed under `dependencyOutputs`.

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

