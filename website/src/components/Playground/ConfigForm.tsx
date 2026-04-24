/**
 * Visual config form for beginners.
 * Provides a UI for configuring generators without writing code.
 */

import React, { useCallback } from 'react';
import type { ConfigFormState } from '../../utils/configCodegen';
import {
  PRESET_COMPATIBILITY,
  PROTOCOL_INPUT_COMPATIBILITY,
} from '../../utils/configCodegen';
import styles from './playground.module.css';

export interface ConfigFormProps {
  /** Current form state */
  formState: ConfigFormState;
  /** Update form state */
  onFormStateChange: (state: ConfigFormState) => void;
}

const INPUT_TYPE_LABEL: Record<ConfigFormState['inputType'], string> = {
  asyncapi: 'AsyncAPI',
  openapi: 'OpenAPI',
  jsonschema: 'JSON Schema',
};

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

function supportedInputsLabel(preset: string): string {
  const supported = PRESET_COMPATIBILITY[preset] ?? [];
  return supported.map((t) => INPUT_TYPE_LABEL[t]).join(', ');
}

export default function ConfigForm({
  formState,
  onFormStateChange,
}: ConfigFormProps): JSX.Element {
  const handleGeneratorToggle = useCallback(
    (preset: string) => {
      if (!PRESET_COMPATIBILITY[preset]?.includes(formState.inputType)) return;
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

  // Filter protocols by both supportedBy (generator type) and input type axis.
  const availableProtocols = PROTOCOLS.filter((p) => {
    const inputOk = PROTOCOL_INPUT_COMPATIBILITY[p.value]?.includes(
      formState.inputType
    );
    if (!inputOk) return false;
    if (channelsEnabled && p.supportedBy.includes('channels')) return true;
    if (clientEnabled && p.supportedBy.includes('client')) return true;
    return false;
  });

  return (
    <div className={styles.configForm}>
      <div className={styles.formSection}>
        <label className={styles.formLabel}>Generators</label>
        <div className={styles.generatorList}>
          {GENERATOR_PRESETS.map((gen) => {
            const state = formState.generators.find((g) => g.preset === gen.preset);
            const isEnabled = state?.enabled ?? false;
            const isSupported =
              PRESET_COMPATIBILITY[gen.preset]?.includes(formState.inputType) ??
              false;
            const tooltip = isSupported
              ? undefined
              : `Only available for ${supportedInputsLabel(gen.preset)}`;

            return (
              <label
                key={gen.preset}
                className={`${styles.generatorItem} ${
                  !isSupported ? styles.generatorItemDisabled : ''
                }`}
                title={tooltip}
              >
                <input
                  type="checkbox"
                  checked={isEnabled && isSupported}
                  disabled={!isSupported}
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

      {showProtocols && availableProtocols.length > 0 && (
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
