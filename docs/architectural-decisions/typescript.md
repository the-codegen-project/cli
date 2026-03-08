---
sidebar_position: 99
---

# TypeScript
All decision worth mentioning about TypeScript can be found here, simply to keep track.

### 21.08.2024

1. All functions in channel protocols are to be designed arrow function as it's more versatile when combining it together with other code sections.

### 28.04.2025

1. All function parameters MUST be object parameters to better support many optional parameters without having to write `functionCall(undefined, undefined, 'value')`

### 08.04.26

Generated code requires **ES2018** or higher due to async iteration (`for await...of`) in subscription handlers.
