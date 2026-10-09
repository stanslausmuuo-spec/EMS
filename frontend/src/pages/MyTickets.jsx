import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Copy,
  MapPin,
  Printer,
  Ticket as TicketIcon,
  WifiOff,
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { cn, coverGradient, formatDate, formatTime } from '../lib/utils';

const CACHE_KEY = 'ems_cached_tickets';

function icsHref(ticket) {
  const ev = ticket.event || {};
  const start = new Date(ev.date || Date.now());
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EMS//Ticket//EN',
    'BEGIN:VEVENT',
    `UID:${ticket._id}@ems`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${ev.title || 'Event'}`,
    `LOCATION:${ev.location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}

function TicketPass({ ticket }) {
  const toast = useToast();
  const ev = ticket.event || {};
  const isCheckedIn = ticket.status === 'Checked-In';
  const canPrint = typeof window !== 'undefined';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ticket.qrCodeHash);
      toast.success('Code copied', 'Paste it at a gate scanner if the QR won’t scan.');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      <div className={cn('relative flex items-center justify-between gap-4 bg-gradient-to-br p-6 text-white', coverGradient(ev.title || ticket._id))}>
        <div className="absolute inset-0 surface-grid opacity-25" />
        <div className="relative min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/80">E-Ticket</p>
          <h3 className="mt-1 truncate font-display text-xl font-extrabold">{ev.title || 'Event'}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/90">
            <CalendarDays className="h-3.5 w-3.5" /> {formatDate(ev.date)} · {formatTime(ev.date)}
          </p>
        </div>
        <Badge
          variant={isCheckedIn ? 'success' : 'default'}
          className={cn('relative shrink-0 border-white/25 bg-white/15 text-white backdrop-blur', isCheckedIn && 'bg-success text-white')}
        >
          {isCheckedIn ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
          {isCheckedIn ? 'Checked-In' : 'Valid'}
        </Badge>
      </div>

      {/* Perforation */}
      <div className="relative h-0">
        <div className="absolute -left-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
        <div className="absolute -right-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
        <div className="mx-4 border-t-2 border-dashed border-border" />
      </div>

      <div className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-start">
        <div className="shrink-0 rounded-2xl bg-white p-3 shadow-soft dark:bg-white">
          <QRCodeSVG
            value={ticket.qrCodeHash}
            size={148}
            level="M"
            marginSize={1}
            fgColor="#0f172a"
            bgColor="#ffffff"
            aria-label="Ticket QR code"
          />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ticket code</p>
            <p className="break-all font-mono text-xs text-foreground">{ticket.qrCodeHash}</p>
          </div>

          {ev.location && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
              <MapPin className="h-3.5 w-3.5" /> {ev.location}
            </p>
          )}
          {isCheckedIn && ticket.checkedInAt && (
            <p className="mt-1 text-xs text-success">
              Checked in at {new Date(ticket.checkedInAt).toLocaleString()}
            </p>
          )}

          <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button size="sm" variant="secondary" onClick={copy}>
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
            <Button asChild size="sm" variant="secondary">
              <a href={icsHref(ticket)} download="event.ics">
                <CalendarPlus className="h-3.5 w-3.5" /> Add to calendar
              </a>
            </Button>
            {canPrint && (
              <Button size="sm" variant="secondary" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    api
      .get('/api/tickets/my-tickets')
      .then((data) => {
        if (data?.success) {
          setTickets(data.data || []);
          localStorage.setItem(CACHE_KEY, JSON.stringify(data.data || []));
        }
      })
      .catch(() => {
        try {
          const cached = JSON.parse(localStorage.getItem(CACHE_KEY)) || [];
          setTickets(cached);
          setOffline(true);
        } catch {
          /* ignore */
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const { upcoming, past } = useMemo(() => {
    const up = [];
    const pa = [];
    tickets.forEach((t) => {
      const d = t.event?.date ? new Date(t.event.date).getTime() : 0;
      (d >= now ? up : pa).push(t);
    });
    return { upcoming: up, past: pa };
  }, [tickets, now]);

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">My Tickets</h1>
        <p className="mt-1 text-muted-foreground">
          Your digital passes — available offline and ready to scan at the gate.
        </p>
        {offline && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning">
            <WifiOff className="h-4 w-4" /> Offline mode — showing your last synced tickets.
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-3xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title="No tickets yet"
          description="Browse upcoming events and book your first seat."
          action={<Button asChild><Link to="/">Discover events</Link></Button>}
        />
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">
            {upcoming.length === 0 ? (
              <EmptyState icon={TicketIcon} title="No upcoming tickets" description="Book an event to see it here." />
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {upcoming.map((t) => (
                  <TicketPass key={t._id} ticket={t} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="past">
            {past.length === 0 ? (
              <EmptyState icon={Clock} title="No past tickets" description="Your event history will appear here." />
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {past.map((t) => (
                  <TicketPass key={t._id} ticket={t} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
