import Content from '@theme-original/DocItem/Content';
import type ContentType from '@theme/DocItem/Content';
import type {WrapperProps} from '@docusaurus/types';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {
  GeneratorIcon,
  getGeneratorPreset
} from '@site/src/data/generatorPresets';
import styles from './styles.module.css';

type Props = WrapperProps<typeof ContentType>;

/**
 * Badges a generator's doc page with the same icon its card and sidebar entry
 * use, driven by `sidebar_custom_props: {generatorPreset: <preset>}`.
 */
export default function ContentWrapper(props: Props): JSX.Element {
  const {frontMatter} = useDoc();
  const preset = (
    frontMatter.sidebar_custom_props as {generatorPreset?: string} | undefined
  )?.generatorPreset;
  const generator = preset ? getGeneratorPreset(preset) : undefined;

  return (
    <>
      {generator && (
        <p className={styles.badge}>
          <span className={styles.iconWrap} aria-hidden="true">
            <GeneratorIcon preset={generator.preset} />
          </span>
          <code className={styles.preset}>{generator.preset}</code>
          <span className={styles.blurb}>{generator.blurb}</span>
        </p>
      )}
      <Content {...props} />
    </>
  );
}
