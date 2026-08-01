import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import CodePane from '../CodePane';
import {demos, type CodeFile} from '../demos';
import styles from './styles.module.css';

/**
 * Moves focus between tabs with the arrow keys, as the tab role expects.
 *
 * The buttons are siblings inside the tablist, so the DOM order is the tab
 * order and we can walk it directly instead of threading refs per tab.
 */
function handleTablistKeys(event: React.KeyboardEvent<HTMLDivElement>): void {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
    return;
  }
  const tabs = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
  );
  const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
  if (current === -1) {
    return;
  }
  event.preventDefault();
  const offset = event.key === 'ArrowRight' ? 1 : -1;
  tabs[(current + offset + tabs.length) % tabs.length].focus();
}

export default function SpecToCode(): JSX.Element {
  const [demoIndex, setDemoIndex] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [outputIndex, setOutputIndex] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  /**
   * Only the Regenerate button touches this. Switching tabs needs nothing here:
   * a pane replays its reveal when its own content changes, so the pane the
   * reader did not touch stays still.
   */
  const [replayToken, setReplayToken] = useState(0);

  const demo = demos[demoIndex];
  const variant = demo.variants[variantIndex];
  const output = variant.outputs[outputIndex];

  const inputFile: CodeFile = useMemo(
    () =>
      showConfig
        ? {
            path: 'codegen.config.js',
            label: 'codegen.config.js',
            language: 'typescript',
            code: variant.config
          }
        : demo.spec,
    [demo.spec, showConfig, variant.config]
  );

  const selectDemo = useCallback((index: number) => {
    setDemoIndex(index);
    // Variants and outputs are per-demo, so anything held over would be stale.
    setVariantIndex(0);
    setOutputIndex(0);
  }, []);

  const selectVariant = useCallback(
    (index: number) => {
      setVariantIndex(index);
      // Output tabs line up 1:1 across a demo's variants, so the reader keeps
      // looking at the same kind of file when they switch protocol.
      setOutputIndex((current) =>
        Math.min(current, demo.variants[index].outputs.length - 1)
      );
    },
    [demo.variants]
  );

  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  /**
   * Track the pointer for the border glow. The values go straight onto the
   * element as custom properties - putting them in state would re-render the
   * whole stage (and re-highlight both panes) on every mouse move.
   */
  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const stage = stageRef.current;
      if (!stage || frameRef.current !== null) {
        return;
      }
      const {clientX, clientY} = event;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const rect = stage.getBoundingClientRect();
        stage.style.setProperty('--cg-px', `${clientX - rect.left}px`);
        stage.style.setProperty('--cg-py', `${clientY - rect.top}px`);
      });
    },
    []
  );

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    },
    []
  );

  return (
    <section className={styles.section} id="see-it">
      <div className="container">
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Spec in, code out</p>
          <h2 className={styles.title}>
            Your document is already the source of truth.
            <br />
            <span className={styles.titleAccent}>Stop typing it twice.</span>
          </h2>
          <p className={styles.lede}>
            Pick an input, pick a protocol, and see the code you would write —
            plus every generated file standing behind it. Nothing here is mocked
            up.
          </p>
        </div>

        <div
          className={styles.stage}
          ref={stageRef}
          onPointerMove={handlePointerMove}
        >
          <div className={styles.stageTop}>
            <div
              className={styles.inputTabs}
              role="tablist"
              aria-label="Input type"
              onKeyDown={handleTablistKeys}
            >
              {demos.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={index === demoIndex}
                  tabIndex={index === demoIndex ? 0 : -1}
                  className={clsx(
                    styles.inputTab,
                    index === demoIndex && styles.inputTabActive
                  )}
                  onClick={() => selectDemo(index)}
                >
                  {item.label}
                  <span className={styles.inputTabVersions}>
                    {item.versions}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles.replay}
              onClick={() => setReplayToken((value) => value + 1)}
            >
              <span aria-hidden="true">⟳</span> Regenerate
            </button>
          </div>

          <div className={styles.panels}>
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <div
                  className={styles.fileTabs}
                  role="tablist"
                  aria-label="Input files"
                  onKeyDown={handleTablistKeys}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!showConfig}
                    tabIndex={showConfig ? -1 : 0}
                    className={clsx(
                      styles.fileTab,
                      !showConfig && styles.fileTabActive
                    )}
                    onClick={() => setShowConfig(false)}
                  >
                    {demo.spec.label}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={showConfig}
                    tabIndex={showConfig ? 0 : -1}
                    className={clsx(
                      styles.fileTab,
                      showConfig && styles.fileTabActive
                    )}
                    onClick={() => setShowConfig(true)}
                  >
                    codegen.config.js
                  </button>
                </div>
              </div>
              <CodePane
                code={inputFile.code}
                language={inputFile.language}
                panelLabel={inputFile.label}
                replayToken={replayToken}
              />
            </div>

            <div className={styles.bridge} aria-hidden="true">
              <span className={styles.bridgeLine} />
              <span className={styles.bridgeChip}>codegen</span>
              <span className={styles.bridgeLine} />
            </div>

            <div className={clsx(styles.panel, styles.panelOut)}>
              <div className={styles.panelHead}>
                <div
                  className={styles.fileTabs}
                  role="tablist"
                  aria-label="Generated files"
                  onKeyDown={handleTablistKeys}
                >
                  {variant.outputs.map((file, index) => (
                    <button
                      key={file.path}
                      type="button"
                      role="tab"
                      aria-selected={index === outputIndex}
                      tabIndex={index === outputIndex ? 0 : -1}
                      className={clsx(
                        styles.fileTab,
                        index === outputIndex && styles.fileTabActive,
                        file.handWritten && styles.fileTabYours
                      )}
                      onClick={() => setOutputIndex(index)}
                    >
                      {file.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.pathBar}>
                <code>{output.path}</code>
                <span
                  className={clsx(
                    styles.pathTag,
                    output.handWritten && styles.pathTagYours
                  )}
                >
                  {output.handWritten ? 'you write this' : 'generated'}
                </span>
              </div>
              <CodePane
                code={output.code}
                language={output.language}
                panelLabel={output.path}
                replayToken={replayToken}
              />
            </div>
          </div>

          <div className={styles.stageBottom}>
            {demo.variants.length > 1 && (
              <div className={styles.pills}>
                <span className={styles.pillsLabel}>{demo.variantLabel}</span>
                {demo.variants.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={index === variantIndex}
                    className={clsx(
                      styles.pill,
                      index === variantIndex && styles.pillActive
                    )}
                    onClick={() => selectVariant(index)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            <div className={styles.stageMeta}>
              <span className={styles.runtime}>
                runs on <code>{variant.runtime}</code>
              </span>
              <Link className={styles.playgroundLink} to="/playground">
                Try your own spec in the playground →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
