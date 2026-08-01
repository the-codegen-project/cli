import Link from '@docusaurus/Link';
import {
  GENERATOR_PRESETS,
  GeneratorIcon
} from '@site/src/data/generatorPresets';
import styles from './styles.module.css';

/**
 * The preset grid from the landing page, sized for a docs column.
 *
 * Rendered into `docs/generators/README.md` by `scripts/move_docs.js`, which
 * swaps the plain markdown list for this component when it copies the docs in -
 * the list stays in the repo so the file still reads on GitHub.
 */
export default function GeneratorCards(): JSX.Element {
  return (
    <div className={styles.grid}>
      {GENERATOR_PRESETS.map((generator) => (
        <Link key={generator.preset} to={generator.href} className={styles.card}>
          <span className={styles.iconWrap} aria-hidden="true">
            <GeneratorIcon preset={generator.preset} />
          </span>
          <span className={styles.cardTitle}>
            <code>{generator.preset}</code>
          </span>
          <span className={styles.cardBlurb}>{generator.blurb}</span>
        </Link>
      ))}
    </div>
  );
}
