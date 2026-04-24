/**
 * Visual config form for beginners.
 * Provides a UI for configuring generators without writing code.
 */

import React, { useCallback } from 'react';
import type { ConfigFormState, GeneratorFormState } from '../../utils/configCodegen';
import styles from './playground.module.css';

export interface ConfigFormProps {
  /** Current form state */
  formState: ConfigFormState;
  /** Update form state */
  onFormStateChange: (state: ConfigFormState) => void;
}

const INPUT_TYPES = [
  { value: 'asyncapi', label: 'AsyncAPI' },
  { value: 'openapi', label: 'OpenAPI' },
  { value: 'jsonschema', label: 'JSON Schema' },
] as const;

const GENERATOR_PRESETS = [
  { preset: 'payloads', label: 'Payloads', description: 'Message/payload models with validation' },
  { preset: 'parameters', label: 'Parameters', description: 'Channel parameter types' },
  { preset: 'headers', label: 'Headers', description: 'Message header types' },
  { preset: 'types', label: 'Types', description: 'Simple type definitions' },
  { preset: 'models', label: 'Models', description: 'Complex data models' },
  { preset: 'channels', label: 'Channels', description: 'Protocol-specific messaging functions' },
  { preset: 'client', label: 'Client', description: 'Full-featured client with protocol handling' },
] as const;

// Protocols supported by the channels generator
// Note: Client generator currently only supports 'nats'
type GeneratorType = 'channels' | 'client';
const PROTOCOLS: ReadonlyArray<{
  value: string;
  label: string;
  supportedBy: readonly GeneratorType[];
}> = [
  { value: 'nats', label: 'NATS', supportedBy: ['channels', 'client'] },
  { value: 'kafka', label: 'Kafka', supportedBy: ['channels'] },
  { value: 'mqtt', label: 'MQTT', supportedBy: ['channels'] },
  { value: 'amqp', label: 'AMQP (RabbitMQ)', supportedBy: ['channels'] },
  { value: 'websocket', label: 'WebSocket', supportedBy: ['channels'] },
  { value: 'http_client', label: 'HTTP Client', supportedBy: ['channels'] },
  { value: 'event_source', label: 'EventSource (SSE)', supportedBy: ['channels'] },
];

export default function ConfigForm({
  formState,
  onFormStateChange,
}: ConfigFormProps): JSX.Element {
  const handleInputTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFormStateChange({
        ...formState,
        inputType: e.target.value as ConfigFormState['inputType'],
      });
    },
    [formState, onFormStateChange]
  );

  const handleGeneratorToggle = useCallback(
    (preset: string) => {
      const generators = formState.generators.map((g) =>
        g.preset === preset ? { ...g, enabled: !g.enabled } : g
      );
      onFormStateChange({ ...formState, generators });
    },
    [formState, onFormStateChange]
  );

  const handleProtocolToggle = useCallback(
    (protocol: string) => {
      const protocols = formState.protocols.includes(protocol)
        ? formState.protocols.filter((p) => p !== protocol)
        : [...formState.protocols, protocol];
      onFormStateChange({ ...formState, protocols });
    },
    [formState, onFormStateChange]
  );

  // Check which protocol-related generators are enabled
  const channelsEnabled = formState.generators.some(
    (g) => g.preset === 'channels' && g.enabled
  );
  const clientEnabled = formState.generators.some(
    (g) => g.preset === 'client' && g.enabled
  );
  const showProtocols = channelsEnabled || clientEnabled;

  // Filter protocols based on which generators are enabled
  const availableProtocols = PROTOCOLS.filter((p) => {
    if (channelsEnabled && p.supportedBy.includes('channels')) return true;
    if (clientEnabled && p.supportedBy.includes('client')) return true;
    return false;
  });

  return (
    <div className={styles.configForm}>
      <div className={styles.formSection}>
        <label className={styles.formLabel}>Input Type</label>
        <select
          className={styles.formSelect}
          value={formState.inputType}
          onChange={handleInputTypeChange}
        >
          {INPUT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formSection}>
        <label className={styles.formLabel}>Generators</label>
        <div className={styles.generatorList}>
          {GENERATOR_PRESETS.map((gen) => {
            const state = formState.generators.find((g) => g.preset === gen.preset);
            const isEnabled = state?.enabled ?? false;

            return (
              <label key={gen.preset} className={styles.generatorItem}>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => handleGeneratorToggle(gen.preset)}
                  className={styles.checkbox}
                />
                <div className={styles.generatorInfo}>
                  <span className={styles.generatorName}>{gen.label}</span>
                  <span className={styles.generatorDesc}>{gen.description}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {showProtocols && (
        <div className={styles.formSection}>
          <label className={styles.formLabel}>
            Protocols
            {clientEnabled && !channelsEnabled && (
              <span className={styles.protocolNote}> (Client only supports NATS)</span>
            )}
          </label>
          <div className={styles.protocolList}>
            {availableProtocols.map((protocol) => (
              <label key={protocol.value} className={styles.protocolItem}>
                <input
                  type="checkbox"
                  checked={formState.protocols.includes(protocol.value)}
                  onChange={() => handleProtocolToggle(protocol.value)}
                  className={styles.checkbox}
                />
                <span>{protocol.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
