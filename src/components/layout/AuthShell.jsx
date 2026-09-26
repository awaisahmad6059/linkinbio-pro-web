import { motion } from 'framer-motion';
import { FiCheck, FiHeart, FiTrendingUp, FiZap } from 'react-icons/fi';
import Logo from '../common/Logo.jsx';
import AnimatedCounter from '../common/AnimatedCounter.jsx';

const POINTS = [
  'Unlimited links, zero cost, no card required',
  'Live preview that matches your public page exactly',
  'Click analytics recorded by your own backend',
];

const STATS = [
  { value: 5, label: 'themes' },
  { value: 12, label: 'platforms' },
  { value: 0, prefix: '$', label: 'to start' },
];

/** Right-hand showcase panel shown next to the auth forms on desktop. */
const AuthAside = () => (
  <motion.aside
    className="auth-aside"
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
  >
    <h2 className="auth-aside-quote">
      <FiZap style={{ color: '#fcd34d', marginRight: 10 }} />
      One link. Every platform. Zero cost.
    </h2>

    <div className="auth-aside-list">
      {POINTS.map((point, i) => (
        <motion.div
          key={point}
          className="auth-aside-item"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.3 + i * 0.09 }}
        >
          <span className="auth-aside-check">
            <FiCheck />
          </span>
          {point}
        </motion.div>
      ))}
    </div>

    <div className="auth-aside-stats">
      {STATS.map((stat) => (
        <div key={stat.label} className="auth-aside-stat">
          <strong>
            {stat.prefix}
            <AnimatedCounter value={stat.value} duration={1200} />
          </strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>

    <div className="row gap-8" style={{ marginTop: 34, position: 'relative', color: 'rgba(255,255,255,.72)' }}>
      <FiTrendingUp />
      <span className="small">Trusted by creators, coaches and small studios</span>
    </div>

    <div className="row gap-6" style={{ marginTop: 10, position: 'relative', color: 'rgba(255,255,255,.6)' }}>
      <FiHeart />
      <span className="tiny">Built as a free alternative to Linktree</span>
    </div>
  </motion.aside>
);

/** Shared left-hand panel wrapper for the login/signup screens. */
const AuthShell = ({ children, title, subtitle }) => (
  <div className="auth-wrap">
    <div className="auth-panel">
      <div className="auth-card">
        <motion.div className="auth-brand" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Logo to="/" />
        </motion.div>
        <motion.h1 className="auth-title" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}>
          {title}
        </motion.h1>
        <motion.p className="auth-sub" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
          {subtitle}
        </motion.p>
        {children}
      </div>
    </div>
    <AuthAside />
  </div>
);

export default AuthShell;
