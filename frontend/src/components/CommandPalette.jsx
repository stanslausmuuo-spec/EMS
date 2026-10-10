import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
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

  const items = useMemo(() => {
    const linkItems = filteredLinks.map((l) => ({ kind: 'link', ...l }));
    const eventItems = filteredEvents.map((e) => ({
      kind: 'event',
      to: `/events/${e._id}`,
      label: e.title,
      icon: CalendarDays,
      event: e,
    }));
    return [...linkItems, ...eventItems];
  }, [filteredLinks, filteredEvents]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) go(item.to);
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  const go = (to) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[15%] z-[60] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-3xl border border-border-strong bg-surface-2 shadow-overlay data-[state=open]:animate-scale-in"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <DialogPrimitive.Title className="sr-only">Search and navigate</DialogPrimitive.Title>
          <div onKeyDown={onKeyDown} className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events, pages, actions…"
                aria-label="Search events and pages"
                className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <kbd className="hidden rounded-lg border border-border bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
                ESC
              </kbd>
            </div>

            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No results found.</p>
            ) : (
              <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
                {filteredLinks.length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">
                      Navigate
                    </p>
                    {filteredLinks.map((link, i) => {
                      const index = i;
                      const active = activeIndex === index;
                      return (
                        <button
                          key={link.to}
                          type="button"
                          role="option"
                          aria-selected={active}
                          data-index={index}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => go(link.to)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                            active ? 'bg-primary/12 text-primary' : 'text-muted-foreground',
                          )}
                        >
                          <link.icon className="h-4 w-4" />
                          <span className="font-medium text-foreground">{link.label}</span>
                          <CornerDownLeft className="ml-auto h-3.5 w-3.5 text-faint" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {filteredEvents.length > 0 && (
                  <div className="mt-1">
                    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">
                      Events
                    </p>
                    {filteredEvents.map((event, j) => {
                      const index = filteredLinks.length + j;
                      const active = activeIndex === index;
                      return (
                        <button
                          key={event._id}
                          type="button"
                          role="option"
                          aria-selected={active}
                          data-index={index}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => go(`/events/${event._id}`)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                            active ? 'bg-primary/12' : 'text-muted-foreground',
                          )}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                            <CalendarDays className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-foreground">
                              {event.title}
                            </span>
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
                          <CornerDownLeft className="ml-auto h-3.5 w-3.5 text-faint" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}