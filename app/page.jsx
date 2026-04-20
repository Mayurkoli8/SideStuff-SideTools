"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowRight, ArrowUpRight, Zap, Bot, TrendingUp, X, Send,
  Check, ChevronRight, Sparkles,
  MessageSquare, Workflow,
  AlertCircle, Mail, MessageCircle, Users, Webhook, Database,
  Bell, FileText, Calendar, Globe, ShoppingCart, CreditCard,
  Loader,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  doc, setDoc, getDoc, updateDoc, increment, serverTimestamp,
} from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase";

/* ──────────────────────────────────────────────────────────
   SIDESTUFF — LANDING PAGE
   Aesthetic: brutalist terminal / indie builder underground
   ────────────────────────────────────────────────────────── */

const LIME = "#d4ff00";
const BG = "#0a0a0a";

/* ---------- AI helper — calls server-side /api/ai (Gemini) ---------- */
async function callAI({ user, system, history = [], maxTokens = 1200, jsonMode = false }) {
  const messages = [...history, { role: "user", content: user }];
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system, maxTokens, jsonMode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API ${res.status}`);
  }
  const data = await res.json();
  return data.text || "";
}

function extractJSON(text) {
  const cleaned = text.replace(/```(?:json)?/g, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("no json found");
  return JSON.parse(cleaned.slice(first, last + 1));
}

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const safeDocId = (email) =>
  email.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 120);

/* ---------- icon mapping for automation flow ---------- */
function iconFor(typeOrAction = "") {
  const t = (typeOrAction || "").toLowerCase();
  if (/(form|submit|survey|input)/.test(t)) return FileText;
  if (/(whatsapp|sms|text|message)/.test(t)) return MessageCircle;
  if (/(email|mail|gmail)/.test(t)) return Mail;
  if (/(crm|hubspot|contact|lead|customer)/.test(t)) return Users;
  if (/(webhook|http|api|fetch|request)/.test(t)) return Webhook;
  if (/(database|db|store|save|record|sheet)/.test(t)) return Database;
  if (/(notif|alert|push|ping)/.test(t)) return Bell;
  if (/(calendar|schedule|event|meeting)/.test(t)) return Calendar;
  if (/(slack|discord|chat)/.test(t)) return MessageSquare;
  if (/(web|url|site|browser)/.test(t)) return Globe;
  if (/(cart|order|ecom|shopify)/.test(t)) return ShoppingCart;
  if (/(pay|stripe|invoice|billing)/.test(t)) return CreditCard;
  if (/(ai|gpt|llm|gemini|claude)/.test(t)) return Sparkles;
  return Zap;
}

/* ────────────────────────── APP ────────────────────────── */

export default function App() {
  const [openTool, setOpenTool] = useState(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinedCount, setJoinedCount] = useState(0);
  const [waitlistSource, setWaitlistSource] = useState("hero");

  // Load joined state + counter
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem("ss_joined") === "1") {
        setJoined(true);
      }
    } catch {}

    (async () => {
      if (!firebaseReady || !db) return;
      try {
        const snap = await getDoc(doc(db, "counters", "waitlist"));
        if (snap.exists()) {
          setJoinedCount(Number(snap.data().count) || 0);
        }
      } catch {}
    })();
  }, []);

  const handleJoined = useCallback(async (email, source) => {
    const e = email.trim().toLowerCase();
    if (firebaseReady && db) {
      try {
        await setDoc(doc(db, "waitlist", safeDocId(e)), {
          email: e,
          source,
          created_at: serverTimestamp(),
        });
        try {
          await updateDoc(doc(db, "counters", "waitlist"), { count: increment(1) });
        } catch {
          await setDoc(doc(db, "counters", "waitlist"), { count: 1 });
        }
        setJoinedCount((c) => c + 1);
      } catch (err) {
        console.error("firestore write failed", err);
        throw err;
      }
    }
    try { localStorage.setItem("ss_joined", "1"); } catch {}
    setJoined(true);
  }, []);

  const openWaitlist = (source = "hero") => {
    setWaitlistSource(source);
    setShowWaitlist(true);
  };

  return (
    <div className="min-h-screen text-neutral-100 noise" style={{ background: BG }}>
      <Nav onJoin={() => openWaitlist("nav")} joined={joined} />
      <Hero onJoin={() => openWaitlist("hero")} joined={joined} joinedCount={joinedCount} />
      <ToolsSection onOpen={setOpenTool} />
      <Manifesto />
      <FinalCTA onJoin={() => openWaitlist("final")} joined={joined} />
      <Footer />

      {openTool && (
        <ToolModal
          tool={openTool}
          onClose={() => setOpenTool(null)}
          onJoinRequest={(src) => { setOpenTool(null); openWaitlist(src); }}
          joined={joined}
        />
      )}

      {showWaitlist && (
        <WaitlistModal
          onClose={() => setShowWaitlist(false)}
          onJoined={handleJoined}
          source={waitlistSource}
          alreadyJoined={joined}
        />
      )}
    </div>
  );
}

