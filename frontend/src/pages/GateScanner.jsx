import React, { useState, useEffect } from 'react';
import { saveOfflineScan, getOfflineScans, clearOfflineScans } from '../utils/indexedDB';
import { apiFetch } from '../utils/api';
import { CheckCircle2, AlertCircle, Wifi, WifiOff, Camera, History } from 'lucide-react';

export default () => {
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
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
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  };

  const syncOfflineQueue = async () => {
    try {
      const offlineScans = await getOfflineScans();
      if (offlineScans.length === 0) return;

      setSyncStatus(`Syncing ${offlineScans.length} offline scans...`);
      const token = localStorage.getItem('ems_token');

      for (const scan of offlineScans) {
        await apiFetch('/api/check-in/scan', {
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

  const addRecentScan = (scanItem) => {
    setRecentScans(prev => [scanItem, ...prev.slice(0, 4)]);
  };

  const handleScan = async (e) => {
    e.preventDefault();
    setError('');
    setScanResult(null);

    if (!qrCodeInput.trim()) return;

    const qrHash = qrCodeInput.trim();
    setQrCodeInput('');

    if (!navigator.onLine) {
      await saveOfflineScan({ qrCodeHash: qrHash });
      playChime();
      setFlashSuccess(true);
      const offlineItem = {
        name: 'Offline Queued Pass',
        email: qrHash.substring(0, 12) + '...',
        event: 'Cached Locally',
        time: new Date().toLocaleTimeString(),
        status: 'Queued Offline'
      };
      setScanResult({
        message: 'Offline: Scan saved locally. Will sync when online.',
        data: { qrCodeHash: qrHash, status: 'Queued Offline' }
      });
      addRecentScan(offlineItem);
      setTimeout(() => setFlashSuccess(false), 800);
      return;
    }

    try {
      const token = localStorage.getItem('ems_token');
      const res = await apiFetch('/api/check-in/scan', {
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
        addRecentScan({
          name: data.data?.attendee?.name || 'Attendee',
          email: data.data?.attendee?.email || '',
          event: data.data?.event?.title || 'Event',
          time: new Date().toLocaleTimeString(),
          status: 'Checked-In'
        });
        setTimeout(() => setFlashSuccess(false), 800);
      } else {
        setError(data.message || 'Check-in validation failed');
      }
    } catch (err) {
      await saveOfflineScan({ qrCodeHash: qrHash });
      playChime();
      setFlashSuccess(true);
      setScanResult({
        message: 'Network dropped: Saved to offline queue.',
        data: { qrCodeHash: qrHash, status: 'Queued Offline' }
      });
      addRecentScan({
        name: 'Network Fallback Pass',
        email: qrHash.substring(0, 12) + '...',
        event: 'Offline Queue',
        time: new Date().toLocaleTimeString(),
        status: 'Queued Offline'
      });
      setTimeout(() => setFlashSuccess(false), 800);
    }
  };

  return (
    <div className={`max-w-2xl mx-auto px-4 py-8 transition-colors duration-200 ${flashSuccess ? 'bg-emerald-50 dark:bg-emerald-950/30 rounded-lg' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gate Check-in Scanner</h1>
          <p className="text-sm text-slate-500">Real-time ticket validation with offline fallback.</p>
        </div>
        <div className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded border ${isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isOnline ? 'Online (Synced)' : 'Offline Mode'}</span>
        </div>
      </div>

      {syncStatus && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded text-sm font-medium">{syncStatus}</div>}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex items-center space-x-2 text-slate-500 mb-4">
          <Camera className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium">Laser scanner active / Enter or scan QR code hash</span>
        </div>

        <form onSubmit={handleScan} className="space-y-4">
          <input 
            type="text" 
            placeholder="Scan or paste ticket QR hash..." 
            value={qrCodeInput} 
            onChange={e => setQrCodeInput(e.target.value)}
            autoFocus
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded bg-transparent font-mono text-sm"
          />
          <button type="submit" className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded text-sm hover:opacity-95 transition">
            Validate & Check In
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {scanResult && (
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg mb-6 shadow-sm">
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 font-bold mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{scanResult.message}</span>
          </div>
          {scanResult.data?.attendee && (
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <p><strong>Attendee:</strong> {scanResult.data.attendee.name}</p>
              <p><strong>Email:</strong> {scanResult.data.attendee.email}</p>
              <p><strong>Event:</strong> {scanResult.data.event?.title}</p>
              <p><strong>Time:</strong> {new Date(scanResult.data.checkedInAt || Date.now()).toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Scans Audit Trail */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Recent Gate Scans (Audit Log)</h3>
        </div>
        {recentScans.length === 0 ? (
          <p className="text-xs text-slate-400">No scans recorded in current session.</p>
        ) : (
          <div className="space-y-3">
            {recentScans.map((scan, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{scan.name}</span>
                  <span className="text-slate-500 ml-2">({scan.event})</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400">{scan.time}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded">{scan.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
