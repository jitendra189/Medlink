import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import {
  HeartPulse, Ambulance, Droplets, Building2, User, Play, ArrowRight,
  Bell, MapPin, BedDouble, Stethoscope, ShieldCheck, Clock, Users,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-glow-sm">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">MedLink</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-surface-300 transition hover:text-white">Features</a>
            <a href="#how" className="text-sm font-medium text-surface-300 transition hover:text-white">How it works</a>
            <a href="#roles" className="text-sm font-medium text-surface-300 transition hover:text-white">Who it's for</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" className="text-surface-200 hover:bg-white/5 hover:text-white">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient">
        {/* Floating orbs */}
        <div className="pointer-events-none absolute -left-24 top-24 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-48 h-[28rem] w-[28rem] rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 bottom-0 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 text-center lg:py-32 lg:px-8">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-surface-200 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Trusted by 500+ healthcare providers
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Emergency Healthcare,
            <br />
            <span className="text-gradient">Instantly Connected</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-surface-300">
            MedLink bridges patients, hospitals, blood donors, and ambulance drivers in real-time —
            cutting critical response times and saving lives when every second counts.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/register">
              <Button size="lg" className="shadow-glow">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                <Play className="h-4 w-4" /> Watch How It Works
              </Button>
            </a>
          </div>

          {/* Floating stat pills */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: Building2, label: '500+ Hospitals' },
              { icon: Droplets, label: '10K+ Donors' },
              { icon: Clock, label: '24/7 Emergency Response' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="glass-dark inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-surface-100">
                <Icon className="h-4 w-4 text-brand-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="mx-auto -mt-12 max-w-6xl px-6 lg:px-8">
        <div className="glass-dark rounded-2xl p-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: '500+', label: 'Hospitals Registered' },
              { value: '10K+', label: 'Blood Donors' },
              { value: '< 4 min', label: 'Avg. Response Time' },
              { value: '120+', label: 'Cities Covered' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-gradient">{s.value}</p>
                <p className="mt-1 text-sm text-surface-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">How it works</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">From signup to saved life in 4 steps</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { n: '01', title: 'Register', desc: 'Create your account and pick your role — patient, hospital, donor, or driver.' },
            { n: '02', title: 'Connect', desc: 'Find nearby hospitals, ICUs, blood donors, and ambulances in real time.' },
            { n: '03', title: 'Get Help', desc: 'Trigger emergencies, book doctors, or request blood with a single tap.' },
            { n: '04', title: 'Save Lives', desc: 'Live updates and coordinated response ensure critical care reaches you fast.' },
          ].map((s) => (
            <div key={s.n} className="glass-dark rounded-2xl p-6 transition hover:border-brand-500/30">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/20 text-sm font-bold text-brand-400 ring-1 ring-brand-500/30">
                {s.n}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-surface-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role cards */}
      <section id="roles" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Roles</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Who uses MedLink?</h2>
          <p className="mt-3 text-surface-400">One platform, four life-saving workflows.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: User,       title: 'Patient',          desc: 'Find hospitals, book doctors, request blood, or trigger an SOS in seconds.', from: 'from-brand-500',    to: 'to-brand-700' },
            { icon: Building2,  title: 'Hospital Admin',   desc: 'Manage ICU beds, doctors, incoming emergencies, and bookings live.',       from: 'from-emerald-500',  to: 'to-brand-600' },
            { icon: Droplets,   title: 'Blood Donor',      desc: 'Get notified when your blood group is needed nearby and save a life.',    from: 'from-rose-500',     to: 'to-amber-500' },
            { icon: Ambulance,  title: 'Ambulance Driver', desc: 'Accept dispatches, share live location, and respond faster to victims.',   from: 'from-amber-500',    to: 'to-emerald-500' },
          ].map(({ icon: Icon, title, desc, from, to }) => (
            <div key={title} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-navy-800/50 p-6 transition hover:border-white/10">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${from} ${to} shadow-glow-sm`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-surface-400">{desc}</p>
              <Link to="/register" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-400 transition group-hover:gap-2">
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">Features</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Built for critical moments</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Bell,         title: 'Real-time Emergency Alerts', desc: 'Instant notifications to nearest hospitals when patients trigger SOS.' },
            { icon: MapPin,       title: 'Live Ambulance Tracking',    desc: 'GPS-based routing and driver visibility across every dispatch.' },
            { icon: Droplets,     title: 'Blood Donor Network',        desc: 'Match patients with compatible, available donors within minutes.' },
            { icon: BedDouble,    title: 'ICU Bed Finder',             desc: 'Live ICU availability across every hospital on the network.' },
            { icon: Stethoscope,  title: 'Doctor Bookings',            desc: 'Book verified specialists and manage appointments end-to-end.' },
            { icon: ShieldCheck,  title: 'Secure & Reliable',          desc: 'HIPAA-grade security, JWT auth, encrypted at rest and in transit.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-white/5 bg-navy-800/40 p-6 transition hover:bg-navy-800/70">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-surface-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-emerald-600 p-10 lg:p-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to save lives?</h2>
              <p className="mt-3 text-brand-50">
                Join thousands of healthcare providers and patients already using MedLink to close the gap between emergency and care.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" className="bg-white text-brand-700 hover:bg-surface-100 shadow-none">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-navy-950">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                <HeartPulse className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">MedLink</span>
              <span className="hidden text-sm text-surface-500 md:inline">— Connecting lives in critical moments</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-surface-400">
              <a href="#features" className="hover:text-white">Features</a>
              <a href="#how" className="hover:text-white">How it works</a>
              <Link to="/login" className="hover:text-white">Login</Link>
              <Link to="/register" className="hover:text-white">Sign up</Link>
            </div>
          </div>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-surface-500">
            <Users className="h-3.5 w-3.5" />
            © {new Date().getFullYear()} MedLink. Built to save lives.
          </p>
        </div>
      </footer>
    </div>
  );
}
