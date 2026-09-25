import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, H2, List } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Terms of Service | ${LEGAL.product}`,
  description: `The terms that apply when you use ${LEGAL.product}.`,
};

const mail = <a className="underline hover:text-white" href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These Terms govern your use of {LEGAL.product} (the &quot;Service&quot;), operated by {LEGAL.operator} (&quot;we&quot;, &quot;us&quot;).
        By using the Service or creating an account, you agree to these Terms and to our{" "}
        <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>. If you do not agree, do not use the Service.
      </p>

      <H2>1. Not investment advice</H2>
      <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4">
        <p>
          {LEGAL.product} is an educational and informational tool. Nothing in the Service, including charts, indicators,
          AI-generated summaries, P/E evaluations, alerts or any other content, is investment, financial, tax, legal or trading
          advice, or a recommendation to buy, sell or hold any security, currency, cryptocurrency or other asset. We are not a
          registered investment adviser, broker-dealer or financial planner. Trading and investing involve risk, including the
          loss of your entire investment, and past performance does not predict future results. You are solely responsible for
          your own investment decisions. Consider consulting a licensed financial professional before acting.
        </p>
      </div>

      <H2>2. Market data and AI content</H2>
      <List>
        <li>Market data comes from third-party sources. It may be delayed, incomplete or inaccurate, and it is not guaranteed to be real-time. Do not rely on it for trading decisions.</li>
        <li>AI-generated summaries are produced automatically, can be wrong or out of date, and are not reviewed by a human before you see them.</li>
        <li>Market data is provided for your personal, non-commercial use only and may be subject to the terms of its providers. You may not redistribute, resell or republish it.</li>
      </List>

      <H2>3. Eligibility and accounts</H2>
      <List>
        <li>You must be at least 18 years old and able to form a binding contract to use the Service.</li>
        <li>You are responsible for keeping your login secure and for all activity under your account. Tell us promptly at {mail} if you suspect unauthorized use.</li>
        <li>Provide accurate information and keep it up to date.</li>
      </List>

      <H2>4. Plans, billing and cancellation</H2>
      <List>
        <li>
          {LEGAL.product} offers a free tier and paid subscriptions:{" "}
          {LEGAL.plans.map((p, i) => (
            <span key={p.name}>{i > 0 ? ", " : ""}<strong className="text-white">{p.name}</strong> at {p.price}</span>
          ))}
          , plus any applicable taxes. Features included in each plan are described in the app and may change over time.
        </li>
        <li>Paid plans are billed in advance through Stripe and <strong className="text-white">renew automatically each month</strong> until you cancel. By subscribing, you authorize us to charge your payment method on each renewal.</li>
        <li>You can cancel at any time. Cancellation takes effect at the end of your current billing period, and you keep access until then.</li>
        <li>Except where required by law, payments are non-refundable, and we do not provide refunds or credits for partial months or unused features. If you believe you were charged in error, contact {mail} within 30 days.</li>
        <li>We may change prices. We will tell you at least 30 days before a price change affects your subscription, and you can cancel before it takes effect.</li>
        <li>If a payment fails, we may suspend paid features or move your account to the free tier until payment succeeds.</li>
      </List>

      <H2>5. Acceptable use</H2>
      <p>You agree not to:</p>
      <List>
        <li>scrape, crawl, bulk-download or systematically extract data from the Service, or exceed its rate limits;</li>
        <li>resell, sublicense or commercially redistribute the Service or any data or content from it;</li>
        <li>reverse engineer, disrupt or attempt to gain unauthorized access to the Service, its servers or other accounts;</li>
        <li>share your account or paid access with others;</li>
        <li>use the Service for anything unlawful, including market manipulation or fraud.</li>
      </List>

      <H2>6. Our intellectual property</H2>
      <p>
        The Service, including its software, design and the {LEGAL.product} name, belongs to us and our licensors. We give you a
        limited, personal, non-transferable, revocable license to use the Service under these Terms. Your own data, such as your
        watchlist and portfolio entries, remains yours.
      </p>

      <H2>7. Suspension and termination</H2>
      <p>
        You can stop using the Service and ask us to delete your account at any time. We may suspend or terminate your access if you
        break these Terms, if required by law, or to protect the Service or other users. Sections 1, 2, 6 and 8–11 survive termination.
      </p>

      <H2>8. Disclaimer of warranties</H2>
      <p className="uppercase text-sm">
        The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied, including
        warranties of merchantability, fitness for a particular purpose, accuracy and non-infringement. We do not warrant that the
        Service or any data will be accurate, complete, timely, uninterrupted or error-free.
      </p>

      <H2>9. Limitation of liability</H2>
      <p className="uppercase text-sm">
        To the fullest extent permitted by law, we will not be liable for any indirect, incidental, special, consequential or punitive
        damages, or for any trading or investment losses, lost profits or lost data, arising from your use of or inability to use the
        Service. Our total liability for any claim relating to the Service is limited to the amount you paid us in the 12 months before
        the claim, or $100 if you paid nothing.
      </p>

      <H2>10. Indemnity</H2>
      <p>You agree to defend and indemnify us against claims, losses and expenses (including reasonable legal fees) arising from your misuse of the Service or your violation of these Terms.</p>

      <H2>11. Governing law and disputes</H2>
      <p>
        These Terms are governed by the laws of the State of {LEGAL.governingState}, USA, without regard to its conflict-of-law rules.
        Before filing any claim, you agree to contact us at {mail} and try to resolve the dispute informally for 30 days. Any claim
        that is not resolved will be brought in the state or federal courts located in {LEGAL.governingState}, and both parties
        consent to their jurisdiction. Nothing here limits rights you have under consumer protection laws that cannot be waived.
      </p>

      <H2>12. Changes to these Terms</H2>
      <p>We may update these Terms. If we make material changes, we will update the effective date and, where appropriate, notify you by email or in the app before they take effect. Continuing to use the Service after that means you accept the updated Terms.</p>

      <H2>13. Contact</H2>
      <p>{LEGAL.operator}, {LEGAL.product}: {mail}</p>
    </LegalPage>
  );
}
