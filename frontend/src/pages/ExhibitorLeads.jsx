import React, { useEffect, useMemo, useState } from 'react';
import { Download, Mail, Radar, Search, Target, UserPlus } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Select, Textarea, Field } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { downloadBlob, formatDateTime } from '../lib/utils';

const SCORES = ['Hot', 'Warm', 'Cold'];
const scoreVariant = { Hot: 'danger', Warm: 'warning', Cold: 'accent' };

export default function ExhibitorLeads() {
  const toast = useToast();

  const [leads, setLeads] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ eventId: '', email: '', score: 'Hot', notes: '' });
  const [saving, setSaving] = useState(false);

  const loadLeads = () => {
    api
      .get('/api/leads')
      .then((data) => setLeads(data?.success ? data.data || [] : []))
      .catch((err) => toast.error('Failed to load leads', err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLeads();
    api
      .get('/api/events')
      .then((data) => {
        if (data?.success && data.data?.length) {
          setEvents(data.data);
          setForm((f) => ({ ...f, eventId: f.eventId || data.data[0]._id }));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api.post('/api/leads/capture', {
        eventId: form.eventId,
        email: form.email,
        score: form.score,
        notes: form.notes,
      });
      if (data.success) {
        toast.success('Lead captured', data.data?.attendee?.name || form.email);
        setForm({ ...form, email: '', notes: '' });
        loadLeads();
      } else {
        toast.error('Capture failed', data.message);
      }
    } catch (err) {
      toast.error('Capture failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const update = async (id, patch) => {
    try {
      const data = await api.put(`/api/leads/${id}`, patch);
      if (data.success) loadLeads();
    } catch (err) {
      toast.error('Update failed', err.message);
    }
  };

  const exportCSV = async () => {
    try {
      const res = await fetch('/api/leads/export', {
        headers: { Authorization: `Bearer ${localStorage.getItem('ems_token')}` },
      });
      downloadBlob(await res.blob(), 'exhibitor-leads.csv');
      toast.success('Export ready', 'Your CSV has been downloaded.');
    } catch {
      toast.error('Export failed');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) =>
      [l.attendee?.name, l.attendee?.email, l.event?.title, l.notes]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q)),
    );
  }, [leads, query]);

  const hot = leads.filter((l) => l.score === 'Hot').length;

  return (
    <div className="container py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Lead Capture CRM</h1>
          <p className="mt-1 text-muted-foreground">Scan, score, and manage your booth leads.</p>
        </div>
        <Button variant="secondary" onClick={exportCSV}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total leads', value: leads.length, icon: UserPlus, accent: 'text-primary bg-primary/10' },
          { label: 'Hot leads', value: hot, icon: Target, accent: 'text-danger bg-danger/10' },
          { label: 'Avg. per event', value: events.length ? Math.round(leads.length / events.length) : 0, icon: Radar, accent: 'text-accent bg-accent/10' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.accent}`}>
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="font-display text-2xl font-extrabold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={capture} className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Capture a lead
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Event">
            <Select value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Attendee email" required>
            <Input
              type="email"
              required
              placeholder="attendee@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Lead score">
            <Select value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })}>
              {SCORES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Notes">
            <Input
              placeholder="Meeting notes…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" loading={saving}>
            <UserPlus className="h-4 w-4" /> Capture lead
          </Button>
        </div>
      </form>

      <div className="mt-8 rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold">Captured leads ({filtered.length})</span>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, email, notes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={UserPlus}
              title={query ? 'No matching leads' : 'No leads yet'}
              description={query ? 'Try a different search term.' : 'Captured booth leads will appear here.'}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 font-semibold">Attendee</th>
                  <th className="p-4 font-semibold">Event</th>
                  <th className="p-4 font-semibold">Score</th>
                  <th className="p-4 font-semibold">Notes</th>
                  <th className="p-4 font-semibold">Captured</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((lead) => (
                  <tr key={lead._id} className="transition hover:bg-muted/40">
                    <td className="p-4">
                      <p className="font-semibold">{lead.attendee?.name || 'Unknown'}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {lead.attendee?.email || '—'}
                      </p>
                    </td>
                    <td className="p-4 text-muted-foreground">{lead.event?.title || '—'}</td>
                    <td className="p-4">
                      <Badge variant={scoreVariant[lead.score] || 'default'}>{lead.score}</Badge>
                    </td>
                    <td className="p-4">
                      <input
                        type="text"
                        defaultValue={lead.notes || ''}
                        onBlur={(e) => {
                          if (e.target.value !== (lead.notes || '')) update(lead._id, { notes: e.target.value });
                        }}
                        placeholder="Add notes…"
                        className="w-full rounded-lg border border-border bg-transparent px-2 py-1 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                      />
                    </td>
                    <td className="p-4">
                      <Select
                        value={lead.score}
                        onChange={(e) => update(lead._id, { score: e.target.value })}
                        className="h-8 px-2 py-0 text-xs"
                      >
                        {SCORES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </Select>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(lead.scannedAt)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
