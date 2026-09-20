import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";
import ClassCard from "../components/ClassCard";
import { Button } from "../components/ui";

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const STYLE_MARQUEE = [
  "Hatha",
  "Vinyasa",
  "Power Yoga",
  "Yin",
  "Restorative",
  "Ashtanga",
  "Kundalini",
  "Gentle Yoga",
  "Morning Yoga",
];

const STEPS = [
  {
    n: "01",
    title: "Open Daily Yoga",
    body: "One calm screen shows today's class — instructor, duration, level. No browsing fatigue, no decisions before coffee.",
  },
  {
    n: "02",
    title: "Join & practice",
    body: "Follow a guided sequence with pose visuals, breathing cues, and a soft progress bar. Pause any time. Nothing to achieve.",
  },
  {
    n: "03",
    title: "Complete & return",
    body: "Your practice is remembered. Continue where you left off, browse by goal, and watch your history quietly grow.",
  },
];

const GOALS = [
  { name: "Flexibility", desc: "Ease and range of motion" },
  { name: "Stress Relief", desc: "Calm the nervous system" },
  { name: "Strength", desc: "Steady physical strength" },
  { name: "Relaxation", desc: "Rest and restore" },
  { name: "Mobility", desc: "Joint-friendly movement" },
  { name: "Balance", desc: "Stability and focus" },
  { name: "Better Sleep", desc: "Wind-down evening practice" },
  { name: "Morning Energy", desc: "Breath to start the day" },
];

const TESTIMONIALS = [
  {
    quote:
      "The Daily Yoga button removed every excuse I had. I open the app, the class is already chosen, and fifteen minutes later my day has started properly.",
    name: "Maya C.",
    role: "Student · 94 classes completed",
  },
  {
    quote:
      "I sketch a class idea, the AI drafts the sequence, and I refine every pose before anything is published. It feels like having a teaching assistant, not a replacement.",
    name: "Asha R.",
    role: "Instructor · Hatha & Vinyasa",
  },
  {
    quote:
      "As someone who was intimidated by studios, practicing at home with clear pose guidance and honest, no-hype language changed everything for me.",
    name: "Rohan D.",
    role: "Student · Beginner track",
  },
];

const FAQS = [
  {
    q: "Is Yoga Studio suitable for complete beginners?",
    a: "Yes. Filter by Beginner level and 15-minute durations. Every class includes plain-language instructions, breathing guidance, and gentle cautions — and you're always encouraged to stop if anything feels uncomfortable.",
  },
  {
    q: "What is Daily Yoga?",
    a: "One featured class each day, chosen so you never have to scroll. Open the app, tap Join, and practice. Your completion is tracked automatically.",
  },
  {
    q: "How does AI help instructors?",
    a: "AI drafts class plans, sequences, scripts, and visuals. Instructors review and edit everything in a visual editor, then approve before anything is published. Nothing goes live automatically.",
  },
  {
    q: "Is this medical advice?",
    a: "No. All content is general wellness guidance, never treatment or therapy. For personal health questions, consult a qualified professional.",
  },
];

const STATS = [
  { value: "15–60", label: "minute sessions" },
  { value: "10+", label: "yoga styles" },
  { value: "2", label: "languages (EN · HI)" },
  { value: "100%", label: "human-approved classes" },
];

/* ------------------------------------------------------------------ */
/* Scroll reveal                                                       */
/* ------------------------------------------------------------------ */

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Decorative pieces                                                   */
/* ------------------------------------------------------------------ */

function BreathingOrb() {
  return (
    <div className="pointer-events-none relative mx-auto flex h-56 w-56 items-center justify-center sm:h-72 sm:w-72 md:h-96 md:w-96">
      <div className="animate-breathe absolute inset-0 rounded-full bg-sage/15" />
      <div className="animate-breathe absolute inset-8 rounded-full bg-sage/20 [animation-delay:0.6s]" />
      <div className="animate-breathe-inner absolute inset-16 rounded-full bg-gradient-to-br from-sage-leaf/50 to-sage/30" />
      <svg
        viewBox="0 0 200 200"
        className="relative z-10 h-28 w-28 text-sage-deep sm:h-40 sm:w-40 md:h-52 md:w-52"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="100" cy="52" r="17" />
        <path d="M100 69 v28" />
        <path d="M100 82 C 72 88 58 106 50 124 M100 82 C 128 88 142 106 150 124" />
        <path d="M50 124 c 8 8 20 12 30 10 M150 124 c -8 8 -20 12 -30 10" />
        <path d="M100 97 C 70 108 52 126 46 142 c 20 10 40 14 54 14 s 34 -4 54 -14 c -6 -16 -24 -34 -54 -45 z" />
        <path d="M60 150 q 40 14 80 0" />
      </svg>
    </div>
  );
}

