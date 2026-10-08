import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Calendar, Clock, MapPin, User, Bookmark, CheckCircle2, AlertCircle } from 'lucide-react';

export default ({ eventId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSessions = async () => {
    try {
      const targetEventId = eventId || '65e0a123456789abcdef0123'; // fallback demo ID or prop
      const res = await apiFetch(`/api/sessions/event/${targetEventId}`);
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [eventId]);

  const handleRegisterSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('ems_token');
      if (!token) {
        setError('Please login to bookmark/register for sessions');
        return;
      }
      const res = await apiFetch(`/api/sessions/${sessionId}/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Successfully registered for session!');
        fetchSessions();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Multi-Track Event Agenda</h1>
        <p className="text-sm text-slate-500">Explore conference sessions, breakout rooms, and build your personalized schedule.</p>
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

      {loading ? (
        <p className="text-sm text-slate-400">Loading agenda sessions...</p>
      ) : sessions.length === 0 ? (
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No scheduled sessions found for this event.</p>
          <p className="text-xs text-slate-400 mt-1">Organizers can add breakout sessions via the API.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => (
            <div key={session._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold rounded">
                    {session.track}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{session.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{session.description}</p>
                <div className="flex items-center space-x-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{session.speaker || 'Keynote Speaker'}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{session.room}</span>
                  </span>
                </div>
              </div>

              <button 
                onClick={() => handleRegisterSession(session._id)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded text-sm hover:opacity-95 transition flex-shrink-0"
              >
                <Bookmark className="w-4 h-4" />
                <span>Bookmark / Register</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
