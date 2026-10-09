import React from 'react';
import { FileText } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Acceptance of terms',
    body: 'By accessing or using the Event Management System (EMS), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, you may not use the platform.',
  },
  {
    title: '2. Accounts and registration',
    body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate information and promptly update it as needed.',
  },
  {
    title: '3. Tickets and bookings',
    body: 'Tickets issued through EMS are subject to event-specific terms set by the organizer. Each ticket carries a unique, single-use QR code. Duplicate or fraudulent use may result in denial of entry.',
  },
  {
    title: '4. Organizer responsibilities',
    body: 'Organizers are solely responsible for the events they publish, including accuracy of content, venue safety, and honoring tickets sold. EMS provides tooling but does not operate events.',
  },
  {
    title: '5. Acceptable use',
    body: 'You agree not to misuse the platform, attempt unauthorized access, disrupt scanning or check-in operations, or use automated systems to abuse ticket inventory.',
  },
  {
    title: '6. Limitation of liability',
    body: 'EMS is provided "as is" without warranties of any kind. To the maximum extent permitted by law, EMS is not liable for indirect, incidental, or consequential damages arising from your use of the platform.',
  },
  {
    title: '7. Changes to terms',
    body: 'We may update these terms from time to time. Continued use after changes take effect constitutes acceptance of the revised terms.',
  },
];

export default function Terms() {
  return (
    <div className="container max-w-3xl py-12">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated {new Date().getFullYear()}</p>
        </div>
      </div>
      <div className="mt-8 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-lg font-semibold">{s.title}</h2>
            <p className="mt-2 text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
