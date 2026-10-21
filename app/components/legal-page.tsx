import type { ReactNode } from "react";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { Reveal } from "./reveal";
import "~/styles/legal.css";

export type Section = { id: string; title: string; body: ReactNode };

export function LegalPage({ title, eyebrow, lede, sections }: { title: string; eyebrow: string; lede: ReactNode; sections: Section[] }) {
  return (
    <>
      <SiteHeader />
      <main className="legal">
        <div className="legal-hero">
          <div className="legal-sand" aria-hidden="true" />
          <div className="wrap legal-hero-inner">
            <Reveal>
              <p className="caption">{eyebrow}</p>
              <h1>{title}</h1>
              <p className="legal-lede">{lede}</p>
            </Reveal>
          </div>
        </div>
        <div className="wrap legal-grid">
          <nav className="legal-toc" aria-label="On this page">
            <p className="caption">On this page</p>
            <ol>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.title}</a>
                </li>
              ))}
            </ol>
          </nav>
          <article className="legal-body">
            {sections.map((s) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`}>
                <h2 id={`${s.id}-title`}>{s.title}</h2>
                {s.body}
              </section>
            ))}
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
