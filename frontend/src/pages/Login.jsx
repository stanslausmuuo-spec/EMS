import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Lock, Mail, ScanLine, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input, Field } from '../components/ui/Input';
import { Logo } from '../components/Logo';

const HIGHLIGHTS = [
  { icon: CalendarCheck, text: 'Book seats and manage your schedule in seconds.' },
  { icon: ScanLine, text: 'Contactless QR check-in with real-time attendance.' },
  { icon: Sparkles, text: 'AI concierge to answer everything about the event.' },
];

const DEMO = [
  { label: 'Organizer', email: 'organizer@ems.local', variant: 'primary' },
  { label: 'Attendee', email: 'attendee@ems.local', variant: 'secondary' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/';

  const submit = async (loginEmail, loginPassword) => {
    setLoading(true);
    try {
      const data = await api.post('/api/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });
      if (data.success) {
        login(data.data);
        toast.success('Welcome back', data.data?.name);
        navigate(from, { replace: true });
      } else {
        toast.error('Sign in failed', data.message);
      }
    } catch (err) {
      toast.error('Sign in failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 lg:py-16">
      <div className="grid items-stretch gap-8 lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden rounded-3xl border border-border-strong bg-canvas p-10 shadow-overlay lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-mesh" />
          <div className="absolute inset-0 surface-grid opacity-50" />
          <div aria-hidden="true" className="grain absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-canvas to-transparent" />
          <span
            aria-hidden="true"
            className="absolute -bottom-16 -left-6 select-none font-display text-[16rem] font-bold leading-none tracking-tighter text-primary/[0.06]"
          >
            01
          </span>

          <div className="relative">
            <Logo />
            <p className="eyebrow mt-10 !text-primary">
              <Sparkles className="h-3.5 w-3.5" /> The event OS after dark
            </p>
            <h2 className="mt-4 font-display text-[clamp(2rem,3vw,2.75rem)] font-bold leading-[1.08] tracking-tight">
              The event platform your attendees will love.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Discover, book, and check in — all from one beautifully fast experience.
            </p>
          </div>

          <ul className="relative mt-10 divide-y divide-border border-y border-border">
            {HIGHLIGHTS.map((h) => (
              <li key={h.text} className="flex items-center gap-4 py-4 text-sm text-muted-foreground">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-strong bg-surface-2 text-primary">
                  <h.icon className="h-4 w-4" />
                </span>
                {h.text}
              </li>
            ))}
          </ul>

          <div className="relative mt-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-faint">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Zero overbooking · Offline gate · Live dashboards
          </div>
        </div>

        {/* Form */}
        <div className="mx-auto flex w-full max-w-md flex-col justify-center">
          <div className="rounded-3xl border border-border-strong bg-surface-2 p-8 shadow-overlay">
            <div className="lg:hidden">
              <Logo />
            </div>
            <p className="eyebrow mt-6 !text-primary lg:mt-0">
              <Lock className="h-3.5 w-3.5" /> Secure sign-in
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to access your tickets and dashboard.
            </p>

            <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/[0.07] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" /> One-click demo access
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DEMO.map((d) => (
                  <Button
                    key={d.email}
                    type="button"
                    variant={d.variant}
                    size="sm"
                    disabled={loading}
                    onClick={() => submit(d.email, 'password123')}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                submit(email, password);
              }}
            >
              <Field label="Email address" required>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    className="pl-10"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </Field>
              <Field label="Password" required>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    className="pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </Field>
              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Sign in <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New to EMS?{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}