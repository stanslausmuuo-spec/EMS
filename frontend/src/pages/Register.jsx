import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User as UserIcon, Briefcase, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input, Field } from '../components/ui/Input';
import { Logo } from '../components/Logo';
import { cn } from '../lib/utils';

const ROLES = [
  { value: 'Attendee', label: 'Attendee', hint: 'Book events & manage tickets', icon: Ticket },
  { value: 'Organizer', label: 'Organizer', hint: 'Create events & scan guests', icon: Briefcase },
];

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Attendee' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/api/auth/register', form);
      if (data.success) {
        login(data.data);
        toast.success('Account created', `Welcome, ${data.data?.name || form.name}!`);
        navigate('/', { replace: true });
      } else {
        toast.error('Registration failed', data.message);
      }
    } catch (err) {
      toast.error('Registration failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden py-10 lg:py-16">
      <div className="absolute inset-0 bg-mesh opacity-60" />
      <div className="absolute inset-0 surface-grid opacity-40" />
      <div aria-hidden="true" className="grain absolute inset-0" />

      <div className="container relative mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-border-strong bg-surface-2 p-8 shadow-overlay">
          <Logo />
          <p className="eyebrow mt-8 !text-primary">Join the platform</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join EMS to discover events and manage your experience.
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <Field label="Full name" required>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Ada Lovelace"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </Field>
            <Field label="Email address" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  className="pl-10"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </Field>
            <Field label="Password" required hint="Use at least 8 characters.">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  className="pl-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            </Field>

            <div className="space-y-2">
              <span className="eyebrow">I am joining as</span>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    aria-pressed={form.role === r.value}
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={cn(
                      'flex flex-col items-start gap-1.5 rounded-2xl border p-3.5 text-left transition-all duration-200',
                      form.role === r.value
                        ? 'border-primary bg-primary/[0.08] shadow-glow-soft'
                        : 'border-border bg-surface-1 hover:border-border-strong',
                    )}
                  >
                    <r.icon
                      className={cn(
                        'h-5 w-5',
                        form.role === r.value ? 'text-primary' : 'text-muted-foreground',
                      )}
                    />
                    <span className="text-sm font-semibold">{r.label}</span>
                    <span className="text-xs text-muted-foreground">{r.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Create account <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}