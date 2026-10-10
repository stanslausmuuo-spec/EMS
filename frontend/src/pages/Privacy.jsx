import React from 'react';
import { ShieldCheck } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Information we collect',
    body: 'We collect information you provide directly, such as your name, email address, role, and event registrations. Attendee check-in events and exhibitor lead captures are also recorded to operate the service.',
  },
  {
    title: 'How we use your data',
    body: 'Your information is used to issue tickets, validate entry at the gate, connect attendees with exhibitors you engage with, and improve platform reliability. We never sell your personal data.',
  },
  {
    title: 'QR codes and check-ins',
    body: 'Each ticket contains a unique hashed code used solely to verify entry. Scanning records a timestamp and confirmation status. Offline scans are queued on the device and synced once connectivity returns.',
  },
  {
    title: 'Data sharing',
    body: 'Organizers receive attendance data for their events. Exhibitors receive only the lead information you choose to share by having your ticket scanned at their booth.',
  },
  {
    title: 'Data retention',
    body: 'We retain account and event data for as long as your account is active or as needed to provide the service. You may request deletion of your account at any time.',
  },
  {
    title: 'Security',
    body: 'We apply industry-standard measures including encrypted transport, access controls, and least-privilege data handling to protect your information.',
  },
  {
    title: 'Your rights',
    body: 'Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data. Contact the platform administrator to exercise these rights.',
  },
];

export default function Privacy() {
  return (
    <div className="container max-w-3xl py-12">
      <p className="eyebrow !text-primary">
        <ShieldCheck className="h-3.5 w-3.5" /> Legal
      </p>
      <div className="mt-3 flex items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your privacy matters to us</p>
        </div>
        <span className="hidden font-mono text-xs uppercase tracking-[0.25em] text-faint sm:block">v1.0</span>
      </div>

      <ol className="mt-2">
        {SECTIONS.map((s, i) => (
          <li
            key={s.title}
            className="grid gap-3 border-b border-border py-7 sm:grid-cols-[3.5rem_1fr] sm:gap-6"
          >
            <span className="font-mono text-sm tabular text-primary">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">{s.title}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-8 rounded-2xl border border-dashed border-border-strong bg-surface-1/60 p-5 text-sm text-muted-foreground">
        To exercise your data rights, contact the platform administrator from your account settings.
      </p>
    </div>
  );
}