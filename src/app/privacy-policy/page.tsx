
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Bhasha Guard',
  description: 'Privacy Policy for the Bhasha Guard application, including data deletion instructions.',
  robots: 'noindex', 
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-0">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary">Privacy Policy for Bhasha Guard</h1>
      <p className="text-sm text-muted-foreground text-center mb-8"><em>Last updated: {new Date().toLocaleDateString()}</em></p>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <p className="mb-4 leading-relaxed">Welcome to Bhasha Guard. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.</p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">1. Information We Collect</h2>
        <h3 className="text-xl font-semibold mb-2 mt-4">Content for Analysis</h3>
        <p className="mb-4 leading-relaxed">
          When you input text or URLs into Bhasha Guard for analysis, this data is processed to provide you with spelling and grammar corrections, language detection, or other related linguistic services.
          Our application utilizes Google AI services (via Genkit) for its core processing capabilities. The data you submit (text, URLs) is sent to these services for analysis.
          We encourage you to review <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google's Privacy Policy</a> for detailed information on how Google handles data.
        </p>
        <p className="mb-4 leading-relaxed">
          Bhasha Guard itself does not store your input text or URLs on our servers permanently after processing is complete, beyond what is necessary for the immediate operation of the service and any transient logging performed by the underlying AI services for operational integrity and improvement, subject to their respective data retention policies.
        </p>

        <h3 className="text-xl font-semibold mb-2 mt-4">Location Information for Weather</h3>
        <p className="mb-4 leading-relaxed">
          Our application asks for your location permission for the sole purpose of providing you with localized weather information, which is displayed in the header. We use the browser's Geolocation API to get your coordinates. If you deny permission, we fall back to an IP-based location estimate provided by the weather service. Your precise location data is not stored or used for any other purpose by Bhasha Guard.
        </p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">2. How We Use Your Information</h2>
        <p className="mb-4 leading-relaxed">The information (text, URLs) you provide is used solely for the purpose of performing the requested language checks (spelling, grammar, language detection) via our AI models and delivering these results back to you through the application interface. Location information is used only to fetch and display current weather.</p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">3. Disclosure of Your Information</h2>
        <p className="mb-4 leading-relaxed">We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties, except to trusted third-party services (like Google AI for processing, or weather services) who assist us in operating our application. These parties are expected to keep this information confidential, in line with their own privacy policies.</p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">4. Data Security</h2>
        <p className="mb-4 leading-relaxed">We implement a variety of security measures to maintain the safety of your personal information during its transmission and processing. However, please be aware that no electronic storage or transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
      </section>
      
      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">5. Your Data Rights and Deletion Requests</h2>
        <p className="mb-4 leading-relaxed">
          As our application is primarily stateless and does not create user accounts for its core features, we do not store the text, URLs, or other content you submit for analysis on our servers after your request has been processed. The only data we may store is related to features where you explicitly provide it, such as our 'Feedback' or 'Chat' features, which are managed separately and require you to be logged in.
        </p>
        <p className="mb-4 leading-relaxed">
          If you have submitted feedback or used the chat feature and wish to have your associated data (name, email, messages, feedback content) reviewed or deleted, you can make a request.
        </p>
        <p className="mb-4 leading-relaxed">
          To do so, please send an email to our support team with the following information:
        </p>
        <ul className="list-disc list-inside mb-4 ml-4 space-y-2">
          <li><strong>Email Subject:</strong> "Data Deletion Request"</li>
          <li><strong>Your Name/Identifier:</strong> The name and email address you used when submitting feedback or using the chat.</li>
          <li><strong>Details of your request:</strong> A clear description of the data you would like to have deleted.</li>
        </ul>
        <p className="mb-4 leading-relaxed">
          Please send your request to: <a href="mailto:consolsentinelpost@gmail.com" className="text-accent hover:underline">consolsentinelpost@gmail.com</a>
        </p>
        <p className="mb-4 leading-relaxed">
          Upon receiving your request, we will confirm its receipt and process the deletion of any identified data from our systems within 30 days. We will notify you once the deletion has been completed.
        </p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">6. Third-Party Services</h2>
        <p className="mb-4 leading-relaxed">Our service utilizes Genkit, Google AI models, and weather data providers to deliver its functionalities. Your interaction with these services, initiated through Bhasha Guard, is subject to their respective privacy policies and terms of service.</p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">7. Your Consent</h2>
        <p className="mb-4 leading-relaxed">By using our application, Bhasha Guard, you consent to this Privacy Policy.</p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">8. Changes to This Privacy Policy</h2>
        <p className="mb-4 leading-relaxed">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
      </section>

      <section className="mb-6 p-6 bg-secondary text-secondary-foreground shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-primary-foreground bg-primary -mx-6 -mt-6 px-6 py-3 rounded-t-lg">9. Contact Us</h2>
        <p className="mb-4 leading-relaxed">If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:consolsentinelpost@gmail.com" className="text-accent hover:underline">consolsentinelpost@gmail.com</a></p>
      </section>

      <div className="mt-10 text-center">
        <Link href="/" className="text-primary hover:underline">
          &larr; Back to Bhasha Guard Home
        </Link>
      </div>
    </div>
  );
}
