import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Ticket, CheckCircle2 } from 'lucide-react';

export default () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem('ems_token');
        const res = await fetch('/api/tickets/my-tickets', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setTickets(data.data);
          // Cache tickets in localStorage for offline access
          localStorage.setItem('ems_cached_tickets', JSON.stringify(data.data));
        }
      } catch (err) {
        // Fallback to offline cached tickets
        const cached = localStorage.getItem('ems_cached_tickets');
        if (cached) {
          setTickets(JSON.parse(cached));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-2">My Tickets</h1>
      <p className="text-slate-500 mb-8">Access your digital passes and QR codes even without cellular service.</p>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg">
          You haven't booked any tickets yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((ticket) => (
            <div key={ticket._id} className="ticket-card shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ticket ID: {ticket._id}</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${ticket.status === 'Checked-In' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                    {ticket.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{ticket.event?.title || 'Event'}</h3>
                <div className="space-y-1 text-sm text-slate-600 mb-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(ticket.event?.date).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{ticket.event?.location}</span>
                  </div>
                </div>
              </div>

              {/* Pure white background container behind QR code for venue laser scanners */}
              <div className="bg-white border border-slate-200 p-4 rounded flex flex-col items-center justify-center">
                <div className="w-40 h-40 bg-slate-900 text-white flex items-center justify-center font-mono text-xs p-2 text-center rounded">
                  [QR HASH]<br/>{ticket.qrCodeHash.substring(0, 16)}...
                </div>
                <span className="text-xs text-slate-500 mt-2">Scan at Gate</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
