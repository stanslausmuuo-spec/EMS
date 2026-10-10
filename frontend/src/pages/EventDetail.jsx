import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Heart,
  MapPin,
  Share2,
  Ticket,
  User,
  Users,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Kicker } from '../components/ui/Kicker';
import { Progress } from '../components/ui/Progress';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { cn, coverAccent, coverGlow, coverGradient, coverNumeral, formatDate, formatTime, isSoldOut, seatsLeft } from '../lib/utils';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [saved, setSaved] = useState(() => {
    try {
      return (JSON.parse(localStorage.getItem('ems_saved_events')) || []).includes(id);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api
      .get(`/api/events/${id}`)
      .then((data) => {
        if (data?.success) setEvent(data.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    api
      .get(`/api/sessions/event/${id}`)
      .then((data) => {
        if (data?.success) setSessions(data.data || []);
      })
      .catch(() => {});
  }, [id]);

  const register = async () => {
    if (!user) {
      toast.info('Sign in required', 'Please sign in to book tickets.');
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    setRegistering(true);
    try {
      const res = await api.post(`/api/tickets/events/${id}/register`);
      if (res.success) {
        toast.success('You’re in!', 'Your ticket is ready in My Tickets.');
        navigate('/tickets');
      } else {
        toast.error('Registration failed', res.message);
      }
    } catch (err) {
      toast.error('Registration failed', err.message);
    } finally {
      setRegistering(false);
    }
  };

  const toggleSave = () => {
    try {
      const current = JSON.parse(localStorage.getItem('ems_saved_events')) || [];
      const next = saved ? current.filter((x) => x !== id) : [...new Set([...current, id])];
      localStorage.setItem('ems_saved_events', JSON.stringify(next));
      setSaved(!saved);
      toast.success(saved ? 'Removed from saved' : 'Saved', event?.title);
    } catch {
      /* ignore */
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: event?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied', 'Share this event with friends.');
      }
    } catch {
      /* cancelled */
    }
  };

  if (loading) {
    return (
      <div className="container py-10">
        <Skeleton className="h-72 w-full rounded-3xl" />
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="container py-20">
        <EmptyState
          icon={CalendarDays}
          title="Event not found"
          description="This event may have been removed or the link is incorrect."
          action={<Button onClick={() => navigate('/')}>Back to events</Button>}
        />
      </div>
    );
  }

  const soldOut = isSoldOut(event);
  const left = seatsLeft(event);
  const soldPct = Math.min(100, Math.round(((event.soldTickets || 0) / (event.capacity || 1)) * 100));
  const organizerName = typeof event.organizer === 'object' ? event.organizer?.name : 'Event organizer';
  const gradient = coverGradient(event);
  const accent = coverAccent(event);
  const glow = coverGlow(event);
  const numeral = coverNumeral(event.title);

  return (
    <div className="pb-12">
      {/* Hero */}
      <section className={cn('relative overflow-hidden border-b border-border bg-gradient-to-br', gradient)}>
        <span
          aria-hidden="true"
          className={cn('absolute -top-10 right-6 select-none font-display text-[12rem] font-bold leading-none tracking-tighter opacity-[0.12]', accent)}
        >
          {numeral}
        </span>
        <span
          aria-hidden="true"
          className="absolute -left-24 bottom-0 h-[28rem] w-[28rem] rounded-full blur-3xl"
          style={{ backgroundColor: glow }}
        />
        <div aria-hidden="true" className="grain absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="container relative py-10 sm:py-16">
          <button
            onClick={() => navigate(-1)}
            className="glass mb-8 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="glass !text-foreground">{event.category}</Badge>
              {soldOut ? (
                <Badge variant="danger">Sold out</Badge>
              ) : left <= 15 ? (
                <Badge variant="warning">Only {left} seats left</Badge>
              ) : null}
            </div>
            <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-tight text-white">
              {event.title}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm text-white/85">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                {formatDate(event.date, { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> {formatTime(event.date)}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> {event.location}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="container grid gap-10 py-10 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-10 lg:col-span-2">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
          >
            <Kicker>About this event</Kicker>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">The rundown</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{event.description}</p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
          >
            <div className="flex items-end justify-between">
              <div>
                <Kicker>Program</Kicker>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">Agenda preview</h2>
              </div>
              <Link to="/agenda" className="text-sm font-medium text-primary hover:underline">
                Full agenda
              </Link>
            </div>
            {sessions.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-dashed border-border-strong bg-surface-1/60 p-6 text-sm text-muted-foreground">
                The agenda will be published soon.
              </p>
            ) : (
              <ol className="mt-5 space-y-3">
                {sessions.slice(0, 5).map((s) => (
                  <li
                    key={s._id}
                    className="card-hover flex gap-4 rounded-2xl border border-border bg-surface-2 p-4 shadow-surface"
                  >
                    <div className="flex w-20 shrink-0 flex-col border-r border-border pr-4 text-sm">
                      <span className="font-semibold tabular-nums text-primary">{formatTime(s.startTime)}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(s.endTime)}</span>
                    </div>
                    <div className="min-w-0">
                      <Badge variant="accent">{s.track}</Badge>
                      <p className="mt-1.5 font-semibold">{s.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {s.speaker && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" /> {s.speaker}
                          </span>
                        )}
                        {s.room && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {s.room}
                          </span>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            className="relative overflow-hidden rounded-3xl border border-border-strong bg-surface-2 p-6 shadow-surface"
          >
            <div aria-hidden="true" className="absolute inset-0 bg-mesh-top opacity-70" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-display text-sm font-bold text-primary">
                {organizerName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="eyebrow">Organized by</p>
                <p className="font-semibold text-foreground">{organizerName}</p>
              </div>
              <div className="ml-auto hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                <Users className="h-4 w-4 text-primary" />
                {event.soldTickets || 0} people are going
              </div>
            </div>
          </motion.section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-3xl border border-border-strong bg-surface-2 p-6 shadow-overlay">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl font-bold">
                {soldOut ? 'Sold out' : 'Free'}
              </span>
              <span className="text-sm text-muted-foreground">per attendee</span>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{event.soldTickets || 0} of {event.capacity} seats claimed</span>
              <span className="tabular-nums text-primary">{soldPct}%</span>
            </div>
            <Progress value={soldPct} className="mt-2" />
            <Button
              className="mt-6 w-full"
              size="lg"
              loading={registering}
              disabled={soldOut}
              onClick={register}
            >
              <Ticket className="h-4 w-4" />
              {soldOut ? 'Join waitlist unavailable' : 'Book my seat'}
            </Button>
            {!soldOut && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {left} {left === 1 ? 'seat' : 'seats'} remaining — zero overbooking guaranteed
              </p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={toggleSave}>
                <Heart className={cn('h-4 w-4', saved && 'fill-danger text-danger')} />
                {saved ? 'Saved' : 'Save'}
              </Button>
              <Button variant="secondary" onClick={share}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface-1 p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-primary" /> Date & time
            </div>
            <p className="mt-2 font-display text-lg font-semibold">
              {formatDate(event.date, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-sm text-muted-foreground">{formatTime(event.date)} — {event.location}</p>
          </div>
        </aside>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface-1/90 p-3 backdrop-blur-md lg:hidden">
        <div className="container flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{event.title}</p>
            <p className="text-xs text-muted-foreground">{soldOut ? 'Sold out' : `From ${formatDate(event.date)}`}</p>
          </div>
          <Button loading={registering} disabled={soldOut} onClick={register}>
            {soldOut ? 'Sold out' : 'Book'}
          </Button>
        </div>
      </div>
    </div>
  );
}