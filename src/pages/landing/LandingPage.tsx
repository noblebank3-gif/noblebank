import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ChevronRight, Shield, Globe, Zap, Lock, TrendingUp,
  CreditCard, ArrowLeftRight, BarChart3, Users, Award,
  CheckCircle, Star, ArrowRight, Phone, Mail, MapPin,
  Banknote, Eye, FileText, Headphones,
} from 'lucide-react';
import { LandingNavbar } from './LandingNavbar';
import { Button } from '@/components/ui/Button';

/* ─── Fade-in wrapper ─────────────────────────────────────────────────────── */
const FadeIn = ({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
  className?: string;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 24 : 0,
      x: direction === 'left' ? -24 : direction === 'right' ? 24 : 0,
    },
    visible: { opacity: 1, y: 0, x: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={variants}
      transition={{ duration: 0.55, delay, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Section wrapper ─────────────────────────────────────────────────────── */
const Section = ({
  id,
  children,
  className = '',
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section id={id} className={`py-20 lg:py-28 ${className}`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
  </section>
);

/* ─── Section heading ─────────────────────────────────────────────────────── */
const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  center?: boolean;
}) => (
  <FadeIn className={center ? 'text-center' : ''}>
    <p className="text-gold-500 text-xs font-semibold tracking-widest uppercase mb-3">{eyebrow}</p>
    <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">{title}</h2>
    {subtitle && (
      <p className="mt-4 text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">{subtitle}</p>
    )}
  </FadeIn>
);

/* ═══════════════════════════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════════════════════════ */
const Hero = () => (
  <section className="relative min-h-dvh flex items-center overflow-hidden bg-gradient-hero pt-16">
    {/* Ambient glows */}
    <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold-500/5 blur-[120px] pointer-events-none" />
    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
    {/* Grid pattern */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(36,51,81,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(36,51,81,0.3)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0 relative z-10">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left — copy */}
        <div className="space-y-8">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
            <span className="text-gold-500 text-xs font-medium tracking-wide">
              Trusted by 18,000+ clients globally
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight">
              Private Banking
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-gold">
                Reimagined.
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-400 text-xl leading-relaxed max-w-lg"
          >
            Noble Trust Bank delivers institutional-grade financial services to individuals
            and businesses who demand more — faster, smarter, and without compromise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/signup">
              <Button variant="gold" size="lg" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Open Your Account
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Sign In
              </Button>
            </Link>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-wrap items-center gap-6 pt-2"
          >
            {[
              { icon: Shield,  label: 'FDIC Insured'         },
              { icon: Lock,    label: '256-bit Encryption'   },
              { icon: Award,   label: 'FCA Regulated'        },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-slate-500 text-sm">
                <Icon className="w-4 h-4 text-gold-500/70" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="hidden lg:block"
        >
          <div className="relative">
            {/* Glow behind card */}
            <div className="absolute inset-0 bg-gold-500/10 rounded-3xl blur-2xl scale-105" />

            {/* Main dashboard mockup card */}
            <div className="relative bg-surface-card border border-surface-border rounded-3xl p-6 shadow-card-lg">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-slate-500 text-xs">Good morning,</p>
                  <p className="text-white font-semibold">Noble Client</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center">
                  <span className="text-navy-900 text-xs font-bold">NC</span>
                </div>
              </div>

              {/* Balance */}
              <div className="bg-gradient-card rounded-2xl p-5 mb-4 border border-surface-border">
                <p className="text-slate-400 text-xs mb-1">Total Portfolio Value</p>
                <p className="text-3xl font-bold text-white font-mono">$1,840,570.60</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-medium">+4.2% this month</span>
                </div>
              </div>

              {/* Account rows */}
              <div className="space-y-2 mb-5">
                {[
                  { name: 'Private Checking', bal: '$248,750.42',   tag: 'Checking'   },
                  { name: 'Wealth Savings',   bal: '$1,024,500.00', tag: 'Savings'    },
                  { name: 'GBP Account',      bal: '£42,800.00',    tag: 'Foreign'    },
                ].map(a => (
                  <div key={a.name} className="flex items-center justify-between bg-surface-elevated rounded-xl px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{a.name}</p>
                      <p className="text-slate-500 text-xs capitalize">{a.tag}</p>
                    </div>
                    <p className="text-white font-mono text-sm font-semibold">{a.bal}</p>
                  </div>
                ))}
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Sent',     val: '$19,570', color: 'text-red-400'     },
                  { label: 'Received', val: '$43,500', color: 'text-emerald-400' },
                  { label: 'Saved',    val: '$23,930', color: 'text-gold-500'    },
                ].map(s => (
                  <div key={s.label} className="bg-surface-elevated rounded-xl p-3 text-center">
                    <p className={`text-sm font-bold font-mono ${s.color}`}>{s.val}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating notification card */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
              className="absolute -bottom-5 -left-8 bg-surface-card border border-surface-border rounded-2xl px-4 py-3 shadow-card-lg flex items-center gap-3 w-56"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Transfer Sent</p>
                <p className="text-slate-500 text-[10px]">$5,000 → Wealth Savings</p>
              </div>
            </motion.div>

            {/* Floating security badge */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -top-4 -right-6 bg-surface-card border border-gold-500/20 rounded-2xl px-4 py-3 shadow-gold flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-gold-500" />
              <p className="text-gold-500 text-xs font-semibold">Bank-grade Security</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>

    {/* Bottom fade */}
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
  </section>
);

/* ═══════════════════════════════════════════════════════════════════════════
   STATS BAR
═══════════════════════════════════════════════════════════════════════════ */
const stats = [
  { value: '$2.4B+',  label: 'Assets Under Management' },
  { value: '18,000+', label: 'Private Banking Clients'  },
  { value: '42',      label: 'Countries Served'         },
  { value: '99.98%',  label: 'Uptime Reliability'       },
];

const StatsBar = () => (
  <div className="border-y border-surface-border bg-surface-card/60 backdrop-blur-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <FadeIn key={stat.label} delay={i * 0.08} className="text-center">
            <p className="text-3xl lg:text-4xl font-bold text-white font-mono">{stat.value}</p>
            <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
          </FadeIn>
        ))}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   PRODUCTS / FEATURES
═══════════════════════════════════════════════════════════════════════════ */
const products = [
  {
    icon: Banknote,
    title: 'Private Checking',
    description: 'High-yield checking with zero fees, unlimited transactions, and a dedicated relationship manager.',
    tag: 'Most Popular',
    tagColor: 'bg-gold-500/10 text-gold-500 border-gold-500/20',
  },
  {
    icon: TrendingUp,
    title: 'Wealth Savings',
    description: 'Competitive APY rates with daily compounding interest. Grow your wealth while we keep it safe.',
    tag: null,
    tagColor: '',
  },
  {
    icon: BarChart3,
    title: 'Investment Portfolio',
    description: 'Managed investment accounts with access to equities, bonds, ETFs, and alternative assets.',
    tag: null,
    tagColor: '',
  },
  {
    icon: Globe,
    title: 'Multi-Currency Accounts',
    description: 'Hold and transact in USD, GBP, EUR, AED, and more. Send internationally at live rates.',
    tag: 'New',
    tagColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    icon: CreditCard,
    title: 'Premium Cards',
    description: 'Metal debit and credit cards with no foreign transaction fees, concierge access, and real-time controls.',
    tag: null,
    tagColor: '',
  },
  {
    icon: ArrowLeftRight,
    title: 'Global Transfers',
    description: 'Send money anywhere in the world in seconds. SWIFT, SEPA, and domestic wires — all in one place.',
    tag: null,
    tagColor: '',
  },
];

const Products = () => (
  <Section id="products" className="bg-surface">
    <SectionHeading
      eyebrow="Our Products"
      title={<>Everything your wealth<br />deserves, in one place</>}
      subtitle="A complete suite of private banking products built for individuals and businesses with discerning financial needs."
    />
    <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {products.map((p, i) => (
        <FadeIn key={p.title} delay={i * 0.06}>
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="group card p-6 hover:border-surface-elevated hover:shadow-card transition-all duration-200 cursor-default h-full"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-11 h-11 rounded-xl bg-gold-500/10 flex items-center justify-center group-hover:bg-gold-500/15 transition-colors duration-200">
                <p.icon className="w-5 h-5 text-gold-500" />
              </div>
              {p.tag && (
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${p.tagColor}`}>
                  {p.tag}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-white mb-2">{p.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{p.description}</p>
            <div className="mt-5 flex items-center gap-1 text-gold-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Learn more <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        </FadeIn>
      ))}
    </div>
  </Section>
);

/* ═══════════════════════════════════════════════════════════════════════════
   HOW IT WORKS
═══════════════════════════════════════════════════════════════════════════ */
const steps = [
  {
    step: '01',
    icon: FileText,
    title: 'Apply Online',
    description: 'Complete our secure digital application in under 5 minutes. No paperwork, no branch visits required.',
  },
  {
    step: '02',
    icon: Eye,
    title: 'Identity Verified',
    description: 'We verify your identity using bank-grade KYC technology. Your data is encrypted end-to-end.',
  },
  {
    step: '03',
    icon: Banknote,
    title: 'Fund Your Account',
    description: 'Deposit via bank transfer, wire, or cheque. Your relationship manager helps you get started.',
  },
  {
    step: '04',
    icon: TrendingUp,
    title: 'Start Banking',
    description: 'Access your full suite of banking services — instantly. Transfers, cards, and investments from day one.',
  },
];

const HowItWorks = () => (
  <Section id="how-it-works" className="bg-surface-card/30">
    <SectionHeading
      eyebrow="How It Works"
      title={<>Open your account<br />in four simple steps</>}
      subtitle="Getting started with Noble Trust Bank is fast, secure, and entirely digital."
    />
    <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {steps.map((s, i) => (
        <FadeIn key={s.step} delay={i * 0.08}>
          <div className="relative">
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="hidden lg:block absolute top-7 left-[calc(100%+12px)] right-[-12px] h-px bg-gradient-to-r from-surface-border to-transparent w-full z-0" />
            )}
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-card border border-surface-border flex items-center justify-center shrink-0">
                  <s.icon className="w-6 h-6 text-gold-500" />
                </div>
                <span className="text-3xl font-bold text-surface-border font-mono">{s.step}</span>
              </div>
              <h3 className="text-base font-semibold text-white">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{s.description}</p>
            </div>
          </div>
        </FadeIn>
      ))}
    </div>
  </Section>
);

/* ═══════════════════════════════════════════════════════════════════════════
   SECURITY
═══════════════════════════════════════════════════════════════════════════ */
const securityFeatures = [
  { icon: Lock,    title: '256-bit SSL Encryption',       desc: 'All data in transit is encrypted with TLS 1.3, the most advanced standard available.' },
  { icon: Shield,  title: 'FDIC & FCA Regulated',         desc: 'Fully licensed and regulated. Deposits insured up to $250,000 per depositor.'         },
  { icon: Eye,     title: 'Real-time Fraud Monitoring',   desc: 'AI-powered fraud detection monitors every transaction, 24 hours a day, 7 days a week.'  },
  { icon: Phone,   title: 'Biometric Authentication',     desc: 'Face ID and fingerprint authentication ensure only you can access your account.'         },
  { icon: Zap,     title: 'Instant Freeze & Unfreeze',   desc: 'Lock any card or account instantly from the app with a single tap.'                      },
  { icon: Headphones, title: '24/7 Dedicated Support',   desc: 'Your personal relationship manager is always one call away, day or night.'               },
];

const Security = () => (
  <Section id="security" className="bg-surface">
    <div className="grid lg:grid-cols-2 gap-16 items-center">
      <FadeIn direction="left">
        <div className="space-y-6">
          <p className="text-gold-500 text-xs font-semibold tracking-widest uppercase">Security First</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
            Your security is our
            <span className="text-transparent bg-clip-text bg-gradient-gold"> top priority</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            We've built Noble Trust Bank from the ground up with institutional-grade security.
            Every layer of our platform is designed to protect your wealth and your privacy.
          </p>
          <Link to="/signup">
            <Button variant="gold" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open a Secure Account
            </Button>
          </Link>
        </div>
      </FadeIn>

      <div className="grid sm:grid-cols-2 gap-4">
        {securityFeatures.map((f, i) => (
          <FadeIn key={f.title} delay={i * 0.07} direction="right">
            <div className="card p-5 hover:border-surface-elevated transition-colors duration-200">
              <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center mb-3">
                <f.icon className="w-4 h-4 text-gold-500" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">{f.title}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  </Section>
);

/* ═══════════════════════════════════════════════════════════════════════════
   TESTIMONIALS
═══════════════════════════════════════════════════════════════════════════ */
const testimonials = [
  {
    name: 'Amara Osei',
    role: 'CEO, Meridian Capital',
    quote: "Noble Trust Bank transformed how I manage my business finances. The private banking experience is genuinely world-class — faster, smarter, and more personal than anything I've used before.",
    stars: 5,
    avatar: 'AO',
  },
  {
    name: 'James Harrington',
    role: 'Managing Partner, Harrington Ventures',
    quote: "The multi-currency accounts and global wire capabilities are exceptional. I can send money internationally in seconds, and my relationship manager is always available. Truly premium service.",
    stars: 5,
    avatar: 'JH',
  },
  {
    name: 'Priya Nair',
    role: 'Family Office Director',
    quote: "We've managed family wealth across several banks. Noble Trust stands out for its transparency, the quality of its investment advice, and its security infrastructure. A genuine partner.",
    stars: 5,
    avatar: 'PN',
  },
];

const Testimonials = () => (
  <Section className="bg-surface-card/30">
    <SectionHeading
      eyebrow="Client Stories"
      title={<>Trusted by those who<br />expect only the best</>}
    />
    <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((t, i) => (
        <FadeIn key={t.name} delay={i * 0.1}>
          <div className="card p-6 flex flex-col gap-5 h-full">
            <div className="flex gap-1">
              {Array.from({ length: t.stars }).map((_, si) => (
                <Star key={si} className="w-4 h-4 fill-gold-500 text-gold-500" />
              ))}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed flex-1">"{t.quote}"</p>
            <div className="flex items-center gap-3 pt-2 border-t border-surface-border">
              <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center shrink-0">
                <span className="text-navy-900 text-xs font-bold">{t.avatar}</span>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{t.name}</p>
                <p className="text-slate-500 text-xs">{t.role}</p>
              </div>
            </div>
          </div>
        </FadeIn>
      ))}
    </div>
  </Section>
);

/* ═══════════════════════════════════════════════════════════════════════════
   CTA BANNER
═══════════════════════════════════════════════════════════════════════════ */
const CTABanner = () => (
  <Section className="bg-surface">
    <FadeIn>
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-navy-700 via-navy-800 to-surface border border-surface-border p-10 lg:p-16 text-center">
        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-gold-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
          <p className="text-gold-500 text-xs font-semibold tracking-widest uppercase">
            Start Today
          </p>
          <h2 className="text-3xl lg:text-5xl font-bold text-white leading-tight">
            Ready to experience private banking without limits?
          </h2>
          <p className="text-slate-400 text-lg">
            Open your Noble Trust Bank account in minutes. No minimum balance to start. Upgrade to private banking when you're ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link to="/signup">
              <Button variant="gold" size="lg" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Open Your Account Free
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 pt-2">
            {['No hidden fees', 'No minimum deposit', 'Cancel anytime'].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-slate-500 text-sm">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </FadeIn>
  </Section>
);

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════════════════════════ */
const footerLinks = {
  Products: ['Private Checking', 'Wealth Savings', 'Investments', 'Cards', 'Transfers', 'Business'],
  Company:  ['About Us', 'Careers', 'Press', 'Blog', 'Investor Relations'],
  Support:  ['Help Centre', 'Contact Us', 'Security', 'Report Fraud', 'Accessibility'],
  Legal:    ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Regulatory Info'],
};

const Footer = () => (
  <footer id="about" className="bg-surface-card border-t border-surface-border">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
        {/* Brand column */}
        <div className="col-span-2 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-navy-900" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Noble Trust Bank</p>
              <p className="text-gold-500 text-[10px] tracking-widest uppercase">Private Banking</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Institutional-grade private banking for discerning individuals and businesses worldwide.
          </p>
          <div className="space-y-2">
            {[
              { icon: Mail,    text: 'private@nobletrust.com' },
              { icon: Phone,   text: '+1 (800) 668-2537'      },
              { icon: MapPin,  text: 'New York · London · Dubai' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-slate-500 text-xs">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(footerLinks).map(([category, links]) => (
          <div key={category} className="space-y-4">
            <p className="text-white text-sm font-semibold">{category}</p>
            <ul className="space-y-2">
              {links.map(link => (
                <li key={link}>
                  <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-150">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="mt-12 pt-8 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-slate-600 text-sm">
          © {new Date().getFullYear()} Noble Trust Bank. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-slate-600 text-xs">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-gold-500/50" />
            FDIC Member
          </span>
          <span className="flex items-center gap-1.5">
            <Award className="w-3 h-3 text-gold-500/50" />
            FCA Regulated
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-gold-500/50" />
            256-bit SSL
          </span>
        </div>
      </div>
    </div>
  </footer>
);

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE ASSEMBLY
═══════════════════════════════════════════════════════════════════════════ */
export const LandingPage = () => (
  <div className="bg-surface text-white overflow-x-hidden">
    <LandingNavbar />
    <main id="main-content">
    <Hero />
    <StatsBar />
    <Products />
    <HowItWorks />
    <Security />
    <Testimonials />
    <CTABanner />
    </main>
    <Footer />
  </div>
);
