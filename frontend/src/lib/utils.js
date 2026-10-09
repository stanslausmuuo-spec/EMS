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
  'from-[#161e38] to-[#0d1226]',
  'from-[#211539] to-[#120a22]',
  'from-[#0f2630] to-[#0a161c]',
  'from-[#2b1a12] to-[#160c08]',
  'from-[#1c2830] to-[#0d141a]',
  'from-[#251b2e] to-[#110d18]',
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
