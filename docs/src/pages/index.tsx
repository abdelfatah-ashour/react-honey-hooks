import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

const features = [
  {
    title: "SSR-safe and Next.js ready",
    text: "No hook touches window or document while rendering on the server. Works in the App Router, Pages Router, Remix and Vite apps.",
  },
  {
    title: "TypeScript first",
    text: "Strict types, such as checked query param keys and typed DOM events. No @types package needed.",
  },
  {
    title: "Tiny and tree-shakeable",
    text: "Zero dependencies. Your bundle only includes the hooks you import.",
  },
];

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout description={siteConfig.tagline}>
      <header className="hero hero--primary">
        <div className="container">
          <h1 className="hero__title">🍯 {siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            Get started
          </Link>
        </div>
      </header>
      <main className="container margin-vert--lg">
        <div className="row">
          {features.map((feature) => (
            <section key={feature.title} className="col col--4">
              <h2>{feature.title}</h2>
              <p>{feature.text}</p>
            </section>
          ))}
        </div>
      </main>
    </Layout>
  );
}
