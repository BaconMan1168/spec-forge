export const metadata = {
  title: "Privacy Policy — Xern AI",
  description: "How Xern AI collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <main className="relative z-10 mx-auto max-w-[760px] px-8 py-24 text-[var(--color-text-secondary)]">
      <h1 className="mb-3 text-[42px] font-bold tracking-[-0.02em] text-[var(--color-text-primary)]">
        Privacy Policy
      </h1>
      <p className="mb-12 text-[14px] text-[var(--color-text-tertiary)]">
        Last updated: April 25, 2026
      </p>

      <Section title="1. Introduction">
        Xern AI (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the website{" "}
        <a
          href="https://xernai.com"
          className="text-[var(--color-accent-primary)] hover:underline"
        >
          xernai.com
        </a>{" "}
        and the Xern AI platform. This Privacy Policy explains how we collect,
        use, disclose, and safeguard your information when you use our service.
        Please read this policy carefully. If you disagree with its terms, please
        discontinue use of the site.
      </Section>

      <Section title="2. Information We Collect">
        <p className="mb-3">We may collect the following categories of information:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-[var(--color-text-primary)]">Account information</strong> — your
            name and email address when you register via Google OAuth or email.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)]">Usage data</strong> — pages
            visited, features used, and session timestamps.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)]">User-submitted content</strong> —
            feedback files, text, and other data you upload to create project
            specs.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)]">Technical data</strong> — IP
            address, browser type, device identifiers, and referral source.
          </li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Information">
        <ul className="list-disc space-y-2 pl-5">
          <li>To provide, operate, and maintain the Xern AI service.</li>
          <li>To authenticate your identity and secure your account.</li>
          <li>To process your uploaded content through our AI pipeline to generate specs.</li>
          <li>To send transactional emails (e.g. account confirmation, password reset).</li>
          <li>To improve and develop new features based on aggregate usage patterns.</li>
          <li>To comply with legal obligations.</li>
        </ul>
      </Section>

      <Section title="4. Sharing Your Information">
        We do not sell your personal data. We may share your information with:
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-[var(--color-text-primary)]">Service providers</strong> —
            Supabase (database and authentication), Anthropic (AI processing),
            Stripe (billing), and Vercel (hosting). Each provider is contractually
            bound to protect your data.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)]">Law enforcement</strong> — when
            required by applicable law or valid legal process.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)]">Business transfers</strong> — in
            connection with a merger, acquisition, or sale of assets, with prior
            notice.
          </li>
        </ul>
      </Section>

      <Section title="5. Data Retention">
        We retain your account data for as long as your account is active or as
        needed to provide services. You may request deletion of your account and
        associated data at any time by emailing{" "}
        <a
          href="mailto:privacy@xernai.com"
          className="text-[var(--color-accent-primary)] hover:underline"
        >
          privacy@xernai.com
        </a>
        . Uploaded project content is retained until you delete the project or
        close your account.
      </Section>

      <Section title="6. Cookies and Tracking">
        We use session cookies necessary for authentication and platform
        operation. We do not use third-party advertising cookies. You can
        configure your browser to refuse cookies, but some parts of the service
        may not function correctly.
      </Section>

      <Section title="7. Security">
        We implement industry-standard technical and organizational measures to
        protect your data, including TLS encryption in transit and access controls
        on our database. However, no method of transmission over the internet is
        100% secure, and we cannot guarantee absolute security.
      </Section>

      <Section title="8. Your Rights">
        Depending on your jurisdiction, you may have the right to:
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Access, correct, or delete your personal data.</li>
          <li>Object to or restrict certain processing activities.</li>
          <li>Data portability (receive your data in a structured format).</li>
          <li>Withdraw consent at any time where processing is consent-based.</li>
        </ul>
        To exercise any of these rights, contact us at{" "}
        <a
          href="mailto:privacy@xernai.com"
          className="text-[var(--color-accent-primary)] hover:underline"
        >
          privacy@xernai.com
        </a>
        .
      </Section>

      <Section title="9. Children's Privacy">
        Xern AI is not directed to individuals under the age of 13. We do not
        knowingly collect personal data from children. If you believe a child has
        provided us with personal data, please contact us and we will delete it
        promptly.
      </Section>

      <Section title="10. Changes to This Policy">
        We may update this Privacy Policy from time to time. We will notify you
        of material changes by posting the new policy on this page with an updated
        date. Continued use of the service after changes constitutes acceptance of
        the updated policy.
      </Section>

      <Section title="11. Contact Us">
        If you have any questions about this Privacy Policy, please contact us at{" "}
        <a
          href="mailto:privacy@xernai.com"
          className="text-[var(--color-accent-primary)] hover:underline"
        >
          privacy@xernai.com
        </a>
        .
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-[20px] font-semibold text-[var(--color-text-primary)]">
        {title}
      </h2>
      <div className="text-[15px] leading-[1.8]">{children}</div>
    </section>
  );
}
