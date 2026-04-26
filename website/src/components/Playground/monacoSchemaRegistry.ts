/**
 * Centralized Monaco JSON schema registry.
 *
 * monaco.languages.json.jsonDefaults is global singleton state. Calling
 * setDiagnosticsOptions({ schemas: [...] }) replaces the entire schemas
 * array. With multiple <Editor> instances calling it independently, the
 * last writer wins — every JSON model in the page ends up validated
 * against whichever schema was registered most recently. This registry
 * holds one entry per editor (keyed by model path) and writes the merged
 * schemas array on every register/unregister, with each entry's fileMatch
 * scoped to that editor's own model URI.
 */

interface MonacoLike {
  languages: {
    json: {
      jsonDefaults: {
        setDiagnosticsOptions: (options: {
          validate: boolean;
          enableSchemaRequest: boolean;
          schemas: Array<{ uri: string; fileMatch: string[]; schema: object }>;
        }) => void;
      };
    };
  };
}

interface RegistryEntry {
  modelPath: string;
  schemaUri: string;
  schema: object;
}

const entries = new Map<string, RegistryEntry>();
let monacoInstance: MonacoLike | null = null;

function flush(): void {
  if (!monacoInstance) return;
  monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    enableSchemaRequest: false,
    schemas: Array.from(entries.values()).map((e) => ({
      uri: e.schemaUri,
      fileMatch: [e.modelPath],
      schema: e.schema,
    })),
  });
}

export function setMonaco(monaco: MonacoLike): void {
  monacoInstance = monaco;
  flush();
}

export function registerSchema(
  modelPath: string,
  schemaUri: string,
  schema: object,
): void {
  const existing = entries.get(modelPath);
  if (
    existing &&
    existing.schemaUri === schemaUri &&
    existing.schema === schema
  ) {
    return;
  }
  entries.set(modelPath, { modelPath, schemaUri, schema });
  flush();
}

export function unregisterSchema(modelPath: string): void {
  if (entries.delete(modelPath)) flush();
}
