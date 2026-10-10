import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { cn, coverAccent, coverGlow, coverGradient, coverNumeral, formatDate, formatTime } from '../lib/utils';

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

function PassRow({ label, value, mono, accent }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 truncate text-sm font-medium text-foreground', mono && 'font-mono text-xs text-primary', accent && 'text-success')}>
        {value}
      </p>
    </div>
  );
}

function TicketPass({ ticket }) {
  const toast = useToast();
  const ev = ticket.event || {};
  const isCheckedIn = ticket.status === 'Checked-In';
  const canPrint = typeof window !== 'undefined';
  const cover = coverGradient(ev);
  const glow = coverGlow(ev);
  const numeral = coverNumeral(ev.title || ticket._id);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ticket.qrCodeHash);
      toast.success('Code copied', 'Paste it at a gate scanner if the QR won’t scan.');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-border-strong bg-surface-2 shadow-elevate">
      {/* Header band */}
      <div className={cn('relative overflow-hidden rounded-t-[1.75rem] bg-gradient-to-br p-6', cover)}>
        <span
          aria-hidden="true"
          className={cn('absolute -top-6 right-3 select-none font-display text-[5rem] font-bold leading-none tracking-tighter opacity-[0.18]', coverAccent(ev))}
        >
          {numeral}
        </span>
        <span
          aria-hidden="true"
          className="absolute -left-14 bottom-0 h-40 w-40 rounded-full blur-3xl"
          style={{ backgroundColor: glow }}
        />
        <div aria-hidden="true" className="grain absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Gate · E-Ticket
            </p>
            <h3 className="mt-2 truncate font-display text-2xl font-bold tracking-tight text-white">
              {ev.title || 'Event'}
            </h3>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(ev.date)} · {formatTime(ev.date)}
              </span>
              {ev.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {ev.location}
                </span>
              )}
            </p>
          </div>
          <Badge
            variant={isCheckedIn ? 'success' : 'default'}
            className={cn('relative shrink-0 border-white/20 bg-black/40 !text-white', isCheckedIn && 'bg-success !text-success-foreground')}
          >
            {isCheckedIn ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            {isCheckedIn ? 'Checked In' : 'Valid'}
          </Badge>
        </div>
        <p className="relative mt-3 font-mono text-[10px] uppercase tracking-widest text-white/50">
          EMS-PLATFORM · ADMIT ONE · {numeral}
        </p>
      </div>

      {/* Perforation */}
      <div className="relative h-0">
        <div className="absolute -left-3.5 top-0 h-7 w-7 -translate-y-1/2 rounded-full bg-canvas" />
        <div className="absolute -right-3.5 top-0 h-7 w-7 -translate-y-1/2 rounded-full bg-canvas" />
        <div className="mx-8 border-t-2 border-dashed border-border-strong" />
      </div>

      {/* Pass body */}
      <div className="flex flex-col gap-6 p-6 sm:flex-row">
        <div className="relative mx-auto shrink-0 rounded-2xl bg-white p-3 shadow-overlay sm:mx-0">
          <QRCodeSVG
            value={ticket.qrCodeHash}
            size={148}
            level="M"
            marginSize={1}
            fgColor="#0a0a0b"
            bgColor="#ffffff"
            aria-label="Ticket QR code"
          />
          {isCheckedIn && (
            <motion.span
              initial={{ scale: 2, rotate: -18, opacity: 0 }}
              animate={{ scale: 1, rotate: -12, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-white/40"
            >
              <span className="-rotate-12 rounded border-4 border-success px-2 py-0.5 text-xs font-bold uppercase tracking-[0.25em] text-success">
                Checked in
              </span>
            </motion.span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hold to the bar</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <PassRow label="Gate code" value={ticket.qrCodeHash} mono />
            <PassRow label="Attendee" value={ticket.attendee?.name || 'Ticket holder'} />
            {ev.location ? <PassRow label="Venue" value={ev.location} /> : null}
            {ticket.attendee?.email ? <PassRow label="Contact" value={ticket.attendee.email} /> : null}
            {isCheckedIn && ticket.checkedInAt ? (
              <PassRow label="Checked in at" value={new Date(ticket.checkedInAt).toLocaleString()} accent />
            ) : (
              <PassRow label="Status" value="Ready to scan" accent />
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
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
        <p className="eyebrow !text-primary">
          <TicketIcon className="h-3.5 w-3.5" /> Your passes
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">My Tickets</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Your digital passes — available offline and ready to scan at the gate.
        </p>
        {offline && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning">
            <WifiOff className="h-4 w-4" /> Offline mode — showing your last synced tickets.
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full rounded-[1.75rem]" />
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