/* ────────────────────────── NAV ────────────────────────── */

function Nav({ onJoin, joined }) {
  return (
    <nav className="sticky top-0 z-30 border-b border-neutral-900/80 backdrop-blur-md bg-[#0a0a0a]/70">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 relative">
            <div className="absolute inset-0 rounded-sm" style={{ background: LIME }} />
            <div className="absolute inset-[3px] bg-black rounded-[1px]" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">sidestuff</span>
          <span className="font-mono text-[10px] text-neutral-500 ml-1 hidden sm:inline">v0.1 · private beta</span>
        </div>
        <div className="flex items-center gap-2">
          <a className="hidden md:inline-flex font-mono text-[11px] uppercase tracking-widest text-neutral-400 hover:text-white px-3 py-2 transition-colors" href="#tools">tools</a>
          <a className="hidden md:inline-flex font-mono text-[11px] uppercase tracking-widest text-neutral-400 hover:text-white px-3 py-2 transition-colors" href="#manifesto">manifesto</a>
          <button
            onClick={onJoin}
            className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 border transition-all"
            style={{
              borderColor: joined ? "#2a2a2a" : LIME,
              color: joined ? "#a3a3a3" : LIME,
            }}
          >
            {joined ? "✓ you're in" : "join waitlist"}
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ────────────────────────── HERO ────────────────────────── */

function Hero({ onJoin, joined, joinedCount }) {
  const tickerItems = [
    "shipping at 2am", "pushing commits sunday", "launching tomorrow",
    "refactoring at lunch", "first paying user", "shipped v0.3",
    "broke prod, fixed prod", "submitted to HN", "iOS build #47",
    "landing page live", "redis finally working", "MRR: $42",
    "domain registered", "stripe connected", "webhook debugging",
    "copy rewrite #9", "logo take 14", "onboarding rebuilt",
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_top,#000_20%,transparent_70%)]" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-20 md:pt-28 pb-24 relative">
        <div className="flex items-center gap-3 mb-12 fade-up">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full opacity-75 pulse-dot" style={{ background: LIME }} />
            <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: LIME }} />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">
            {joinedCount > 0
              ? `${joinedCount.toLocaleString()} builder${joinedCount === 1 ? "" : "s"} on the list`
              : "private beta · limited seats"}
          </span>
          <span className="font-mono text-[11px] text-neutral-700">//</span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 hidden sm:inline">
            opening soon
          </span>
        </div>

        <div className="grid grid-cols-12 gap-6 items-end">
          <div className="col-span-12 lg:col-span-9">
            <h1 className="font-display font-bold leading-[0.88] tracking-tight text-[54px] sm:text-[84px] md:text-[120px] lg:text-[148px] fade-up" style={{ animationDelay: "80ms" }}>
              stop thinking.<br />
              <span className="text-neutral-600">start </span>
              <span className="relative inline-block">
                <span style={{ color: LIME }}>building</span>
                <span className="cursor" aria-hidden />
              </span>
            </h1>
          </div>
          <div className="col-span-12 lg:col-span-3 lg:pb-6 fade-up" style={{ animationDelay: "200ms" }}>
            <div className="border-l-2 pl-4 max-w-sm" style={{ borderColor: LIME }}>
              <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 mb-2">&gt; what_is_this.txt</p>
              <p className="text-neutral-300 text-[15px] leading-relaxed">
                find people actually building things outside the 9 to 5.<br />
                <span className="text-neutral-500">not talking. not planning.</span><br />
                <span className="text-white">building.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-4 fade-up" style={{ animationDelay: "320ms" }}>
          <button
            onClick={onJoin}
            className="group inline-flex items-center gap-3 px-7 py-4 text-[15px] font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: LIME, color: "#0a0a0a" }}
          >
            {joined ? "you're in — see you soon" : "join the waitlist"}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
          </button>
          <a href="#tools" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-[14px]">
            or try the tools first
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="mt-20 border-y border-neutral-900 py-4 overflow-hidden fade-up" style={{ animationDelay: "440ms" }}>
          <div className="flex gap-12 marquee whitespace-nowrap">
            {[...tickerItems, ...tickerItems].map((t, i) => (
              <span key={i} className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 flex items-center gap-3">
                <span style={{ color: LIME }}>●</span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── TOOLS SECTION ────────────────────────── */

const TOOLS = [
  {
    id: "auto",
    number: "01",
    title: "automation builder",
    tagline: "turn a sentence into a workflow",
    description: "describe what you want to automate. get a real workflow diagram. no zapier bloat, no dragging 40 nodes.",
    icon: Workflow,
    cta: "build a workflow",
  },
  {
    id: "clone",
    number: "02",
    title: "ai clone",
    tagline: "a bot that talks like you",
    description: "give it a paragraph about yourself. it becomes a chat assistant with your tone, your goals, your weird opinions.",
    icon: Bot,
    cta: "create a clone",
  },
  {
    id: "sim",
    number: "03",
    title: "startup simulator",
    tagline: "fast-forward your idea by 6 months",
    description: "pitch an idea. see projected users, revenue, the problems you'll hit, and the story of how it plays out.",
    icon: TrendingUp,
    cta: "simulate an idea",
  },
];

function ToolsSection({ onOpen }) {
  return (
    <section id="tools" className="max-w-[1400px] mx-auto px-6 md:px-10 py-24 md:py-32">
      <div className="flex items-end justify-between mb-12 md:mb-16 flex-wrap gap-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
            <span className="w-6 h-px bg-neutral-700" />
            tools · no login · use instantly
          </p>
          <h2 className="font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-[0.92] tracking-tight max-w-3xl">
            three tools.<br />
            <span className="text-neutral-600">one philosophy:</span><br />
            <span style={{ color: LIME }}>ship, don't plan.</span>
          </h2>
        </div>
        <p className="text-neutral-400 max-w-sm text-[14px] leading-relaxed">
          these are a preview of what lives inside sidestuff. try them here. if they click, you'll want in.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-neutral-900">
        {TOOLS.map((t, idx) => <ToolCard key={t.id} tool={t} onOpen={() => onOpen(t.id)} delay={idx * 80} />)}
      </div>
    </section>
  );
}

function ToolCard({ tool, onOpen, delay }) {
  const Icon = tool.icon;
  return (
    <button
      onClick={onOpen}
      className="group relative text-left p-8 md:p-10 border-r border-b border-neutral-900 hover:bg-neutral-950/60 transition-all duration-300 fade-up overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 w-10 h-10 pointer-events-none">
        <div className="absolute top-4 right-4 w-2 h-2 transition-all group-hover:w-3 group-hover:h-3" style={{ background: LIME }} />
      </div>

      <div className="flex items-start justify-between mb-10">
        <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-600">
          {tool.number} / 03
        </span>
        <Icon className="w-5 h-5 text-neutral-600 group-hover:text-[#d4ff00] transition-colors" />
      </div>

      <h3 className="font-display font-bold text-2xl md:text-3xl mb-3 leading-tight">
        {tool.title}
      </h3>
      <p className="text-[13px] uppercase tracking-wider font-mono mb-5" style={{ color: LIME }}>
        {tool.tagline}
      </p>
      <p className="text-neutral-400 leading-relaxed text-[14px] mb-10">
        {tool.description}
      </p>

      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-neutral-300 group-hover:text-white transition-colors">
        {tool.cta}
        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
      </div>
    </button>
  );
}

/* ────────────────────────── MANIFESTO ────────────────────────── */

function Manifesto() {
  const lines = [
    { t: "why is it so hard to find people who are", em: "actually building things?" },
    null,
    { t: "not people who", em: "want to" },
    { t: "not people who", em: "talk about it" },
    null,
    { t: "people who are", em: "doing it. right now." },
    null,
    { t: "shipping at midnight.", dim: true },
    { t: "pushing commits on weekends.", dim: true },
    { t: "launching things nobody asked for.", dim: true },
    null,
    { t: "we built this for", em: "them.", big: true },
    null,
    { t: "no followers.", dim: true },
    { t: "no vanity metrics.", dim: true },
    { t: "no pitch decks.", dim: true },
    { t: "no 'just thinking out loud'.", dim: true },
    null,
    { t: "just", em: "the work", suffix: ", visible, in motion." },
  ];

  return (
    <section id="manifesto" className="relative border-t border-neutral-900">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-24 md:py-36">
        <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 mb-12 flex items-center gap-2">
          <span className="w-6 h-px bg-neutral-700" />
          manifesto · read it out loud if you want
        </p>

        <div className="max-w-4xl">
          {lines.map((line, i) =>
            line === null ? (
              <div key={i} className="h-6 md:h-8" />
            ) : (
              <p
                key={i}
                className={`font-display tracking-tight leading-[1.08] ${
                  line.big
                    ? "text-5xl md:text-7xl lg:text-8xl font-extrabold"
                    : "text-3xl md:text-5xl lg:text-6xl font-semibold"
                } ${line.dim ? "text-neutral-500" : "text-neutral-200"}`}
              >
                {line.t}{" "}
                {line.em && (
                  <span style={{ color: LIME }}>{line.em}</span>
                )}
                {line.suffix}
              </p>
            )
          )}
        </div>

        <div className="mt-20 flex items-center gap-4 font-mono text-[11px] uppercase tracking-widest text-neutral-500">
          <span className="w-8 h-px bg-neutral-700" />
          sidestuff. coming soon.
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── FINAL CTA ────────────────────────── */

function FinalCTA({ onJoin, joined }) {
  return (
    <section className="relative border-t border-neutral-900">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-24 md:py-36 text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 mb-10">
          [ one more thing ]
        </p>
        <h2 className="font-display font-bold text-5xl md:text-7xl lg:text-[120px] leading-[0.9] tracking-tight mb-12">
          if you're building<br />
          something on the side,<br />
          <span style={{ color: LIME }}>you belong here.</span>
        </h2>
        <button
          onClick={onJoin}
          className="group inline-flex items-center gap-4 px-10 py-5 text-[16px] font-semibold transition-all hover:-translate-y-1"
          style={{ background: LIME, color: "#0a0a0a" }}
        >
          {joined ? "you're in ✓" : "join the waitlist"}
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
        </button>
        <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-600 mt-8">
          email only · no spam · one update when we open
        </p>
      </div>
    </section>
  );
}

/* ────────────────────────── FOOTER ────────────────────────── */

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-neutral-900 py-10">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3" style={{ background: LIME }} />
          <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">
            sidestuff · built by builders, for builders
          </span>
        </div>
        <span className="font-mono text-[10px] text-neutral-700">
          {year} · v0.1 · we see you shipping
        </span>
      </div>
    </footer>
  );
}

/* ────────────────────────── MODAL SHELL ────────────────────────── */

function Modal({ children, onClose, maxWidth = "max-w-3xl" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-0 md:p-6 overflow-y-auto">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "rgba(5,5,5,0.85)" }}
        onClick={onClose}
      />
      <div className={`relative w-full ${maxWidth} my-auto`}>
        <div className="bg-[#0a0a0a] border border-neutral-800 noise">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── TOOL MODAL ────────────────────────── */

function ToolModal({ tool, onClose, onJoinRequest, joined }) {
  const meta = TOOLS.find((t) => t.id === tool);
  const Icon = meta.icon;

  return (
    <Modal onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex items-start justify-between p-6 md:p-8 border-b border-neutral-900">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 border border-neutral-800 flex items-center justify-center">
            <Icon className="w-5 h-5" style={{ color: LIME }} />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
              tool {meta.number} · live preview
            </p>
            <h3 className="font-display font-bold text-2xl md:text-3xl tracking-tight">{meta.title}</h3>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 md:p-10">
        {tool === "auto" && <AutomationBuilder onSave={() => onJoinRequest("automation")} joined={joined} />}
        {tool === "clone" && <AIClone onSave={() => onJoinRequest("clone")} joined={joined} />}
        {tool === "sim" && <StartupSimulator onSave={() => onJoinRequest("sim")} joined={joined} />}
      </div>
    </Modal>
  );
}

/* ────────────────────────── TOOL 1: AUTOMATION ────────────────────────── */

function AutomationBuilder({ onSave, joined }) {
  const [input, setInput] = useState("when someone fills my contact form, send me a whatsapp and add them to my crm");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showJson, setShowJson] = useState(false);

  const build = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const sys =
        "You convert natural-language automation instructions into structured workflows. Return ONLY valid minified JSON, no markdown, no prose. " +
        "Schema: {\"trigger\":{\"label\":string,\"description\":string},\"steps\":[{\"label\":string,\"type\":string,\"action\":string,\"description\":string}]}. " +
        "Keep labels to 2-3 words. Keep descriptions under 60 chars. 2-5 steps max.";
      const out = await callAI({ user: input.trim(), system: sys, maxTokens: 800, jsonMode: true });
      const parsed = extractJSON(out);
      if (!parsed.trigger || !Array.isArray(parsed.steps)) throw new Error("bad shape");
      setResult(parsed);
    } catch (e) {
      setError("couldn't build that one. try rephrasing?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block font-mono text-[11px] uppercase tracking-widest text-neutral-500 mb-3">
          &gt; describe what to automate
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 p-4 text-[15px] text-white resize-none transition-colors"
          placeholder="when someone fills a form, send whatsapp and add to crm"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={build}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-3 text-[13px] font-semibold transition-all disabled:opacity-50"
          style={{ background: LIME, color: "#0a0a0a" }}
        >
          {loading ? <><Loader className="w-4 h-4 animate-spin" /> building...</> : <><Zap className="w-4 h-4" /> build workflow</>}
        </button>
        {result && (
          <button
            onClick={() => setShowJson((s) => !s)}
            className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 hover:text-white px-3 py-2 border border-neutral-800 hover:border-neutral-700 transition-colors"
          >
            {showJson ? "hide json" : "view json"}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 border border-red-900/60 bg-red-950/20 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="fade-up space-y-6">
          <FlowDiagram data={result} />
          {showJson && (
            <pre className="font-mono text-[12px] bg-neutral-950 border border-neutral-900 p-4 overflow-x-auto text-neutral-300 leading-relaxed">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}

          <div className="border border-dashed border-neutral-800 p-5 flex items-center justify-between flex-wrap gap-4">
            <p className="text-neutral-300 text-[14px]">
              want to <span className="text-white font-semibold">save this workflow</span> &amp; run it for real?
            </p>
            <button
              onClick={onSave}
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-4 py-2 border transition-all"
              style={{ borderColor: LIME, color: LIME }}
            >
              {joined ? "you're in ✓" : "join sidestuff"} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FlowDiagram({ data }) {
  const nodes = [
    { label: data.trigger.label || "trigger", description: data.trigger.description || "", type: "trigger", kind: data.trigger.label },
    ...data.steps.map((s) => ({
      label: s.label || s.action || "action",
      description: s.description || "",
      type: "action",
      kind: (s.type || "") + " " + (s.action || ""),
    })),
  ];

  return (
    <div className="bg-neutral-950 border border-neutral-900 p-6 md:p-8 overflow-x-auto">
      <div className="flex items-stretch gap-0 min-w-max">
        {nodes.map((n, i) => {
          const Icon = iconFor(n.kind);
          const isTrigger = n.type === "trigger";
          return (
            <div key={i} className="flex items-center">
              <div
                className="w-[180px] border p-4 relative fade-up"
                style={{
                  borderColor: isTrigger ? LIME : "#262626",
                  background: isTrigger ? `${LIME}0d` : "transparent",
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">
                    {isTrigger ? "trigger" : `step ${i}`}
                  </span>
                  <Icon className="w-4 h-4" style={{ color: isTrigger ? LIME : "#a3a3a3" }} />
                </div>
                <p className="font-semibold text-[14px] text-white mb-1 capitalize leading-tight">
                  {n.label}
                </p>
                <p className="text-[11px] text-neutral-500 leading-snug line-clamp-2">
                  {n.description}
                </p>
              </div>
              {i < nodes.length - 1 && (
                <svg width="48" height="24" className="shrink-0">
                  <line
                    x1="0" y1="12" x2="42" y2="12"
                    stroke={LIME} strokeWidth="1.5"
                    className="anim-dash"
                  />
                  <polygon points="42,6 48,12 42,18" fill={LIME} />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────── TOOL 2: AI CLONE ────────────────────────── */

function AIClone({ onSave, joined }) {
  const [description, setDescription] = useState("i'm a cs student obsessed with ai. i want to make money online without a boring job. i talk casually, use lowercase, and hate corporate speak.");
  const [systemPrompt, setSystemPrompt] = useState(null);
  const [building, setBuilding] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatting, setChatting] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatting]);

  const buildClone = async () => {
    if (!description.trim()) return;
    setBuilding(true); setError(null);
    try {
      const sys =
        "You design concise system prompts for AI assistants that mimic a described person. " +
        "Output ONLY the system prompt text — no preamble, no markdown, no quotes around it. " +
        "Cover personality, tone, goals, and typical behavior. Keep it under 140 words. Write in second person (You are...).";
      const out = await callAI({ user: description.trim(), system: sys, maxTokens: 500 });
      setSystemPrompt(out.trim());
      setMessages([{ role: "assistant", content: "alright, i'm you now. ask me anything — business ideas, opinions, whatever. what's up?" }]);
    } catch {
      setError("clone machine broke. try again?");
    } finally {
      setBuilding(false);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !systemPrompt || chatting) return;
    const userMsg = { role: "user", content: chatInput.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setChatInput("");
    setChatting(true);
    try {
      const out = await callAI({
        user: userMsg.content,
        system: systemPrompt,
        history: messages,
        maxTokens: 500,
      });
      setMessages([...history, { role: "assistant", content: out.trim() }]);
    } catch {
      setMessages([...history, { role: "assistant", content: "(your clone glitched. one more time?)" }]);
    } finally {
      setChatting(false);
    }
  };

  return (
    <div className="space-y-6">
      {!systemPrompt && (
        <>
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-widest text-neutral-500 mb-3">
              &gt; who are you?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 p-4 text-[15px] text-white resize-none transition-colors"
              placeholder="describe yourself — personality, interests, how you talk, what you want..."
            />
          </div>
          <button
            onClick={buildClone}
            disabled={building}
            className="inline-flex items-center gap-2 px-5 py-3 text-[13px] font-semibold transition-all disabled:opacity-50"
            style={{ background: LIME, color: "#0a0a0a" }}
          >
            {building ? <><Loader className="w-4 h-4 animate-spin" /> cloning...</> : <><Bot className="w-4 h-4" /> create clone</>}
          </button>
          {error && (
            <div className="flex items-start gap-3 p-4 border border-red-900/60 bg-red-950/20 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}
        </>
      )}

      {systemPrompt && (
        <div className="fade-up space-y-5">
          <details className="group border border-neutral-900">
            <summary className="cursor-pointer list-none p-4 flex items-center justify-between text-[12px]">
              <span className="font-mono uppercase tracking-widest text-neutral-400">
                &gt; generated system prompt
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-500 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="px-4 pb-4 text-[13px] text-neutral-300 leading-relaxed font-mono">
              {systemPrompt}
            </div>
          </details>

          <div className="border border-neutral-900 bg-neutral-950">
            <div className="p-3 border-b border-neutral-900 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full pulse-dot" style={{ background: LIME }} />
              <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">
                chatting with your clone
              </span>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-4 py-2.5 text-[14px] leading-relaxed ${
                      m.role === "user"
                        ? "text-neutral-950"
                        : "border border-neutral-800 bg-neutral-900/60 text-neutral-100"
                    }`}
                    style={m.role === "user" ? { background: LIME } : {}}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {chatting && (
                <div className="flex">
                  <div className="px-4 py-2.5 border border-neutral-800 bg-neutral-900/60 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-pulse" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-pulse" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t border-neutral-900 flex items-center">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="ask your clone anything..."
                className="flex-1 bg-transparent px-4 py-3 text-[14px] text-white placeholder:text-neutral-600"
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim() || chatting}
                className="px-4 py-3 text-neutral-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="border border-dashed border-neutral-800 p-5 flex items-center justify-between flex-wrap gap-4">
            <p className="text-neutral-300 text-[14px]">
              want to <span className="text-white font-semibold">turn this into a real bot</span> (web, whatsapp, telegram)?
            </p>
            <button
              onClick={onSave}
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-4 py-2 border transition-all"
              style={{ borderColor: LIME, color: LIME }}
            >
              {joined ? "you're in ✓" : "join sidestuff"} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── TOOL 3: STARTUP SIMULATOR ────────────────────────── */

function StartupSimulator({ onSave, joined }) {
  const [idea, setIdea] = useState("ai tool that writes cold emails to real estate leads");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const simulate = async () => {
    if (!idea.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const sys =
        "You simulate realistic 6-month trajectories for side-project startups. Return ONLY valid minified JSON, no markdown, no prose. " +
        "Schema: {\"name\":string,\"months\":[{\"label\":\"M1\"..\"M6\",\"users\":number,\"revenue\":number}],\"problems\":[string,string,string],\"story\":string,\"peakMrr\":string}. " +
        "Keep story to 3-4 tight sentences, conversational, realistic — not hype. Problems should be specific, not generic. Users and revenue should follow a plausible indie curve (slow start, gradual). months MUST have exactly 6 entries.";
      const out = await callAI({ user: idea.trim(), system: sys, maxTokens: 900, jsonMode: true });
      const parsed = extractJSON(out);
      if (!Array.isArray(parsed.months) || parsed.months.length < 4) throw new Error("bad");
      setResult(parsed);
    } catch {
      setError("simulation crashed. try a different idea?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block font-mono text-[11px] uppercase tracking-widest text-neutral-500 mb-3">
          &gt; pitch your idea in one line
        </label>
        <input
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && simulate()}
          className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 p-4 text-[15px] text-white transition-colors"
          placeholder="ai tool for real estate leads"
        />
      </div>

      <button
        onClick={simulate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-3 text-[13px] font-semibold transition-all disabled:opacity-50"
        style={{ background: LIME, color: "#0a0a0a" }}
      >
        {loading ? <><Loader className="w-4 h-4 animate-spin" /> simulating...</> : <><TrendingUp className="w-4 h-4" /> run simulation</>}
      </button>

      {error && (
        <div className="flex items-start gap-3 p-4 border border-red-900/60 bg-red-950/20 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="fade-up space-y-6">
          <div className="border border-neutral-900 p-6 bg-neutral-950">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-1">projected · 6 months</p>
                <h4 className="font-display font-bold text-xl md:text-2xl tracking-tight">{result.name || "your side project"}</h4>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-1">peak mrr</p>
                <p className="font-display font-bold text-xl md:text-2xl" style={{ color: LIME }}>
                  {result.peakMrr || `$${(result.months[result.months.length - 1]?.revenue ?? 0).toLocaleString()}`}
                </p>
              </div>
            </div>

            <div className="h-52 mt-6 -ml-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.months} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={LIME} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={LIME} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1a1a1a" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="label" stroke="#525252" fontSize={11} tickLine={false} axisLine={{ stroke: "#262626" }} style={{ fontFamily: "var(--font-mono)" }} />
                  <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} style={{ fontFamily: "var(--font-mono)" }} />
                  <Tooltip
                    contentStyle={{ background: "#0a0a0a", border: "1px solid #262626", fontSize: 12, fontFamily: "var(--font-mono)" }}
                    labelStyle={{ color: "#a3a3a3", textTransform: "uppercase", fontSize: 10 }}
                    itemStyle={{ color: LIME }}
                    formatter={(val, name) => [val.toLocaleString(), name === "users" ? "users" : "revenue"]}
                  />
                  <Area type="monotone" dataKey="users" stroke={LIME} strokeWidth={2} fill="url(#gradUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-px mt-6 bg-neutral-900 border border-neutral-900">
              <Stat label="month 1" value={result.months[0]?.users.toLocaleString()} sub="users" />
              <Stat label="month 3" value={result.months[2]?.users.toLocaleString()} sub="users" />
              <Stat label="month 6" value={result.months[5]?.users.toLocaleString()} sub="users" highlight />
            </div>
          </div>

          <div className="border border-neutral-900 p-6 bg-neutral-950">
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-3">the story</p>
            <p className="text-neutral-200 text-[15px] leading-relaxed">{result.story}</p>
          </div>

          <div className="border border-neutral-900 p-6 bg-neutral-950">
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-4">problems you'll hit</p>
            <ul className="space-y-3">
              {result.problems.map((p, i) => (
                <li key={i} className="flex gap-3 text-[14px] text-neutral-300">
                  <span className="font-mono text-[11px] mt-1" style={{ color: LIME }}>0{i + 1}</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-dashed border-neutral-800 p-5 flex items-center justify-between flex-wrap gap-4">
            <p className="text-neutral-300 text-[14px]">
              simulation over. <span className="text-white font-semibold">now actually build it.</span>
            </p>
            <button
              onClick={onSave}
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-4 py-2 border transition-all"
              style={{ borderColor: LIME, color: LIME }}
            >
              {joined ? "you're in ✓" : "join sidestuff"} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, highlight }) {
  return (
    <div className="bg-neutral-950 p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-2">{label}</p>
      <p className="font-display font-bold text-2xl tracking-tight" style={highlight ? { color: LIME } : { color: "#ffffff" }}>
        {value}
      </p>
      <p className="text-[11px] text-neutral-500 mt-1">{sub}</p>
    </div>
  );
}

/* ────────────────────────── WAITLIST MODAL ────────────────────────── */

function WaitlistModal({ onClose, onJoined, source, alreadyJoined }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(alreadyJoined);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const submit = async () => {
    if (!isEmail(email) || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onJoined(email.trim().toLowerCase(), source);
      setSuccess(true);
    } catch (err) {
      setError("couldn't save that — check your connection & try once more.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="p-8 md:p-10 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        {!success ? (
          <>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full pulse-dot" style={{ background: LIME }} />
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                waitlist · private beta
              </span>
            </div>

            <h3 className="font-display font-bold text-3xl md:text-4xl leading-[0.95] tracking-tight mb-3">
              save your<br /><span style={{ color: LIME }}>spot.</span>
            </h3>
            <p className="text-neutral-400 text-[14px] leading-relaxed mb-8">
              one email when we open. no marketing, no drip, no nonsense. you can walk away any time.
            </p>

            <div className="space-y-3">
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="you@building.com"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 px-4 py-4 text-[15px] text-white transition-colors"
              />
              <button
                onClick={submit}
                disabled={!isEmail(email) || submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 text-[14px] font-semibold transition-all disabled:opacity-50"
                style={{ background: LIME, color: "#0a0a0a" }}
              >
                {submitting ? <><Loader className="w-4 h-4 animate-spin" /> joining...</> : <>join the list <ArrowRight className="w-4 h-4" strokeWidth={2.5} /></>}
              </button>
              {error && (
                <p className="text-red-400 text-[12px] mt-2">{error}</p>
              )}
            </div>

            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-600 mt-6">
              source: {source} · no password, no bs
            </p>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-14 h-14 border mb-6" style={{ borderColor: LIME }}>
              <Check className="w-6 h-6" style={{ color: LIME }} strokeWidth={2.5} />
            </div>
            <h3 className="font-display font-bold text-3xl md:text-4xl leading-[0.95] tracking-tight mb-3">
              you're<br /><span style={{ color: LIME }}>in.</span>
            </h3>
            <p className="text-neutral-400 text-[14px] leading-relaxed max-w-xs mx-auto mb-8">
              we'll ping you the second sidestuff opens. in the meantime — go ship something.
            </p>
            <button
              onClick={onClose}
              className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 border border-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white transition-colors"
            >
              back to building
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
