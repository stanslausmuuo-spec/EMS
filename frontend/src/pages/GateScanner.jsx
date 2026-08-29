import React, { useState, useEffect } from 'react';
import { saveOfflineScan, getOfflineScans, clearOfflineScans } from '../utils/indexedDB';
import { CheckCircle2, AlertCircle, Wifi, WifiOff, Camera } from 'lucide-react';

export default () => {
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('');
  const [flashSuccess, setFlashSuccess] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio context error fallback
    }
  };

  const syncOfflineQueue = async () => {
    try {
      const offlineScans = await getOfflineScans();
      if (offlineScans.length === 0) return;

      setSyncStatus(`Syncing ${offlineScans.length} offline scans...`);
      const token = localStorage.getItem('ems_token');

      for (const scan of offlineScans) {
        await fetch('/api/check-in/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ qrCodeHash: scan.qrCodeHash })
        });
      }

      await clearOfflineScans();
      setSyncStatus('All offline scans synchronized successfully!');
      setTimeout(() => setSyncStatus(''), 4000);
    } catch (err) {
      setSyncStatus('Failed to sync offline scans');
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    setError('');
    setScanResult(null);

    if (!qrCodeInput.trim()) return;

    const qrHash = qrCodeInput.trim();
    setQrCodeInput('');

    if (!navigator.onLine) {
      // Offline mode: save to IndexedDB outbox
      await saveOfflineScan({ qrCodeHash: qrHash });
      playChime();
      setFlashSuccess(true);
      setScanResult({
        message: 'Offline: Scan saved locally. Will sync when online.',
        data: { qrCodeHash: qrHash, status: 'Queued Offline' }
      });
      setTimeout(() => setFlashSuccess(false), 800);
      return;
    }

    try {
      const token = localStorage.getItem('ems_token');
      const res = await fetch('/api/check-in/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ qrCodeHash: qrHash })
      });
      const data = await res.json();

      if (data.success) {
        playChime();
        setFlashSuccess(true);
        setScanResult(data);
        setTimeout(() => setFlashSuccess(false), 800);
      } else {
        setError(data.message || 'Check-in validation failed');
      }
    } catch (err) {
      // Fallback if network drops mid-request
      await saveOfflineScan({ qrCodeHash: qrHash });
      playChime();
      setFlashSuccess(true);
      setScanResult({
        message: 'Network dropped: Saved to offline queue.',
        data: { qrCodeHash: qrHash, status: 'Queued Offline' }
      });
      setTimeout(() => setFlashSuccess(false), 800);
    }
  };

  return (
    <div className={`max-w-xl mx-auto px-4 py-8 transition-colors duration-200 ${flashSuccess ? 'bg-emerald-100 dark:bg-emerald-950/40 rounded-lg' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Gate Check-in Scanner</h1>
        <div className={`flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded ${isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
        </div>
      </div>

      {syncStatus && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">{syncStatus}</div>}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-2 text-slate-500 mb-4">
          <Camera className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium">Point laser scanner or enter QR code hash</span>
        </div>

        <form onSubmit={handleScan} className="space-y-4">
          <input 
            type="text" 
            placeholder="Paste or scan QR code hash..." 
            value={qrCodeInput} 
            onChange={e => setQrCodeInput(e.target.value)}
            autoFocus
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded bg-transparent font-mono text-sm"
          />
          <button type="submit" className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded hover:opacity-90">
            Validate Ticket
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center space-x-3 mb-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {scanResult && (
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 font-bold mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{scanResult.message}</span>
          </div>
          {scanResult.data?.attendee && (
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <p><strong>Attendee:</strong> {scanResult.data.attendee.name}</p>
              <p><strong>Email:</strong> {scanResult.data.attendee.email}</p>
              <p><strong>Event:</strong> {scanResult.data.event?.title}</p>
              <p><strong>Checked In At:</strong> {new Date(scanResult.data.checkedInAt || Date.now()).toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
