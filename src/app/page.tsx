import Link from 'next/link'
import { BillingPlans } from '@/components/BillingPlans'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IQ</span>
              </div>
              <span className="text-xl font-bold text-gray-900">IncidentIQ</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="/docs" className="text-gray-600 hover:text-gray-900">Docs</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">Sign in</Link>
              <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Get started free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            AI-Powered Incident Management
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Incidents resolved faster.<br />
            <span className="text-blue-600">Post-mortems write themselves.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            IncidentIQ automatically classifies severity, routes on-call responders, tracks timelines in real-time, and generates comprehensive post-mortems — so your team can focus on fixing, not documenting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors">
              Start free trial
            </Link>
            <Link href="#features" className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors">
              See how it works
            </Link>
          </div>
          <p className="text-gray-500 text-sm mt-4">No credit card required · 14-day free trial</p>
        </div>
      </section>

      <section id="features" className="py-20 bg-gray-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything your SRE team needs</h2>
            <p className="text-xl text-gray-600">From alert to post-mortem, automated.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🤖', title: 'AI Severity Classification', desc: 'GPT-4 automatically classifies every incident as P0–P3 based on title and description, reducing triage time by 80%.' },
              { icon: '📄', title: 'Auto Post-Mortems', desc: 'One click generates a comprehensive post-mortem from the incident timeline. Never write a post-mortem from scratch again.' },
              { icon: '🔔', title: 'Smart On-Call Routing', desc: 'Automatically pages the right on-call responder for P0/P1 incidents via Slack. Respects rotation schedules.' },
              { icon: '📊', title: 'MTTR Analytics', desc: 'Track mean time to resolve by severity and team. Identify patterns. Reduce future incidents.' },
              { icon: '⚡', title: 'Real-Time Timeline', desc: 'Live incident timeline with instant updates. Every team member stays in sync during an active incident.' },
              { icon: '🔗', title: 'Alert Ingestion API', desc: 'Push alerts from any monitoring tool (Datadog, PagerDuty, custom) via a simple REST API. No agent required.' },
            ].map((feature) => (
              <div key={feature.title} className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600">Start free. Scale as you grow.</p>
          </div>
          <BillingPlans showActions={false} />
        </div>
      </section>

      <footer className="border-t border-gray-200 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IQ</span>
            </div>
            <span className="text-gray-700 font-semibold">IncidentIQ</span>
          </div>
          <p className="text-gray-500 text-sm">© 2024 Aurora Rayes LLC. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="/privacy" className="text-gray-500 hover:text-gray-700 text-sm">Privacy</a>
            <a href="/terms" className="text-gray-500 hover:text-gray-700 text-sm">Terms</a>
            <a href="https://github.com/21leahcimhtiek-oss/incidentiq" className="text-gray-500 hover:text-gray-700 text-sm">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}