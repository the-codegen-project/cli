import clsx from 'clsx';
import {Highlight, themes} from 'prism-react-renderer';
import type {Language} from '../demos';
import styles from './styles.module.css';

/**
 * A read-only, editor-looking code surface with a "streaming in" reveal.
 *
 * The reveal is done with a per-line CSS animation delay rather than by
 * re-rendering a growing substring: highlighting runs once, the browser handles
 * the 60fps part on the compositor, and there is nothing to throttle. Replaying
 * it means remounting the element, which restarts the CSS animations from zero.
 *
 * The remount key is derived from `code` itself, so a pane only re-animates when
 * what it shows actually changed. Callers do not have to work out which of their
 * controls affect which pane - and a pane sitting next to one the reader just
 * switched stays still instead of flickering for no reason.
 */
export default function CodePane({
  code,
  language,
  replayToken,
  animate = true,
  showLineNumbers = true,
  panelLabel,
  className
}: {
  code: string;
  language: Language;
  /**
   * Changes to this force a replay even when `code` is unchanged - for an
   * explicit "run it again" control. Leave unset to animate on content change
   * only.
   */
  replayToken?: string | number;
  animate?: boolean;
  /** Off for shell snippets, where numbered "lines" are meaningless. */
  showLineNumbers?: boolean;
  /**
   * Set when the pane is the content a tablist switches between: it makes the
   * pane the tabpanel those tabs are missing, named after the current file.
   */
  panelLabel?: string;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={clsx(styles.pane, className)}
      role={panelLabel ? 'tabpanel' : undefined}
      aria-label={panelLabel}
    >
      {/* `oneDark` over the more obvious `vsDark`: vsDark has no style for the
          `atrule` token type, which is what Prism's YAML grammar tags every key
          as - so a whole YAML document would render as flat, unhighlighted
          text. Keep `--cg-code-plain` in sync with this theme's plain colour. */}
      <Highlight theme={themes.oneDark} code={code} language={language}>
        {({tokens, getLineProps, getTokenProps}) => (
          <pre
            key={`${replayToken ?? ''}:${code}`}
            className={clsx(
              styles.pre,
              animate && styles.animated,
              !showLineNumbers && styles.noGutter
            )}
            tabIndex={0}
          >
            <code>
              {tokens.map((line, i) => {
                const {style: _ignoredLineStyle, ...lineProps} = getLineProps({
                  line
                });
                return (
                  <span
                    key={i}
                    {...lineProps}
                    className={clsx(styles.line, lineProps.className)}
                    // Staggered so the file appears to stream in. Capped so a
                    // long file still finishes in well under a second.
                    style={{animationDelay: `${Math.min(i * 14, 620)}ms`}}
                  >
                    {showLineNumbers && (
                      <span className={styles.lineNo} aria-hidden="true">
                        {i + 1}
                      </span>
                    )}
                    <span className={styles.lineContent}>
                      {line.map((token, key) => {
                        const {style, ...rest} = getTokenProps({token});
                        return <span key={key} {...rest} style={style} />;
                      })}
                    </span>
                  </span>
                );
              })}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
}
