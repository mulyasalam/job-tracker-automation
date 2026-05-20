"use client";

import Link from "next/link";
import { Mail, Lock, Sparkles, ArrowRight } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const handleGoogle = async () => {
    setLoading(true);
    await signIn.social({ provider: "google", callbackURL: "/" });
  };
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Left — Editorial masthead pane */}
      <section className="relative flex flex-col px-10 lg:px-16 py-10 bg-paper rule">
        {/* Top */}
        <header className="flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl tracking-tightest">
            Dossier<span className="text-vermilion">.</span>
          </Link>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash">
            Vol I · Issue 001
          </div>
        </header>

        {/* Newspaper-style headline */}
        <div className="flex-1 flex flex-col justify-center max-w-[640px] -mt-10">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-vermilion mb-5">
            ¶ Front Page · Sign In
          </div>
          <h1 className="font-display text-[88px] xl:text-[108px] font-bold leading-[0.9] tracking-tightest text-ink">
            Stop<br />
            chasing,<br />
            <span className="italic text-vermilion">start reading</span>.
          </h1>
          <p className="mt-8 font-display text-[19px] italic text-ink/75 leading-relaxed max-w-[500px]">
            Connect Gmail once. We file every application confirmation, interview invite, and rejection into a single, hand-set archive — automatically, privately, beautifully.
          </p>

          {/* Pull quotes */}
          <div className="mt-10 grid grid-cols-3 gap-6 rule-top pt-6 max-w-[560px]">
            <Stat label="Avg. inbox parsed" value="2.3s" />
            <Stat label="Manual entry saved" value="0min" />
            <Stat label="Read-only access" value="OAuth" />
          </div>
        </div>

        {/* Bottom marquee */}
        <footer className="mt-auto pt-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-ash rule-top pt-4">
          <span>Crafted in Aachen · Spring 2026</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-moss animate-pulse-dot" />
            All systems nominal
          </span>
        </footer>
      </section>

      {/* Right — Sign in column */}
      <section className="bg-cream flex flex-col justify-center px-10 lg:px-16 py-16 relative overflow-hidden">
        {/* Decorative giant numeral */}
        <div className="absolute -right-10 -top-10 font-display font-bold text-[320px] leading-none text-ink/[0.04] select-none pointer-events-none">
          01
        </div>

        <div className="max-w-[420px] mx-auto w-full relative">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ash mb-2">
            Step One of One
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tightest leading-tight">
            Connect your<br />
            inbox.
          </h2>
          <p className="mt-3 text-[14px] text-ink/70 leading-relaxed">
            One click. Read-only. We never see your password, and your email never leaves Google's servers unencrypted.
          </p>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="mt-8 w-full bg-ink text-paper px-6 py-4 flex items-center justify-center gap-3 font-medium hover:bg-vermilion transition-colors group disabled:opacity-60"
          >
            <GoogleMark />
            {loading ? "Redirecting…" : "Continue with Gmail"}
            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" strokeWidth={2} />
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-ink/10" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash">or</span>
            <div className="flex-1 h-px bg-ink/10" />
          </div>

          {/* Email fallback */}
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" strokeWidth={1.5} />
              <input
                type="email"
                placeholder="email@address.com"
                className="w-full bg-transparent border border-ink/15 pl-11 pr-4 py-3.5 text-[14px] placeholder:text-ash focus:border-ink"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ash" strokeWidth={1.5} />
              <input
                type="password"
                placeholder="password"
                className="w-full bg-transparent border border-ink/15 pl-11 pr-4 py-3.5 text-[14px] placeholder:text-ash focus:border-ink"
              />
            </div>
            <button className="w-full border border-ink/20 hover:border-ink py-3.5 text-[14px] font-medium transition-colors">
              Sign in with email
            </button>
          </div>

          {/* Trust signals */}
          <div className="mt-8 pt-6 rule-top space-y-2">
            <TrustRow text="Read-only Gmail OAuth — we cannot send or delete email" />
            <TrustRow text="Parsing runs server-side; emails are never shared with third parties" />
            <TrustRow text="Delete your dossier and all data anytime, in one click" />
          </div>

          {/* AI footnote */}
          <div className="mt-8 flex items-start gap-2 text-[11px] text-ash leading-relaxed">
            <Sparkles className="w-3 h-3 mt-0.5 text-vermilion shrink-0" strokeWidth={2} />
            <span>
              Powered by Gemini 1.5 Flash, running with redacted prompts. Read more in our{" "}
              <a className="underline decoration-vermilion underline-offset-2" href="#">privacy ledger</a>.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-bold tabular leading-none">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash mt-1.5">{label}</div>
    </div>
  );
}

function TrustRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-[12px] text-ink/75 leading-relaxed">
      <span className="text-vermilion mt-1">✓</span>
      <span>{text}</span>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
      <path fill="#4285F4" d="M22.5 12.27c0-.78-.07-1.53-.2-2.27H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.32z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.46 2.09 14.97 1 12 1A10.99 10.99 0 0 0 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
