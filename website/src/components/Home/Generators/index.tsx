import Link from '@docusaurus/Link';
import styles from './styles.module.css';

/**
 * The eight presets, described the way the config schema describes them.
 *
 * Wording is condensed from the `preset` field's own Zod `.describe()` text in
 * `src/codegen/generators/**`, which is the single source of truth for what a
 * generator does. If a preset's purpose changes there, change it here too.
 */
const GENERATORS: {
  preset: string;
  blurb: string;
  href: string;
  /** Rendered inside a 24x24 viewBox, `currentColor` stroked. */
  icon: JSX.Element;
}[] = [
  {
    preset: 'payloads',
    blurb:
      'Typed payload and message models that serialize straight into your wire format.',
    href: '/docs/generators/payloads',
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 13h8M8 16h5" />
      </>
    )
  },
  {
    preset: 'parameters',
    blurb:
      'Parameter models that interpolate values into subjects, topics and URL paths.',
    href: '/docs/generators/parameters',
    icon: (
      <>
        <path d="M4 7h6M14 7h6M4 17h6M14 17h6" />
        <circle cx="12" cy="7" r="2.4" />
        <circle cx="12" cy="17" r="2.4" />
      </>
    )
  },
  {
    preset: 'headers',
    blurb:
      'Message header models, with optional runtime validation of what arrives.',
    href: '/docs/generators/headers',
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M7 14h4" />
      </>
    )
  },
  {
    preset: 'types',
    blurb:
      'Type aliases and enums derived from the constraints already in your document.',
    href: '/docs/generators/types',
    icon: (
      <>
        <path d="M4 6h16M12 6v13" />
        <path d="M8 19h8" />
      </>
    )
  },
  {
    preset: 'channels',
    blurb:
      'Protocol-specific publish, subscribe, request and reply functions per operation.',
    href: '/docs/generators/channels',
    icon: (
      <>
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="M8.2 10.9 15.8 7.1M8.2 13.1l7.6 3.8" />
      </>
    )
  },
  {
    preset: 'client',
    blurb:
      'One class wrapping the channel functions, with connection handling built in.',
    href: '/docs/generators/client',
    icon: (
      <>
        <rect x="3" y="5" width="18" height="12" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    )
  },
  {
    preset: 'models',
    blurb:
      'Plain typed models via Modelina, with none of the messaging machinery.',
    href: '/docs/generators/models',
    icon: (
      <>
        <path d="M12 3 21 8v8l-9 5-9-5V8z" />
        <path d="M3 8l9 5 9-5M12 13v8" />
      </>
    )
  },
  {
    preset: 'custom',
    blurb:
      'Your own render function, fed the parsed document and other generators’ output.',
    href: '/docs/generators/custom',
    icon: (
      <>
        <path d="M9 7 4 12l5 5M15 7l5 5-5 5" />
      </>
    )
  }
];

export default function Generators(): JSX.Element {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Eight presets</p>
          <h2 className={styles.title}>Generate exactly as much as you want</h2>
          <p className={styles.lede}>
            Presets compose. Take just the models, or wire up the whole client —
            the renderer resolves the dependency order for you.
          </p>
        </div>

        <div className={styles.grid}>
          {GENERATORS.map((generator) => (
            <Link
              key={generator.preset}
              to={generator.href}
              className={styles.card}
            >
              <span className={styles.iconWrap} aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {generator.icon}
                </svg>
              </span>
              <h3 className={styles.cardTitle}>
                <code>{generator.preset}</code>
              </h3>
              <p className={styles.cardBlurb}>{generator.blurb}</p>
              <span className={styles.cardMore} aria-hidden="true">
                Docs →
              </span>
            </Link>
          ))}
        </div>

        <p className={styles.footnote}>
          AsyncAPI and OpenAPI support all eight. JSON Schema supports{' '}
          <code>models</code> and <code>custom</code>.{' '}
          <Link to="/docs/generators">See the full support matrix →</Link>
        </p>
      </div>
    </section>
  );
}
