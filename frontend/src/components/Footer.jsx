import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter, Radio, ShieldCheck, Zap } from 'lucide-react';
import { Logo } from './Logo';

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Discover events', to: '/' },
      { label: 'Event agenda', to: '/agenda' },
      { label: 'My tickets', to: '/tickets' },
      { label: 'Gate scanner', to: '/scanner' },
    ],
  },
  {
    title: 'For organizers',
    links: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Lead capture', to: '/leads' },
      { label: 'Create account', to: '/register' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms & Conditions', to: '/terms' },
      { label: 'Privacy Policy', to: '/privacy' },
    ],
  },
];

const PROOF = [
  { icon: Zap, label: 'Zero overbooking' },
  { icon: Radio, label: 'Offline-first gates' },
  { icon: ShieldCheck, label: 'Live crowd intel' },
];

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-border">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="container relative py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The event OS for discovery, ticketing, and flawless gate operations — built to
              never oversell and never stop checking people in.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {PROOF.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="eyebrow">{col.title}</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="transition hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} EMS Platform. All rights reserved.</span>
          <div className="flex items-center gap-2">
            {[Github, Twitter, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-2 text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                aria-label="Social link"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none select-none px-4 text-center font-display text-[clamp(3rem,18vw,15rem)] font-bold leading-none tracking-tighter text-foreground/[0.04]"
      >
        EMS PLATFORM
      </div>
    </footer>
  );
}