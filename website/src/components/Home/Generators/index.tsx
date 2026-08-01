import Link from '@docusaurus/Link';
import {
  GENERATOR_PRESETS,
  GeneratorIcon
} from '@site/src/data/generatorPresets';
import styles from './styles.module.css';

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
          {GENERATOR_PRESETS.map((generator) => (
            <Link
              key={generator.preset}
              to={generator.href}
              className={styles.card}
            >
              <span className={styles.iconWrap} aria-hidden="true">
                <GeneratorIcon preset={generator.preset} />
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
