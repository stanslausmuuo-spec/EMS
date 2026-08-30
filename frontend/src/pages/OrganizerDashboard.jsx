import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { apiFetch } from '../utils/api';
import { PlusCircle, Users, Ticket, TrendingUp, Download } from 'lucide-react';

export default () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [stats, setStats] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Tech');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [message, setMessage] = useState('');

  const fetchOrganizerEvents = async () => {
    try {
      const res = await apiFetch('/api/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
        if (data.data.length > 0 && !selectedEventId) {
          setSelectedEventId(data.data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrganizerEvents();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('ems_token');
        const res = await apiFetch(`/api/check-in/events/${selectedEventId}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();

    const socket = io();
    socket.emit('joinEventRoom', selectedEventId);

    socket.on('ticketCheckedIn', (data) => {
      if (data.eventId === selectedEventId) {
        setStats(prev => prev ? { ...prev, checkedInCount: prev.checkedInCount + 1 } : prev);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedEventId]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const token = localStorage.getItem('ems_token');
      const res = await apiFetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, category, date, location, capacity: Number(capacity) })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Event created successfully!');
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setDate('');
        setLocation('');
        fetchOrganizerEvents();
      } else {
        setMessage(data.message || 'Creation failed');
      }
    } catch (err) {
      setMessage('Network error');
    }
  };

  const downloadCSV = async () => {
    if (!selectedEventId) return;
    try {
      const token = localStorage.getItem('ems_token');
      const res = await apiFetch(`/api/check-in/events/${selectedEventId}/attendees/csv`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendees-event-${selectedEventId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to download CSV attendee list');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage events, monitor live attendance, and export attendee rosters.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded text-sm hover:opacity-95 transition flex items-center space-x-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Event</span>
        </button>
      </div>

      {message && <div className="mb-6 p-3 bg-blue-50 text-blue-700 rounded text-sm font-medium">{message}</div>}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Event Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 border rounded bg-transparent text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} required className="w-full px-3 py-2 border rounded bg-transparent text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded bg-transparent text-sm">
                    <option value="Tech">Tech</option>
                    <option value="Music">Music</option>
                    <option value="Business">Business</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Capacity</label>
                  <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required className="w-full px-3 py-2 border rounded bg-transparent text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date & Time</label>
                  <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required className="w-full px-3 py-2 border rounded bg-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} required className="w-full px-3 py-2 border rounded bg-transparent text-sm" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-semibold border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="w-full md:w-96">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Select Event to Monitor:</label>
            <select 
              value={selectedEventId} 
              onChange={e => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 border rounded bg-transparent text-sm font-medium"
            >
              {events.map(ev => (
                <option key={ev._id} value={ev._id}>{ev.title} ({new Date(ev.date).toLocaleDateString()})</option>
              ))}
            </select>
          </div>
          <button 
            onClick={downloadCSV}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded flex items-center space-x-2 transition"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export Attendee Roster (CSV)</span>
          </button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Total Capacity</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold">{stats.capacity}</div>
          </div>
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Tickets Sold</span>
              <Ticket className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold">{stats.soldTickets}</div>
          </div>
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Checked-In (Live WebSocket)</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-emerald-600">{stats.checkedInCount} <span className="text-sm text-slate-500 font-normal">({stats.attendanceRate})</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
