import Link from '@docusaurus/Link';
import styles from './styles.module.css';

/** The eight protocols the `channels` preset can emit, with what they run on. */
const PROTOCOLS: {name: string; runtime: string; href: string}[] = [
  {name: 'NATS', runtime: 'nats', href: '/docs/protocols/nats'},
  {name: 'Kafka', runtime: 'kafkajs', href: '/docs/protocols/kafka'},
  {name: 'MQTT', runtime: 'mqtt v5', href: '/docs/protocols/mqtt'},
  {name: 'AMQP', runtime: 'amqplib', href: '/docs/protocols/amqp'},
  {name: 'WebSocket', runtime: 'ws', href: '/docs/protocols/websocket'},
  {
    name: 'EventSource',
    runtime: 'SSE',
    href: '/docs/protocols/eventsource'
  },
  {name: 'HTTP Client', runtime: 'fetch', href: '/docs/protocols/http_client'},
  {name: 'HTTP Server', runtime: 'express', href: '/docs/protocols/http_server'}
];

function Chip({
  name,
  runtime,
  href,
  ariaHidden = false
}: {
  name: string;
  runtime: string;
  href: string;
  ariaHidden?: boolean;
}): JSX.Element {
  return (
    <Link
      to={href}
      className={styles.chip}
      aria-hidden={ariaHidden || undefined}
      tabIndex={ariaHidden ? -1 : undefined}
    >
      <span className={styles.chipName}>{name}</span>
      <span className={styles.chipRuntime}>{runtime}</span>
    </Link>
  );
}

export default function Protocols(): JSX.Element {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.intro}>
          <p className={styles.eyebrow}>One document, every transport</p>
          <h2 className={styles.title}>
            Swap the broker, keep the call sites
          </h2>
          <p className={styles.lede}>
            The <code>channels</code> preset emits idiomatic code per protocol —
            JetStream for NATS, consumer groups for Kafka, user properties for
            MQTT v5, exchanges and queues for AMQP.
          </p>
        </div>
      </div>

      {/* The track is duplicated so the loop has no visible seam; the copy is
          hidden from assistive tech and taken out of the tab order. */}
      <div className={styles.marquee}>
        <div className={styles.track}>
          {PROTOCOLS.map((protocol) => (
            <Chip key={protocol.name} {...protocol} />
          ))}
          {PROTOCOLS.map((protocol) => (
            <Chip key={`echo-${protocol.name}`} {...protocol} ariaHidden />
          ))}
        </div>
      </div>
    </section>
  );
}
