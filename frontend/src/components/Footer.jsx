import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ShieldCheck, Github, Twitter, Linkedin } from 'lucide-react';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-card/40">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The high-performance event platform for discovery, ticketing, and flawless gate operations.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Platform</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/" className="transition hover:text-foreground">Discover events</Link></li>
              <li><Link to="/agenda" className="transition hover:text-foreground">Agenda</Link></li>
              <li><Link to="/tickets" className="transition hover:text-foreground">My tickets</Link></li>
              <li><Link to="/scanner" className="transition hover:text-foreground">Gate scanner</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">For organizers</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/dashboard" className="transition hover:text-foreground">Dashboard</Link></li>
              <li><Link to="/leads" className="transition hover:text-foreground">Lead capture</Link></li>
              <li><Link to="/register" className="transition hover:text-foreground">Create account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/terms" className="transition hover:text-foreground">Terms &amp; Conditions</Link></li>
              <li><Link to="/privacy" className="transition hover:text-foreground">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} EMS Platform. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Encrypted</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> WCAG 2.2 AA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
