import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service - footy.bot",
  description: "footy.bot Terms of Service - Review the terms and conditions for using our website.",
  openGraph: {
    title: "Terms of Service - footy.bot",
    description: "Review the terms and conditions for using our website.",
    url: "https://www.footy.bot/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-6 w-full pt-6">
        <Header />
      </div>

      <main className="flex-grow max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Terms of Service
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
              Welcome to <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span>. These Terms of Service ("Terms") govern your access to and use of our website, services, and content. By accessing or using our website, you agree to be bound by these Terms and our Privacy Policy.
            </p>
            <div className="bg-gray-50 border border-gray-400 rounded-lg p-4">
              <p className="text-gray-700 text-sm leading-relaxed font-semibold">
                IMPORTANT: PLEASE READ THESE TERMS CAREFULLY. BY USING THIS WEBSITE, YOU AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE THIS WEBSITE. THESE TERMS CONTAIN IMPORTANT PROVISIONS INCLUDING AN ARBITRATION AGREEMENT AND CLASS ACTION WAIVER THAT REQUIRE DISPUTES TO BE RESOLVED ON AN INDIVIDUAL BASIS THROUGH BINDING ARBITRATION.
              </p>
            </div>
          </section>

          {/* Acceptance of Terms */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Acceptance of Terms
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              By accessing, browsing, or using <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span>, you acknowledge that you have read, understood, and agree to be bound by these Terms and all applicable laws and regulations. If you do not agree with these Terms, you are prohibited from using or accessing this website.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time without prior notice. Your continued use of the website following any changes constitutes acceptance of those changes. It is your responsibility to review these Terms periodically.
            </p>
          </section>

          {/* Use License and Restrictions */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Use License and Restrictions
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the website for personal, non-commercial purposes only.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>You agree NOT to:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li>Use the website for any illegal purpose or in violation of any local, state, national, or international law</li>
              <li>Reproduce, duplicate, copy, sell, resell, or exploit any portion of the website without express written permission</li>
              <li>Use any automated system (including robots, spiders, or scrapers) to access the website</li>
              <li>Attempt to gain unauthorized access to any portion of the website or any systems or networks connected to the website</li>
              <li>Interfere with or disrupt the website or servers or networks connected to the website</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
              <li>Collect or store personal data about other users without their express permission</li>
              <li>Upload or transmit viruses, malware, or any other malicious code</li>
              <li>Remove, circumvent, disable, damage, or otherwise interfere with security-related features</li>
              <li>Use the website to transmit spam, chain letters, or other unsolicited communications</li>
            </ul>
          </section>

          {/* Disclaimer of Warranties */}
          <section className="bg-gray-100 border-2 border-gray-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Disclaimer of Warranties
            </h2>
            <div className="space-y-3 text-sm">
              <p className="text-gray-700 leading-relaxed font-semibold">
                THE WEBSITE AND ALL CONTENT, SERVICES, AND PRODUCTS ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF ANY KIND.
              </p>
              <p className="text-gray-700 leading-relaxed">
                TO THE FULLEST EXTENT PERMITTED BY LAW, <span className="font-orbitron text-xs">footy<span className="text-footy-orange">.bot</span></span> EXPRESSLY DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT</li>
                <li>WARRANTIES THAT THE WEBSITE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE</li>
                <li>WARRANTIES REGARDING THE ACCURACY, COMPLETENESS, RELIABILITY, OR CURRENCY OF ANY CONTENT OR INFORMATION</li>
                <li>WARRANTIES THAT DEFECTS OR ERRORS WILL BE CORRECTED</li>
                <li>WARRANTIES REGARDING THE RESULTS OBTAINED FROM USE OF THE WEBSITE</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                WE MAKE NO REPRESENTATIONS OR WARRANTIES ABOUT THE SUITABILITY, RELIABILITY, AVAILABILITY, TIMELINESS, SECURITY, LACK OF ERRORS, OR ACCURACY OF THE WEBSITE OR ANY CONTENT. YOUR USE OF THE WEBSITE IS AT YOUR SOLE RISK.
              </p>
            </div>
          </section>

          {/* Content Disclaimer */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Content Disclaimer
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Guarantees of Accuracy
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  All information, content, data, and materials provided on this website, including but not limited to card information, pricing data, set details, checklists, player information, and product descriptions, are provided for informational purposes only. We make no representations or warranties regarding the accuracy, completeness, or reliability of any content.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  AI-Generated Content
                </h3>
                <p className="text-gray-700 leading-relaxed mb-2">
                  Our website may use artificial intelligence (AI) and machine learning to generate, organize, categorize, or enhance content. AI-generated content may contain errors, inaccuracies, biases, or outdated information.
                </p>
                <div className="bg-gray-50 border border-gray-400 rounded-lg p-4">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    <strong>WARNING:</strong> You acknowledge and agree that AI-generated content is provided without any warranty whatsoever. You must independently verify all information before making any decisions or taking any actions based on such content. We are not liable for any errors, omissions, or damages arising from AI-generated content.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Third-Party Content
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  The website may contain content, information, or links from third parties. We do not endorse, verify, or assume responsibility for any third-party content. Any reliance on third-party content is at your own risk.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Not Professional Advice
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Nothing on this website constitutes professional, financial, investment, or legal advice. You should consult with appropriate professionals before making any decisions based on information found on this website.
                </p>
              </div>
            </div>
          </section>

          {/* eBay Affiliate Disclaimer */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              eBay Partner Network and Affiliate Links
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span> is a participant in the eBay Partner Network and other affiliate programs. We display product listings and links from eBay and other third-party platforms.
            </p>
            <div className="bg-gray-50 border border-gray-400 rounded-lg p-4">
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                <strong>Material Connection Disclosure:</strong> We earn commissions from qualifying purchases made through affiliate links on our website. This means we receive financial compensation when you click on certain links and make purchases.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                <strong>No Endorsement or Warranty:</strong> The presence of affiliate links, product listings, or pricing information does NOT constitute an endorsement, recommendation, or warranty of any products, sellers, or services. We make no representations regarding:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                <li>Product authenticity, condition, quality, or description accuracy</li>
                <li>Seller reliability, reputation, or legitimacy</li>
                <li>Pricing accuracy or availability</li>
                <li>Transaction security or buyer protection</li>
                <li>Shipping times, costs, or delivery guarantees</li>
              </ul>
              <p className="text-gray-700 text-sm leading-relaxed mt-3">
                <strong>Your Responsibility:</strong> All purchase decisions are solely your responsibility. You assume all risks associated with purchases from third-party sellers. We are not liable for any disputes, losses, damages, or issues arising from your transactions with third parties.
              </p>
            </div>
          </section>

          {/* User Conduct and Responsibilities */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              User Conduct and Responsibilities
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You are solely responsible for your use of the website and any consequences thereof. You agree to use the website only for lawful purposes and in accordance with these Terms.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You acknowledge that you are responsible for maintaining the confidentiality of any account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.
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
              <li>IN NO EVENT SHALL <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span>, ITS OWNERS, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, LICENSORS, SUPPLIERS, OR SERVICE PROVIDERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, REVENUE, DATA, USE, GOODWILL, BUSINESS INTERRUPTION, OR OTHER INTANGIBLE LOSSES.</li>
              <li>OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR YOUR USE OF THE WEBSITE SHALL NOT EXCEED TEN DOLLARS ($10 USD) IN THE AGGREGATE.</li>
              <li>WE SHALL NOT BE LIABLE FOR ANY DAMAGES ARISING FROM: (A) YOUR USE OR INABILITY TO USE THE WEBSITE; (B) UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR DATA; (C) STATEMENTS OR CONDUCT OF ANY THIRD PARTY; (D) ERRORS, INACCURACIES, OR OMISSIONS IN CONTENT; (E) VIRUSES OR MALICIOUS CODE; (F) LOSS OF DATA; OR (G) ANY OTHER MATTER RELATING TO THE WEBSITE.</li>
              <li>WE SHALL NOT BE LIABLE FOR ANY FAILURE OR DELAY CAUSED BY CIRCUMSTANCES BEYOND OUR REASONABLE CONTROL, INCLUDING BUT NOT LIMITED TO ACTS OF GOD, WAR, TERRORISM, RIOTS, EMBARGOES, GOVERNMENT ACTIONS, FIRES, FLOODS, EARTHQUAKES, PANDEMICS, INTERNET FAILURES, CYBER ATTACKS, OR LABOR DISPUTES.</li>
              <li>THE LIMITATIONS AND EXCLUSIONS IN THIS SECTION APPLY REGARDLESS OF THE FORM OF ACTION, WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR OTHERWISE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</li>
            </ul>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Indemnification
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to defend, indemnify, and hold harmless <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span>, its owners, officers, directors, employees, agents, licensors, suppliers, and service providers from and against any and all claims, liabilities, damages, losses, costs, expenses, fees (including reasonable attorneys' fees and court costs) arising from or relating to: (a) your use of the website; (b) your violation of these Terms; (c) your violation of any rights of another party; (d) your violation of any applicable laws or regulations; (e) any content you submit, post, or transmit through the website; or (f) any transactions or interactions you have with third parties through the website.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Intellectual Property
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              The website and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, audio, and the design, selection, and arrangement thereof) are owned by <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span>, its licensors, or other providers of such material and are protected by copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our website, except as follows:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 text-sm">
              <li>Your computer may temporarily store copies of such materials in RAM incidental to your accessing and viewing those materials</li>
              <li>You may store files that are automatically cached by your web browser for display enhancement purposes</li>
              <li>You may print or download one copy of a reasonable number of pages for your personal, non-commercial use</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              All trademarks, service marks, logos, and trade names displayed on the website are the property of their respective owners. Nothing in these Terms grants you any right to use any trademark, service mark, logo, or trade name.
            </p>
          </section>

          {/* Third-Party Links and Services */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Third-Party Links and Services
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              The website may contain links to third-party websites, services, or resources that are not owned or controlled by <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span>. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.
            </p>
            <div className="bg-gray-50 border border-gray-400 rounded-lg p-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong>Disclaimer:</strong> We do not warrant, endorse, guarantee, or assume responsibility for any product or service advertised or offered by a third party. We will not be a party to or in any way be responsible for monitoring any transaction between you and third parties. You acknowledge and agree that we shall not be responsible or liable for any loss or damage arising from your use of third-party websites or services.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Termination
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We may terminate or suspend your access to the website immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms. We reserve the right to refuse service to anyone for any reason at any time.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Upon termination, your right to use the website will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive, including but not limited to ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>

          {/* Dispute Resolution and Arbitration */}
          <section className="bg-gray-100 border-2 border-gray-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Dispute Resolution and Arbitration
            </h2>
            <div className="space-y-3 text-sm">
              <p className="text-gray-700 leading-relaxed font-semibold">
                PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Binding Arbitration:</strong> Except as otherwise provided herein, any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, enforcement, interpretation, or validity thereof, including disputes about the scope or applicability of this agreement to arbitrate, shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) in accordance with its Commercial Arbitration Rules and the procedures set forth in these Terms.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>CLASS ACTION WAIVER:</strong> YOU AND <span className="font-orbitron text-xs">footy<span className="text-footy-orange">.bot</span></span> AGREE THAT EACH PARTY MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR REPRESENTATIVE PROCEEDING. UNLESS BOTH YOU AND WE AGREE OTHERWISE, THE ARBITRATOR MAY NOT CONSOLIDATE MORE THAN ONE PERSON'S CLAIMS AND MAY NOT OTHERWISE PRESIDE OVER ANY FORM OF A REPRESENTATIVE OR CLASS PROCEEDING. YOU HEREBY WAIVE ANY RIGHT TO A JURY TRIAL.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Arbitration Procedure:</strong> The arbitration will be conducted in English. The arbitrator's decision will be final and binding. Judgment on the arbitration award may be entered in any court having jurisdiction. Each party shall bear its own costs and expenses and an equal share of the arbitrator's fees and administrative fees of arbitration.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Exceptions to Arbitration:</strong> Either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of a party's intellectual property rights or proprietary information.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>30-Day Right to Opt-Out:</strong> You have the right to opt out of binding arbitration within thirty (30) days of first accepting these Terms by sending written notice to the contact address provided in these Terms. Your notice must include your name, address, and a clear statement that you wish to opt out of this arbitration agreement.
              </p>
            </div>
          </section>

          {/* Governing Law and Jurisdiction */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Governing Law and Jurisdiction
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              These Terms and any disputes arising out of or related to them or the website shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
            </p>
            <p className="text-gray-700 leading-relaxed">
              To the extent that the arbitration provisions do not apply or are found to be unenforceable, you agree to submit to the exclusive jurisdiction of the state and federal courts located in Wilmington, Delaware for the resolution of any disputes. You hereby waive any objection to venue in such courts and any claim that such courts are an inconvenient forum.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Changes to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect by posting a notice on the website. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By continuing to access or use the website after revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the website.
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Severability
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If any provision of these Terms is held to be invalid, illegal, or unenforceable under applicable law, such provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving its original intent. If such modification is not possible, the provision shall be severed from these Terms. The invalidity of any provision shall not affect the validity or enforceability of the remaining provisions, which shall remain in full force and effect.
            </p>
          </section>

          {/* Entire Agreement */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Entire Agreement
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms, together with our Privacy Policy and any other legal notices published by us on the website, constitute the entire agreement between you and <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span> concerning your use of the website and supersede all prior or contemporaneous agreements, communications, and proposals, whether oral or written, between you and us regarding the website.
            </p>
          </section>

          {/* Waiver */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Waiver
            </h2>
            <p className="text-gray-700 leading-relaxed">
              No waiver by <span className="font-orbitron">footy<span className="text-footy-orange">.bot</span></span> of any term or condition set forth in these Terms shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition. Any failure to assert a right or provision under these Terms shall not constitute a waiver of such right or provision.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              Contact Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms, please contact us through any of our social media platforms listed in the footer below, including Twitter, Facebook, Instagram, and YouTube.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-700 text-sm">
                We will respond to your inquiries as soon as reasonably possible.
              </p>
            </div>
          </section>

          {/* Acknowledgment */}
          <section className="bg-gray-50 border border-gray-400 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Acknowledgment
            </h3>
            <p className="text-gray-700 leading-relaxed">
              BY USING THIS WEBSITE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM. YOU FURTHER ACKNOWLEDGE THAT THESE TERMS CONSTITUTE A BINDING AGREEMENT BETWEEN YOU AND <span className="font-orbitron text-sm">footy<span className="text-footy-orange">.bot</span></span>.
            </p>
          </section>
        </div>
      </main>

      <div className="max-w-6xl mx-auto px-6 w-full">
        <Footer />
      </div>
    </div>
  );
}
