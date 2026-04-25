export const metadata = {
  title: "Terms of Service — Xern AI",
  description: "The terms and conditions that govern your use of Xern AI.",
};

export default function TermsPage() {
  return (
    <main className="relative z-10 mx-auto max-w-[760px] px-8 py-24 text-[var(--color-text-secondary)]">
      <h1 className="mb-3 text-[42px] font-bold tracking-[-0.02em] text-[var(--color-text-primary)]">
        Terms of Service
      </h1>
      <p className="mb-12 text-[14px] text-[var(--color-text-tertiary)]">
        Last updated: April 25, 2026
      </p>

      <Section title="1. Acceptance of Terms">
        By accessing or using Xern AI (&quot;Service&quot;) at{" "}
        <a
          href="https://xernai.com"
          className="text-[var(--color-accent-primary)] hover:underline"
        >
          xernai.com
        </a>
        , you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you
        do not agree to these Terms, do not use the Service. We may update these
        Terms at any time; continued use of the Service constitutes acceptance of
        the updated Terms.
      </Section>

      <Section title="2. Description of Service">
        Xern AI is a web-based platform that helps product teams transform raw
        customer feedback into AI-generated product specs and proposals. The
        Service includes file ingestion, AI synthesis, proposal generation, and
        Markdown export capabilities.
      </Section>

      <Section title="3. Accounts and Registration">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            You must provide accurate and complete information when creating an
            account.
          </li>
          <li>
            You are responsible for maintaining the confidentiality of your
            account credentials.
          </li>
          <li>
            You are responsible for all activity that occurs under your account.
          </li>
          <li>
            You must be at least 13 years old to use the Service.
          </li>
          <li>
            We reserve the right to suspend or terminate accounts that violate
            these Terms.
          </li>
        </ul>
      </Section>

      <Section title="4. Acceptable Use">
        You agree not to use the Service to:
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Upload content that is illegal, harmful, defamatory, or infringes on third-party rights.</li>
          <li>Reverse-engineer, decompile, or attempt to extract the source code of the Service.</li>
          <li>Use automated tools (bots, scrapers) to access the Service in a manner that exceeds normal usage.</li>
          <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
          <li>Resell or sublicense access to the Service without prior written consent.</li>
        </ul>
      </Section>

      <Section title="5. Your Content">
        You retain ownership of all content you upload to the Service
        (&quot;User Content&quot;). By uploading User Content, you grant Xern AI a
        limited, non-exclusive license to process that content solely for the
        purpose of providing the Service to you. We do not use your User Content
        to train AI models. You represent and warrant that you have all rights
        necessary to upload and process your User Content.
      </Section>

      <Section title="6. Intellectual Property">
        All rights, title, and interest in and to the Service (excluding User
        Content) are and remain the exclusive property of Xern AI and its
        licensors. Our name, logo, and all related marks are trademarks of
        Xern AI. Nothing in these Terms grants you any right to use our
        trademarks.
      </Section>

      <Section title="7. Billing and Payments">
        Certain features of the Service are available on a paid subscription
        basis. All fees are stated in US dollars and are non-refundable except as
        required by applicable law. We reserve the right to change pricing at any
        time with reasonable notice. If you fail to pay applicable fees, we may
        suspend or terminate your access to paid features.
      </Section>

      <Section title="8. Disclaimers">
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
        OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
        WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
        NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
        UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL
        COMPONENTS. AI-GENERATED OUTPUTS ARE PROVIDED FOR INFORMATIONAL PURPOSES
        AND SHOULD BE REVIEWED BEFORE RELIANCE.
      </Section>

      <Section title="9. Limitation of Liability">
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, XERN AI AND ITS
        AFFILIATES, OFFICERS, EMPLOYEES, AND LICENSORS WILL NOT BE LIABLE FOR
        ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
        OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR
        INDIRECTLY. OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM THESE
        TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF $100 USD OR THE
        AMOUNT YOU PAID TO US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
      </Section>

      <Section title="10. Indemnification">
        You agree to indemnify, defend, and hold harmless Xern AI and its
        officers, directors, employees, and agents from and against any claims,
        liabilities, damages, losses, and expenses (including reasonable
        attorneys&apos; fees) arising out of or in any way connected with your access
        to or use of the Service, your User Content, or your violation of these
        Terms.
      </Section>

      <Section title="11. Termination">
        Either party may terminate this agreement at any time. You may close your
        account by contacting us. We may suspend or terminate your access
        immediately if you breach these Terms. Upon termination, your right to use
        the Service ceases and we may delete your account data in accordance with
        our Privacy Policy.
      </Section>

      <Section title="12. Governing Law">
        These Terms shall be governed by and construed in accordance with the
        laws of the State of Delaware, without regard to its conflict of law
        provisions. Any disputes shall be resolved exclusively in the state or
        federal courts located in Delaware.
      </Section>

      <Section title="13. Contact Us">
        If you have any questions about these Terms, please contact us at{" "}
        <a
          href="mailto:legal@xernai.com"
          className="text-[var(--color-accent-primary)] hover:underline"
        >
          legal@xernai.com
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
