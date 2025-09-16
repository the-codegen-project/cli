---
sidebar_position: 99
---

# 🏗️ Models

```js
export default {
  ...,
  generators: [
    {
      preset: 'models',
      outputPath: './src/models',
      language: 'typescript',
      renderers: [...],
      options: {...}
    }
  ]
};
```

The `models` preset provides native integration with [AsyncAPI Modelina](https://modelina.org) for generating TypeScript models directly from AsyncAPI and OpenAPI documents. This generator exposes Modelina's full capabilities, giving you complete control over model generation.

This is supported through the following inputs: `asyncapi`, `openapi`

It supports the following languages; [`typescript`](#typescript)

## Core Features

- **Native Modelina Integration**: Direct access to Modelina's TypeScript generator
- **Custom Presets**: Full control over generated code through Modelina's preset system
- **Flexible Options**: Configure all TypeScript generation options
- **Production Ready**: Generate models that are immediately usable in your applications

## Configuration

### `renderers`

The `renderers` property exposes Modelina's [preset system](https://raw.githubusercontent.com/asyncapi/modelina/refs/heads/master/docs/presets.md), allowing you to customize every aspect of the generated models.

Presets can:
- Add custom content to classes, interfaces, enums, and types
- Override default rendering behavior
- Inject validation logic, serialization methods, or custom properties
- Apply consistent formatting and documentation

### `options`

The `options` property provides access to all [Modelina TypeScript options](https://github.com/asyncapi/modelina/blob/master/docs/languages/TypeScript.md), including:

- Model types (class, interface, type alias)
- Enum generation styles
- Property naming conventions
- Module system preferences
- Type mappings and constraints

## Examples

### Basic Usage

```js
export default {
  inputType: 'asyncapi',
  inputPath: 'asyncapi.json',
  language: 'typescript',
  generators: [
    {
      preset: 'models',
      outputPath: './src/models'
    }
  ]
};
```

### Using Built-in Presets

```js
import { modelina } from '@the-codegen-project/cli';
const { TS_COMMON_PRESET } = modelina;

export default {
  inputType: 'asyncapi',
  inputPath: 'asyncapi.json',
  language: 'typescript',
  generators: [
    {
      preset: 'models',
      renderers: [
        {
          preset: TS_COMMON_PRESET,
          options: {
            marshalling: true
          }
        }
      ],
      outputPath: './src/models'
    }
  ]
};
```

### Custom Presets

```js
export default {
  inputType: 'asyncapi',
  inputPath: 'asyncapi.json',
  language: 'typescript',
  generators: [
    {
      preset: 'models',
      renderers: [
        {
          class: {
            self: ({model}) => `class ${model.name} {}`
          },
          interface: {
            self: ({model}) => `interface ${model.name} {}`
          },
          type: {
            self: ({model}) => `type ${model.name} = string;`
          }
        }
      ],
      outputPath: './src/models'
    }
  ]
};
```

### Advanced Configuration with Options

```js
export default {
  inputType: 'asyncapi',
  inputPath: 'asyncapi.json',
  language: 'typescript',
  generators: [
    {
      preset: 'models',
      options: {
        modelType: 'interface',
        enumType: 'union',
        mapType: 'indexedObject',
        moduleSystem: 'ESM',
        rawPropertyNames: false,
        useJavascriptReservedKeywords: false
      },
      renderers: [
        {
          interface: {
            property: ({ content, property }) => {
              return `/** ${property.property.description || 'Auto-generated property'} */\n${content}`;
            }
          }
        }
      ],
      outputPath: './src/models'
    }
  ]
};
```

## Languages

### TypeScript

The TypeScript implementation provides full access to Modelina's TypeScript generator capabilities.

**Dependencies**: None (generates plain TypeScript)

**Supported Features**:
- Classes, interfaces, type aliases, and enums
- Complex nested types and circular references
- Union types and discriminated unions
- Optional and required properties
- Custom property naming and constraints
- Marshalling and unmarshalling methods (with TS_COMMON_PRESET)
- JSON Schema validation (with custom presets)

**Common Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `modelType` | `'class' \| 'interface'` | `'class'` | Type of models to generate |
| `enumType` | `'enum' \| 'union'` | `'enum'` | How to render enum types |
| `mapType` | `'indexedObject' \| 'record'` | `'record'` | How to render map/dictionary types |
| `moduleSystem` | `'CJS' \| 'ESM'` | `'ESM'` | Module system to use |
| `rawPropertyNames` | `boolean` | `false` | Use raw property names without transformation |
| `useJavascriptReservedKeywords` | `boolean` | `true` | Allow JavaScript reserved keywords |

**Common Presets**:

| Preset | Description |
|--------|-------------|
| `TS_COMMON_PRESET` | Adds marshalling/unmarshalling methods |
| `TS_DESCRIPTION_PRESET` | Adds JSDoc descriptions from schemas |
| Custom presets | Define your own rendering behavior |

**Generated Code Structure**:

```typescript
// Example generated class with TS_COMMON_PRESET
export class UserProfile {
  private _id?: string;
  private _email?: string;
  private _name?: string;

  constructor(input: {
    id?: string;
    email?: string;
    name?: string;
  }) {
    this._id = input.id;
    this._email = input.email;
    this._name = input.name;
  }

  get id(): string | undefined { return this._id; }
  set id(id: string | undefined) { this._id = id; }

  get email(): string | undefined { return this._email; }
  set email(email: string | undefined) { this._email = email; }

  get name(): string | undefined { return this._name; }
  set name(name: string | undefined) { this._name = name; }

  public marshal(): string {
    return JSON.stringify({
      id: this.id,
      email: this.email,
      name: this.name
    });
  }

  public static unmarshal(data: string): UserProfile {
    const obj = JSON.parse(data);
    return new UserProfile(obj);
  }
}
```

## Integration Examples

### With Channels Generator

```js
export default {
  inputType: 'asyncapi',
  inputPath: 'asyncapi.json',
  language: 'typescript',
  generators: [
    {
      preset: 'models',
      renderers: [
        {
          preset: TS_COMMON_PRESET,
          options: { marshalling: true }
        }
      ],
      outputPath: './src/models'
    },
    {
      preset: 'channels',
      outputPath: './src/channels',
      protocols: ['nats', 'kafka']
    }
  ]
};
```

### With Custom Validation

```js
export default {
  inputType: 'asyncapi',
  inputPath: 'asyncapi.json',
  language: 'typescript',
  generators: [
    {
      preset: 'models',
      renderers: [
        {
          class: {
            additionalContent: ({ content, model }) => {
              return `${content}
  
  public validate(): boolean {
    // Custom validation logic
    return true;
  }`;
            }
          }
        }
      ],
      outputPath: './src/models'
    }
  ]
};
```

## Resources

- [Modelina Presets Documentation](https://github.com/asyncapi/modelina/blob/master/refs/heads/master/docs/presets.md)
- [Modelina TypeScript Options](https://github.com/asyncapi/modelina/blob/master/docs/languages/TypeScript.md)
- [Modelina Examples](https://github.com/asyncapi/modelina/tree/master/examples)
