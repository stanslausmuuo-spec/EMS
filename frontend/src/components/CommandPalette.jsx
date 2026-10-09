import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  CalendarDays,
  CornerDownLeft,
  LayoutDashboard,
  Loader2,
  MapPin,
  QrCode,
  Search,
  Ticket,
  Users,
} from 'lucide-react';
import { api } from '../lib/api';
import { cn, formatDate } from '../lib/utils';

const QUICK_LINKS = [
  { label: 'Discover events', to: '/', icon: CalendarDays },
  { label: 'Event agenda', to: '/agenda', icon: CalendarDays },
  { label: 'My tickets', to: '/tickets', icon: Ticket },
  { label: 'Gate scanner', to: '/scanner', icon: QrCode },
  { label: 'Organizer dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Lead capture', to: '/leads', icon: Users },
];

export function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get('/api/events')
      .then((data) => {
        if (!cancelled && data?.success) setEvents(data.data || []);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events.slice(0, 5);
    return events
      .filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.location || '').toLowerCase().includes(q) ||
          (e.category || '').toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [events, query]);

  const filteredLinks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK_LINKS.slice(0, 4);
    return QUICK_LINKS.filter((l) => l.label.toLowerCase().includes(q));
  }, [query]);

  const go = (to) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-ink-950/70 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-[15%] z-[60] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-float data-[state=open]:animate-scale-in">
          <DialogPrimitive.Title className="sr-only">Search and navigate</DialogPrimitive.Title>
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, pages, actions…"
              className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <div className="max-h-[50vh] overflow-y-auto p-2">
            {filteredLinks.length > 0 && (
              <div className="mb-1">
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Navigate
                </p>
                {filteredLinks.map((link) => (
                  <button
                    key={link.to}
                    onClick={() => go(link.to)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                  >
                    <link.icon className="h-4 w-4 text-muted-foreground" />
                    {link.label}
                    <CornerDownLeft className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            <div>
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Events
              </p>
              {filteredEvents.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">No events found.</p>
              ) : (
                filteredEvents.map((event) => (
                  <button
                    key={event._id}
                    onClick={() => go(`/events/${event._id}`)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white', 'from-primary to-accent')}>
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{event.title}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {formatDate(event.date)}
                        {event.location ? (
                          <>
                            <span aria-hidden>·</span>
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{event.location}</span>
                          </>
                        ) : null}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
