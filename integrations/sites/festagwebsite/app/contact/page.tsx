import type { Metadata } from "next";
import { Btn } from "../_components/site/primitives";
import { ContactForm } from "../_components/site/ContactForm";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontaktiere Festag — Sales, Support, Careers und Security.",
};

const CHANNELS = [
  {
    title: "Sales & Demos",
    body: "Für Teams und Organisationen, die Festag evaluieren. Wir zeigen Delivery Intelligence — kein Pitch-Deck-Theater.",
    href: "mailto:hello@festag.app",
    label: "hello@festag.app",
  },
  {
    title: "Support",
    body: "Für bestehende Workspaces — ruhig, konkret, schnell.",
    href: "mailto:support@festag.app",
    label: "support@festag.app",
  },
  {
    title: "Careers",
    body: "Rollen und Initiativbewerbungen.",
    href: "mailto:careers@festag.app",
    label: "careers@festag.app",
  },
  {
    title: "Security",
    body: "Security Reviews und Vulnerability Reports.",
    href: "mailto:security@festag.app",
    label: "security@festag.app",
  },
];

export default function ContactPage() {
  return (
    <div className="page">
      <div className="site-wrap">
        <h1 className="page-title">Kontakt</h1>
        <p className="page-body">
          Schreib uns direkt. Wir antworten ruhig und ohne Sales-Theater — in der Regel
          innerhalb eines Werktags.
        </p>

        <div className="grid-2" style={{ marginTop: 40 }}>
          {CHANNELS.map((c) => (
            <article key={c.title} className="tile">
              <h3>{c.title}</h3>
              <p style={{ marginBottom: 16 }}>{c.body}</p>
              <Btn href={c.href} variant="ghost" external>
                {c.label}
              </Btn>
            </article>
          ))}
        </div>

        <ContactForm />

        <section className="page-block" style={{ marginTop: 56 }}>
          <h2>Bevor du schreibst</h2>
          <ul className="prose-list">
            <li>Sales: Workspace-Größe, Tools (GitHub, Slack, Linear…) und was Klarheit heute kostet.</li>
            <li>Support: Workspace-Name und kurze Repro — wir brauchen keine Screenshots-Flut.</li>
            <li>Security: Responsible Disclosure an security@festag.app.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
