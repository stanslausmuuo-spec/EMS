import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, CalendarDays, Heart, MapPin, Music2, Terminal, Users, Wrench } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import {
  cn,
  coverAccent,
  coverGlow,
  coverGradient,
  coverNumeral,
  formatDate,
  formatTime,
  isSoldOut,
  seatsLeft,
} from '../lib/utils';

const CATEGORY_GLYPHS = {
  Tech: Terminal,
  Music: Music2,
  Business: Briefcase,
  Workshop: Wrench,
};

export function EventCard({ event, index = 0, saved, onToggleSave }) {
  const soldOut = isSoldOut(event);
  const left = seatsLeft(event);
  const capacity = event.capacity || 1;
  const soldPct = Math.min(100, Math.round(((event.soldTickets || 0) / capacity) * 100));
  const urgent = !soldOut && left <= Math.max(5, capacity * 0.1);
  const CategoryGlyph = CATEGORY_GLYPHS[event.category] || CalendarDays;
  const numeral = coverNumeral(event.title);
  const accent = coverAccent(event);
  const glow = coverGlow(event);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2), ease: [0.16, 1, 0.3, 1] }}
      className="card-hover group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface-2 shadow-surface"
    >
      <Link to={`/events/${event._id}`} className="relative block" aria-label={event.title}>
        <div className={cn('relative h-44 overflow-hidden bg-gradient-to-br', coverGradient(event))}>
          <span
            aria-hidden="true"
            className={cn(
              'absolute -top-5 right-2 select-none font-display text-[6.5rem] font-bold leading-none tracking-tighter opacity-[0.15]',
              accent,
            )}
          >
            {numeral}
          </span>
          <span
            aria-hidden="true"
            className="absolute -left-12 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full blur-3xl"
            style={{ backgroundColor: glow }}
          />
          <CategoryGlyph
            strokeWidth={1}
            className="absolute -bottom-7 -left-5 h-32 w-32 rotate-12 text-white/[0.07] transition-transform duration-500 group-hover:scale-110"
          />
          <div aria-hidden="true" className="grain absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

          <span className="glass absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground">
            <CategoryGlyph className="h-3.5 w-3.5" />
            {event.category}
          </span>
          {soldOut && (
            <Badge variant="danger" className="absolute right-4 top-4 uppercase">Sold out</Badge>
          )}
          {urgent && (
            <Badge variant="warning" className="absolute right-4 top-4 uppercase">Only {left} left</Badge>
          )}

          <div className="absolute inset-x-4 bottom-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
              <CalendarDays className="h-3 w-3" />
              {formatDate(event.date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(event.date)}
            </p>
            <p className="mt-0.5 line-clamp-1 font-display text-lg font-semibold text-white">
              {event.title}
            </p>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <Link to={`/events/${event._id}`} className="min-w-0">
            <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
              {event.title}
            </h3>
          </Link>
          <button
            type="button"
            onClick={() => onToggleSave?.(event)}
            aria-label={saved ? 'Remove from saved' : 'Save event'}
            className={cn(
              'shrink-0 rounded-full p-1.5 transition hover:bg-muted',
              saved ? 'text-danger' : 'text-muted-foreground hover:text-danger',
            )}
          >
            <Heart className={cn('h-4 w-4', saved && 'fill-danger text-danger')} />
          </button>
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{event.location}</span>
        </div>

        <div className="mt-auto pt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              {event.soldTickets || 0} attending
            </span>
            <span className="tabular-nums">{soldPct}% full</span>
          </div>
          <Progress value={soldPct} indicatorClassName={soldOut ? 'bg-danger' : undefined} />

          <Button asChild className="mt-4 w-full" variant={soldOut ? 'secondary' : 'primary'}>
            <Link to={`/events/${event._id}`}>
              {soldOut ? 'View details' : 'Get tickets'}
            </Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}