function SectionEyebrow({ children }) {
  return (
    <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.35em] text-sage">
      <span className="h-px w-8 bg-sage/50" />
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const { isAuthenticated, homePath } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    api
      .get("/yoga/classes", { params: { pageSize: 6 } })
      .then((r) => setFeatured(r.data.data?.items || []))
      .catch(() => setFeatured([]));
  }, []);

  if (isAuthenticated) {
    return <Navigate to={homePath()} replace />;
  }

  const spotlight = featured[0];

  return (
    <div>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 top-10 h-[480px] w-[480px] rounded-full bg-sage/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-64 h-[380px] w-[380px] rounded-full bg-clay/10 blur-3xl" />

        <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-20 pt-8 sm:gap-10 sm:pb-16 sm:pt-12 md:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-4">
          <div className="relative z-10">
            <Reveal>
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-sand bg-white/70 px-3 py-1.5 text-[11px] text-sage-deep shadow-sm backdrop-blur sm:px-4 sm:text-xs">
                <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-sage-leaf" />
                <span className="truncate">Today&apos;s class is live — join in one tap</span>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 font-serif text-4xl leading-[1.04] tracking-tight text-sage-deep sm:mt-6 sm:text-5xl md:text-7xl">
                Move.
                <br />
                Breathe.
                <br />
                <span className="relative inline-block">
                  Balance.
                  <svg
                    viewBox="0 0 220 14"
                    className="absolute -bottom-2 left-0 w-full text-clay/60"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 10 C 60 2 160 2 216 8"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-5 max-w-md text-base leading-relaxed text-sage sm:mt-7 sm:text-lg">
                A daily yoga practice designed to be effortless to start and hard to skip.
                Real instructors, calm design, and honest wellness language.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button className="w-full px-8 py-3.5 text-base sm:w-auto">
                    Join Today&apos;s Yoga
                    <span aria-hidden="true">→</span>
                  </Button>
                </Link>
                <Link
                  to="/login"
                  className="text-center text-sm font-medium text-sage-deep underline decoration-sand decoration-2 underline-offset-8 transition hover:decoration-sage sm:text-left"
                >
                  Explore classes
                </Link>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <dl className="mt-10 grid max-w-md grid-cols-2 gap-x-6 gap-y-5 border-t border-sand pt-6 sm:mt-12 sm:gap-x-8 sm:gap-y-6 sm:pt-8 sm:grid-cols-4">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-serif text-xl text-sage-deep sm:text-2xl">{s.value}</dd>
                    <dd className="mt-1 text-[10px] uppercase tracking-wider text-sage sm:text-[11px]">
                      {s.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <div className="relative mx-auto w-full max-w-sm pb-28 sm:max-w-none sm:pb-16 lg:pb-8">
            <BreathingOrb />
            <Reveal delay={300} className="absolute bottom-0 left-1/2 w-[min(100%,300px)] -translate-x-1/2 sm:w-[340px]">
              <div className="animate-float-slow overflow-hidden rounded-2xl border border-sand/70 bg-white/90 shadow-soft backdrop-blur sm:rounded-3xl">
                {spotlight?.thumbnailUrl ? (
                  <img
                    src={spotlight.thumbnailUrl}
                    alt=""
                    className="h-28 w-full object-cover sm:h-32"
                  />
                ) : null}
                <div className="p-4 sm:p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-clay">
                  Daily Yoga
                </p>
                <p className="mt-2 font-serif text-lg text-sage-deep sm:text-xl">
                  {spotlight?.title || "Morning Balance Flow"}
                </p>
                <p className="mt-1 text-sm text-sage">
                  {spotlight?.instructorName || "Asha Rao"} ·{" "}
                  {spotlight?.durationMinutes || 30} min ·{" "}
                  <span className="capitalize">{spotlight?.level || "beginner"}</span>
                </p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 -space-x-2">
                    {["A", "M", "R"].map((ch) => (
                      <span
                        key={ch}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-sage-mist text-[10px] font-semibold text-sage-deep ring-2 ring-white"
                      >
                        {ch}
                      </span>
                    ))}
                    <span className="flex h-7 items-center rounded-full bg-sage-deep px-2.5 text-[10px] font-medium text-cream ring-2 ring-white">
                      now
                    </span>
                  </div>
                  <Link to="/register" className="shrink-0 text-xs font-semibold text-clay hover:underline">
                    Join →
                  </Link>
                </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Style marquee */}
        <div className="border-y border-sand/70 bg-white/60 py-4 backdrop-blur">
          <div className="overflow-hidden">
            <div className="animate-marquee flex w-max gap-10">
              {[...STYLE_MARQUEE, ...STYLE_MARQUEE].map((style, i) => (
                <span
                  key={`${style}-${i}`}
                  className="flex items-center gap-10 whitespace-nowrap font-serif text-lg text-sage/70"
                >
                  {style}
                  <span className="text-clay/50" aria-hidden="true">
                    ✦
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Daily ritual ---------------- */}
      <section id="daily-yoga" className="px-4 py-14 sm:py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionEyebrow>The daily ritual</SectionEyebrow>
            <h2 className="mt-4 max-w-2xl font-serif text-3xl leading-tight text-sage-deep md:text-5xl">
              Designed so the hardest part
              <br className="hidden md:block" /> is already done.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 120}>
                <div className="group relative h-full rounded-[2rem] border border-sand/80 bg-white/70 p-8 transition duration-300 hover:-translate-y-1.5 hover:bg-white hover:shadow-soft">
                  <span className="font-serif text-5xl text-sage/20 transition group-hover:text-clay/40">
                    {step.n}
                  </span>
                  <h3 className="mt-5 font-serif text-2xl text-sage-deep">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-sage">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Featured classes ---------------- */}
      <section id="classes" className="relative overflow-hidden bg-sage-deep px-4 py-14 text-cream sm:py-20 md:py-24">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sage-leaf/10 blur-3xl" />
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.35em] text-sand">
                  <span className="h-px w-8 bg-sand/50" />
                  The library
                </p>
                <h2 className="mt-4 font-serif text-3xl md:text-5xl">Classes worth returning to</h2>
              </div>
              <Link
                to="/login"
                className="text-sm text-sand underline decoration-sand/40 underline-offset-8 transition hover:text-cream"
              >
                Sign in to browse everything
              </Link>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.length ? (
              featured.slice(0, 6).map((c, i) => (
                <Reveal key={c.id} delay={i * 90}>
                  <ClassCard item={c} to="/login" />
                </Reveal>
              ))
            ) : (
              <p className="col-span-full text-sand">
                Published classes appear here. The seeded Morning Balance Flow shows up after sign-in.
              </p>
            )}
          </div>
          <Reveal delay={200}>
            <div className="mt-14 grid gap-3 sm:grid-cols-4">
              {[15, 30, 45, 60].map((d) => (
                <Link
                  key={d}
                  to="/login"
                  className="group flex items-center justify-between rounded-2xl border border-sand/20 bg-white/5 px-5 py-4 text-sm transition hover:bg-white/10"
                >
                  <span>{d} minute sessions</span>
                  <span className="text-sand/60 transition group-hover:translate-x-1" aria-hidden="true">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Goals ---------------- */}
      <section className="px-4 py-14 sm:py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionEyebrow>Find your focus</SectionEyebrow>
            <h2 className="mt-4 font-serif text-3xl text-sage-deep md:text-5xl">
              Practice with a purpose
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GOALS.map((g, i) => (
              <Reveal key={g.name} delay={i * 60}>
                <Link
                  to="/register"
                  className="group block rounded-[1.75rem] border border-sand bg-white/70 p-6 transition duration-300 hover:-translate-y-1 hover:border-sage/30 hover:bg-white hover:shadow-soft"
                >
                  <p className="font-serif text-xl text-sage-deep">{g.name}</p>
                  <p className="mt-1.5 text-sm text-sage">{g.desc}</p>
                  <p className="mt-4 text-xs font-semibold text-clay opacity-0 transition group-hover:opacity-100">
                    Explore →
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Instructors / AI ---------------- */}
      <section id="how-it-works" className="border-y border-sand/70 bg-white/50 px-4 py-14 sm:py-20 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <SectionEyebrow>For instructors</SectionEyebrow>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-sage-deep md:text-5xl">
              AI drafts.
              <br />
              You direct.
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-sage">
              Describe the class — duration, level, style, goal — and get a complete draft:
              sequence, script, pose visuals, thumbnail. Then shape every second of it in the
              visual editor. Nothing is ever published without your approval.
            </p>
            <div className="mt-8 space-y-4">
              {[
                ["Guided wizard", "Duration, level, style, goal, language — in under a minute."],
                ["Sequence editor", "Drag, reorder, retime, and rewrite every pose."],
                ["Honest generation", "Background jobs with real status. Failures never fake success."],
              ].map(([title, body]) => (
                <div key={title} className="flex gap-4">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-mist text-xs text-sage-deep">
                    ✓
                  </span>
                  <div>
                    <p className="font-medium text-sage-deep">{title}</p>
                    <p className="text-sm text-sage">{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/register" className="mt-10 inline-block">
              <Button variant="secondary" className="px-8 py-3">
                Become an instructor
              </Button>
            </Link>
          </Reveal>

          <Reveal delay={150}>
            {/* Mock class-builder card */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-sage/10 to-clay/10 blur-xl" />
              <div className="relative rounded-[2rem] border border-sand bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between border-b border-sand/70 pb-4">
                  <p className="font-serif text-lg text-sage-deep">Evening Unwind · 30 min</p>
                  <span className="rounded-full bg-sage-mist px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-sage-deep">
                    Draft
                  </span>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {[
                    ["Centering", "2 min", "bg-sage-mist"],
                    ["Pranayama", "3 min", "bg-sage-mist"],
                    ["Cat-Cow", "2 min", "bg-sand/50"],
                    ["Seated Forward Fold", "3 min", "bg-sand/50"],
                    ["Supine Twist", "3 min", "bg-sage-mist"],
                    ["Shavasana", "5 min", "bg-clay/10"],
                  ].map(([pose, time, bg]) => (
                    <li
                      key={pose}
                      className={`flex items-center justify-between rounded-xl ${bg} px-4 py-2.5 text-sm`}
                    >
                      <span className="text-sage-deep">{pose}</span>
                      <span className="text-xs text-sage">{time}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between rounded-xl bg-sage-deep px-4 py-3 text-cream">
                  <span className="text-xs">✓ Plan generated · awaiting your review</span>
                  <span className="text-xs font-semibold">Preview →</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Testimonials ---------------- */}
      <section className="px-4 py-14 sm:py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionEyebrow>Voices from the mat</SectionEyebrow>
            <h2 className="mt-4 font-serif text-3xl text-sage-deep md:text-5xl">
              Quiet practice, real momentum
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 120}>
                <figure className="flex h-full flex-col rounded-[2rem] border border-sand bg-white/80 p-8">
                  <span className="font-serif text-5xl leading-none text-clay/30" aria-hidden="true">
                    “
                  </span>
                  <blockquote className="mt-2 flex-1 text-[15px] leading-relaxed text-sage-deep">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-6 border-t border-sand/70 pt-4">
                    <p className="font-medium text-sage-deep">{t.name}</p>
                    <p className="text-xs text-sage">{t.role}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="border-t border-sand/70 bg-white/50 px-4 py-14 sm:py-20 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <SectionEyebrow>Questions</SectionEyebrow>
            <h2 className="mt-4 font-serif text-3xl text-sage-deep md:text-4xl">
              Before you unroll the mat
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-sage">
              Everything here is general wellness guidance — calm, honest, and never medical
              advice.
            </p>
          </Reveal>
          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <Reveal key={f.q} delay={i * 80}>
                  <div
                    className={`rounded-2xl border transition ${
                      open ? "border-sage/30 bg-white shadow-soft" : "border-sand bg-white/60"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? -1 : i)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                      aria-expanded={open}
                    >
                      <span className="font-medium text-sage-deep">{f.q}</span>
                      <span
                        className={`text-xl text-sage transition-transform duration-300 ${
                          open ? "rotate-45" : ""
                        }`}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>
                    {open ? (
                      <p className="px-6 pb-6 text-sm leading-relaxed text-sage">{f.a}</p>
                    ) : null}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section id="instructors" className="px-4 py-14 sm:py-20 md:py-24">
        <Reveal>
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-sage-deep px-5 py-14 text-center text-cream sm:rounded-[3rem] sm:px-8 sm:py-20 md:px-16">
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-sage-leaf/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-clay/20 blur-3xl" />
            <p className="relative text-xs uppercase tracking-[0.4em] text-sand">Daily Yoga</p>
            <h2 className="relative mx-auto mt-5 max-w-2xl font-serif text-3xl leading-tight sm:text-4xl md:text-6xl">
              Tomorrow morning, your class will be waiting.
            </h2>
            <p className="relative mx-auto mt-5 max-w-md text-sm text-sand sm:text-base">
              Free to join. One tap to practice. Built with care at{" "}
              <span className="text-cream">yogastudio.airepro.in</span>.
            </p>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link to="/register" className="w-full sm:w-auto">
                <Button className="w-full bg-cream px-9 py-3.5 text-base text-sage-deep hover:bg-white sm:w-auto">
                  Start practicing free
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="ghost" className="w-full text-cream hover:bg-white/10 sm:w-auto">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
