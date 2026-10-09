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
  Wifi,
  WifiOff,
} from 'lucide-react';
import { saveOfflineScan, getOfflineScans, clearOfflineScans } from '../utils/indexedDB';
import { api } from '../lib/api';
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
    try {
      for (const scan of scans) {
        await api.post('/api/check-in/scan', { qrCodeHash: scan.qrCodeHash });
      }
      await clearOfflineScans();
      setQueueCount(0);
      toast.success('Offline scans synced', `${scans.length} scan(s) reconciled.`);
    } catch {
      toast.error('Sync failed', 'Will retry when the connection is stable.');
    } finally {
      setSyncing(false);
    }
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
      if (data.success) {
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
      } else {
        const already = /already/i.test(data.message || '');
        playTone(false);
        vibrate(false);
        setResult({ kind: already ? 'duplicate' : 'error', message: data.message, data: data.data });
        pushHistory({
          code: value,
          name: data.data?.attendee?.name,
          event: data.data?.event?.title,
          status: already ? 'Duplicate' : 'Denied',
          time: new Date().toISOString(),
        });
      }
    } catch {
      await saveOfflineScan({ qrCodeHash: value });
      await refreshQueue();
      playTone(true);
      vibrate(true);
      setResult({ kind: 'queued', value });
      pushHistory({ code: value, status: 'Queued offline', time: new Date().toISOString() });
    } finally {
      setScanning(false);
      inputRef.current?.focus();
    }
  };

  const resultStyles = {
    success: 'border-success/40 bg-success/10 text-success',
    duplicate: 'border-warning/40 bg-warning/10 text-warning',
    error: 'border-danger/40 bg-danger/10 text-danger',
    queued: 'border-accent/40 bg-accent/10 text-accent',
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-ink-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
              Gate Check-in
            </h1>
            <p className="text-sm text-slate-400">Scan fast, validate offline, sync automatically.</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
                online
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-warning/40 bg-warning/10 text-warning',
              )}
            >
              {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {online ? 'Online' : 'Offline mode'}
            </span>
            {queueCount > 0 && (
              <Button
                size="sm"
                variant="secondary"
                loading={syncing}
                onClick={syncQueue}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <CloudUpload className="h-3.5 w-3.5" /> Sync {queueCount}
              </Button>
            )}
          </div>
        </div>

        {/* Scanner */}
        <div className="relative mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#111a2c] p-6 sm:p-8">
          {result?.kind === 'success' && (
            <motion.div
              key={`flash-${result.data?._id || result.value || ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.65, 0] }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50% 35%,rgb(79_70_229/0.5),transparent_70%)]"
            />
          )}
          <form onSubmit={handleScan} className="space-y-4 relative">
            <label htmlFor="scan-input" className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <ScanLine className="h-4 w-4 text-accent" /> Scan or paste a ticket code
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <QrCode className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  id="scan-input"
                  ref={inputRef}
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="QR hash…"
                  className="h-14 w-full rounded-2xl border border-white/10 bg-ink-900/80 pl-11 pr-4 font-mono text-base text-white outline-none transition placeholder:text-slate-500 focus:border-accent focus:ring-2 focus:ring-accent/40"
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
                className={cn('relative mt-6 rounded-2xl border p-5', resultStyles[result.kind])}
                role="status"
                aria-live="assertive"
              >
                <div className="flex items-start gap-3">
                  {result.kind === 'success' ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0" />
                  ) : result.kind === 'duplicate' ? (
                    <AlertTriangle className="h-6 w-6 shrink-0" />
                  ) : result.kind === 'queued' ? (
                    <CloudUpload className="h-6 w-6 shrink-0" />
                  ) : (
                    <AlertCircle className="h-6 w-6 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold">
                      {result.kind === 'success' && 'Access granted'}
                      {result.kind === 'duplicate' && 'Already checked in'}
                      {result.kind === 'error' && 'Access denied'}
                      {result.kind === 'queued' && 'Saved offline'}
                    </p>
                    {result.kind === 'success' && result.data && (
                      <>
                        <motion.span
                          initial={{ scale: 2.4, rotate: -18, opacity: 0 }}
                          animate={{ scale: 1, rotate: -12, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                          className="pointer-events-none absolute right-4 top-4 inline-flex -rotate-12 items-center rounded border-2 border-success/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-success/90"
                        >
                          Checked in
                        </motion.span>
                        <div className="mt-1 space-y-0.5 text-sm opacity-90">
                        <p><span className="font-semibold">{result.data.attendee?.name}</span> · {result.data.attendee?.email}</p>
                        <p>{result.data.event?.title}</p>
                      </div>
                      </>
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
        <div className="mt-8 rounded-3xl border border-white/10 bg-[#111a2c] p-6">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <History className="h-4 w-4" /> Session audit trail
          </div>
          {history.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No scans recorded yet in this session.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/5">
              {history.map((h, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {h.name || 'Unknown attendee'}
                    </p>
                    <p className="truncate font-mono text-xs text-slate-500">{h.code}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-slate-500">{timeAgo(h.time)}</span>
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
