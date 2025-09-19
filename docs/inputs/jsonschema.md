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

## Best Practices

### Schema Structure
- **Include `$schema`**: Always specify the JSON Schema draft version
- **Use Descriptions**: Add descriptions to properties for better generated documentation
- **Define Required Fields**: Clearly specify required properties
- **Use Appropriate Formats**: Leverage format keywords like `email`, `uuid`, `date-time`

### Model Generation
- **Choose Model Type**: Select between `class`, `interface`, or `type` based on your needs
- **Enum Strategy**: Use `enum` for named constants, `union` for type unions
- **Property Names**: Consider `rawPropertyNames` option for exact property name preservation

### File Organization
- **Separate Concerns**: Use separate schema files for different domains
- **Reference Definitions**: Use `$ref` to reference common definitions
- **Modular Schemas**: Break complex schemas into smaller, reusable components

## Limitations

- **Single File Input**: Each configuration supports one JSON Schema file
- **No Operation Definitions**: JSON Schema doesn't include API operations (use OpenAPI for that)
- **No Channel Definitions**: JSON Schema doesn't include messaging patterns (use AsyncAPI for that)

For API operations, consider using [OpenAPI input](./openapi.md). For messaging patterns, consider using [AsyncAPI input](./asyncapi.md).

## Schema Validation

The JSON Schema input processor includes built-in validation:

- **Document Structure**: Validates basic JSON Schema structure
- **Format Support**: Ensures the file format (JSON/YAML) is supported
- **Content Validation**: Warns about empty or incomplete schemas
- **Version Detection**: Detects and validates JSON Schema draft versions

## Integration with Other Tools

JSON Schema input works seamlessly with:
- **JSON Schema Validators**: Generated models can be validated against the original schema
- **API Documentation**: Use with tools like JSON Schema documentation generators
- **Database Integration**: Generate models that match database schema definitions
- **Form Generation**: Create form validation that matches your data models
