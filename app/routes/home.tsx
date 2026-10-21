import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { Link } from "react-router";

import type { Route } from "./+types/home";
import { AppStoreButton } from "~/components/app-store-button";
import { MarbleGarden } from "~/components/marble-garden";
import { Phone, Shot } from "~/components/phone";
import { Reveal } from "~/components/reveal";
import { SandTray, type SandTrayHandle } from "~/components/sand-tray";
import { SiteFooter } from "~/components/site-footer";
import { SiteHeader } from "~/components/site-header";
import { RODS, SANDS, TRAYS, look } from "~/sand/looks";
import type { Phase } from "~/sand/tray-engine";
import { pageMeta } from "~/site";
import "~/styles/home.css";

export function meta({}: Route.MetaArgs) {
  return pageMeta(
    "Kare: a sand garden for overthinking",
    "Write down what's going round in your head and watch the sand smooth it away. No account, no streaks. Once it's gone, it's gone.",
    "/",
  );
}

const STARTER = "what if I'm not enough";

export default function Home() {
  const [marbles, setMarbles] = useState(9);
  return (
    <>
      <SiteHeader />
      <main>
        <Hero onPassed={() => setMarbles((n) => n + 1)} />
        <Steps />
        <Garden count={marbles} />
        <Night />
        <PitsAndSounds />
        <Looks />
        <Private />
        <Premium />
        <Closing />
      </main>
      <SiteFooter />
    </>
  );
}

const PHASE_LINES: Record<Phase, { line: string; caption: string }> = {
  idle: { line: "Draw in the sand, or write something down.", caption: "Try it here" },
  carving: { line: "Into the sand.", caption: "" },
  holding: { line: "It's in the sand now.", caption: "" },
  passing: { line: "It's passing.", caption: "You don't have to watch" },
  passed: { line: "It has passed.", caption: "A marble for your garden" },
};

function Hero({ onPassed }: { onPassed: () => void }) {
  const tray = useRef<SandTrayHandle>(null);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [night, setNight] = useState(false);
  const heroLook = useMemo(() => look("ivory", "walnut", "brass"), []);
  const busy = phase === "carving";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    tray.current?.inscribe(text, 22);
    setText("");
  };

  return (
    <section className="hero" data-night={night}>
      <div className="hero-glow" aria-hidden="true" />
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <motion.p
            className="caption"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          >
            A sand garden for overthinking
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            Write it in the sand. <span>Watch it pass.</span>
          </motion.h1>
          <motion.p
            className="hero-lede"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            Kare is for the thoughts you don't want to keep. The ones still going round your head when you're trying to
            sleep.
          </motion.p>
          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <AppStoreButton />
            <p className="caption">Free on iPhone</p>
          </motion.div>
        </div>

        <motion.div
          className="hero-stage"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
        >
          <SandTray
            ref={tray}
            look={heroLook}
            night={night}
            initialText={STARTER}
            passSeconds={30}
            followPointer
            fallback="/media/hero-tray.webp"
            label="A walnut tray of ivory sand. Words written in it are slowly raked away by a turning brass rod."
            className="hero-tray"
            onPhase={(p) => {
              setPhase(p);
              if (p === "passed") onPassed();
            }}
          />
          <div className="hero-status" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              >
                <p className="hero-status-line">{PHASE_LINES[phase].line}</p>
                {PHASE_LINES[phase].caption && <p className="caption">{PHASE_LINES[phase].caption}</p>}
              </motion.div>
            </AnimatePresence>
          </div>
          <form className="composer" onSubmit={submit}>
            <label className="visually-hidden" htmlFor="thought">
              What would you like to let go of?
            </label>
            <input
              id="thought"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={60}
              placeholder="What would you like to let go of?"
              autoComplete="off"
              enterKeyHint="done"
            />
            <button className="pill" type="submit" disabled={!text.trim() || busy}>
              Into the sand
            </button>
          </form>
          <button
            type="button"
            className="moon"
            aria-pressed={night}
            aria-label={night ? "Day light" : "Night light"}
            onClick={() => setNight((n) => !n)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              {night ? (
                <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
                </g>
              ) : (
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1Z"
                />
              )}
            </svg>
          </button>
          <p className="visually-hidden">Words you write here stay in this page. Nothing is sent anywhere.</p>
        </motion.div>
      </div>
      <p className="hero-privacy caption">Nothing you write here leaves this page</p>
    </section>
  );
}

const STEPS = [
  {
    shot: "composer",
    alt: "Kare asking what you'd like to let go of this morning, with a slider for how much it weighs on you",
    title: "Write down whatever's on your mind.",
    body: "The email you keep rereading. The call you're putting off. That thing you said at the party. A few words are enough, and there's nothing to fix or sort out.",
  },
  {
    shot: "hero",
    alt: "The words “what if I'm not enough” carved into ivory sand in a walnut tray",
    title: "Pour some sand over it.",
    body: "Say how much it weighs on you, and the words go into the sand. The sand moves like real sand: draw in it with your finger if you like.",
  },
  {
    shot: "smooth",
    alt: "A rod turning slowly through the sand, smoothing the words away",
    title: "It takes its own time.",
    body: "The rod goes round and the sand slowly smooths the words away. You don't have to watch. It keeps going while you're away, and Kare can let you know when it's done.",
  },
  {
    shot: "passed",
    alt: "Smooth raked sand with a single marble, and the words “It has passed.”",
    title: "Once it's gone, it's gone.",
    body: "Its words are deleted for good. Nobody reads them, not even you later. All that's left is a marble for your garden.",
  },
];

