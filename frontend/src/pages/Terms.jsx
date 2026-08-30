import React from 'react';

export default ({ setCurrentPage }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800 dark:text-slate-200">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Terms & Conditions</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: August 30, 2026</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">1. Agreement to Terms</h2>
          <p>By accessing or using the Enterprise Event Management System ("EMS"), you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access our platform or services.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">2. Ticketing & Seat Allocation</h2>
          <p>All ticket purchases and event registrations are processed through atomic distributed locking mechanisms. Once a ticket is confirmed and issued with a cryptographic QR hash, your seat is reserved. EMS guarantees zero overbooking via strict database concurrency controls.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">3. User Conduct & Accounts</h2>
          <p>Users must provide accurate information when registering accounts (Attendee or Organizer). You are responsible for safeguarding your credentials and JWT session tokens. Unauthorized gate scanning attempts or fraudulent ticket duplication will result in immediate account termination and potential legal liability.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">4. Limitation of Liability</h2>
          <p>EMS provides event infrastructure and ticketing software. Event organizers are solely responsible for venue safety, event execution, schedule changes, and refund policies. EMS shall not be held liable for indirect, incidental, or consequential damages arising from event cancellations or venue disruptions.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">5. Governing Law</h2>
          <p>These terms shall be governed by and construed in accordance with applicable commercial and technology jurisdiction laws, without regard to conflict of law provisions.</p>
        </section>

        <div className="pt-6">
          <button onClick={() => setCurrentPage('home')} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
