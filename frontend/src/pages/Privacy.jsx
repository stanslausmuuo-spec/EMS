import React from 'react';

export default ({ setCurrentPage }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800 dark:text-slate-200">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: August 30, 2026</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">1. Information We Collect</h2>
          <p>We collect personal information that you voluntarily provide when registering for an account, booking tickets, or creating events, including your name, email address, and encrypted authentication credentials. We also record check-in timestamps and cryptographic ticket hashes for event verification.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">2. How We Use Your Data</h2>
          <p>Your data is used exclusively to facilitate event registration, generate cryptographic PDF/QR tickets, dispatch confirmation notifications via secure SMTP, and provide real-time attendance analytics to verified event organizers.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">3. Data Security & Encryption</h2>
          <p>We implement robust enterprise security measures, including bcrypt password hashing, JSON Web Tokens (JWT), Helmet HTTP header hardening, Redis atomic locking, and encrypted database connections. Offline scan data is securely stored locally via IndexedDB.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">4. GDPR & CCPA Rights</h2>
          <p>You have the right to access, correct, or request deletion of your personal data at any time by contacting our system administration team. We do not sell, rent, or trade your personal information to third-party advertisers.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">5. Contact Us</h2>
          <p>If you have any questions regarding this Privacy Policy, please contact privacy@ems.local.</p>
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
