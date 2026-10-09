import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, CalendarDays, Heart, MapPin, Music2, Terminal, Users, Wrench } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import { cn, coverGradient, formatDate, formatTime, isSoldOut, seatsLeft } from '../lib/utils';

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

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2), ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
    >
      <Link to={`/events/${event._id}`} className="relative block">
        <div className={cn('relative h-40 overflow-hidden bg-gradient-to-br', coverGradient(event.title))}>
          <CategoryGlyph
            strokeWidth={1}
            className="absolute -bottom-6 -right-4 h-28 w-28 text-white/[0.08] transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-ink-950/70 px-2.5 py-1 text-xs font-semibold text-white">
            <CategoryGlyph className="h-3.5 w-3.5" />
            {event.category}
          </span>
          {soldOut && (
            <span className="absolute right-4 top-4 rounded-full bg-danger px-2.5 py-1 text-xs font-semibold text-white">
              Sold out
            </span>
          )}
          {urgent && (
            <span className="absolute right-4 top-4 rounded-full bg-warning px-2.5 py-1 text-xs font-semibold text-warning-foreground">
              Only {left} left
            </span>
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
            className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-danger"
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
              <Users className="h-3.5 w-3.5" />
              {event.soldTickets || 0} attending
            </span>
            <span>{soldPct}% full</span>
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
