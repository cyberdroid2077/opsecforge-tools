import React from 'react';
import { Scale, Shield, AlertCircle, FileText, Globe, Mail } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service - OpSecForge',
  description: 'Terms of Service for OpSecForge - Free online developer security tools',
};

export default function TermsOfService() {
  const lastUpdated = 'March 15, 2026';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Scale className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Terms of Service</h1>
              <p className="text-slate-400 text-sm mt-1">Last updated: {lastUpdated}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-invert prose-slate max-w-none">
          {/* Introduction */}
          <section className="mb-12">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-300 leading-relaxed">
                    Welcome to <strong className="text-white">OpSecForge</strong>. These Terms of Service 
                    (&quot;Terms&quot;) govern your access to and use of our free online developer tools and 
                    services. By accessing or using OpSecForge, you agree to be bound by these Terms. 
                    If you disagree with any part of the terms, you may not access the service.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">1</span>
              Use of Service
            </h2>
            <div className="text-slate-300 space-y-4 leading-relaxed pl-10">
              <p>
                OpSecForge provides free online security tools for developers and security professionals. 
                Our services are provided &quot;as is&quot; and &quot;as available&quot; for your personal, 
                non-commercial, or commercial use.
              </p>
              <p>
                You agree to use our tools only for lawful purposes and in accordance with these Terms. 
                You are solely responsible for any data you input, process, or generate using our services.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">2</span>
              No Data Storage Policy
            </h2>
            <div className="text-slate-300 space-y-4 leading-relaxed pl-10">
              <p>
                <strong className="text-white">All processing is done client-side.</strong> OpSecForge does 
                not store, transmit, or retain any data you process using our tools. Your data never leaves 
                your browser unless you explicitly choose to use features that require server communication.
              </p>
              <p>
                We have no ability to recover or access any data processed through our tools. You are 
                responsible for saving and securing your own work.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">3</span>
              Intellectual Property
            </h2>
            <div className="text-slate-300 space-y-4 leading-relaxed pl-10">
              <p>
                OpSecForge and its original content, features, and functionality are and will remain the 
                exclusive property of OpSecForge and its licensors. The service is protected by copyright, 
                trademark, and other laws.
              </p>
              <p>
                You retain all rights to any content you generate using our tools. We claim no ownership 
                over your input or output data.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">4</span>
              Disclaimers
            </h2>
            <div className="text-slate-300 space-y-4 leading-relaxed pl-10">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-amber-200/80">
                    Our tools are provided for educational and development purposes. While we strive for 
                    accuracy, we make no guarantees about the correctness, reliability, or suitability of 
                    our tools for any specific purpose.
                  </p>
                </div>
              </div>
              <p>
                Your use of the service is at your sole risk. The service is provided without warranties 
                of any kind, whether express or implied, including, but not limited to, implied warranties 
                of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">5</span>
              Limitation of Liability
            </h2>
            <div className="text-slate-300 space-y-4 leading-relaxed pl-10">
              <p>
                In no event shall OpSecForge, nor its directors, employees, partners, agents, suppliers, 
                or affiliates, be liable for any indirect, incidental, special, consequential, or punitive 
                damages, including without limitation, loss of profits, data, use, goodwill, or other 
                intangible losses.
              </p>
              <p>
                This limitation applies regardless of whether the damages are based on warranty, contract, 
                tort, or any other legal theory, and whether or not we have been informed of the possibility 
                of such damage.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">6</span>
              Prohibited Uses
            </h2>
            <div className="text-slate-300 space-y-4 leading-relaxed pl-10">
              <p>You agree not to use OpSecForge to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon or violate our intellectual property rights or the rights of others</li>
                <li>Transmit any malicious code, viruses, or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems or networks</li>
                <li>Interfere with or disrupt the integrity or performance of the service</li>
                <li>Engage in any activity that could harm minors</li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">7</span>
              Third-Party Services
            </h2>
            <div className="text-slate-300 space-y-4 leading-relaxed pl-10">
              <p>
                Our service may contain links to third-party websites or services that are not owned or 
                controlled by OpSecForge. We have no control over, and assume no responsibility for, the 
                content, privacy policies, or practices of any third-party websites or services.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">8</span>
              Changes to Terms
            </h2>
            <div className="text-slate-300 space-y-4 leading-relaxed pl-10">
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                If a revision is material, we will try to provide at least 30 days&apos; notice prior to any 
                new terms taking effect.
              </p>
              <p>
                What constitutes a material change will be determined at our sole discretion. By continuing 
                to access or use our service after those revisions become effective, you agree to be bound 
                by the revised terms.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">9</span>
              Governing Law
            </h2>
            <div className="text-slate-300 space-y-4 leading-relaxed pl-10">
              <p>
                These Terms shall be governed and construed in accordance with the laws applicable to 
                online services, without regard to its conflict of law provisions.
              </p>
              <p>
                Our failure to enforce any right or provision of these Terms will not be considered a 
                waiver of those rights. If any provision of these Terms is held to be invalid or 
                unenforceable by a court, the remaining provisions of these Terms will remain in effect.
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">10</span>
              Contact Us
            </h2>
            <div className="text-slate-300 space-y-4 leading-relaxed pl-10">
              <p>
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                <Mail className="w-4 h-4" />
                <a href="mailto:legal@opsecforge.com" className="underline">legal@opsecforge.com</a>
              </div>
            </div>
          </section>

          {/* Footer Note */}
          <div className="mt-12 pt-8 border-t border-slate-700/50">
            <div className="flex items-start gap-3 text-slate-400 text-sm">
              <Shield className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <p>
                By using OpSecForge, you acknowledge that you have read, understood, and agree to be 
                bound by these Terms of Service. Thank you for using our tools responsibly.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
