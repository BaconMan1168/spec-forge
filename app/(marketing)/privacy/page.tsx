import { LegalPageLayout, LegalSection } from "@/components/marketing/legal-page-layout";
import type { TocItem } from "@/components/marketing/legal-page-layout";

export const metadata = {
  title: "Privacy Policy — Xern AI",
  description: "How Xern AI collects, uses, and protects your personal information.",
};

const EFFECTIVE_DATE = "April 25, 2026";
const CONTACT_EMAIL = "xernai.app@gmail.com";

const TOC: TocItem[] = [
  { id: "introduction",     label: "Introduction" },
  { id: "data-collected",   label: "Data We Collect" },
  { id: "legal-bases",      label: "Legal Bases" },
  { id: "how-we-use",       label: "How We Use Data" },
  { id: "subprocessors",    label: "Subprocessors" },
  { id: "payment-data",     label: "Payment Data" },
  { id: "cookies",          label: "Cookies" },
  { id: "retention",        label: "Data Retention" },
  { id: "international",    label: "International Transfers" },
  { id: "security",         label: "Security" },
  { id: "your-rights",      label: "Your Rights" },
  { id: "age",              label: "Age Requirements" },
  { id: "policy-changes",   label: "Policy Changes" },
  { id: "contact",          label: "Contact" },
];

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="This policy explains what personal data Xern AI collects, why we collect it, and how we protect it."
      effectiveDate={EFFECTIVE_DATE}
      tocItems={TOC}
    >
      <LegalSection id="introduction" title="1. Introduction">
        <p>
          Xern AI (&ldquo;Xern&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the website{" "}
          <a href="https://xernai.com" className="text-[var(--color-accent-primary)] hover:underline">
            xernai.com
          </a>{" "}
          and the Xern AI platform — an AI-powered product discovery and spec generation tool.
        </p>
        <p>
          This Privacy Policy describes the personal information we collect, how we use it, and your rights in relation to it.
          By using the Service, you agree to the practices described here. If you do not agree, please discontinue use.
        </p>
        <p>
          This policy applies to all users of xernai.com regardless of their country of residence.
        </p>
      </LegalSection>

      <LegalSection id="data-collected" title="2. Data We Collect">
        <p>We may collect the following categories of information:</p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Account information</span> — your name
            and email address, provided when you register via Google OAuth or email/password.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">User-submitted content</span> — feedback
            files, pasted text, and other data you upload to create product specs. This content may include
            customer feedback or proprietary business information that you choose to provide.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Usage data</span> — pages visited,
            features used, session timestamps, and actions taken within the platform.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Technical data</span> — IP address,
            browser type, device identifiers, and referral source, collected automatically when you access the
            Service.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Billing information</span> — subscription
            tier and billing status. Payment card details are handled directly by Stripe and are not stored on our
            servers. See Section 6.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Communications</span> — messages you
            send to us via email for support or other inquiries.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="legal-bases" title="3. Legal Bases for Processing">
        <p>
          Where data protection law requires a legal basis for processing personal data, we rely on the following:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Contract performance</span> — processing
            necessary to provide you with the Service you signed up for (account management, running the AI
            pipeline on your content, billing).
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Legitimate interests</span> — improving
            and securing the Service, detecting fraud or abuse, and maintaining product analytics, where these
            interests are not overridden by your rights.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Legal obligation</span> — complying with
            applicable laws, regulations, or valid legal requests.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Consent</span> — where we have asked for
            your consent for a specific purpose (e.g. optional marketing communications), and you have provided it.
            You may withdraw consent at any time.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="how-we-use" title="4. How We Use Your Data">
        <ul className="list-disc space-y-2 pl-5">
          <li>To create and maintain your account and authenticate your identity.</li>
          <li>
            To process uploaded content through our AI pipeline — including sending that content to AI
            subprocessors — in order to generate themes, quotes, and product spec proposals on your behalf.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">
              We do not use your uploaded content to train, fine-tune, or improve any AI or machine learning model.
            </span>{" "}
            Your content is processed solely to produce outputs for you.
          </li>
          <li>To send transactional emails (e.g. account confirmation, password reset, billing receipts).</li>
          <li>To process payments and manage your subscription via Stripe.</li>
          <li>To monitor platform performance, detect abuse, and fix bugs.</li>
          <li>To improve the Service based on aggregate, anonymised usage patterns.</li>
          <li>To comply with legal obligations and enforce our Terms of Service.</li>
        </ul>
      </LegalSection>

      <LegalSection id="subprocessors" title="5. Subprocessors / Third-Party Services">
        <p>
          We share data with the following third-party service providers (&ldquo;subprocessors&rdquo;) who process
          data on our behalf. Each is contractually bound to protect your data and may only use it to provide
          services to us.
        </p>
        <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-0)]">
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]">Provider</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]">Purpose</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">Vercel</td>
                <td className="px-4 py-3 text-[var(--color-text-tertiary)]">Hosting &amp; edge network</td>
                <td className="px-4 py-3 text-[var(--color-text-tertiary)]">United States</td>
              </tr>
              <tr className="bg-[var(--color-surface-0)]/40">
                <td className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">Supabase</td>
                <td className="px-4 py-3 text-[var(--color-text-tertiary)]">Database &amp; authentication</td>
                <td className="px-4 py-3 text-[var(--color-text-tertiary)]">United States</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">Anthropic</td>
                <td className="px-4 py-3 text-[var(--color-text-tertiary)]">AI processing of uploaded content</td>
                <td className="px-4 py-3 text-[var(--color-text-tertiary)]">United States</td>
              </tr>
              <tr className="bg-[var(--color-surface-0)]/40">
                <td className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">Stripe</td>
                <td className="px-4 py-3 text-[var(--color-text-tertiary)]">Payment processing &amp; billing</td>
                <td className="px-4 py-3 text-[var(--color-text-tertiary)]">United States / Global</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">Google / Resend</td>
                <td className="px-4 py-3 text-[var(--color-text-tertiary)]">Transactional email delivery</td>
                <td className="px-4 py-3 text-[var(--color-text-tertiary)]">United States</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          We do not sell your personal data to third parties, and we do not share it with advertisers or data brokers.
        </p>
      </LegalSection>

      <LegalSection id="payment-data" title="6. Payment Data">
        <p>
          Xern AI uses Stripe to process all subscription payments. When you enter payment card details, those
          details are submitted directly to Stripe&rsquo;s secure servers and are never transmitted to or stored on
          Xern AI&rsquo;s systems.
        </p>
        <p>
          We receive from Stripe only non-sensitive billing metadata such as your subscription status, plan tier,
          billing interval, and a tokenised payment method identifier. We do not have access to your full card
          number, CVV, or expiry date.
        </p>
        <p>
          Stripe&rsquo;s privacy practices are governed by the{" "}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent-primary)] hover:underline"
          >
            Stripe Privacy Policy
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="7. Cookies and Tracking">
        <p>
          We use session cookies and local storage that are strictly necessary for the platform to function —
          specifically to maintain your authenticated session after login. We do not use advertising cookies,
          cross-site tracking cookies, or fingerprinting techniques.
        </p>
        <p>
          Xern AI does not currently use third-party analytics services. If we introduce analytics in the future,
          this policy will be updated and you will be notified in accordance with Section 13.
        </p>
        <p>
          You may configure your browser to block or delete cookies, but doing so may prevent you from remaining
          logged in to the Service.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="8. Data Retention and Deletion">
        <p>We retain your data for the following periods:</p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Account data</span> — retained for as
            long as your account is active, plus a reasonable period after closure to handle any outstanding
            billing queries or legal obligations.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Project content</span> — retained until
            you delete the project or close your account, whichever is earlier.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Backup and log data</span> — system
            backups and server logs may retain copies of your data for up to 90 days after deletion, after which
            they are purged as part of our standard infrastructure rotation.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Billing records</span> — retained for
            the period required by applicable tax and financial regulations.
          </li>
        </ul>
        <p className="mt-4">
          To request deletion of your account and all associated data, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent-primary)] hover:underline">
            {CONTACT_EMAIL}
          </a>
          . We will process your request and confirm deletion within 30 days, subject to legal retention
          requirements.
        </p>
      </LegalSection>

      <LegalSection id="international" title="9. International Data Transfers">
        <p>
          Xern AI is operated from Singapore. Our subprocessors (Vercel, Supabase, Anthropic, and Stripe) are
          primarily based in the United States. When you use the Service, your personal data may be transferred to
          and processed in countries outside your country of residence, including the United States and other
          jurisdictions.
        </p>
        <p>
          These countries may have data protection laws that differ from those in your country. We take reasonable
          steps to ensure that any cross-border data transfers are made subject to appropriate safeguards, and
          that subprocessors are bound by data protection obligations consistent with this policy.
        </p>
        <p>
          If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, please note that
          data transfers to subprocessors in the United States may be subject to Standard Contractual Clauses or
          other approved transfer mechanisms.
          {/* FOUNDER REVIEW: If you anticipate significant EEA user base, consult a privacy lawyer about
              implementing SCCs / an EU Representative and updating this section accordingly. */}
        </p>
      </LegalSection>

      <LegalSection id="security" title="10. Security">
        <p>
          We apply reasonable technical and organisational safeguards to protect your personal data against
          unauthorised access, loss, or disclosure. These include TLS encryption for data in transit, access
          controls on our database, and limiting access to personal data to staff and subprocessors who require it
          to deliver the Service.
        </p>
        <p>
          No method of data transmission or storage over the internet can be guaranteed to be 100% secure. While
          we take these measures seriously, we cannot provide an absolute guarantee against every security risk.
          If you believe your account has been compromised, please contact us immediately.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="11. Your Rights">
        <p>
          Depending on your country of residence and applicable law, you may have some or all of the following
          rights regarding your personal data:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li><span className="font-medium text-[var(--color-text-primary)]">Access</span> — request a copy of the data we hold about you.</li>
          <li><span className="font-medium text-[var(--color-text-primary)]">Correction</span> — request that we correct inaccurate or incomplete data.</li>
          <li><span className="font-medium text-[var(--color-text-primary)]">Deletion</span> — request erasure of your personal data, subject to legal retention requirements.</li>
          <li><span className="font-medium text-[var(--color-text-primary)]">Portability</span> — receive your data in a structured, machine-readable format.</li>
          <li><span className="font-medium text-[var(--color-text-primary)]">Objection / restriction</span> — object to or request restriction of certain processing activities.</li>
          <li><span className="font-medium text-[var(--color-text-primary)]">Withdraw consent</span> — where processing is based on consent, withdraw it at any time without affecting prior processing.</li>
        </ul>
        <p className="mt-4">
          To exercise any of these rights, contact us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent-primary)] hover:underline">
            {CONTACT_EMAIL}
          </a>
          . We will respond within 30 days. We may need to verify your identity before processing certain requests.
        </p>
      </LegalSection>

      <LegalSection id="age" title="12. Age Requirements">
        <p>
          The Service is intended for users who are 18 years of age or older. We do not knowingly collect personal
          data from individuals under 18. If you believe that a minor has provided us with personal data, please
          contact us and we will take steps to delete it promptly.
        </p>
      </LegalSection>

      <LegalSection id="policy-changes" title="13. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices, legal
          requirements, or the Service. When we make material changes, we will post the updated policy on this
          page with a revised effective date, and — where practicable — notify you via email or an in-app notice.
        </p>
        <p>
          Your continued use of the Service after the effective date of an updated policy constitutes your
          acceptance of the changes. If you do not agree to the updated policy, you should stop using the Service
          and request deletion of your account.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="14. Contact Us" last>
        <p>
          If you have questions, concerns, or requests relating to this Privacy Policy or your personal data,
          please contact us at:
        </p>
        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-5 py-4">
          <p className="font-medium text-[var(--color-text-primary)]">Xern AI</p>
          <p className="mt-1">
            Email:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent-primary)] hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-1 text-[var(--color-text-tertiary)]">
            We aim to respond to all privacy inquiries within 30 days.
          </p>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
}
