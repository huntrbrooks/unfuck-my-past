import React from 'react'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen-dvh bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="responsive-heading neon-heading mb-6">Privacy Policy</h1>
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <h2>Overview</h2>
          <p>
            We respect your privacy. This policy explains how we collect, use, and disclose personal information, including sensitive health information, in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
          </p>
          <h2>What we collect</h2>
          <ul>
            <li>Account information (e.g., email, name via authentication provider)</li>
            <li>Preference and onboarding data you provide</li>
            <li>Diagnostic responses and journaling entries you submit</li>
            <li>Usage analytics and device information</li>
          </ul>
          <h2>Why we collect it</h2>
          <ul>
            <li>To provide personalized guidance and generate reports</li>
            <li>To maintain safety features and respect your boundaries</li>
            <li>To operate, secure, and improve the Service</li>
            <li>To comply with legal obligations</li>
          </ul>
          <h2>How we use your information</h2>
          <p>
            We process your information to deliver the Service (e.g., generating questions, insights, and reports). We may use aggregated, de-identified data to improve the Service where you opt in.
          </p>
          <h2>Disclosure</h2>
          <p>
            We do not sell your personal information. We may share information with service providers (e.g., hosting, analytics, payments) under agreements that protect your data, and where required by law. Where data is stored or processed overseas, we take reasonable steps to ensure comparable protections.
          </p>
          <h2>Security</h2>
          <p>
            We implement technical and organisational measures appropriate to the risks, but no system is 100% secure. You can export or delete your data from Preferences.
          </p>
          <h2>Access and correction</h2>
          <p>
            You may request access to and correction of your personal information. Use the in-app export and delete features or contact us.
          </p>
          <h2>Your choices</h2>
          <ul>
            <li>Adjust tone, depth and topics to avoid in Preferences</li>
            <li>Opt in/out of anonymised improvement data</li>
            <li>Export or delete your data at any time</li>
          </ul>
          <h2>Australian privacy compliance</h2>
          <p>
            We handle personal information in line with the APPs, including APP 1 (open and transparent management), APP 6 (use or disclosure), and APP 11 (security). For complaints, contact us. If unresolved, you can contact the Office of the Australian Information Commissioner (OAIC).
          </p>
          <h2>Contact</h2>
          <p>
            For privacy questions or requests, contact support via the email listed in the app or website footer.
          </p>
        </div>
      </div>
    </main>
  )
}


