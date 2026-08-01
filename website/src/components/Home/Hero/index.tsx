import {useCallback, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const INSTALL_COMMAND = 'npm install --save-dev @the-codegen-project/cli';

const STATS: {value: string; label: string}[] = [
  {value: '3', label: 'input formats'},
  {value: '8', label: 'generators'},
  {value: '7', label: 'protocols'},
  {value: '0', label: 'hand-written models'}
];

/** Copy-to-clipboard that falls back to selecting the text it could not copy. */
function CopyButton({value}: {value: string}): JSX.Element {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be denied (insecure context, permissions). Saying
      // nothing would look like the button is broken.
      setCopied(false);
    }
  }, [value]);

  return (
    <button
      type="button"
      className={styles.copyButton}
      onClick={copy}
      aria-label={`Copy "${value}" to clipboard`}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function Hero(): JSX.Element {
  return (
    <header className={styles.hero}>
      {/* Decorative: an animated gradient wash plus a faint grid. */}
      <div className={styles.backdrop} aria-hidden="true">
        <span className={clsx(styles.blob, styles.blobOne)} />
        <span className={clsx(styles.blob, styles.blobTwo)} />
        <span className={clsx(styles.blob, styles.blobThree)} />
        <span className={styles.grid} />
      </div>

      <div className={clsx('container', styles.inner)}>
        <p className={styles.badge}>
          <span className={styles.badgeDot} aria-hidden="true" />
          AsyncAPI · OpenAPI · JSON Schema → TypeScript
        </p>

        <h1 className={styles.title}>
          Ship the API.
          <br />
          <span className={styles.titleAccent}>Skip the boilerplate.</span>
        </h1>

        <p className={styles.subtitle}>
          The Codegen Project reads the API document you already maintain and
          writes the TypeScript you were going to hand-type: payload and
          parameter models, typed publish/subscribe functions for NATS, Kafka,
          MQTT, AMQP, WebSocket and SSE, and complete HTTP clients.
        </p>

        <div className={styles.actions}>
          <Link
            className={clsx(styles.cta, styles.ctaPrimary)}
            to="/docs/getting-started"
          >
            Get started
            <span className={styles.ctaHint}>5 min</span>
          </Link>
          <Link
            className={clsx(styles.cta, styles.ctaGhost)}
            to="/playground"
          >
            Open the playground
          </Link>
        </div>

        <div className={styles.install}>
          <span className={styles.installPrompt} aria-hidden="true">
            $
          </span>
          <code className={styles.installCommand}>{INSTALL_COMMAND}</code>
          <CopyButton value={INSTALL_COMMAND} />
        </div>

        <dl className={styles.stats}>
          {STATS.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <dt className={styles.statValue}>{stat.value}</dt>
              <dd className={styles.statLabel}>{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}