function Steps() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  const progress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length))));

  return (
    <section className="steps" aria-labelledby="steps-title">
      <div className="wrap steps-intro">
        <Reveal>
          <p className="caption">Get it out of your head</p>
          <h2 id="steps-title">No account, no streaks, no prompts.</h2>
        </Reveal>
      </div>
      <div className="steps-track" ref={ref}>
        <div className="steps-sticky">
          <div className="wrap steps-grid">
            <ol className="steps-list">
              {STEPS.map((s, i) => (
                <li key={s.shot} data-active={i === active}>
                  <span className="steps-number caption">0{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
              <motion.span className="steps-progress" style={{ height: progress }} aria-hidden="true" />
            </ol>
            <div className="steps-phone">
              <Phone>
                {STEPS.map((s, i) => (
                  <div key={s.shot} className="steps-shot" data-active={i === active}>
                    <Shot name={s.shot} alt={s.alt} />
                  </div>
                ))}
              </Phone>
            </div>
          </div>
        </div>
      </div>
      <ol className="wrap steps-mobile">
        {STEPS.map((s, i) => (
          <li key={s.shot}>
            <Reveal>
              <Phone className="small">
                <Shot name={s.shot} alt={s.alt} />
              </Phone>
              <span className="steps-number caption">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Garden({ count }: { count: number }) {
  return (
    <section className="garden" aria-labelledby="garden-title">
      <div className="wrap garden-grid">
        <Reveal className="garden-copy">
          <p className="caption">A little sand garden</p>
          <h2 id="garden-title">Every thought you let go leaves a marble.</h2>
          <p>
            They gather in a wooden garden, one for each thing you've put down, and roll when you tilt your phone. Let
            something go in the tray above and a new one will join them.
          </p>
          <p className="garden-count caption">
            {count} {count === 1 ? "marble" : "marbles"} so far
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <MarbleGarden count={count} />
        </Reveal>
      </div>
    </section>
  );
}

function Night() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const glow = useTransform(scrollYProgress, [0.15, 0.5], [0, 1]);
  return (
    <section className="night" ref={ref} aria-labelledby="night-title">
      <motion.div className="night-bg" style={{ y }} aria-hidden="true" />
      <motion.div className="night-lamp" style={{ opacity: glow }} aria-hidden="true" />
      <div className="wrap night-grid">
        <Reveal className="night-phone">
          <Phone>
            <Shot name="night" alt="Kare at night: the tray lit by a low warm lamp, words still in the sand" />
          </Phone>
        </Reveal>
        <Reveal className="night-copy" delay={0.1}>
          <p className="caption">Before you sleep</p>
          <h2 id="night-title">Leave it on your bedside table.</h2>
          <p>
            Can't switch off tonight? Write down what's going round in your head and put your phone down. At night Kare
            dims right down, and the sand keeps going while you sleep.
          </p>
          <p>
            If you like, it'll let you know quietly when a thought has passed. There's a simple breathing guide too, for
            when it all gets a bit much.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function PitsAndSounds() {
  return (
    <section className="pair" aria-label="Sand pits and sounds">
      <div className="wrap pair-grid">
        <Reveal className="pair-card">
          <div className="pair-phone">
            <Phone className="small">
              <Shot name="pits" alt="Sand pits named work, home and sleep, each with its own tray" />
            </Phone>
          </div>
          <p className="caption">Sand pits</p>
          <h3>One for each part of your life.</h3>
          <p>
            With Kare Premium, keep separate sand pits for work, home or the people you love. Each one just counts the thoughts that have
            passed through it. Nothing else.
          </p>
        </Reveal>
        <Reveal className="pair-card" delay={0.12}>
          <div className="pair-phone">
            <Phone className="small">
              <Shot name="sounds" alt="Choosing a soundscape: rain, sea, garden, dawn, forest and more" />
            </Phone>
          </div>
          <p className="caption">Sounds</p>
          <h3>Rain, the sea, a forest at dawn.</h3>
          <p>
            Listen to the rod moving through the sand. With Kare Premium, play one of eleven soundscapes underneath, and
            keep it playing after you close Kare.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Swatches<T extends { id: string; name: string }>({
  label,
  items,
  value,
  onChange,
  paint,
}: {
  label: string;
  items: T[];
  value: string;
  onChange: (id: string) => void;
  paint: (item: T) => React.CSSProperties;
}) {
  return (
    <fieldset className="swatches">
      <legend className="caption">{label}</legend>
      <div className="swatch-row">
        {items.map((item) => (
          <label key={item.id} className="swatch" title={item.name}>
            <input
              type="radio"
              name={label}
              value={item.id}
              checked={value === item.id}
              onChange={() => onChange(item.id)}
            />
            <span className="swatch-chip" style={paint(item)} />
            <span className="swatch-name">{item.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Looks() {
  const [sand, setSand] = useState("marble");
  const [tray, setTray] = useState("oak");
  const [rod, setRod] = useState("steel");
  const current = useMemo(() => look(sand, tray, rod), [sand, tray, rod]);
  return (
    <section className="looks" aria-labelledby="looks-title">
      <div className="wrap looks-grid">
        <Reveal className="looks-copy">
          <p className="caption">Make it yours</p>
          <h2 id="looks-title">Eight sands. Eight trays. Six rods.</h2>
          <p>Pick the ones that feel calm to you. Try them here.</p>
          <Swatches
            label="Sand"
            items={SANDS}
            value={sand}
            onChange={setSand}
            paint={(s) => ({ backgroundImage: `url(${s.swatch})` })}
          />
          <Swatches
            label="Tray"
            items={TRAYS}
            value={tray}
            onChange={setTray}
            paint={(t) => ({ background: `radial-gradient(circle at 35% 30%, ${t.swatch[0]}, ${t.swatch[1]})` })}
          />
          <Swatches
            label="Rod"
            items={RODS}
            value={rod}
            onChange={setRod}
            paint={(r) => ({ background: `linear-gradient(135deg, ${r.swatch[0]}, ${r.swatch[1]})` })}
          />
        </Reveal>
        <Reveal className="looks-stage" delay={0.1}>
          <SandTray
            look={current}
            initialText="let it go"
            passSeconds={40}
            fallback="/media/hero-tray.webp"
            label={`A ${current.tray.name.toLowerCase()} tray of ${current.sand.name.toLowerCase()} sand with a ${current.rod.name.toLowerCase()} rod`}
            className="looks-tray"
          />
          <p className="caption looks-name">
            {current.sand.name} · {current.tray.name} · {current.rod.name}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

const PROMISES = [
  ["No account", "Open it and write. There's nothing to sign up for."],
  ["No analytics", "We don't count what you do in Kare, or how often."],
  ["No ads, no tracking", "Nothing follows you in or out of the app."],
  ["Stays on your phone", "What you write is never sent anywhere, and is deleted once it passes."],
];

function Private() {
  return (
    <section className="private" aria-labelledby="private-title">
      <div className="wrap">
        <Reveal className="private-head">
          <p className="caption">Your thoughts stay yours</p>
          <h2 id="private-title">Nobody reads it. Not even you, later.</h2>
        </Reveal>
        <ul className="private-list">
          {PROMISES.map(([title, body], i) => (
            <li key={title}>
              <Reveal delay={i * 0.08}>
                <h3>{title}</h3>
                <p>{body}</p>
              </Reveal>
            </li>
          ))}
        </ul>
        <Reveal>
          <p className="private-more">
            <Link to="/privacy">Read exactly what Kare keeps</Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Premium() {
  return (
    <section className="premium" aria-labelledby="premium-title">
      <div className="wrap">
        <Reveal className="premium-head">
          <p className="caption">Kare Premium</p>
          <h2 id="premium-title">Pay once. Keep it for good.</h2>
          <p>
            Kare is free with one sand pit. Kare Premium is a one-time purchase, not a subscription: nothing renews, and
            you can restore it on a new iPhone any time.
          </p>
        </Reveal>
        <div className="premium-grid">
          <Reveal className="plan">
            <h3>Kare</h3>
            <p className="caption">Free</p>
            <ul>
              <li>Write a thought and watch it pass</li>
              <li>A sand pit with sand that moves like real sand</li>
              <li>Your marble garden</li>
              <li>The breathing guide and night light</li>
              <li>A quiet notice when a thought has passed</li>
            </ul>
          </Reveal>
          <Reveal className="plan plan-premium" delay={0.1}>
            <h3>Kare Premium</h3>
            <p className="caption">One-time purchase</p>
            <ul>
              <li>As many sand pits as you like</li>
              <li>Eleven soundscapes to play under the sand</li>
              <li>Sound that keeps playing when Kare is closed, with a Live Activity on your Lock Screen</li>
              <li>The Home Screen widget</li>
              <li>Five more sands, five more trays and four more rods</li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="closing" aria-labelledby="closing-title">
      <div className="wrap closing-grid">
        <Reveal className="closing-phone">
          <Phone>
            <video
              src="/media/preview.mp4"
              poster="/media/preview-poster.webp"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="A thought written, raked away and turned into a marble in Kare"
            />
          </Phone>
        </Reveal>
        <Reveal className="closing-copy" delay={0.1}>
          <h2 id="closing-title">Get it out of your head.</h2>
          <p>
            Write it down, pour some sand over it, and let it go. Kare is free on iPhone, with Kare Premium as a single
            purchase if you'd like more.
          </p>
          <AppStoreButton />
        </Reveal>
      </div>
    </section>
  );
}
