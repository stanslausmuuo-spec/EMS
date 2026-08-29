import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Users, Search, Ticket } from 'lucide-react';

export default () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  const fetchEvents = async () => {
    try {
      let url = '/api/events?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (category) url += `category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search, category]);

  const handleRegister = async (eventId) => {
    setMessage('');
    try {
      const token = localStorage.getItem('ems_token');
      const res = await fetch(`/api/tickets/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Successfully registered! Check your tickets.');
        fetchEvents();
      } else {
        setMessage(data.message || 'Registration failed');
      }
    } catch (err) {
      setMessage('Network error during registration');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upcoming Events</h1>
          <p className="text-slate-500 mt-1">Discover and secure tickets for conferences, festivals, and workshops.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search events..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-sm"
          >
            <option value="">All Categories</option>
            <option value="Tech">Tech</option>
            <option value="Music">Music</option>
            <option value="Business">Business</option>
            <option value="Workshop">Workshop</option>
          </select>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded text-sm">
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg">
          No events found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isSoldOut = event.soldTickets >= event.capacity;
            return (
              <div key={event._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded">
                      {event.category}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {event.capacity - event.soldTickets} seats left
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3">{event.description}</p>
                  
                  <div className="space-y-2 text-sm text-slate-500 mb-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Organizer: {event.organizer?.name || 'Admin'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {user ? (
                    isSoldOut ? (
                      <button disabled className="w-full py-2 bg-slate-200 dark:bg-slate-800 text-slate-500 font-semibold rounded cursor-not-allowed">
                        Sold Out
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleRegister(event._id)}
                        className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded hover:opacity-90 flex items-center justify-center space-x-2"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>Book Ticket</span>
                      </button>
                    )
                  ) : (
                    <div className="text-center text-sm text-slate-500 py-2">
                      Please login to book tickets
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
