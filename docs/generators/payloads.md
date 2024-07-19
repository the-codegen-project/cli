# Payloads
`payloads` preset is for generating models that represent typed models that can be serialized into message payloads.


Input support; `asyncapi`

Language support; `typescript`, `java`, `csharp`

## Inputs

The `payloads` preset with `asyncapi` input generates all the message payloads for each channel in the AsyncAPI document.

The return type is a map of channels and the model that represent the payload. 

## Languages
Each language has a set of constraints which means that some typed model types are either supported or not, or it might just be the code generation library that does not yet support it.

|  | Circular models | Enums | Tuples | Arrays | Nested Arrays | Dictionaries | Json Serialization |
|---|---|---|---|---|---|---|---|
| **Java** | X | X | X | X | X | X | X |
| **TypeScript** | X | X | X | X | X | X | X |
| **C#** | X | X | X | X | X | X | X |

### Java

Dependencies: Jackson

### TypeScript

Dependencies: None

### C#

Requires System.Text.Json, System.Text.Json.Serialization, System.Text.RegularExpressions and Microsoft.CSharp version 4.7 to work.
