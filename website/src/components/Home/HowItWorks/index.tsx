import Link from '@docusaurus/Link';
import CodePane from '../CodePane';
import type {Language} from '../demos';
import styles from './styles.module.css';

const STEPS: {
  title: string;
  blurb: JSX.Element;
  language: Language;
  code: string;
}[] = [
  {
    title: 'Install',
    blurb: (
      <>
        A dev dependency, a global binary, or a signed installer per platform.
        Node.js 22+.
      </>
    ),
    language: 'plaintext',
    code: `npm install --save-dev @the-codegen-project/cli`
  },
  {
    title: 'Initialize',
    blurb: (
      <>
        <code>codegen init</code> walks you through it interactively, or takes
        flags for CI. It writes the config file — JSON, YAML, TS, ESM or CJS.
      </>
    ),
    language: 'plaintext',
    code: `codegen init

# or non-interactively
codegen init --no-tty \\
  --input-type asyncapi \\
  --input-file ./asyncapi.yml \\
  --include-payloads \\
  --include-channels \\
  --channels-protocols nats`
  },
  {
    title: 'Generate',
    blurb: (
      <>
        Once, or on every change with <code>--watch</code>. Commit the output or
        generate it in CI — both work.
      </>
    ),
    language: 'plaintext',
    code: `codegen generate

# keep it in sync while you edit the spec
codegen generate --watch`
  }
];

export default function HowItWorks(): JSX.Element {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Three commands</p>
          <h2 className={styles.title}>From spec to typed code in one sitting</h2>
        </div>

        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <div className={styles.stepHead}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
              </div>
              <p className={styles.stepBlurb}>{step.blurb}</p>
              <div className={styles.stepCode}>
                <CodePane
                  code={step.code}
                  language={step.language}
                  animate={false}
                  showLineNumbers={false}
                />
              </div>
            </li>
          ))}
        </ol>

        <p className={styles.footnote}>
          Working with an AI assistant?{' '}
          <Link to="/docs/ai-assistants">
            There is an MCP server and a rules file for that
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
