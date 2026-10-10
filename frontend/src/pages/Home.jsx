import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Compass,
  RadioTower,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  WifiOff,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { EventCard } from '../components/EventCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { cn, coverAccent, coverGlow, coverGradient, coverNumeral, formatDate, seatsLeft, isSoldOut } from '../lib/utils';

const CATEGORIES = ['Tech', 'Music', 'Business', 'Workshop'];
const SAVED_KEY = 'ems_saved_events';

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY)) || [];
  } catch {
    return [];
  }
}

const PROOF_ITEMS = [
  { icon: ShieldCheck, label: 'Zero-overbook ticketing' },
  { icon: WifiOff, label: 'Offline-first check-in' },
  { icon: RadioTower, label: 'Live gate dashboards' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [saved, setSaved] = useState(readSaved);
  const [registeringId, setRegisteringId] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (category) params.set('category', category);
      if (date) params.set('date', date);
      const qs = params.toString();
      api
        .get(`/api/events${qs ? `?${qs}` : ''}`, { signal: controller.signal })
        .then((data) => {
          if (data?.success) setEvents(data.data || []);
          else setError(data?.message || 'Failed to load events');
        })
        .catch((err) => {
          if (err.name !== 'AbortError') setError(err.message);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, category, date, reload]);

  const toggleSave = (event) => {
    setSaved((prev) => {
      const exists = prev.includes(event._id);
      const next = exists ? prev.filter((id) => id !== event._id) : [...prev, event._id];
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      toast.success(exists ? 'Removed from saved' : 'Saved to your list', event.title);
      return next;
    });
  };

  const register = async (event) => {
    if (!user) {
      toast.info('Sign in required', 'Please sign in to book tickets.');
      navigate('/login');
      return;
    }
    setRegisteringId(event._id);
    try {
      const res = await api.post(`/api/tickets/events/${event._id}/register`);
      if (res.success) {
        toast.success('You’re registered!', `Ticket for ${event.title} is ready.`);
        navigate('/tickets');
      } else {
        toast.error('Registration failed', res.message);
      }
    } catch (err) {
      toast.error('Registration failed', err.message);
    } finally {
      setRegisteringId(null);
    }
  };

  const featured = useMemo(() => events.slice(0, 1)[0], [events]);
  const rest = useMemo(() => events.slice(1), [events]);

  const hasFilters = search || category || date;
  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setDate('');
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-mesh">
        <div className="absolute inset-0 surface-grid opacity-60" />
        <div className="absolute inset-0 bg-radial-fade" />
        <div aria-hidden="true" className="grain absolute inset-0" />
        <div className="container relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: [0.16, 1, 0.3, 1] }}
              className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-muted-foreground"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Zero-overbook ticketing · Offline-first check-in
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 font-display text-[clamp(2.75rem,7vw,5rem)] font-bold leading-[1.02] tracking-tighter"
            >
              Discover experiences{' '}
              <span className="text-gradient">worth showing up for</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg"
            >
              Secure your seat in seconds, carry your pass offline, and breeze through the gate.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-col gap-2 rounded-2xl border border-border-strong bg-surface-2/90 p-1.5 shadow-overlay backdrop-blur-xl sm:flex-row sm:items-center"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events, cities, topics…"
                  className="border-0 bg-transparent pl-10 shadow-none focus:ring-0"
                  aria-label="Search events"
                />
              </div>
              <div className="hidden h-7 w-px bg-border sm:block" />
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border-0 bg-transparent shadow-none sm:w-40 focus:ring-0"
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <div className="hidden h-7 w-px bg-border sm:block" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-0 bg-transparent shadow-none sm:w-44 focus:ring-0"
                aria-label="Filter by date"
              />
              <Button
                size="md"
                className="sm:px-7"
                onClick={() => document.getElementById('event-grid')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 flex justify-center"
            >
              <SegmentedControl
                ariaLabel="Filter by category"
                options={['All', ...CATEGORIES]}
                value={category}
                onChange={(v) => setCategory(v === 'All' ? '' : v)}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Proof strip */}
      <section className="border-b border-border bg-surface-1">
        <div className="container flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-4">
          {PROOF_ITEMS.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-primary" />
              {label}
            </span>
          ))}
        </div>
      </section>

      <section id="event-grid" className="container py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.3 }}
          className="mb-8 flex items-end justify-between gap-4"
        >
          <div>
            <p className="eyebrow !text-primary">
              <Compass className="h-3.5 w-3.5" /> Browse
            </p>
            <h2 className="mt-1 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight">
              {hasFilters ? 'Matching events' : 'Upcoming events'}
            </h2>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" /> Clear filters
            </Button>
          )}
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border border-border bg-surface-2">
                <Skeleton className="h-44 rounded-none" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={Compass}
            title="Couldn’t load events"
            description={error}
            action={<Button onClick={() => setReload((r) => r + 1)}>Retry</Button>}
          />
        ) : events.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No events found"
            description={hasFilters ? 'Try clearing filters or searching for something else.' : 'Check back soon for new events.'}
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            {featured && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ ease: [0.16, 1, 0.3, 1] }}
                className="mb-10 grid gap-6 lg:grid-cols-5"
              >
                <FeaturedSpotlight
                  event={featured}
                  saved={saved.includes(featured._id)}
                  onToggleSave={toggleSave}
                  onView={() => navigate(`/events/${featured._id}`)}
                  onRegister={() => register(featured)}
                  registering={registeringId === featured._id}
                />
                <div className="grid gap-6 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
                  {(rest.length ? rest : events.slice(0, 2)).slice(0, 2).map((ev, i) => (
                    <EventCard
                      key={ev._id}
                      event={ev}
                      index={i}
                      saved={saved.includes(ev._id)}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {rest.length > 2 && (
              <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" /> More to explore
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.slice(2).map((ev, i) => (
                <EventCard
                  key={ev._id}
                  event={ev}
                  index={i}
                  saved={saved.includes(ev._id)}
                  onToggleSave={toggleSave}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function FeaturedSpotlight({ event, saved, onToggleSave, onView, onRegister, registering }) {
  const soldOut = isSoldOut(event);
  const left = seatsLeft(event);
  const numeral = coverNumeral(event.title);
  const gradient = coverGradient(event);
  const accent = coverAccent(event);
  const glow = coverGlow(event);

  return (
    <div className="card-hover group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface-2 shadow-surface lg:col-span-3">
      <div className={cn('relative shrink-0 overflow-hidden bg-gradient-to-br px-7 pb-5 pt-7', gradient)}>
        <span
          aria-hidden="true"
          className={cn(
            'absolute -top-6 right-4 select-none font-display text-[8rem] font-bold leading-none tracking-tighter opacity-[0.16]',
            accent,
          )}
        >
          {numeral}
        </span>
        <span
          aria-hidden="true"
          className="absolute -left-16 top-6 h-56 w-56 rounded-full blur-3xl"
          style={{ backgroundColor: glow }}
        />
        <div aria-hidden="true" className="grain absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="relative flex items-center justify-between">
          <Badge variant="default" className="glass border-white/15 gap-1.5 !text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Featured
          </Badge>
          <button
            type="button"
            onClick={onToggleSave}
            aria-label={saved ? 'Remove from saved' : 'Save event'}
            className={cn(
              'rounded-full p-2 transition hover:bg-black/20',
              saved ? 'text-danger' : 'text-white/80 hover:text-danger',
            )}
          >
            <Heart className={cn('h-4 w-4', saved && 'fill-danger text-danger')} />
          </button>
        </div>

        <h3 className="relative mt-6 max-w-xl font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
          {event.title}
        </h3>
        <div className="relative mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {formatDate(event.date, { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          <span>{event.location}</span>
          {!soldOut && <Badge variant="warning">{left} left</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p className="line-clamp-2 text-sm text-muted-foreground sm:text-base">{event.description}</p>
        <div className="mt-auto flex flex-wrap gap-3 pt-6">
          <Button size="lg" loading={registering} disabled={soldOut} onClick={onRegister}>
            <Ticket className="h-4 w-4" />
            {soldOut ? 'Sold out' : 'Book my seat'}
          </Button>
          <Button size="lg" variant="secondary" onClick={onView}>
            View details <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}