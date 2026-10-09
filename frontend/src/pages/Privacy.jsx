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
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/10 text-success">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Your privacy matters to us</p>
        </div>
      </div>
      <div className="mt-8 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-lg font-bold">{s.title}</h2>
            <p className="mt-2 text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
