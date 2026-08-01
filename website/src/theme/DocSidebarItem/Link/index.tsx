import Link from '@theme-original/DocSidebarItem/Link';
import type LinkType from '@theme/DocSidebarItem/Link';
import type {WrapperProps} from '@docusaurus/types';
import {GeneratorIcon} from '@site/src/data/generatorPresets';
import styles from './styles.module.css';

type Props = WrapperProps<typeof LinkType>;

/**
 * Puts a preset's icon in front of its sidebar entry, so the docs read with the
 * same iconography as the landing page's preset grid.
 *
 * Opt in per doc with `sidebar_custom_props: {generatorPreset: <preset>}`; the
 * front matter is invisible when the same file renders on GitHub.
 */
export default function LinkWrapper(props: Props): JSX.Element {
  const preset = (
    props.item.customProps as {generatorPreset?: string} | undefined
  )?.generatorPreset;

  if (!preset) {
    return <Link {...props} />;
  }

  const label = (
    <>
      <span className={styles.icon} aria-hidden="true">
        <GeneratorIcon preset={preset} />
      </span>
      {props.item.label}
    </>
  );

  return (
    <Link
      {...props}
      item={{
        ...props.item,
        // The theme renders `label` straight into the link, so handing it a node
        // gets the icon inside the anchor without forking the whole component.
        label: label as unknown as string
      }}
    />
  );
}
