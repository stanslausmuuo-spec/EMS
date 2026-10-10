import React from 'react';
import { FileText } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Acceptance of terms',
    body: 'By accessing or using the Event Management System (EMS), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, you may not use the platform.',
  },
  {
    title: 'Accounts and registration',
    body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate information and promptly update it as needed.',
  },
  {
    title: 'Tickets and bookings',
    body: 'Tickets issued through EMS are subject to event-specific terms set by the organizer. Each ticket carries a unique, single-use QR code. Duplicate or fraudulent use may result in denial of entry.',
  },
  {
    title: 'Organizer responsibilities',
    body: 'Organizers are solely responsible for the events they publish, including accuracy of content, venue safety, and honoring tickets sold. EMS provides tooling but does not operate events.',
  },
  {
    title: 'Acceptable use',
    body: 'You agree not to misuse the platform, attempt unauthorized access, disrupt scanning or check-in operations, or use automated systems to abuse ticket inventory.',
  },
  {
    title: 'Limitation of liability',
    body: 'EMS is provided "as is" without warranties of any kind. To the maximum extent permitted by law, EMS is not liable for indirect, incidental, or consequential damages arising from your use of the platform.',
  },
  {
    title: 'Changes to terms',
    body: 'We may update these terms from time to time. Continued use after changes take effect constitutes acceptance of the revised terms.',
  },
];

export default function Terms() {
  return (
    <div className="container max-w-3xl py-12">
      <p className="eyebrow !text-primary">
        <FileText className="h-3.5 w-3.5" /> Legal
      </p>
      <div className="mt-3 flex items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-1 text-sm text-muted-foreground">Last updated {new Date().getFullYear()}</p>
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
        Questions about these terms? Reach out to the platform administrator from your account settings.
      </p>
    </div>
  );
}