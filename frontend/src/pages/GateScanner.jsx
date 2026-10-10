import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  History,
  QrCode,
  ScanLine,
} from 'lucide-react';
import { saveOfflineScan, getOfflineScans, clearOfflineScans } from '../utils/indexedDB';
import { api, ApiError } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { cn, timeAgo } from '../lib/utils';

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

export default function GateScanner() {
  const online = useOnline();
  const toast = useToast();
  const inputRef = useRef(null);

  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [history, setHistory] = useState([]);
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const playTone = (ok = true) => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = ok ? 'sine' : 'square';
      osc.frequency.setValueAtTime(ok ? 920 : 220, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (ok ? 0.18 : 0.3));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      /* ignore */
    }
  };

  const vibrate = (ok) => {
    try {
      navigator.vibrate?.(ok ? 60 : [40, 40, 40]);
    } catch {
      /* ignore */
    }
  };

  const refreshQueue = useCallback(async () => {
    const scans = await getOfflineScans();
    setQueueCount(scans.length);
  }, []);

  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  const syncQueue = useCallback(async () => {
    const scans = await getOfflineScans();
    if (!scans.length) return;
    setSyncing(true);
    let synced = 0;
    let failed = 0;
    for (const scan of scans) {
      try {
        const res = await api.post('/api/check-in/scan', { qrCodeHash: scan.qrCodeHash });
        if (res?.success) synced += 1;
        else failed += 1;
      } catch (err) {
        // A definitive server answer (duplicate / invalid ticket) reconciles the
        // queued scan — only true network failures should remain queued.
        if (err instanceof ApiError && (err.status === 400 || err.status === 404)) synced += 1;
        else failed += 1;
      }
    }
    if (failed === 0) {
      await clearOfflineScans();
      setQueueCount(0);
      toast.success('Offline scans synced', `${synced} scan(s) reconciled.`);
    } else if (synced > 0) {
      toast.error('Partial sync', `${synced} reconciled, ${failed} still queued for retry.`);
    } else {
      toast.error('Sync failed', 'Will retry when the connection is stable.');
    }
    setSyncing(false);
  }, [toast]);

  useEffect(() => {
    if (online && queueCount > 0) syncQueue();
  }, [online, queueCount, syncQueue]);

  const pushHistory = (entry) => setHistory((prev) => [entry, ...prev].slice(0, 12));

  const handleScan = async (e) => {
    e.preventDefault();
    const value = code.trim();
    if (!value || scanning) return;
    setCode('');
    setScanning(true);
    setResult(null);

    if (!navigator.onLine) {
      await saveOfflineScan({ qrCodeHash: value });
      await refreshQueue();
      playTone(true);
      vibrate(true);
      setResult({ kind: 'queued', value });
      pushHistory({ code: value, status: 'Queued offline', time: new Date().toISOString() });
      setScanning(false);
      inputRef.current?.focus();
      return;
    }

    try {
      const data = await api.post('/api/check-in/scan', { qrCodeHash: value });
      playTone(true);
      vibrate(true);
      setResult({ kind: 'success', data: data.data });
      pushHistory({
        code: value,
        name: data.data?.attendee?.name,
        event: data.data?.event?.title,
        status: 'Checked-In',
        time: new Date().toISOString(),
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const already = /already/i.test(err.message || '');
        playTone(false);
        vibrate(false);
        setResult({
          kind: already ? 'duplicate' : 'error',
          message: err.message,
          data: err.raw?.data,
        });
        pushHistory({
          code: value,
          name: err.raw?.data?.attendee?.name,
          event: err.raw?.data?.event?.title,
          status: already ? 'Duplicate' : 'Denied',
          time: new Date().toISOString(),
        });
      } else {
        await saveOfflineScan({ qrCodeHash: value });
        await refreshQueue();
        playTone(true);
        vibrate(true);
        setResult({ kind: 'queued', value });
        pushHistory({ code: value, status: 'Queued offline', time: new Date().toISOString() });
      }
    } finally {
      setScanning(false);
      inputRef.current?.focus();
    }
  };

  const resultStyles = {
    success: 'border-primary/40 bg-primary/10 text-foreground',
    duplicate: 'border-warning/40 bg-warning/10 text-warning',
    error: 'border-danger/40 bg-danger/10 text-danger',
    queued: 'border-accent/40 bg-accent/10 text-accent',
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-canvas text-foreground">
      <div className="absolute inset-0 bg-mesh opacity-40" />
      <div className="absolute inset-0 surface-grid opacity-40" />
      <div aria-hidden="true" className="grain absolute inset-0" />
      <div className="relative mx-auto max-w-4xl px-4 py-8">
        {/* Terminal header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow !text-primary">
              <ScanLine className="h-3.5 w-3.5" /> Gate·01 · Terminal
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Check-in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Scan fast, validate offline, sync automatically.</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
                online
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-warning/40 bg-warning/10 text-warning',
              )}
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                {online && (
                  <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', online ? 'bg-success' : 'bg-warning')} />
                )}
                <span className={cn('relative inline-flex h-2 w-2 rounded-full', online ? 'bg-success' : 'bg-warning')} />
              </span>
              {online ? 'Online' : 'Offline mode'}
            </span>
            {queueCount > 0 && (
              <Button size="sm" variant="secondary" loading={syncing} onClick={syncQueue}>
                <CloudUpload className="h-3.5 w-3.5" /> Sync {queueCount}
              </Button>
            )}
          </div>
        </div>

        {/* Scanner */}
        <div className="relative mt-8 overflow-hidden rounded-3xl border border-border-strong bg-surface-2 p-6 shadow-overlay sm:p-8">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          {result?.kind === 'success' && (
            <motion.div
              key={`flash-${result.data?._id || result.value || ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0] }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50% 35%,rgb(var(--primary)/0.45),transparent_70%)]"
            />
          )}
          <form onSubmit={handleScan} className="relative space-y-5">
            <label htmlFor="scan-input" className="flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-primary" /> Scan or paste a ticket code
              </span>
              <span className="hidden font-mono text-[11px] uppercase tracking-widest text-faint sm:inline">expects 40-char hash</span>
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <QrCode className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-faint" />
                <input
                  id="scan-input"
                  ref={inputRef}
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="QR hash…"
                  className="h-14 w-full rounded-2xl border border-border-strong bg-inset pl-12 pr-4 font-mono text-base text-foreground shadow-inner outline-none transition placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <Button type="submit" size="lg" loading={scanning} className="h-14 sm:w-40">
                Validate
              </Button>
            </div>
          </form>

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={result.kind + (result.data?._id || result.value || result.message || '')}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ ease: [0.16, 1, 0.3, 1] }}
                className={cn('relative mt-6 overflow-hidden rounded-2xl border p-5', resultStyles[result.kind])}
                role="status"
                aria-live="assertive"
              >
                {result.kind === 'success' && (
                  <motion.span
                    aria-hidden="true"
                    initial={{ scale: 2.4, rotate: -18, opacity: 0 }}
                    animate={{ scale: 1, rotate: -12, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="pointer-events-none absolute right-4 top-4 inline-flex -rotate-12 items-center rounded border-2 border-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary"
                  >
                    Admit one
                  </motion.span>
                )}
                <div className="flex items-start gap-3">
                  {result.kind === 'success' ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />
                  ) : result.kind === 'duplicate' ? (
                    <AlertTriangle className="h-6 w-6 shrink-0" />
                  ) : result.kind === 'queued' ? (
                    <CloudUpload className="h-6 w-6 shrink-0" />
                  ) : (
                    <AlertCircle className="h-6 w-6 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-display text-xl font-bold">
                      {result.kind === 'success' && 'Access granted'}
                      {result.kind === 'duplicate' && 'Already checked in'}
                      {result.kind === 'error' && 'Access denied'}
                      {result.kind === 'queued' && 'Saved offline'}
                    </p>
                    {result.kind === 'success' && result.data && (
                      <div className="mt-1.5 space-y-0.5 text-sm text-muted-foreground">
                        <p className="font-semibold text-foreground">
                          {result.data.attendee?.name} · {result.data.attendee?.email}
                        </p>
                        <p>{result.data.event?.title}</p>
                      </div>
                    )}
                    {result.message && <p className="mt-1 text-sm opacity-90">{result.message}</p>}
                    {result.kind === 'queued' && (
                      <p className="mt-1 text-sm opacity-90">It will be validated automatically once you’re back online.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Audit log */}
        <div className="relative mt-8 overflow-hidden rounded-3xl border border-border-strong bg-surface-2 p-6 shadow-overlay">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <History className="h-4 w-4 text-accent" /> Session audit trail
          </div>
          {history.length === 0 ? (
            <p className="mt-4 text-sm text-faint">No scans recorded yet in this session.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {history.map((h, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {h.name || 'Unknown attendee'}
                    </p>
                    <p className="truncate font-mono text-xs text-faint">{h.code}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-faint">{timeAgo(h.time)}</span>
                    <Badge
                      variant={
                        h.status === 'Checked-In'
                          ? 'success'
                          : h.status === 'Duplicate'
                            ? 'warning'
                            : h.status === 'Denied'
                              ? 'danger'
                              : 'accent'
                      }
                    >
                      {h.status}
                    </Badge>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}