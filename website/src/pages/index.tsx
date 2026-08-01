import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Hero from '@site/src/components/Home/Hero';
import SpecToCode from '@site/src/components/Home/SpecToCode';
import Generators from '@site/src/components/Home/Generators';
import Protocols from '@site/src/components/Home/Protocols';
import HowItWorks from '@site/src/components/Home/HowItWorks';
import FinalCTA from '@site/src/components/Home/FinalCTA';
import Sponsors from '@site/src/components/Sponsors';

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.tagline}
      description="Generate TypeScript models, protocol helpers and full clients from your AsyncAPI, OpenAPI and JSON Schema documents."
    >
      <Hero />
      <main>
        <SpecToCode />
        <Generators />
        <Protocols />
        <HowItWorks />
        <Sponsors />
        <FinalCTA />
      </main>
    </Layout>
  );
}
