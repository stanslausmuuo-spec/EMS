import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Download,
  PlusCircle,
  Radio,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import { api } from '../lib/api';
import { createSocket } from '../lib/socket';
import { downloadBlob } from '../lib/utils';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea, Field } from '../components/ui/Input';
import { Progress } from '../components/ui/Progress';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog';

const CATEGORIES = ['Tech', 'Music', 'Business', 'Workshop'];

function StatCard({ label, value, sub, icon: Icon, accent, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-surface"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <motion.span
        key={String(value)}
        initial={{ opacity: 0.5, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="inline-block"
      >
        <div className="mt-3 font-display text-3xl font-semibold tabular-nums">{value}</div>
      </motion.span>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

export default function OrganizerDashboard() {
  const toast = useToast();
  const socketRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [live, setLive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Tech',
    capacity: 100,
    date: '',
    location: '',
  });

  const loadEvents = async () => {
    try {
      const data = await api.get('/api/events');
      if (data?.success) {
        setEvents(data.data || []);
        setSelectedId((prev) => prev || data.data?.[0]?._id || '');
      }
    } catch (err) {
      toast.error('Failed to load events', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setStatsLoading(true);
    api
      .get(`/api/check-in/events/${selectedId}/stats`)
      .then((data) => {
        if (active && data?.success) setStats(data.data);
      })
      .catch(() => {})
      .finally(() => active && setStatsLoading(false));

    const socket = createSocket();
    socketRef.current = socket;
    socket.on('connect', () => {
      setLive(true);
      socket.emit('joinEventRoom', selectedId);
    });
    socket.on('disconnect', () => setLive(false));
    socket.on('ticketCheckedIn', (payload) => {
      if (payload?.eventId === selectedId) {
        setStats((prev) =>
          prev ? { ...prev, checkedInCount: (prev.checkedInCount || 0) + 1 } : prev,
        );
      }
    });

    return () => {
      active = false;
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const selectedEvent = useMemo(
    () => events.find((e) => e._id === selectedId),
    [events, selectedId],
  );

  const exportCSV = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/check-in/events/${selectedId}/attendees/csv`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ems_token')}` },
      });
      const blob = await res.blob();
      downloadBlob(blob, `attendees-${selectedId}.csv`);
    } catch {
      toast.error('Export failed');
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api.post('/api/events', { ...form, capacity: Number(form.capacity) });
      if (data.success) {
        toast.success('Event created', form.title);
        setDialogOpen(false);
        setForm({ title: '', description: '', category: 'Tech', capacity: 100, date: '', location: '' });
        setLoading(true);
        await loadEvents();
        setSelectedId(data.data._id);
      } else {
        toast.error('Could not create event', data.message);
      }
    } catch (err) {
      toast.error('Could not create event', err.message);
    } finally {
      setSaving(false);
    }
  };

  const attendanceRate = stats?.soldTickets
    ? Math.round((stats.checkedInCount / stats.soldTickets) * 100)
    : 0;

  return (
    <div className="container py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Organizer Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Monitor live attendance and manage your events.</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              live
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-border bg-muted text-muted-foreground'
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${live ? 'animate-pulse' : ''}`} />
            {live ? 'Live' : 'Connecting…'}
          </span>
          <Button onClick={() => setDialogOpen(true)}>
            <PlusCircle className="h-4 w-4" /> Create event
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={CalendarDays}
            title="No events yet"
            description="Create your first event to start selling tickets and checking in guests."
            action={<Button onClick={() => setDialogOpen(true)}><PlusCircle className="h-4 w-4" /> Create event</Button>}
          />
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-surface sm:flex-row sm:items-end sm:justify-between">
            <Field label="Monitoring event" className="w-full sm:max-w-md">
              <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title} — {new Date(ev.date).toLocaleDateString()}
                  </option>
                ))}
              </Select>
            </Field>
            <Button variant="secondary" onClick={exportCSV}>
              <Download className="h-4 w-4" /> Export attendee roster
            </Button>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statsLoading || !stats ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
            ) : (
              <>
                <StatCard label="Capacity" value={stats.capacity} icon={Users} accent="bg-primary/10 text-primary" sub="Total seats" />
                <StatCard label="Tickets sold" value={stats.soldTickets} icon={Ticket} accent="bg-accent/10 text-accent" sub={`${Math.round(((stats.soldTickets || 0) / (stats.capacity || 1)) * 100)}% of capacity`} delay={0.05} />
                <StatCard label="Checked-in" value={stats.checkedInCount} icon={TrendingUp} accent="bg-success/10 text-success" sub="Live via websocket" delay={0.1} />
                <StatCard label="Attendance rate" value={`${attendanceRate}%`} icon={CalendarDays} accent="bg-warning/10 text-warning" sub="Checked-in / sold" delay={0.15} />
              </>
            )}
          </div>

          {stats && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-surface">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Gate progress</span>
                <span className="text-muted-foreground">
                  {stats.checkedInCount} of {stats.soldTickets} arrived
                </span>
              </div>
              <Progress value={attendanceRate} className="mt-3 h-3" />
              {selectedEvent && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {selectedEvent.soldTickets} sold · {Math.max(0, selectedEvent.capacity - selectedEvent.soldTickets)} seats remaining
                </p>
              )}
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create a new event</DialogTitle>
            <DialogDescription>Fill in the details and publish instantly.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createEvent} className="space-y-4">
            <Field label="Event title" required>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Design Systems Summit"
                required
              />
            </Field>
            <Field label="Description" required>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What should attendees expect?"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" required>
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Capacity" required>
                <Input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  required
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date & time" required>
                <Input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </Field>
              <Field label="Location" required>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Venue, city"
                  required
                />
              </Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Publish event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
