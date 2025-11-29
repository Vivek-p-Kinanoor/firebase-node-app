
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions - Bhasha Guard',
  description: 'Terms and Conditions for using the Bhasha Guard application.',
  robots: 'noindex', 
};

export default function TermsAndConditionsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-0">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary">Terms and Conditions for Bhasha Guard</h1>
      <p className="text-sm text-muted-foreground text-center mb-8"><em>Last updated: {new Date().toLocaleDateString()}</em></p>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <p className="mb-4 leading-relaxed">Please read these Terms and Conditions (&quot;Terms&quot;, &quot;Terms and Conditions&quot;) carefully before using the Bhasha Guard application (the &quot;Service&quot;) operated by the team behind Bhasha Guard (referred to as &quot;us&quot;, &quot;we&quot;, or &quot;our&quot;).</p>
        <p className="mb-4 leading-relaxed">Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.</p>
        <p className="mb-4 leading-relaxed"><strong className="font-semibold">By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</strong></p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">1. Use of Service</h2>
        <p className="mb-4 leading-relaxed">Bhasha Guard provides language checking and refinement tools. You agree to use the Service responsibly and not for any unlawful purpose, to infringe on the rights of others, or to submit malicious or harmful content. You are solely responsible for the content you submit for processing and ensuring you have the necessary rights to do so.</p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">2. Intellectual Property</h2>
        <p className="mb-4 leading-relaxed">The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of The Bhasha Guard Team and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of The Bhasha Guard Team.</p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">3. AI Processing and Accuracy</h2>
        <p className="mb-4 leading-relaxed">The Service uses AI models (e.g., via Google Genkit) to process the text you submit. While we and our AI providers strive for accuracy, AI-generated suggestions may not always be perfect, complete, or suitable for all contexts. You acknowledge that the output provided by the Service is for informational purposes and assistance, and you are responsible for reviewing, verifying, and accepting any suggestions before use. We are not liable for any errors, inaccuracies, or consequences arising from your reliance on the AI-generated content.</p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">4. User Conduct</h2>
        <p className="mb-4 leading-relaxed">You agree not to use the Service to:</p>
        <ul className="list-disc list-inside mb-4 ml-4 space-y-1">
          <li>Submit any content that is unlawful, harmful, defamatory, obscene, or otherwise objectionable.</li>
          <li>Violate any applicable local, state, national, or international law.</li>
          <li>Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
          <li>Transmit any material that contains software viruses or any other computer code, files, or programs designed to interrupt, destroy, or limit the functionality of any computer software or hardware or telecommunications equipment.</li>
        </ul>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">5. Disclaimers</h2>
        <p className="mb-4 leading-relaxed">The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We make no warranties, expressed or implied, regarding the operation of the Service or the information, content, materials, or products included on the Service. You expressly agree that your use of the Service is at your sole risk. We do not warrant that the Service will be uninterrupted, timely, secure, or error-free.</p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">6. Limitation of Liability</h2>
        <p className="mb-4 leading-relaxed">In no event shall we (The Bhasha Guard Team) be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.</p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">7. Changes to Terms</h2>
        <p className="mb-4 leading-relaxed">We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">8. Governing Law</h2>
        <p className="mb-4 leading-relaxed">These Terms shall be governed and construed in accordance with the laws applicable to the operator of Bhasha Guard, without regard to conflict of law provisions.</p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">9. Contact Us</h2>
        <p className="mb-4 leading-relaxed">If you have any questions about these Terms, please contact us at: <a href="mailto:consolsentinelpost@gmail.com" className="text-accent hover:underline">consolsentinelpost@gmail.com</a></p>
      </section>

      <div className="mt-10 text-center">
        <Link href="/" className="text-primary hover:underline">
          &larr; Back to Bhasha Guard Home
        </Link>
      </div>
    </div>
  );
}
