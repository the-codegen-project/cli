---
sidebar_position: 3
---

# JSON Schema

JSON Schema input support enables you to generate TypeScript models directly from JSON Schema documents. This is particularly useful when you have standalone JSON Schema files that define your data structures.

## Supported Generators

The JSON Schema input type supports the following generators:

| Generator | Support |
|-----------|---------|
| [`models`](../generators/models.md) | ✅ Full Support |
| [`custom`](../generators/custom.md) | ✅ Full Support |

## Features

- **Direct JSON Schema Support**: Use JSON Schema files directly as input without wrapping them in AsyncAPI or OpenAPI documents
- **Full Modelina Integration**: Leverages AsyncAPI Modelina for comprehensive TypeScript model generation
- **Multiple Formats**: Supports both JSON (`.json`) and YAML (`.yaml`, `.yml`) file formats
- **Schema Validation**: Built-in validation for JSON Schema documents
- **Rich Model Generation**: Generate classes, interfaces, types, and enums from your schemas

## Configuration

### Basic Configuration

```js
export default {
  inputType: 'jsonschema',
  inputPath: './user-schema.json',
  language: 'typescript',
  generators: [
    {
      preset: 'models',
      outputPath: './src/models'
    }
  ]
};
```

### Advanced Configuration with Modelina Options

```js
export default {
  inputType: 'jsonschema',
  inputPath: './complex-schema.json',
  language: 'typescript',
  generators: [
    {
      preset: 'models',
      outputPath: './src/models',
      options: {
        modelType: 'class',
        enumType: 'enum',
        mapType: 'record',
        rawPropertyNames: false,
        useJavascriptReservedKeywords: false
      },
      renderers: [
        {
          class: {
            property: ({ content, property }) => {
              return `/** ${property.property.description || 'Auto-generated property'} */\n${content}`;
            }
          }
        }
      ]
    }
  ]
};
```

## Examples

### Simple User Schema

**Input: `user-schema.json`**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "integer",
      "minimum": 0
    }
  },
  "required": ["id", "name", "email"]
}
```

**Configuration: `codegen.mjs`**
```js
export default {
  inputType: 'jsonschema',
  inputPath: './user-schema.json',
  language: 'typescript',
  generators: [
    {
      preset: 'models',
      outputPath: './src/models'
    }
  ]
};
```

**Generated Output: `src/models/User.ts`**
```typescript
export class User {
  private _id: string;
  private _name: string;
  private _email: string;
  private _age?: number;

  constructor(input: {
    id: string,
    name: string,
    email: string,
    age?: number,
  }) {
    this._id = input.id;
    this._name = input.name;
    this._email = input.email;
    this._age = input.age;
  }

  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get email(): string { return this._email; }
  get age(): number | undefined { return this._age; }

  public marshal(): string {
    return JSON.stringify({
      id: this.id,
      name: this.name,
      email: this.email,
      age: this.age,
    });
  }

  public static unmarshal(json: string): User {
    const obj = JSON.parse(json);
    return new User(obj);
  }
}
```

### Complex Schema with Definitions

**Input: `complex-schema.json`**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "Address": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" },
        "zipCode": { "type": "string" }
      },
      "required": ["street", "city", "zipCode"]
    }
  },
  "type": "object",
  "properties": {
    "person": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "address": { "$ref": "#/definitions/Address" }
      },
      "required": ["name"]
    }
  }
}
```

This will generate both `Person` and `Address` classes with proper type relationships.

## File Format Support

### JSON Format
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "example": { "type": "string" }
  }
}
```

### YAML Format
```yaml
$schema: "http://json-schema.org/draft-07/schema#"
type: object
properties:
  example:
    type: string
```
