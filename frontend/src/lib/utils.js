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

const COVER_GRADIENTS = [
  'from-indigo-500 via-violet-500 to-fuchsia-500',
  'from-sky-500 via-cyan-500 to-teal-400',
  'from-rose-500 via-orange-500 to-amber-400',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-violet-600 via-purple-500 to-indigo-400',
  'from-blue-600 via-indigo-500 to-sky-400',
];

export function coverGradient(seed = '') {
  const key = String(seed);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
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
