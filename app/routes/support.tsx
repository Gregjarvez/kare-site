import { Link } from "react-router";

import type { Route } from "./+types/support";
import { LegalPage, type Section } from "~/components/legal-page";
import { CONTACT_EMAIL, pageMeta } from "~/site";

export function meta({}: Route.MetaArgs) {
  return pageMeta("Support · Kare", "Help with Kare, and how to reach us.", "/support/");
}

const sections: Section[] = [
  {
    id: "contact",
    title: "Write to us",
    body: (
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Every message is read, and answered by a person.
      </p>
    ),
  },
  {
    id: "how-long",
    title: "How long does a thought take to pass?",
    body: (
      <p>
        It depends on how much it weighs on you. When you write something down, Kare asks, and a heavier thought takes
        longer. You don't have to watch: the sand keeps going while Kare is closed, and you can ask to be told when it
        has passed in Kare's settings.
      </p>
    ),
  },
  {
    id: "premium",
    title: "Kare Premium",
    body: (
      <>
        <p>
          Kare Premium is one purchase, yours for good. It isn't a subscription, so there is nothing to cancel and
          nothing renews.
        </p>
        <p>
          On a new phone, or after reinstalling, open Kare's settings and choose Restore to bring it back. It is tied to
          your Apple Account, not to this phone.
        </p>
        <p>
          Refunds are handled by Apple. You can ask for one at{" "}
          <a href="https://reportaproblem.apple.com">reportaproblem.apple.com</a>.
        </p>
      </>
    ),
  },
  {
    id: "thoughts",
    title: "Your thoughts",
    body: (
      <p>
        What you write stays on your phone, so we can't see it, recover it or remove it for you. Once a thought has
        passed, its words are gone. The <Link to="/privacy">privacy policy</Link> says exactly what Kare keeps.
      </p>
    ),
  },
  {
    id: "start-over",
    title: "Starting again",
    body: (
      <p>
        Start over, in Kare's settings, clears your sand, marbles, name and choices, so you can begin fresh. Kare Premium
        stays.
      </p>
    ),
  },
  {
    id: "more",
    title: "If it's more than that",
    body: (
      <p>
        Kare is a quiet ritual, not a treatment. If a thought is more than it can carry,{" "}
        <a href="https://findahelpline.com">findahelpline.com</a> lists free, confidential helplines in your country.
      </p>
    ),
  },
];

export default function Support() {
  return (
    <LegalPage
      eyebrow="Kare · Support"
      title="Support"
      lede="If something isn't working, or you'd just like to say something, write to us."
      sections={sections}
    />
  );
}
