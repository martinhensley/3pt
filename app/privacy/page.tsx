import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy - footy.bot",
  description: "footy.bot Privacy Policy - Learn how we collect, use, and protect your information.",
  openGraph: {
    title: "Privacy Policy - footy.bot",
    description: "Learn how we collect, use, and protect your information.",
    url: "https://www.footy.bot/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-600">
            Last Updated: October 27, 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 md:p-10 space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span>. We are committed to protecting your privacy and ensuring you have a positive experience on our website. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit our website.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the site.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Information We Collect
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Information You Provide to Us
                </h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We may collect information that you voluntarily provide to us when you:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Register for an account (if applicable)</li>
                  <li>Subscribe to newsletters or updates</li>
                  <li>Contact us with questions or feedback</li>
                  <li>Participate in surveys or promotions</li>
                  <li>Use interactive features of our website</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                  This information may include your name, email address, username, and any other information you choose to provide.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Automatically Collected Information
                </h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  When you visit our website, we may automatically collect certain information about your device and browsing actions, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>IP address and geographic location</li>
                  <li>Browser type and version</li>
                  <li>Device type and operating system</li>
                  <li>Referring website addresses</li>
                  <li>Pages visited and time spent on pages</li>
                  <li>Links clicked and other actions taken</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Cookies and Tracking Technologies
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  We use cookies, web beacons, and similar tracking technologies to collect information about your browsing activities. Cookies are small data files stored on your device that help us improve your experience, understand usage patterns, and deliver personalized content. You can control cookie preferences through your browser settings.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              How We Use Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use the information we collect for various purposes, including to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Provide, operate, and maintain our website and services</li>
              <li>Improve, personalize, and expand our website</li>
              <li>Understand and analyze how you use our website</li>
              <li>Develop new products, services, features, and functionality</li>
              <li>Communicate with you for customer service, updates, and marketing purposes</li>
              <li>Send you newsletters and promotional materials (with your consent)</li>
              <li>Process transactions and manage your requests</li>
              <li>Find and prevent fraud and security issues</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Third-Party Services
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Analytics Services
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  We may use third-party analytics services to monitor and analyze web traffic and user behavior. These services may use cookies and similar technologies to collect information about your use of our website.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  eBay Partner Network
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Our website displays product listings from eBay through the eBay Partner Network. When you click on eBay links, you may be directed to eBay's website, which is governed by eBay's privacy policy. We may earn a commission from qualifying purchases made through these affiliate links.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Hosting and Infrastructure
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Our website is hosted on third-party servers. These service providers may have access to your information only to perform tasks on our behalf and are obligated not to disclose or use it for other purposes.
                </p>
              </div>
            </div>
          </section>

          {/* Data Sharing and Disclosure */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Data Sharing and Disclosure
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We may share your information in the following situations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>With Service Providers:</strong> We may share your information with third-party vendors who perform services on our behalf, such as hosting, analytics, and customer support.</li>
              <li><strong>For Legal Reasons:</strong> We may disclose your information if required by law or in response to valid legal requests from public authorities.</li>
              <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
              <li><strong>With Your Consent:</strong> We may share your information with third parties when you have given us explicit consent to do so.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              We do not sell your personal information to third parties.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We implement commercially reasonable technical and organizational security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
            </p>
            <div className="bg-gray-50 border border-gray-400 rounded-lg p-4">
              <p className="text-gray-900 font-semibold mb-2">Security Disclaimer:</p>
              <p className="text-gray-700 text-sm leading-relaxed">
                YOU EXPRESSLY UNDERSTAND AND AGREE THAT WE SHALL NOT BE LIABLE FOR ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION STORED THEREIN. YOU ACKNOWLEDGE THAT YOU PROVIDE YOUR PERSONAL INFORMATION AT YOUR OWN RISK. WE DO NOT WARRANT, GUARANTEE, OR REPRESENT THAT YOUR USE OF THE WEBSITE IS SECURE OR FREE FROM HACKERS, MALWARE, OR OTHER HARMFUL CONTENT.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Data Retention
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Your Privacy Rights
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Depending on your location, you may have certain rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Access:</strong> You can request access to the personal information we hold about you.</li>
              <li><strong>Correction:</strong> You can request that we correct inaccurate or incomplete information.</li>
              <li><strong>Deletion:</strong> You can request that we delete your personal information, subject to certain exceptions.</li>
              <li><strong>Opt-Out:</strong> You can opt out of receiving marketing communications from us at any time.</li>
              <li><strong>Data Portability:</strong> You can request a copy of your data in a structured, machine-readable format.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              To exercise these rights, please contact us using the information provided below.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Children's Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our website is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately, and we will take steps to delete such information.
            </p>
          </section>

          {/* International Users */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              International Data Transfers
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using our website, you consent to the transfer of your information to these countries.
            </p>
          </section>

          {/* Third-Party Links */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Third-Party Websites
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our website may contain links to third-party websites, including eBay. We are not responsible for the privacy practices or content of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of the website after such changes constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <p className="text-gray-900 font-semibold mb-2">
                <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span>
              </p>
              <p className="text-gray-700">
                Website: <a href="https://www.footy.bot" className="text-footy-green hover:underline">www.footy.bot</a>
              </p>
              <p className="text-gray-700 mt-4 text-sm">
                We will respond to your inquiries as soon as reasonably possible.
              </p>
            </div>
          </section>

          {/* GDPR/CCPA Notice */}
          <section className="bg-gray-50 border border-gray-400 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Notice for EU and California Residents
            </h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              <strong>GDPR (EU Users):</strong> If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR), including the right to lodge a complaint with a supervisory authority.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>CCPA (California Users):</strong> If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect and the right to opt out of the sale of your information. We do not sell personal information.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-gray-100 border-2 border-gray-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3 font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li>IN NO EVENT SHALL <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span>, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.</li>
              <li>OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THIS PRIVACY POLICY OR OUR WEBSITE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRIOR TO THE EVENT GIVING RISE TO LIABILITY, OR $100 USD, WHICHEVER IS LESS.</li>
              <li>WE SHALL NOT BE LIABLE FOR ANY FAILURE OR DELAY IN PERFORMANCE DUE TO CIRCUMSTANCES BEYOND OUR REASONABLE CONTROL, INCLUDING BUT NOT LIMITED TO ACTS OF GOD, WAR, TERRORISM, RIOTS, EMBARGOES, ACTS OF CIVIL OR MILITARY AUTHORITIES, FIRE, FLOODS, ACCIDENTS, NETWORK INFRASTRUCTURE FAILURES, STRIKES, OR SHORTAGES OF TRANSPORTATION FACILITIES, FUEL, ENERGY, LABOR, OR MATERIALS.</li>
              <li>WE ARE NOT RESPONSIBLE FOR THE ACTIONS, CONTENT, INFORMATION, OR DATA OF THIRD PARTIES, AND YOU RELEASE US FROM ANY CLAIMS AND DAMAGES ARISING FROM OR IN ANY WAY CONNECTED WITH SUCH THIRD PARTIES.</li>
            </ul>
          </section>

          {/* Disclaimer of Warranties */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Disclaimer of Warranties
            </h2>
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                THE WEBSITE AND ALL INFORMATION, CONTENT, MATERIALS, AND SERVICES INCLUDED ON OR OTHERWISE MADE AVAILABLE TO YOU THROUGH THIS WEBSITE ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, UNLESS OTHERWISE SPECIFIED IN WRITING.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                WE MAKE NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THE WEBSITE OR THE INFORMATION, CONTENT, MATERIALS, OR SERVICES INCLUDED ON OR MADE AVAILABLE THROUGH THE WEBSITE, UNLESS OTHERWISE SPECIFIED IN WRITING.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                TO THE FULL EXTENT PERMISSIBLE BY APPLICABLE LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, TITLE, QUIET ENJOYMENT, AND DATA ACCURACY.
              </p>
            </div>
          </section>

          {/* AI Content Disclaimer */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              AI-Generated Content Disclaimer
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Our website may use artificial intelligence (AI) and machine learning technologies to generate, organize, or enhance content, including but not limited to card descriptions, set information, and recommendations.
            </p>
            <div className="bg-gray-50 border border-gray-400 rounded-lg p-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong>Disclaimer:</strong> AI-generated content may contain errors, inaccuracies, or outdated information. We make no representations or warranties regarding the accuracy, completeness, or reliability of any AI-generated content. You should independently verify all information before making any decisions or taking any actions based on such content. We are not liable for any damages arising from your reliance on AI-generated content.
              </p>
            </div>
          </section>

          {/* Affiliate Disclosure */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Affiliate Disclosure (FTC Compliance)
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              In compliance with the Federal Trade Commission's 16 CFR Part 255 ("Guides Concerning the Use of Endorsements and Testimonials in Advertising"):
            </p>
            <div className="bg-gray-50 border border-gray-400 rounded-lg p-4">
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                <strong>Material Connection:</strong> <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span> is a participant in affiliate advertising programs, including the eBay Partner Network. We may earn commissions from qualifying purchases made through links on our website. This means we receive a financial benefit when you click on certain links and make purchases.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                <strong>No Endorsement:</strong> The presence of affiliate links does not constitute an endorsement, recommendation, or warranty of any products or services. We are not responsible for the accuracy of product descriptions, pricing, availability, or quality of products sold by third parties.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong>Your Decisions:</strong> Any purchase decisions you make are solely your responsibility. We do not guarantee any specific results from purchases made through our affiliate links. You assume all risks associated with purchases from third-party sellers.
              </p>
            </div>
          </section>

          {/* User Indemnification */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Indemnification
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to defend, indemnify, and hold harmless <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span>, its officers, directors, employees, agents, licensors, and service providers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of this Privacy Policy or your use of the website, including, but not limited to, your User Content, any use of the website's content, services, and products other than as expressly authorized in this Privacy Policy, or your use of any information obtained from the website.
            </p>
          </section>

          {/* Dispute Resolution and Arbitration */}
          <section className="bg-gray-100 border border-gray-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Dispute Resolution and Arbitration
            </h2>
            <div className="space-y-3 text-sm">
              <p className="text-gray-700 leading-relaxed">
                <strong>Binding Arbitration:</strong> Any dispute, controversy, or claim arising out of or relating to this Privacy Policy, or the breach, termination, enforcement, interpretation, or validity thereof, shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) in accordance with its Commercial Arbitration Rules.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>CLASS ACTION WAIVER:</strong> YOU AND <span className="font-orbitron text-xs">footy<span className="text-footy-orange">.bot</span></span> AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING. YOU WAIVE ANY RIGHT TO A JURY TRIAL.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Exceptions:</strong> Either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of a party's intellectual property rights.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>30-Day Right to Opt-Out:</strong> You have the right to opt out of binding arbitration within 30 days of first accepting this Privacy Policy by sending written notice to the contact information below.
              </p>
            </div>
          </section>

          {/* Governing Law and Jurisdiction */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Governing Law and Jurisdiction
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              This Privacy Policy and any disputes arising out of or related to it shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
            </p>
            <p className="text-gray-700 leading-relaxed">
              To the extent arbitration does not apply, you agree to submit to the exclusive jurisdiction of the state and federal courts located in Wilmington, Delaware for the resolution of any disputes. You hereby waive any objection to venue in such courts and any claim that such courts are an inconvenient forum.
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Severability
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If any provision of this Privacy Policy is found to be unenforceable or invalid under any applicable law, such unenforceability or invalidity shall not render this Privacy Policy unenforceable or invalid as a whole. Such provisions shall be deleted without affecting the remaining provisions herein, and the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          {/* Entire Agreement */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Entire Agreement
            </h2>
            <p className="text-gray-700 leading-relaxed">
              This Privacy Policy, together with our Terms of Service (if applicable), constitutes the entire agreement between you and <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span> regarding your use of the website and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, both written and oral, regarding the website.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
