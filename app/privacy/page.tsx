import type { Metadata } from "next";
import { LegalPage, H2, List } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Privacy Policy | ${LEGAL.product}`,
  description: `How ${LEGAL.product} collects, uses and protects your information.`,
};

const mail = <a className="underline hover:text-white" href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains what information {LEGAL.product} (&quot;we&quot;, &quot;us&quot;), operated by {LEGAL.operator},
        collects when you use {LEGAL.siteUrl} and its API, how we use it, and the choices you have. Questions? Email {mail}.
      </p>

      <H2>1. Information we collect</H2>
      <p><strong className="text-white">Information you give us</strong></p>
      <List>
        <li><strong className="text-white">Account details.</strong> If you sign in with Google, we receive your name, email address and profile picture from Google. If you create an account with an email and password, we store your email and a securely hashed version of your password (we never store the password itself).</li>
        <li><strong className="text-white">Things you save in the app.</strong> Your watchlist, the holdings and transactions you enter in the portfolio tracker, and the price alerts you set.</li>
        <li><strong className="text-white">Messages.</strong> Anything you send us by email.</li>
      </List>
      <p><strong className="text-white">Information collected automatically</strong></p>
      <List>
        <li><strong className="text-white">Usage and technical data.</strong> The tickers you look up, and standard server logs such as IP address, browser type, pages or API endpoints requested and the time of each request. We use your IP address briefly to limit abuse (rate limiting).</li>
        <li><strong className="text-white">Cookies.</strong> We use essential cookies to keep you signed in. We do not use advertising or cross-site tracking cookies. The embedded demo video is served from YouTube in privacy-enhanced mode; YouTube may set its own cookies if you play it.</li>
      </List>
      <p><strong className="text-white">Payment information</strong></p>
      <List>
        <li>Payments are processed by Stripe. Your card details go directly to Stripe and never reach our servers. We receive and store your Stripe customer ID, subscription ID, plan and subscription status.</li>
      </List>

      <H2>2. How we use your information</H2>
      <List>
        <li>To provide the service: show market data and indicators, save your watchlist, portfolio and alerts, and send the alerts you ask for.</li>
        <li>To manage your account and subscription, including sign-in, email verification, password resets and billing.</li>
        <li>To keep the service secure and working: preventing abuse, debugging and monitoring performance.</li>
        <li>To contact you about your account or important changes to the service or these policies.</li>
      </List>
      <p>We do not sell your personal information, and we do not share it for cross-context behavioral advertising.</p>

      <H2>3. AI-generated summaries</H2>
      <p>
        To produce the AI summary for a ticker, we send the ticker symbol and its calculated indicator values (price, RSI, MACD
        and Bollinger Bands) to an AI provider, currently Google (Gemini) and/or Anthropic (Claude). We do not send your
        name, email, watchlist, portfolio or other personal information to these providers.
      </p>

      <H2>4. Who we share information with</H2>
      <p>We share information only with service providers that help us run {LEGAL.product}, and only as needed for them to do that work:</p>
      <List>
        <li><strong className="text-white">Hosting and infrastructure:</strong> Vercel (website) and Google Cloud (API servers and logs).</li>
        <li><strong className="text-white">Database:</strong> MongoDB (stores your account, watchlist, portfolio and alerts).</li>
        <li><strong className="text-white">Sign-in:</strong> Google, if you choose Google sign-in.</li>
        <li><strong className="text-white">Payments:</strong> Stripe.</li>
        <li><strong className="text-white">Email delivery:</strong> our email provider, to send verification, password-reset and alert emails.</li>
        <li><strong className="text-white">AI providers:</strong> Google and Anthropic, as described in section 3.</li>
        <li><strong className="text-white">Market data:</strong> third-party market data sources receive the ticker symbols requested, not your personal information.</li>
      </List>
      <p>We may also disclose information if required by law, to protect our rights or users&apos; safety, or as part of a sale or transfer of the business (in which case this policy will continue to apply to your information).</p>

      <H2>5. How long we keep it</H2>
      <List>
        <li>Account, watchlist, portfolio and alert data: for as long as your account is open. When you ask us to delete your account, we delete this data within 30 days, except where we must keep records (such as billing records) by law.</li>
        <li>Password-reset links expire after 1 hour and email-verification links after 48 hours.</li>
        <li>Server logs are kept for a limited period according to our hosting providers&apos; retention settings.</li>
      </List>

      <H2>6. Your choices and rights</H2>
      <p>
        You can ask us to access, correct, export or delete your personal information by emailing {mail}. We will respond
        within 30 days and may need to verify your identity first. You can cancel your subscription at any time, and you
        can stop alert emails by deleting your alerts. Depending on where you live (for example California, under the CCPA/CPRA,
        or the EU/UK, under the GDPR), you may have additional rights, and you will not be treated differently for using them.
      </p>

      <H2>7. Security</H2>
      <p>
        We use HTTPS encryption, hashed passwords, access controls and reputable hosting providers to protect your
        information. No system is perfectly secure, so we cannot guarantee absolute security. If we learn of a breach that
        affects you, we will notify you as required by law.
      </p>

      <H2>8. Children</H2>
      <p>{LEGAL.product} is not intended for anyone under 18, and we do not knowingly collect information from children. If you believe a child has given us information, email {mail} and we will delete it.</p>

      <H2>9. International users</H2>
      <p>{LEGAL.product} is operated from the United States, and your information is processed and stored in the United States and other countries where our service providers operate.</p>

      <H2>10. Changes to this policy</H2>
      <p>We may update this policy. If we make significant changes, we will update the effective date above and, where appropriate, notify you by email or in the app before the change takes effect.</p>

      <H2>11. Contact</H2>
      <p>{LEGAL.operator}, {LEGAL.product}: {mail}</p>
    </LegalPage>
  );
}
