import { motion } from 'framer-motion';
import { RevealSection } from '../common/PageTransition.jsx';
import {
  FiBarChart2,
  FiEdit3,
  FiGlobe,
  FiLayout,
  FiLink2,
  FiShield,
  FiSmartphone,
} from 'react-icons/fi';

const FEATURES = [
  {
    Icon: FiLink2,
    title: 'Unlimited links',
    text: 'Instagram, TikTok, YouTube, WhatsApp, a booking page, a shop — everything in one stack that visitors tap in seconds.',
  },
  {
    Icon: FiSmartphone,
    title: 'Looks great on phones',
    text: 'Every page is mobile-first by design, because that is where your traffic actually comes from — the link in your bio.',
  },
  {
    Icon: FiLayout,
    title: 'Five real themes',
    text: 'Minimal, Dark, Gradient, Bold and Nature. Each one is genuinely designed, not a colour swap on the same layout.',
  },
  {
    Icon: FiEdit3,
    title: 'Drag, drop, done',
    text: 'Reorder your links by dragging them, toggle any link off without deleting it, and watch the live preview update instantly.',
  },
  {
    Icon: FiBarChart2,
    title: 'Analytics that matter',
    text: 'Page views, total clicks and a per-link breakdown, all recorded by your own backend. No Google Analytics, no tracking scripts.',
  },
  {
    Icon: FiShield,
    title: 'Yours, start to finish',
    text: 'Change your username, update your email, reset your password or delete everything in one click. No lock-in.',
  },
];

const Features = () => (
  <section className="section" id="features">
    <div className="container">
      <RevealSection className="section-head">
        <span className="section-eyebrow">Everything included</span>
        <h2 className="section-title">A proper link-in-bio tool, not a side project</h2>
        <p className="section-sub">
          Everything a creator or small business needs to look credible in a bio link — and nothing
          you have to pay for.
        </p>
      </RevealSection>

      <div className="feature-grid">
        {FEATURES.map(({ Icon, title, text }, i) => (
          <RevealSection key={title} delay={(i % 3) * 0.08}>
            <motion.article className="feature-card" whileHover={{ y: -4 }} transition={{ duration: 0.22 }}>
              <div className="feature-icon">
                <Icon />
              </div>
              <h3 className="feature-title">{title}</h3>
              <p className="feature-text">{text}</p>
            </motion.article>
          </RevealSection>
        ))}
      </div>
    </div>
  </section>
);

export default Features;

/* ------------------------------------------------------------------------ */

const STEPS = [
  {
    title: 'Create your account',
    text: 'Sign up with an email, a password and a username. That username becomes your public link instantly.',
  },
  {
    title: 'Add your links',
    text: 'Pick a platform for the icon and colour, or go custom. Drag to reorder and toggle off anything you do not want live.',
  },
  {
    title: 'Share and watch',
    text: 'Drop linkinbiopro.com/yourname into your bio. Every view and click is tracked in your dashboard from that moment.',
  },
];

const HowItWorks = () => (
  <section className="section alt" id="how-it-works">
    <div className="container">
      <RevealSection className="section-head">
        <span className="section-eyebrow">How it works</span>
        <h2 className="section-title">Live in under a minute</h2>
        <p className="section-sub">No design skills, no code, no waiting on a designer.</p>
      </RevealSection>

      <div className="steps">
        {STEPS.map((step, i) => (
          <RevealSection key={step.title} delay={i * 0.1}>
            <div className="step">
              <div className="step-num" />
              <h3 className="step-title">{step.title}</h3>
              <p className="step-text">{step.text}</p>
            </div>
          </RevealSection>
        ))}
      </div>
    </div>
  </section>
);

export { HowItWorks };
