# JSON Schema Models Example

This example demonstrates how to use The Codegen Project CLI with JSON Schema input to generate TypeScript models.

## Overview

This example shows:
- Using JSON Schema as input for the `models` generator
- Generating TypeScript classes with properties, getters, and marshalling methods
- Working with complex schemas including nested objects, arrays, and enums
- Customizing the generated code with Modelina renderers

## Files

- `user-schema.json` - A comprehensive JSON Schema defining a User model
- `codegen.config.js` - Configuration file specifying JSON Schema input and models generator
- `index.ts` - Example usage of the generated User model
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project dependencies and scripts

## Usage

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate models:**
   ```bash
   npm run generate
   ```

3. **Build and run the example:**
   ```bash
   npm start
   ```

## Generated Output

The generator creates a `User` class in `src/models/User.ts` with:

- **Properties**: All schema properties as private fields with getters
- **Constructor**: Object parameter constructor with type validation
- **Marshalling**: `marshal()` method to convert to JSON string
- **Unmarshalling**: Static `unmarshal()` method to create instances from JSON
- **Type Safety**: Full TypeScript type safety based on the JSON Schema

## Schema Features Demonstrated

- **Basic Types**: string, number, boolean, array, object
- **Format Validation**: email, uuid, date-time, uri formats
- **Constraints**: minLength, maxLength, minimum, maximum
- **Enums**: String enums for roles and theme preferences
- **Required Fields**: Some fields are required, others optional
- **Nested Objects**: Profile object with its own properties
- **Arrays**: Roles array with enum item constraints
- **Descriptions**: Schema descriptions become JSDoc comments

## Customization

The example shows how to use Modelina renderers to customize the generated code:

```js
renderers: [
  {
    class: {
      property: ({ content, property }) => {
        // Add JSDoc comments for better documentation
        const description = property.property.description;
        if (description) {
          return `  /** ${description} */\n${content}`;
        }
        return content;
      }
    }
  }
]
```

This adds JSDoc comments to properties based on their schema descriptions.

## Benefits of JSON Schema Input

1. **Direct Schema Usage**: Use existing JSON Schema files without modification
2. **Schema Validation**: Built-in validation ensures schema correctness
3. **Rich Type System**: Support for complex types, formats, and constraints
4. **Documentation**: Schema descriptions become code documentation
5. **Flexibility**: Works with any valid JSON Schema v4, v6, or v7

## Next Steps

- Try modifying the schema and regenerating the models
- Experiment with different Modelina options (interface vs class, different enum types)
- Add custom renderers for additional functionality
- Integrate with your existing JSON Schema workflows
