import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type Sponsor = {
  name: string;
  logo: string;
  url: string;
  description: string;
};

const sponsors: Sponsor[] = [
  {
    name: 'CodeForge',
    logo: '/img/sponsors/CodeForge.png',
    url: 'https://code-forge.net/',
    description: 'Automated SDK generation platform built on The Codegen Project'
  }
];

export default function Sponsors(): JSX.Element {
  return (
    <section className={styles.sponsors}>
      <div className="container">
        <div className={styles.sponsorHeader}>
          <Heading as="h2">💎 Sponsors</Heading>
        </div>
        
        <div className={clsx(styles.sponsorGrid, sponsors.length === 1 && styles.centered)}>
          {sponsors.map((sponsor, idx) => (
            <div key={idx} className={styles.sponsorCard}>
              <a 
                href={sponsor.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.sponsorLink}
              >
                <div className={styles.logoContainer}>
                  <img 
                    src={sponsor.logo} 
                    alt={sponsor.name}
                    className={styles.sponsorLogo}
                  />
                </div>
              </a>
              <a 
                href={sponsor.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.sponsorTitle}
              >
                <strong>{sponsor.name}</strong>
              </a>
              <p className={styles.sponsorDescription}>
                <em>{sponsor.description}</em>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

