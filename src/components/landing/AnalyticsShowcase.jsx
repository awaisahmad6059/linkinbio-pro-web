import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FiEye, FiMousePointer, FiTrendingUp } from 'react-icons/fi';
import { RevealSection } from '../common/PageTransition.jsx';
import AnimatedCounter from '../common/AnimatedCounter.jsx';
import { formatDayLabel } from '../../lib/utils.js';

const SAMPLE = [
  { date: '2026-09-19', views: 120, clicks: 48 },
  { date: '2026-09-20', views: 168, clicks: 71 },
  { date: '2026-09-21', views: 142, clicks: 63 },
  { date: '2026-09-22', views: 214, clicks: 96 },
  { date: '2026-09-23', views: 265, clicks: 118 },
  { date: '2026-09-24', views: 238, clicks: 104 },
  { date: '2026-09-25', views: 312, clicks: 141 },
];

/** Marketing section that demonstrates the built-in analytics dashboard. */
const AnalyticsShowcase = () => (
  <section className="section alt" id="analytics">
    <div className="container">
      <div className="hero-grid" style={{ alignItems: 'center' }}>
        <div>
          <RevealSection>
            <span className="section-eyebrow">Analytics</span>
            <h2 className="section-title" style={{ marginTop: 12 }}>
              Know exactly what gets clicked
            </h2>
            <p className="section-sub" style={{ textAlign: 'left' }}>
              Every page view and every link tap is recorded by the LinkInBio Pro backend itself —
              no third-party tracker, no cookie banner, no paid analytics tool. See which links earn
              their place and which ones to retire.
            </p>

            <div className="row gap-24" style={{ marginTop: 30, flexWrap: 'wrap' }}>
              {[
                { Icon: FiEye, value: 1459, label: 'Page views this week' },
                { Icon: FiMousePointer, value: 641, label: 'Link clicks' },
                { Icon: FiTrendingUp, value: 44, suffix: '%', label: 'Click-through rate' },
              ].map(({ Icon, value, label, suffix }, i) => (
                <RevealSection key={label} delay={i * 0.1}>
                  <div className="row gap-12">
                    <span className="stat-icon" style={{ width: 38, height: 38, fontSize: 18 }}>
                      <Icon />
                    </span>
                    <div className="stack">
                      <span className="hero-stat-value" style={{ fontSize: 22 }}>
                        <AnimatedCounter value={value} />
                        {suffix}
                      </span>
                      <span className="hero-stat-label">{label}</span>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </RevealSection>
        </div>

        <RevealSection delay={0.12}>
          <motion.div className="chart-card" whileHover={{ y: -4 }} transition={{ duration: 0.22 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <div className="card-title">Views &amp; clicks</div>
              <span className="badge badge-success">Last 7 days</span>
            </div>
            <p className="hint" style={{ marginBottom: 14 }}>
              linkinbiopro.com/awais
            </p>

            <div style={{ height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SAMPLE} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.34} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 5" stroke="#eeecf7" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDayLabel}
                    tick={{ fontSize: 11, fill: '#8f8aa3' }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={12}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#8f8aa3' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e7e5f0',
                      boxShadow: '0 10px 30px rgba(30,27,46,.12)',
                      fontSize: 12,
                    }}
                    labelFormatter={(v) => formatDayLabel(v)}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#4f46e5"
                    strokeWidth={2.4}
                    fill="url(#viewsFill)"
                    animationDuration={1300}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#ec4899"
                    strokeWidth={2.4}
                    fill="url(#clicksFill)"
                    animationDuration={1300}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-legend" style={{ marginTop: 12 }}>
              <span>
                <i className="legend-dot" style={{ background: '#4f46e5' }} />
                Views
              </span>
              <span>
                <i className="legend-dot" style={{ background: '#ec4899' }} />
                Clicks
              </span>
            </div>
          </motion.div>
        </RevealSection>
      </div>
    </div>
  </section>
);

export default AnalyticsShowcase;
