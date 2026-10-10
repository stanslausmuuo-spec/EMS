import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date, opts = {}) {
  if (!date) return 'TBA';
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...opts,
  });
}

export function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date) {
  if (!date) return 'TBA';
  return `${formatDate(date)} · ${formatTime(date)}`;
}

const CATEGORY_CATALOG = {
  Tech: {
    gradient: 'from-[#10141f] via-[#16251c] to-[#0a0f0c]',
    accent: 'text-primary',
    glow: 'rgb(var(--primary) / 0.28)',
  },
  Music: {
    gradient: 'from-[#1d1018] via-[#291520] to-[#0f0a12]',
    accent: 'text-[#ff7a46]',
    glow: 'rgb(255 122 70 / 0.22)',
  },
  Business: {
    gradient: 'from-[#1b1507] via-[#231c0c] to-[#0c0a05]',
    accent: 'text-[#f5b544]',
    glow: 'rgb(245 181 68 / 0.2)',
  },
  Workshop: {
    gradient: 'from-[#0b1620] via-[#0e1f2b] to-[#070f14]',
    accent: 'text-[#5ec8f5]',
    glow: 'rgb(94 200 245 / 0.2)',
  },
};

const DEFAULT_COVER = CATEGORY_CATALOG.Tech;

export function coverStyle(event) {
  return CATEGORY_CATALOG[event?.category] || DEFAULT_COVER;
}

export function coverGradient(seed) {
  if (typeof seed === 'object' && seed !== null) return coverStyle(seed).gradient;
  return DEFAULT_COVER.gradient;
}

export function coverAccent(event) {
  return coverStyle(event).accent;
}

export function coverGlow(event) {
  return coverStyle(event).glow;
}

function hashOf(seed = '') {
  let hash = 0;
  const key = String(seed);
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function coverNumeral(seed = '') {
  return String((hashOf(seed) % 898) + 101);
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || '?';
}

export function seatsLeft(event) {
  if (!event) return 0;
  return Math.max(0, (event.capacity || 0) - (event.soldTickets || 0));
}

export function isSoldOut(event) {
  return seatsLeft(event) <= 0;
}

export function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
