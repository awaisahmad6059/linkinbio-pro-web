import { useRef } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { FiCheck, FiMousePointer, FiTrendingUp, FiZap } from 'react-icons/fi';
import Button from '../common/Button.jsx';
import PhoneFrame from '../common/PhoneFrame.jsx';
import { ProfileView } from '../profile/ProfileView.jsx';
import AnimatedCounter from '../common/AnimatedCounter.jsx';
import { useCountUp } from '../../lib/utils.js';

const HEADLINE = ['One', 'link', 'for', 'everything', 'you', 'do.'];

/** Sample content shown inside the hero phone mockup. */
const DEMO = {
  profile: {
    username: 'awais',
    displayName: 'Awais Ahmad',
    bio: 'Full-stack developer 💻 · Building in public · Pakistan → Remote',
  },
  links: [
    { _id: 'a', label: 'My design portfolio', platform: 'custom', isActive: true },
    { _id: 'b', label: 'Shop my presets', platform: 'instagram', isActive: true },
    { _id: 'c', label: 'Watch my YouTube', platform: 'youtube', isActive: true },
    { _id: 'd', label: 'Hire me for work', platform: 'email', isActive: true },
  ],
};

const STATS = [
  { value: 0, suffix: '', label: 'Cost to start' },
  { value: 5, suffix: '', label: 'Page themes' },
  { value: 60, suffix: 's', label: 'To build your page' },
];

const Stat = ({ value, suffix, label }) => {
  const n = useCountUp(value, 1400);
  return (
    <div>
      <div className="hero-stat-value">
        {n > 0 ? <AnimatedCounter value={n} duration={300} /> : '$0'}
        {suffix}
      </div>
      <div className="hero-stat-label">{label}</div>
    </div>
  );
};

const Hero = () => {
  const ref = useRef(null);

  // Gentle parallax: the phone drifts as the pointer moves across the hero.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 90, damping: 18, mass: 0.6 };
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [10, -10]), spring);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [-8, 8]), spring);
  const y = useSpring(useTransform(py, [-0.5, 0.5], [14, -14]), spring);

  // Scroll-linked drift so the mockup keeps floating as the hero scrolls away.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const scrollRotate = useTransform(scrollYProgress, [0, 1], [0, -7]);
  const scrollScale = useTransform(scrollYProgress, [0, 1], [1, 0.93]);
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.55]);

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section className="hero" ref={ref} onMouseMove={handleMove}>
      <div className="hero-bg" aria-hidden="true" />

      <div className="container hero-grid">
        <div>
          <motion.div
            className="hero-eyebrow"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="logo-mark" aria-hidden="true">
              <FiZap size={11} />
            </span>
            100% free · no credit card · built in minutes
          </motion.div>

          <h1>
            {HEADLINE.map((word, i) => (
              <motion.span
                key={word + i}
                style={{ display: 'inline-block', marginRight: i === 1 ? '0.45em' : '0.18em' }}
                initial={{ opacity: 0, y: 26, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
                className={i >= 4 ? 'grad-text' : undefined}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="hero-sub"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            LinkInBio Pro gives creators, freelancers and small businesses one beautiful page for
            every link they own — then tells you exactly who is clicking it. Put it in your bio and
            watch it work.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <Button to="/signup" size="lg" icon={FiZap}>
              Create your free page
            </Button>
            <Button to="/login" size="lg" variant="outline">
              I already have one
            </Button>
          </motion.div>

          <motion.p
            className="hero-note"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.68 }}
          >
            <FiCheck style={{ color: 'var(--success)' }} />
            Free forever. Export or delete your page at any time.
          </motion.p>

          <motion.div
            className="hero-stats"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.78 } } }}
          >
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}
              >
                <Stat {...stat} />
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="hero-visual">
          <motion.div
            className="hero-orb hero-orb-1"
            animate={{ scale: [1, 1.15, 1], opacity: [0.75, 0.95, 0.75] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="hero-orb hero-orb-2"
            animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.65, 0.9, 0.65] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="hero-phone"
            initial={{ opacity: 0, y: 44, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ rotateY, rotateX, y, rotate: scrollRotate, scale: scrollScale, opacity: scrollOpacity }}
          >
            <PhoneFrame url="linkinbiopro.com/awais">
              <ProfileView theme="gradient" compact={false} profile={DEMO.profile} links={DEMO.links} animate={false} />
            </PhoneFrame>
          </motion.div>

          <motion.div
            className="hero-float-card hero-fc-1"
            initial={{ opacity: 0, x: -18, y: 10 }}
            animate={{ opacity: 1, x: 0, y: [10, -8, 10] }}
            transition={{
              opacity: { duration: 0.5, delay: 0.85 },
              x: { duration: 0.5, delay: 0.85, ease: [0.22, 1, 0.36, 1] },
              y: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <span className="hero-fc-icon" style={{ background: 'var(--brand-50)', color: 'var(--brand)' }}>
              <FiTrendingUp />
            </span>
            <span className="stack">
              <span>1,204 clicks</span>
              <span className="tiny muted">this week</span>
            </span>
          </motion.div>

          <motion.div
            className="hero-float-card hero-fc-2"
            initial={{ opacity: 0, x: 18, y: 10 }}
            animate={{ opacity: 1, x: 0, y: [10, 8, 10] }}
            transition={{
              opacity: { duration: 0.5, delay: 1.05 },
              x: { duration: 0.5, delay: 1.05, ease: [0.22, 1, 0.36, 1] },
              y: { duration: 6.5, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <span className="hero-fc-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <FiMousePointer />
            </span>
            <span className="stack">
              <span>62% click rate</span>
              <span className="tiny muted">top: My portfolio</span>
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
