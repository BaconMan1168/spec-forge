import { LegalPageLayout, LegalSection } from "@/components/marketing/legal-page-layout";
import type { TocItem } from "@/components/marketing/legal-page-layout";

export const metadata = {
  title: "Terms of Service — Xern AI",
  description: "The terms and conditions governing your use of Xern AI.",
};

const EFFECTIVE_DATE = "April 25, 2026";
const CONTACT_EMAIL = "xernai.app@gmail.com";

const TOC: TocItem[] = [
  { id: "acceptance",       label: "Acceptance" },
  { id: "service-desc",     label: "Service Description" },
  { id: "accounts",         label: "Accounts" },
  { id: "acceptable-use",   label: "Acceptable Use" },
  { id: "your-content",     label: "Your Content" },
  { id: "ai-limitations",   label: "AI Limitations" },
  { id: "no-high-risk",     label: "No High-Risk Use" },
  { id: "plan-limits",      label: "Plan Limits" },
  { id: "billing",          label: "Billing & Payments" },
  { id: "third-party",      label: "Third-Party Services" },
  { id: "ip",               label: "Intellectual Property" },
  { id: "disclaimers",      label: "Disclaimers" },
  { id: "liability",        label: "Liability Limits" },
  { id: "indemnification",  label: "Indemnification" },
  { id: "termination",      label: "Termination" },
  { id: "governing-law",    label: "Governing Law" },
  { id: "changes",          label: "Changes to Terms" },
  { id: "contact",          label: "Contact" },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="These terms govern your access to and use of Xern AI. Please read them carefully before using the platform."
      effectiveDate={EFFECTIVE_DATE}
      tocItems={TOC}
    >
      <LegalSection id="acceptance" title="1. Acceptance of Terms">
        <p>
          By accessing or using Xern AI (&ldquo;Service&rdquo;) at{" "}
          <a href="https://xernai.com" className="text-[var(--color-accent-primary)] hover:underline">
            xernai.com
          </a>
          , you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;) and our{" "}
          <a href="/privacy" className="text-[var(--color-accent-primary)] hover:underline">
            Privacy Policy
          </a>
          . If you do not agree, do not access or use the Service.
        </p>
        <p>
          If you are using the Service on behalf of an organisation, you represent that you have the authority to
          bind that organisation to these Terms.
        </p>
      </LegalSection>

      <LegalSection id="service-desc" title="2. Description of Service">
        <p>
          Xern AI is a web-based platform that helps product teams and individuals transform raw customer
          feedback into AI-generated product specs, themes, and proposals. The Service includes file ingestion,
          AI synthesis (powered by third-party AI providers), proposal generation, and Markdown export
          capabilities.
        </p>
        <p>
          The Service is provided &ldquo;as is&rdquo; and features may change, be added, or be removed at any time.
          We will endeavour to provide reasonable notice of significant changes.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="3. Accounts and Registration">
        <ul className="list-disc space-y-2 pl-5">
          <li>You must provide accurate and complete information when creating an account.</li>
          <li>
            You are responsible for maintaining the confidentiality of your account credentials and for all
            activity that occurs under your account.
          </li>
          <li>
            You must be at least 18 years of age to use the Service.
          </li>
          <li>
            One person or entity may not maintain more than one free account. Duplicate accounts for the purpose
            of circumventing plan limits are prohibited.
          </li>
          <li>
            You must notify us promptly at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent-primary)] hover:underline">
              {CONTACT_EMAIL}
            </a>{" "}
            if you suspect unauthorised access to your account.
          </li>
          <li>
            We reserve the right to suspend or terminate accounts that violate these Terms or that have been
            inactive for an extended period, with reasonable notice where practicable.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="acceptable-use" title="4. Acceptable Use">
        <p>You agree not to use the Service to:</p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            Upload content that is unlawful, harmful, defamatory, obscene, or that infringes upon any
            third-party intellectual property, privacy, or contractual rights.
          </li>
          <li>
            Upload content containing personal data of third parties without a lawful basis to do so, or in
            violation of applicable data protection laws.
          </li>
          <li>
            Attempt to reverse-engineer, decompile, or extract the source code or underlying models of the
            Service.
          </li>
          <li>
            Use automated tools, bots, or scrapers to access the Service in a manner that exceeds normal,
            reasonable usage or that places undue load on our infrastructure.
          </li>
          <li>
            Attempt to gain unauthorised access to any part of the Service, its infrastructure, or other users&rsquo;
            accounts or data.
          </li>
          <li>
            Resell, sublicense, or provide access to the Service to third parties without prior written
            consent from Xern AI.
          </li>
          <li>
            Use the Service in any way that violates applicable local, national, or international law or
            regulation.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="your-content" title="5. Your Content">
        <p>
          You retain ownership of all content you upload to the Service (&ldquo;User Content&rdquo;). By uploading User
          Content, you grant Xern AI a limited, non-exclusive, royalty-free licence to process that content
          solely for the purpose of providing the Service to you.
        </p>
        <p>
          <span className="font-medium text-[var(--color-text-primary)]">
            We do not use your User Content to train, fine-tune, or otherwise improve any AI or machine learning
            model — ours or our subprocessors&rsquo;.
          </span>{" "}
          Your content is processed by AI models solely to generate outputs for you.
        </p>
        <p>
          You represent and warrant that:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            You have all necessary rights, licences, and permissions to upload and process the content you
            submit, including rights to any third-party data (e.g. customer feedback) contained within it.
          </li>
          <li>
            The content does not contain restricted, confidential, or legally privileged information that you
            are not authorised to process using a third-party AI service.
          </li>
          <li>
            Uploading the content does not violate any confidentiality agreement, non-disclosure agreement, or
            data protection obligation you are subject to.
          </li>
        </ul>
        <p>
          You are solely responsible for ensuring that your use of the Service complies with any applicable data
          processing agreements or regulations governing the data you upload.
        </p>
      </LegalSection>

      <LegalSection id="ai-limitations" title="6. AI Output Limitations">
        <p>
          Xern AI uses large language models (via Anthropic) to generate themes, quotes, and product spec
          proposals from your uploaded content. You acknowledge and agree that:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            AI-generated outputs may be inaccurate, incomplete, inconsistent, or unsuitable for your particular
            use case.
          </li>
          <li>
            Outputs are generated probabilistically and may vary between runs on the same input.
          </li>
          <li>
            All outputs must be reviewed, validated, and edited by a qualified human before being relied upon,
            shared, or acted upon.
          </li>
          <li>
            Xern AI makes no representation or warranty as to the accuracy, reliability, or fitness for purpose
            of any AI-generated output.
          </li>
        </ul>
        <p>
          The Service is a tool to assist human decision-making, not a replacement for professional judgement,
          domain expertise, or independent verification.
        </p>
      </LegalSection>

      <LegalSection id="no-high-risk" title="7. No High-Risk Use">
        <p>
          The Service is not designed or intended for use in high-stakes or safety-critical contexts. You must
          not use Xern AI outputs — without independent professional review — as the sole or primary basis for:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Medical diagnosis, treatment, or clinical decision-making.</li>
          <li>Legal advice, filings, or proceedings.</li>
          <li>Financial advice, investment decisions, or credit assessments.</li>
          <li>Employment, housing, insurance, or other decisions that materially affect individuals&rsquo; rights.</li>
          <li>Any application where errors could result in personal injury, death, or significant harm.</li>
        </ul>
        <p>
          In all such contexts, AI outputs must be treated as supplementary information only and must be
          independently verified by a qualified professional.
        </p>
      </LegalSection>

      <LegalSection id="plan-limits" title="8. Plan Limits and Usage">
        <p>
          Use of the Service is subject to plan-specific limits. Depending on your subscription tier, limits may
          apply to:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>The number of projects you may create.</li>
          <li>The number of analysis runs per project or per billing period.</li>
          <li>File size and number of files per upload batch.</li>
          <li>Storage of uploaded content and generated outputs.</li>
          <li>API request rate limits to prevent abuse and ensure fair use for all users.</li>
        </ul>
        <p>
          We reserve the right to introduce, adjust, or enforce usage limits at any time to maintain Service
          performance and fair access. We will endeavour to provide reasonable notice of material changes to
          plan limits.
        </p>
        <p>
          If you exceed the limits of your plan, we may throttle your usage or prompt you to upgrade. We will
          not silently charge you for overages.
        </p>
      </LegalSection>

      <LegalSection id="billing" title="9. Billing and Payments">
        <p>
          Certain features of the Service are available on a paid subscription basis. All fees are stated in US
          dollars (USD) unless otherwise indicated.
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Subscriptions</span> — paid plans are
            billed on a recurring basis (monthly or annually, as selected). Your subscription renews automatically
            at the end of each billing period unless you cancel.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Cancellation</span> — you may cancel
            your subscription at any time through your account settings. On cancellation, you will retain access
            to paid features until the end of your current billing period. No partial-period refunds are issued
            for early cancellation.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Refunds</span> — all payments are
            non-refundable except as required by applicable law, or where we have made a billing error. If you
            believe you have been charged in error, please contact us within 14 days of the charge.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Price changes</span> — we reserve the
            right to change subscription pricing at any time. We will provide at least 30 days&rsquo; advance notice of
            price increases, and they will not take effect until your next billing cycle.
          </li>
          <li>
            <span className="font-medium text-[var(--color-text-primary)]">Failed payments</span> — if a payment
            fails, we may suspend access to paid features until payment is successfully processed.
          </li>
        </ul>
        <p className="mt-3">
          All payments are processed by Stripe. By subscribing, you also agree to{" "}
          <a
            href="https://stripe.com/legal/ssa"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent-primary)] hover:underline"
          >
            Stripe&rsquo;s terms
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="third-party" title="10. Third-Party Services">
        <p>
          The Service relies on third-party providers including Vercel (hosting), Supabase (database and
          authentication), Anthropic (AI processing), Stripe (payments), and email delivery providers. Your use
          of the Service involves data being processed by these providers as described in our{" "}
          <a href="/privacy" className="text-[var(--color-accent-primary)] hover:underline">
            Privacy Policy
          </a>
          .
        </p>
        <p>
          These third-party services are governed by their own terms and privacy policies. Xern AI is not
          responsible for the practices, availability, or performance of third-party services. We will notify
          you of any material changes to our subprocessor relationships that affect how your data is handled.
        </p>
        <p>
          The Service may contain links to external websites or resources. We are not responsible for the content
          or practices of any third-party sites.
        </p>
      </LegalSection>

      <LegalSection id="ip" title="11. Intellectual Property">
        <p>
          All rights, title, and interest in and to the Service (excluding User Content) — including the
          software, design, trademarks, and AI-generated output formats — are and remain the exclusive property
          of Xern AI and its licensors.
        </p>
        <p>
          Nothing in these Terms grants you any right to use Xern AI&rsquo;s name, logo, or other trademarks without
          prior written consent.
        </p>
        <p>
          You own any output files (e.g. Markdown exports) generated from your own User Content. You are
          responsible for determining whether any third-party rights (including rights in your source data) affect
          your use of those outputs.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="12. Disclaimers">
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
          IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
          TITLE, OR NON-INFRINGEMENT.
        </p>
        <p>
          WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE FROM VIRUSES
          OR OTHER HARMFUL COMPONENTS. AI-GENERATED OUTPUTS ARE PROVIDED FOR INFORMATIONAL AND PRODUCTIVITY
          PURPOSES ONLY AND MAY BE INACCURATE OR INCOMPLETE. YOU BEAR SOLE RESPONSIBILITY FOR REVIEWING AND
          VALIDATING ALL OUTPUTS BEFORE RELIANCE.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="13. Limitation of Liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, XERN AI AND ITS AFFILIATES, OFFICERS, EMPLOYEES,
          AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
          PUNITIVE, OR EXEMPLARY DAMAGES — INCLUDING LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS OPPORTUNITIES
          — ARISING FROM OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN
          ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM THESE TERMS OR THE SERVICE SHALL NOT
          EXCEED THE GREATER OF (A) USD $100 OR (B) THE TOTAL FEES YOU PAID TO US IN THE THREE MONTHS
          IMMEDIATELY PRECEDING THE CLAIM.
        </p>
        <p>
          SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF LIABILITY FOR CERTAIN TYPES OF DAMAGES.
          IN SUCH JURISDICTIONS, OUR LIABILITY IS LIMITED TO THE FULLEST EXTENT PERMITTED BY LAW.
        </p>
      </LegalSection>

      <LegalSection id="indemnification" title="14. Indemnification">
        <p>
          You agree to indemnify, defend, and hold harmless Xern AI and its officers, directors, employees, and
          agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable
          legal fees) arising out of or in connection with:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Your access to or use of the Service.</li>
          <li>Your User Content, including any third-party claims relating to it.</li>
          <li>Your violation of these Terms.</li>
          <li>Your violation of any applicable law or third-party rights.</li>
        </ul>
      </LegalSection>

      <LegalSection id="termination" title="15. Termination">
        <p>
          Either party may terminate the agreement under these Terms at any time.
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            You may close your account at any time via account settings or by contacting us. Closure of a paid
            account takes effect at the end of the current billing period.
          </li>
          <li>
            We may suspend or terminate your access immediately and without prior notice if you materially breach
            these Terms, engage in illegal activity using the Service, or pose a risk to other users or our
            infrastructure.
          </li>
          <li>
            We may terminate the Service or discontinue certain features with reasonable advance notice.
          </li>
        </ul>
        <p className="mt-3">
          Upon termination, your right to access the Service ceases and we will handle your data in accordance
          with our{" "}
          <a href="/privacy" className="text-[var(--color-accent-primary)] hover:underline">
            Privacy Policy
          </a>
          . Sections 5, 6, 7, 11, 12, 13, 14, and 16 of these Terms survive termination.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" title="16. Governing Law and Disputes">
        <p>
          These Terms are governed by and construed in accordance with the laws of Singapore, without regard to
          its conflict of law principles.
        </p>
        <p>
          Any dispute arising out of or in connection with these Terms, including any question regarding their
          existence, validity, or termination, shall first be attempted to be resolved through good-faith
          negotiation. If unresolved within 30 days, disputes shall be subject to the non-exclusive jurisdiction
          of the courts of Singapore.
        </p>
        <p>
          Nothing in this section prevents either party from seeking urgent injunctive or equitable relief from
          any court of competent jurisdiction.
          {/* FOUNDER REVIEW: As the user base grows internationally, consider whether you want to add
              an arbitration clause, a specific arbitration body (e.g. SIAC), or region-specific
              dispute resolution language for EU/US users. A Singapore lawyer can advise. */}
        </p>
      </LegalSection>

      <LegalSection id="changes" title="17. Changes to These Terms">
        <p>
          We may update these Terms from time to time. When we do, we will post the revised Terms on this page
          with an updated effective date.
        </p>
        <p>
          For material changes — such as changes to your rights, payment terms, or data handling — we will
          provide at least 14 days&rsquo; advance notice via email or a prominent in-app notice. Non-material changes
          (such as clarifications or corrections) take effect immediately upon posting.
        </p>
        <p>
          Your continued use of the Service after the effective date of any updated Terms constitutes your
          acceptance of those changes. If you do not agree to the updated Terms, you should stop using the
          Service and close your account before the changes take effect.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="18. Contact Us" last>
        <p>
          For any questions about these Terms or to report a violation, please contact us at:
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
            We aim to respond to all legal inquiries within 14 business days.
          </p>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
}
