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

const DOCS_BASE = 'https://the-codegen-project.org/docs';

const GENERATOR_PRESETS = [
  { preset: 'payloads', label: 'Payloads', description: 'Message/payload models with validation', docsUrl: `${DOCS_BASE}/generators/payloads` },
  { preset: 'parameters', label: 'Parameters', description: 'Channel parameter types', docsUrl: `${DOCS_BASE}/generators/parameters` },
  { preset: 'headers', label: 'Headers', description: 'Message header types', docsUrl: `${DOCS_BASE}/generators/headers` },
  { preset: 'types', label: 'Types', description: 'Simple type definitions', docsUrl: `${DOCS_BASE}/generators/types` },
  { preset: 'models', label: 'Models', description: 'Complex data models', docsUrl: `${DOCS_BASE}/generators/models` },
  { preset: 'channels', label: 'Channels', description: 'Protocol-specific messaging functions', docsUrl: `${DOCS_BASE}/generators/channels` },
  { preset: 'client', label: 'Client', description: 'Full-featured client with protocol handling', docsUrl: `${DOCS_BASE}/generators/client` },
] as const;

// Protocols supported by the channels generator
// Note: Client generator currently only supports 'nats'
type GeneratorType = 'channels' | 'client';
const PROTOCOLS: ReadonlyArray<{
  value: string;
  label: string;
  supportedBy: readonly GeneratorType[];
  docsUrl: string;
}> = [
  { value: 'nats', label: 'NATS', supportedBy: ['channels', 'client'], docsUrl: `${DOCS_BASE}/protocols/nats` },
  { value: 'kafka', label: 'Kafka', supportedBy: ['channels'], docsUrl: `${DOCS_BASE}/protocols/kafka` },
  { value: 'mqtt', label: 'MQTT', supportedBy: ['channels'], docsUrl: `${DOCS_BASE}/protocols/mqtt` },
  { value: 'amqp', label: 'AMQP (RabbitMQ)', supportedBy: ['channels'], docsUrl: `${DOCS_BASE}/protocols/amqp` },
  { value: 'websocket', label: 'WebSocket', supportedBy: ['channels'], docsUrl: `${DOCS_BASE}/protocols/websocket` },
  { value: 'http_client', label: 'HTTP Client', supportedBy: ['channels'], docsUrl: `${DOCS_BASE}/protocols/http_client` },
  { value: 'event_source', label: 'EventSource (SSE)', supportedBy: ['channels'], docsUrl: `${DOCS_BASE}/protocols/eventsource` },
];

function DocLink({href, label}: {href: string; label: string}): JSX.Element {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.docLink}
      aria-label={`Open ${label} documentation in a new tab`}
      title={`Open ${label} documentation`}
      onClick={(e) => e.stopPropagation()}
    >
      ↗
    </a>
  );
}

function DocsRowLink({href, label}: {href: string; label: string}): JSX.Element {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.docsRowLink}
      aria-label={`Open ${label} documentation in a new tab`}
      onClick={(e) => e.stopPropagation()}
    >
      Read more about {label} →
    </a>
  );
}

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
        <label className={styles.formLabel}>
          Generators
          <DocLink href={`${DOCS_BASE}/generators`} label="Generators" />
        </label>
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
                  <DocsRowLink href={gen.docsUrl} label={gen.label} />
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
            <DocLink
              href={`${DOCS_BASE}/getting-started/protocols`}
              label="Protocols"
            />
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
