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
  Users,
  User,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { cn, coverGradient, formatDate, formatTime, isSoldOut, seatsLeft } from '../lib/utils';

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
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
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

  return (
    <div className="pb-28 lg:pb-12">
      {/* Hero */}
      <section className={cn('relative overflow-hidden border-b border-border bg-gradient-to-br', coverGradient(event.title))}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="container relative py-10 sm:py-16">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-ink-950/60 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-ink-950/80"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="max-w-3xl text-white">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-ink-950/60 px-3 py-1 text-xs font-semibold">
                {event.category}
              </span>
              {soldOut ? (
                <span className="rounded-full bg-danger px-3 py-1 text-xs font-semibold">Sold out</span>
              ) : left <= 15 ? (
                <span className="rounded-full bg-warning px-3 py-1 text-xs font-semibold text-warning-foreground">
                  Only {left} seats left
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-tight tracking-tight">
              {event.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/90">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {formatDate(event.date, { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> {formatTime(event.date)}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {event.location}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="container grid gap-10 py-10 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-10 lg:col-span-2">
          <section>
            <h2 className="font-display text-xl font-semibold tracking-tight">About this event</h2>
            <p className="mt-3 whitespace-pre-line text-muted-foreground">{event.description}</p>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold tracking-tight">Agenda</h2>
              <Link to="/agenda" className="text-sm font-medium text-primary hover:underline">
                Full agenda
              </Link>
            </div>
            {sessions.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
                The agenda will be published soon.
              </p>
            ) : (
              <ol className="mt-4 space-y-3">
                {sessions.slice(0, 5).map((s) => (
                  <li
                    key={s._id}
                    className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-surface"
                  >
                    <div className="flex w-20 shrink-0 flex-col text-sm">
                      <span className="font-semibold text-primary">{formatTime(s.startTime)}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(s.endTime)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary">{s.track}</Badge>
                      </div>
                      <p className="mt-1.5 font-semibold">{s.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
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
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-surface">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl font-semibold">
                {soldOut ? 'Sold out' : 'Free'}
              </span>
              <span className="text-sm text-muted-foreground">per attendee</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {event.soldTickets || 0} of {event.capacity} seats claimed
            </p>
            <Progress value={soldPct} className="mt-3" />
            <Button
              className="mt-5 w-full"
              size="lg"
              loading={registering}
              disabled={soldOut}
              onClick={register}
            >
              <Ticket className="h-4 w-4" />
              {soldOut ? 'Join waitlist unavailable' : 'Book my seat'}
            </Button>
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

          <div className="rounded-2xl border border-border bg-card p-6 shadow-surface">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {organizerName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Organized by
                </p>
                <p className="font-semibold">{organizerName}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              {event.soldTickets || 0} people are going
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 p-3 backdrop-blur-md safe-bottom lg:hidden">
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
