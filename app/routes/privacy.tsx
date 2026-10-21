import type { Route } from "./+types/privacy";
import { LegalPage, type Section } from "~/components/legal-page";
import { CONTACT_EMAIL, pageMeta } from "~/site";

export function meta({}: Route.MetaArgs) {
  return pageMeta("Privacy · Kare", "How Kare handles your data: your thoughts stay on your phone.", "/privacy/");
}

const sections: Section[] = [
  {
    id: "keeps",
    title: "What Kare keeps",
    body: (
      <>
        <p>
          Kare has no accounts, no advertising and no tracking across apps. We don't run any servers, and nothing you
          write is ever sent to us or anyone else.
        </p>
        <p>Everything the app keeps is stored in its own folder on your phone:</p>
        <ul>
          <li>
            the thought you are letting go, until it has passed. Then its words are deleted. For each thought that has
            passed, Kare keeps only when it passed, how long it took, how heavy you said it was, and which sand pit and
            sand it was in, which is what makes its marble in your garden;
          </li>
          <li>
            the name you'd like to be greeted by, the names you give your sand pits, and a picture of each pit's sand so
            it looks as you left it;
          </li>
          <li>your settings, such as sound, your sand, tray and rod, and your notices and reminder.</li>
        </ul>
        <p>
          Clearing the sand, or deleting a sand pit, also deletes its words. If you back up your phone to iCloud or a
          computer, this folder is included in that backup, the same as any other app's data, and is protected by your
          backup's own settings.
        </p>
        <p>
          Kare gives its widgets and its Live Activity a small summary to show on your Home Screen and Lock Screen: a
          sand pit's name, whether it holds a thought, how many have passed and your marbles. Never the words. That stays
          on your phone too.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Sharing a picture",
    body: (
      <p>
        If you choose to share a picture of your sand, Kare makes the picture on your phone and hands it to your phone's
        share sheet. It goes only where you send it. The picture can show the words in the sand at that moment.
      </p>
    ),
  },
  {
    id: "motion",
    title: "Motion and sound",
    body: (
      <p>
        Kare reads your phone's motion sensors so the marbles in your garden roll as you tilt it. These readings are used
        in the moment and are never stored or sent. Kare plays sound but never uses the microphone.
      </p>
    ),
  },
  {
    id: "notifications",
    title: "Notifications",
    body: (
      <>
        <p>
          The first time you let a thought go, Kare asks whether it may send you notifications, and sends them only if
          you say yes. It can then send a quiet notice when a thought has passed while you were away, and one reminder a
          day in the evening. You can turn either off, or move the reminder, in Kare's settings, or turn off all of
          Kare's notifications in your phone's Settings.
        </p>
        <p>
          Notices are scheduled on your phone itself and never include your words. No push service is used, and nothing
          about them leaves your device.
        </p>
      </>
    ),
  },
  {
    id: "premium",
    title: "Kare Premium",
    body: (
      <>
        <p>
          Kare Premium is an optional one-time purchase. It is sold and paid for through Apple, and Kare never sees your
          payment details or Apple ID. Apple's handling of your purchase is covered by the{" "}
          <a href="https://www.apple.com/legal/privacy/">Apple Privacy Policy</a>.
        </p>
        <p>
          To know whether you have Kare Premium, Kare uses <a href="https://www.revenuecat.com/">RevenueCat</a>, a
          purchase service. When the app opens, and when you look at Kare Premium, buy or restore, it contacts RevenueCat
          with:
        </p>
        <ul>
          <li>a random identifier the app makes up. It isn't linked to your name, email or Apple ID;</li>
          <li>your App Store purchase history for Kare;</li>
          <li>
            basic technical details that come with any such request, such as the app version, your phone's system
            version, its App Store country and its IP address.
          </li>
        </ul>
        <p>
          RevenueCat uses this to work out whether you have Kare Premium, and to count how often the Kare Premium screen
          is shown, under the <a href="https://www.revenuecat.com/privacy">RevenueCat Privacy Policy</a>. None of your
          thoughts, names or settings are ever sent.
        </p>
      </>
    ),
  },
  {
    id: "updates",
    title: "Updates",
    body: (
      <p>
        Kare can receive small fixes without a new App Store download. When the app opens, it asks Expo's update
        service, <a href="https://expo.dev/eas">EAS Update</a>, whether one is ready. That request carries the app's
        version, your phone's system, a random identifier for this install of Kare and, as with any request, your IP
        address. It is used only to send the right update, under the{" "}
        <a href="https://expo.dev/privacy">Expo Privacy Policy</a>. None of your thoughts, names or settings are sent.
      </p>
    ),
  },
  {
    id: "usage",
    title: "Usage statistics",
    body: (
      <>
        <p>
          To learn which parts of Kare help, the app sends anonymous usage statistics to{" "}
          <a href="https://posthog.com/">PostHog</a>, an analytics service, which stores them in the United States. They
          say what happened in the app, never what you wrote:
        </p>
        <ul>
          <li>
            that a thought was written, let go or passed, and how heavy you said it was; that sand was cleared, or a sand
            pit added or removed, and how many you have;
          </li>
          <li>
            which sand, tray, rod, sound and breathing you choose, which screens and sheets you open, and when you use
            night mode or a widget;
          </li>
          <li>
            whether you allowed notifications or turned the reminder on, when Kare asks for a rating, when the Kare
            Premium screen is shown, and whether a purchase or restore went through;
          </li>
          <li>when the app is installed, opened and closed.</li>
        </ul>
        <p>
          Each comes with the app's version, your phone's model and system version, its language and time zone, and a
          random identifier for this install of Kare. That identifier isn't linked to your name, email, Apple ID or the
          one RevenueCat uses, and Kare never builds a profile of you. As with any request, PostHog sees your IP address;
          Kare asks it not to work out your location, and PostHog doesn't store the address. Statistics are handled
          under the <a href="https://posthog.com/privacy">PostHog Privacy Policy</a>.
        </p>
        <p>
          You can turn usage statistics off at any time in Kare's settings, with Share anonymous usage. Nothing more is
          sent after that.
        </p>
      </>
    ),
  },
  {
    id: "links",
    title: "Links",
    body: (
      <p>
        If you choose to look for a helpline from inside the app, Kare opens{" "}
        <a href="https://findahelpline.com">findahelpline.com</a> in your browser, at the page for your country and in
        your language where the site has it, so the link includes your country. That site's own privacy policy applies
        there.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Kare isn't directed at children under 13. It never asks anyone, of any age, for an email, an account or
        anything else that says who they are, and nothing that does ever leaves the phone.
      </p>
    ),
  },
  {
    id: "deleting",
    title: "Deleting your data",
    body: (
      <>
        <p>
          Start over, in Kare's settings, deletes your sand, marbles, name and choices at once, and gives Kare a new
          random identifier for usage statistics, so what is sent afterwards can't be tied to what was sent before.
          Deleting Kare from your phone deletes everything it kept. Any backups you have made keep their copy until you
          delete those backups. Usage statistics already sent carry nothing that says who you are, so we can't pick
          yours out afterwards.
        </p>
        <p>
          Kare Premium belongs to your Apple Account, so neither of these loses it: choose Restore in Kare's settings to
          bring it back. To ask RevenueCat to delete the purchase records tied to your random identifier, write to us
          and we'll pass the request on.
        </p>
      </>
    ),
  },
  {
    id: "website",
    title: "This website",
    body: (
      <p>
        This site sets no cookies and runs no analytics. Like any website, it is delivered by a host, Cloudflare, which
        sees your IP address and the page you asked for in order to send it. Anything you write into the sand on our
        home page stays in your browser and is never sent.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: <p>If this policy changes, the new version will appear on this page with a new effective date.</p>,
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions, or anything you'd like removed: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <LegalPage
      eyebrow="Kare · Effective 22 October 2026"
      title="Privacy"
      lede="Your thoughts stay on your phone. Once a thought has passed, its words are gone."
      sections={sections}
    />
  );
}
