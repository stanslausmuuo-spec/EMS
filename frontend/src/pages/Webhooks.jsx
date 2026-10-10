import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Check,
  Copy,
  KeyRound,
  Loader2,
  PlugZap,
  PlusCircle,
  Radio,
  RotateCw,
  Send,
  ShieldCheck,
  Trash2,
  Webhook as WebhookIcon,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { cn, timeAgo } from '../lib/utils';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input, Field } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Stat } from '../components/ui/Stat';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog';

const EVENT_LABELS = {
  'registration.created': { label: 'New registration', variant: 'primary' },
  'checkin.completed': { label: 'Check-in completed', variant: 'success' },
  'event.created': { label: 'Event created', variant: 'accent' },
  'lead.captured': { label: 'Lead captured', variant: 'hot' },
  'webhook.ping': { label: 'Ping', variant: 'default' },
};

const EVENT_OPTIONS = [
  { value: 'registration.created', label: 'New registration' },
  { value: 'checkin.completed', label: 'Check-in completed' },
  { value: 'event.created', label: 'Event created' },
  { value: 'lead.captured', label: 'Lead captured' },
];

const DELIVERY_STATUS = {
  pending: 'warning',
  success: 'success',
  failed: 'danger',
  skipped: 'default',
};

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export default function WebhooksPage() {
  const toast = useToast();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ url: '', events: ['registration.created'] });
  const [secretModal, setSecretModal] = useState(null);
  const [deliveriesFor, setDeliveriesFor] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [copied, setCopied] = useState(false);

  const loadWebhooks = useCallback(async () => {
    try {
      const data = await api.get('/api/webhooks');
      if (data?.success) setWebhooks(data.data || []);
    } catch (err) {
      toast.error('Failed to load webhooks', err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  const counts = useMemo(() => {
    const active = webhooks.filter((w) => w.active).length;
    const failing = webhooks.filter((w) => w.failureCount > 0).length;
    return { total: webhooks.length, active, failing };
  }, [webhooks]);

  const toggleEvent = (event) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const createWebhook = async (e) => {
    e.preventDefault();
    if (!form.events.length) {
      toast.error('Select at least one event');
      return;
    }
    setCreating(true);
    try {
      const data = await api.post('/api/webhooks', form);
      toast.success('Endpoint created', 'Signing secret generated. Store it now — it is shown once.');
      setSecretModal({ secret: data.secret, title: 'Signing secret', url: form.url });
      setCreateOpen(false);
      setForm({ url: '', events: ['registration.created'] });
      setLoading(true);
      await loadWebhooks();
    } catch (err) {
      toast.error('Could not create endpoint', err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (wh) => {
    setBusyId(`${wh._id}:active`);
    try {
      await api.patch(`/api/webhooks/${wh._id}`, { active: !wh.active });
      toast.success(wh.active ? 'Endpoint paused' : 'Endpoint resumed', wh.url);
      await loadWebhooks();
    } catch (err) {
      toast.error('Update failed', err.message);
    } finally {
      setBusyId('');
    }
  };

  const rotateSecret = async (wh) => {
    if (!window.confirm(`Rotate the signing secret for ${wh.url}? The old secret stays valid for 24 hours.`)) return;
    setBusyId(`${wh._id}:rotate`);
    try {
      const data = await api.post(`/api/webhooks/${wh._id}/rotate-secret`);
      setSecretModal({ secret: data.secret, title: 'New signing secret', url: wh.url, rotated: true });
      toast.success('Secret rotated', 'The new secret is shown once.');
      await loadWebhooks();
    } catch (err) {
      toast.error('Rotation failed', err.message);
    } finally {
      setBusyId('');
    }
  };

  const ping = async (wh) => {
    setBusyId(`${wh._id}:ping`);
    try {
      const data = await api.post(`/api/webhooks/${wh._id}/ping`);
      const ok = data?.data?.ok;
      toast[ok ? 'success' : 'error'](
        ok ? 'Endpoint reachable' : 'Delivery failed',
        ok ? 'Your endpoint responded with a 2xx status and a valid signature was sent.' : (data?.data?.error || 'The endpoint did not respond successfully.'),
      );
    } catch (err) {
      toast.error('Ping failed', err.message);
    } finally {
      setBusyId('');
    }
  };

  const removeWebhook = async (wh) => {
    if (!window.confirm(`Delete webhook for ${wh.url}? This cannot be undone.`)) return;
    setBusyId(`${wh._id}:delete`);
    try {
      await api.del(`/api/webhooks/${wh._id}`);
      toast.success('Endpoint deleted', wh.url);
      setWebhooks((prev) => prev.filter((w) => w._id !== wh._id));
    } catch (err) {
      toast.error('Delete failed', err.message);
    } finally {
      setBusyId('');
    }
  };

  const openDeliveries = async (wh) => {
    setDeliveriesFor(wh);
    setDeliveries([]);
    setDeliveriesLoading(true);
    try {
      const data = await api.get(`/api/webhooks/${wh._id}/deliveries`);
      if (data?.success) setDeliveries(data.data || []);
    } catch (err) {
      toast.error('Failed to load deliveries', err.message);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const redeliver = async (d) => {
    if (!deliveriesFor) return;
    try {
      const data = await api.post(
        `/api/webhooks/${deliveriesFor._id}/deliveries/${d._id}/redeliver`,
      );
      toast[data?.data?.ok ? 'success' : 'error'](
        data?.data?.ok ? 'Redelivered' : 'Redelivery failed',
        data?.data?.error || undefined,
      );
      await openDeliveries(deliveriesFor);
    } catch (err) {
      toast.error('Redelivery failed', err.message);
    }
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow !text-primary">
            <WebhookIcon className="h-3.5 w-3.5" /> Integrations
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Webhooks</h1>
          <p className="mt-1 text-muted-foreground">
            Push signed event payloads to your endpoints — with automatic retries, delivery logs, and signature verification.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={creating}>
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />} Add endpoint
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat label="Endpoints" value={counts.total} icon={WebhookIcon} accent="bg-primary/10 text-primary" sub="Registered" />
        <Stat label="Active" value={counts.active} icon={Activity} accent="bg-success/10 text-success" sub="Receiving events" delay={0.05} />
        <Stat label="Failing" value={counts.failing} icon={ShieldCheck} accent="bg-warning/10 text-warning" sub="Consecutive failures" delay={0.1} />
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={WebhookIcon}
            title="No webhooks yet"
            description="Subscribe to check-ins, registrations, and lead captures so your systems stay in sync."
            action={<Button onClick={() => setCreateOpen(true)}><PlusCircle className="h-4 w-4" /> Add your first endpoint</Button>}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {webhooks.map((wh, i) => (
            <div
              key={wh._id}
              className={cn(
                'relative overflow-hidden rounded-3xl border bg-surface-2 p-5 shadow-overlay transition-opacity',
                wh.active ? 'border-border-strong' : 'border-border opacity-80',
              )}
            >
              <div
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent',
                  wh.active ? 'via-primary/60' : 'via-accent/40',
                )}
              />
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={wh.active ? 'success' : 'default'}>
                      <Radio className="h-3 w-3" /> {wh.active ? 'Active' : 'Paused'}
                    </Badge>
                    {wh.failureCount > 0 && (
                      <Badge variant={wh.failureCount >= 10 ? 'danger' : 'warning'}>
                        {wh.failureCount} failure{wh.failureCount === 1 ? '' : 's'}
                      </Badge>
                    )}
                    {wh.lastDeliveryStatus && (
                      <Badge variant={wh.lastDeliveryStatus === 'success' ? 'success' : 'danger'}>
                        Last: {wh.lastDeliveryStatus}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 truncate font-mono text-sm text-foreground">{wh.url}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {wh.events.map((ev) => (
                      <Badge key={ev} variant={EVENT_LABELS[ev]?.variant}>
                        {EVENT_LABELS[ev]?.label || ev}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-faint">
                    Added {timeAgo(wh.createdAt)}
                    {wh.lastDeliveryAt ? ` · last delivery ${timeAgo(wh.lastDeliveryAt)}` : ' · no deliveries yet'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                  <Button size="sm" variant="secondary" onClick={() => openDeliveries(wh)}>
                    <Activity className="h-3.5 w-3.5" /> Deliveries
                  </Button>
                  <Button size="sm" variant="secondary" loading={busyId === `${wh._id}:ping`} onClick={() => ping(wh)}>
                    <Send className="h-3.5 w-3.5" /> Ping
                  </Button>
                  <Button size="sm" variant="secondary" loading={busyId === `${wh._id}:active`} onClick={() => toggleActive(wh)}>
                    {wh.active ? 'Pause' : 'Resume'}
                  </Button>
                  <Button size="sm" variant="secondary" loading={busyId === `${wh._id}:rotate`} onClick={() => rotateSecret(wh)}>
                    <KeyRound className="h-3.5 w-3.5" /> Rotate secret
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:bg-danger/10 hover:text-danger"
                    loading={busyId === `${wh._id}:delete`}
                    onClick={() => removeWebhook(wh)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create endpoint */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add webhook endpoint</DialogTitle>
            <DialogDescription>
              Choose which events to push. We sign every delivery with a per-endpoint HMAC secret.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createWebhook} className="space-y-5">
            <Field label="Endpoint URL" required>
              <Input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://api.your-app.com/hooks/ems"
                required
              />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Subscribe to events</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {EVENT_OPTIONS.map((opt) => {
                  const selected = form.events.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleEvent(opt.value)}
                      aria-pressed={selected}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-left text-sm font-semibold transition',
                        selected
                          ? 'border-primary/40 bg-primary/10 text-foreground'
                          : 'border-border bg-surface-1 text-muted-foreground hover:border-border-strong hover:text-foreground',
                      )}
                    >
                      <span>{opt.label}</span>
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-lg border transition',
                          selected ? 'border-primary bg-primary text-canvas' : 'border-border-strong',
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creating}>
                <PlugZap className="h-4 w-4" /> Create endpoint
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Secret shown once */}
      <Dialog open={!!secretModal} onOpenChange={(o) => { if (!o) setSecretModal(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{secretModal?.title || 'Signing secret'}</DialogTitle>
            <DialogDescription>
              Store this immediately — it is shown only once and cannot be retrieved later.
              {secretModal?.rotated ? ' The previous secret remains valid for 24 hours.' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-faint">{secretModal?.url}</p>
            <div className="flex items-center gap-2 rounded-2xl border border-border-strong bg-inset p-3">
              <code className="min-w-0 flex-1 break-all font-mono text-sm text-primary">{secretModal?.secret}</code>
              <Button type="button" size="sm" variant="secondary" onClick={async () => { setCopied(true); await copyText(secretModal?.secret || ''); setTimeout(() => setCopied(false), 1600); }}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Verify deliveries with signature header{' '}
              <code className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[11px]">X-EMS-Signature</code> using an
              HMAC-SHA256 over {'{timestamp}.{raw_body}'} (Stripe-style{' '}
              <code className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[11px]">t=…,v1=…</code> format).
            </p>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setSecretModal(null)}>
              I’ve stored it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deliveries */}
      <Dialog open={!!deliveriesFor} onOpenChange={(o) => { if (!o) setDeliveriesFor(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Deliveries</DialogTitle>
            <DialogDescription>{deliveriesFor?.url}</DialogDescription>
          </DialogHeader>
          {deliveriesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : deliveries.length === 0 ? (
            <p className="rounded-2xl border border-border bg-surface-1 p-4 text-sm text-muted-foreground">
              No deliveries recorded yet. Deliveries are logged after the first triggered event.
            </p>
          ) : (
            <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              {deliveries.map((d) => (
                <div key={d._id} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-1 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={DELIVERY_STATUS[d.status]}>{d.status}</Badge>
                      <span className="font-mono text-xs text-faint">{d.event}</span>
                      {d.eventId && (
                        <span className="truncate font-mono text-[11px] text-faint">id {d.eventId}</span>
                      )}
                    </div>
                    <span className="text-xs text-faint">{timeAgo(d.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      attempt {d.attempts}/{d.maxAttempts}
                    </span>
                    {d.responseStatus ? <span>HTTP {d.responseStatus}</span> : null}
                    {d.error ? <span className="text-danger">{d.error}</span> : null}
                    {d.responseBodySnippet ? (
                      <code className="max-w-full truncate rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] text-accent">
                        {d.responseBodySnippet}
                      </code>
                    ) : null}
                    {d.status === 'failed' && (
                      <Button size="sm" variant="secondary" onClick={() => redeliver(d)}>
                        <RotateCw className="h-3 w-3" /> Redeliver
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}