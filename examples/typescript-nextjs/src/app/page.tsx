import Link from "next/link";

import styles from "./index.module.css";
import { UserSignedUp } from "~/__gen__/UserSignedUp"

export default function Home() {
  const payload = new UserSignedUp({});
  payload.displayName = "Lagoni";
  payload.email = "lagoni@lagoni.com";

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>
        <span className={styles.pinkSpan}>The Codegen Project</span> Next.js example
        </h1>
        <div className={styles.cardRow}>
          <Link
            className={styles.card}
            href="https://github.com/the-codegen-project/cli"
            target="_blank"
          >
            <h3 className={styles.cardTitle}>Serialized model was → {payload.marshal()}</h3>
          </Link>
        </div>
      </div>
    </main>
  );
}
