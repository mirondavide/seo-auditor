import Link from "next/link";
import {
  BarChart3,
  Check,
  FileText,
  Bell,
  Zap,
  Shield,
  Globe,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold">SEO Auditor</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Local SEO monitoring
            <br />
            <span className="text-blue-600">made simple</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 sm:text-xl">
            Connect Google Analytics & Search Console. Get automated SEO audits
            with priority fixes, PDF reports, and monthly alerts when your metrics
            drop.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
            >
              Start Free Audit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <p className="text-sm text-gray-500">
              Free forever. No credit card required.
            </p>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Or{" "}
            <Link href="/audit" className="font-medium text-blue-600 hover:text-blue-700 underline">
              try a free instant audit
            </Link>
            {" "}&mdash; no sign-up needed
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Everything you need to improve your local SEO
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
            Designed for gyms, tutors, professional studios, and local businesses
            that want more customers from Google.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Automated Audits",
                description:
                  "Run SEO audits with one click. Our engine checks 12+ rules and gives you prioritized fixes.",
              },
              {
                icon: FileText,
                title: "PDF Reports",
                description:
                  "Download professional PDF reports with metrics, recommendations, and a checklist.",
              },
              {
                icon: Bell,
                title: "Monthly Alerts",
                description:
                  "Get notified by email when your traffic, rankings, or Core Web Vitals drop.",
              },
              {
                icon: Globe,
                title: "GA4 + Search Console",
                description:
                  "Connects directly to your Google accounts. See sessions, clicks, CTR, and positions.",
              },
              {
                icon: Shield,
                title: "Core Web Vitals",
                description:
                  "Monitor LCP, CLS, and FID. These metrics directly impact your Google rankings.",
              },
              {
                icon: BarChart3,
                title: "Trend Tracking",
                description:
                  "Daily data sync builds a history of your metrics. Spot trends before they become problems.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-white p-6"
              >
                <feature.icon className="h-8 w-8 text-blue-600" />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
            Start free, upgrade when you need more power.
          </p>

          <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-3">
            {/* Free */}
            <div className="rounded-xl border p-8">
              <h3 className="text-xl font-bold">Free</h3>
              <div className="mt-4 text-4xl font-bold">
                0 EUR
                <span className="text-base font-normal text-gray-500">
                  /month
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Perfect for getting started
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "1 website",
                  "3 audits per month",
                  "Basic metrics dashboard",
                  "Top search queries",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 block rounded-lg border px-6 py-3 text-center text-sm font-medium hover:bg-gray-50"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-xl border-2 border-blue-600 p-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                Most Popular
              </div>
              <h3 className="text-xl font-bold">Pro</h3>
              <div className="mt-4 text-4xl font-bold">
                19 EUR
                <span className="text-base font-normal text-gray-500">
                  /month
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                For businesses serious about SEO
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "5 websites",
                  "Unlimited audits",
                  "Full metrics dashboard",
                  "PDF reports",
                  "Monthly email alerts",
                  "Regression detection",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 block rounded-lg bg-blue-600 px-6 py-3 text-center text-sm font-medium text-white hover:bg-blue-700"
              >
                Start Free, Upgrade Later
              </Link>
            </div>

            {/* Agency */}
            <div className="rounded-xl border-2 border-purple-600 p-8">
              <h3 className="text-xl font-bold">Agency</h3>
              <div className="mt-4 text-4xl font-bold">
                49 EUR
                <span className="text-base font-normal text-gray-500">
                  /month
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                For agencies managing multiple clients
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "20 websites",
                  "Unlimited audits",
                  "White-label PDF reports",
                  "Monthly email alerts",
                  "Regression detection",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 block rounded-lg bg-purple-600 px-6 py-3 text-center text-sm font-medium text-white hover:bg-purple-700"
              >
                Start Free, Upgrade Later
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-blue-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            Stop losing customers to competitors
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Join local businesses already improving their search visibility with
            SEO Auditor.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center rounded-lg bg-white px-6 py-3 font-medium text-blue-600 hover:bg-blue-50"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">SEO Auditor</span>
          </div>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} SEO Auditor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
