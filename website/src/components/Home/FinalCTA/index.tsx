import clsx from 'clsx';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function FinalCTA(): JSX.Element {
  return (
    <section className={styles.section}>
      <div className={styles.backdrop} aria-hidden="true">
        <span className={styles.glow} />
        <span className={styles.grid} />
      </div>
      <div className={clsx('container', styles.inner)}>
        <h2 className={styles.title}>
          Delete your hand-written models today
        </h2>
        <p className={styles.blurb}>
          Apache-2.0, free forever, and built in the open. Bring an AsyncAPI,
          OpenAPI or JSON Schema document and see what falls out.
        </p>
        <div className={styles.actions}>
          <Link
            className={clsx(styles.cta, styles.ctaPrimary)}
            to="/docs/getting-started"
          >
            Read the getting started guide
          </Link>
          <Link
            className={clsx(styles.cta, styles.ctaGhost)}
            href="https://github.com/the-codegen-project/cli"
          >
            Star it on GitHub
          </Link>
        </div>
        <p className={styles.meta}>
          Need it inside an existing app? There are worked{' '}
          <Link href="https://github.com/the-codegen-project/cli/tree/main/examples">
            examples
          </Link>{' '}
          for TypeScript libraries, Next.js, and every protocol.
        </p>
      </div>
    </section>
  );
}
