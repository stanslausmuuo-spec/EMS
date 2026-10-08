import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Users, Search, Download, Star, Tag, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';

export default () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [eventIdInput, setEventIdInput] = useState('');
  const [scanNotes, setScanNotes] = useState('');
  const [scanScore, setScanScore] = useState('Hot');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingLead, setEditingLead] = useState(null);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('ems_token');
      const res = await apiFetch('/api/leads', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load leads. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCaptureLead = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!eventIdInput.trim() || !searchEmail.trim()) {
      setError('Please provide both Event ID and Attendee Email');
      return;
    }

    try {
      const token = localStorage.getItem('ems_token');
      const res = await apiFetch('/api/leads/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: eventIdInput.trim(),
          email: searchEmail.trim(),
          score: scanScore,
          notes: scanNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Successfully captured lead: ${data.data.attendee.name}`);
        setSearchEmail('');
        setScanNotes('');
        fetchLeads();
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while processing lead capture. Please try again.');
    }
  };

  const handleUpdateScore = async (leadId, newScore) => {
    try {
      const token = localStorage.getItem('ems_token');
      const res = await apiFetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score: newScore })
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('ems_token');
      const res = await apiFetch('/api/leads/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exhibitor-leads.csv';
      a.click();
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exhibitor Lead Capture CRM</h1>
          <p className="text-sm text-slate-500">Scan, score, and manage your event booth leads.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded text-sm hover:opacity-95 transition"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center space-x-3 mb-6">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Capture Lead Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 mb-8 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Manual Lead Scanner / Entry</h2>
        <form onSubmit={handleCaptureLead} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input 
            type="text" 
            placeholder="Event ID..." 
            value={eventIdInput}
            onChange={e => setEventIdInput(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-transparent text-sm"
          />
          <input 
            type="email" 
            placeholder="Attendee Email..." 
            value={searchEmail}
            onChange={e => setSearchEmail(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-transparent text-sm"
          />
          <select 
            value={scanScore}
            onChange={e => setScanScore(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-transparent text-sm"
          >
            <option value="Hot">Hot Lead</option>
            <option value="Warm">Warm Lead</option>
            <option value="Cold">Cold Lead</option>
          </select>
          <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-sm transition">
            Capture Lead
          </button>
        </form>
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <span className="font-bold text-sm">Captured Leads ({leads.length})</span>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-slate-400">Loading leads...</p>
        ) : leads.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No leads captured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 font-semibold">Attendee</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Event</th>
                  <th className="p-4 font-semibold">Score</th>
                  <th className="p-4 font-semibold">Scanned At</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leads.map(lead => (
                  <tr key={lead._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-bold">{lead.attendee?.name || 'Unknown'}</td>
                    <td className="p-4 text-slate-500">{lead.attendee?.email || 'N/A'}</td>
                    <td className="p-4 text-slate-500">{lead.event?.title || 'Event'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded ${
                        lead.score === 'Hot' ? 'bg-red-100 text-red-800' :
                        lead.score === 'Warm' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {lead.score}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">{new Date(lead.scannedAt).toLocaleString()}</td>
                    <td className="p-4 text-right space-x-2">
                      <select 
                        value={lead.score} 
                        onChange={e => handleUpdateScore(lead._id, e.target.value)}
                        className="text-xs border border-slate-300 dark:border-slate-700 rounded px-2 py-1 bg-transparent"
                      >
                        <option value="Hot">Hot</option>
                        <option value="Warm">Warm</option>
                        <option value="Cold">Cold</option>
                      </select>
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
};
