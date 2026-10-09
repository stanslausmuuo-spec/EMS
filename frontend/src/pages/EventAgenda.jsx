import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, BookmarkCheck, CalendarDays, Clock, MapPin, Mic2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { cn, formatTime } from '../lib/utils';

export default function EventAgenda() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState('All');
  const [registered, setRegistered] = useState(() => new Set());

  useEffect(() => {
    api
      .get('/api/events')
      .then((data) => {
        if (data?.success && data.data?.length) {
          setEvents(data.data);
          setSelectedId((prev) => prev || data.data[0]._id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setTrack('All');
    api
      .get(`/api/sessions/event/${selectedId}`)
      .then((data) => setSessions(data?.success ? data.data || [] : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const tracks = useMemo(
    () => ['All', ...new Set(sessions.map((s) => s.track).filter(Boolean))],
    [sessions],
  );

  const visible = useMemo(
    () => (track === 'All' ? sessions : sessions.filter((s) => s.track === track)),
    [sessions, track],
  );

  const register = async (sessionId) => {
    if (!user) {
      toast.info('Sign in required', 'Sign in to build your personal schedule.');
      navigate('/login', { state: { from: '/agenda' } });
      return;
    }
    try {
      const data = await api.post(`/api/sessions/${sessionId}/register`);
      if (data.success) {
        setRegistered((prev) => new Set(prev).add(sessionId));
        toast.success('Added to your schedule');
      } else {
        toast.error('Could not register', data.message);
      }
    } catch (err) {
      toast.error('Could not register', err.message);
    }
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Event Agenda</h1>
          <p className="mt-1 text-muted-foreground">
            Explore sessions, breakout rooms, and build your personal schedule.
          </p>
        </div>
        {events.length > 0 && (
          <div className="w-full md:w-80">
            <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {tracks.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {tracks.map((t) => (
            <button
              key={t}
              onClick={() => setTrack(t)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
                track === t
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={CalendarDays}
            title="No sessions scheduled"
            description="The organizer hasn’t published the agenda for this event yet."
          />
        </div>
      ) : (
        <ol className="mt-8 space-y-4">
          {visible.map((s) => {
            const isRegistered = registered.has(s._id);
            return (
              <li
                key={s._id}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-surface transition hover:border-primary/30 md:flex-row md:items-center"
              >
                <div className="flex w-full shrink-0 flex-col gap-1 border-border md:w-28 md:border-r md:pr-4">
                  <span className="font-display text-lg font-semibold text-primary">
                    {formatTime(s.startTime)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {formatTime(s.endTime)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="primary">{s.track}</Badge>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
                  {s.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Mic2 className="h-3.5 w-3.5 text-accent" /> {s.speaker || 'Keynote speaker'}
                    </span>
                    {s.room && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-success" /> {s.room}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant={isRegistered ? 'secondary' : 'primary'}
                  className="shrink-0"
                  onClick={() => register(s._id)}
                >
                  {isRegistered ? (
                    <BookmarkCheck className="h-4 w-4 text-success" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  {isRegistered ? 'In schedule' : 'Register'}
                </Button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
