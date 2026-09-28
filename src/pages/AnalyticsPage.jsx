import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FiActivity, FiEye, FiLink2, FiMousePointer, FiTrendingUp } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import AppShell from '../components/layout/AppShell.jsx';
import AnimatedCounter from '../components/common/AnimatedCounter.jsx';
import { StatCardSkeleton } from '../components/common/Skeleton.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import LinkIcon from '../components/common/LinkIcon.jsx';
import { analyticsApi, parseApiError } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { getPlatform } from '../lib/constants.js';
import { formatDayLabel, formatNumber, formatRelative } from '../lib/utils.js';

const RANGES = [7, 30];

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e7e5f0',
  boxShadow: '0 10px 30px rgba(30,27,46,.12)',
  fontSize: 12,
};

/** Small animated bar used in the per-link breakdown list. */
const BarRow = ({ label, value, max, platform, delay, link }) => {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;
  const meta = getPlatform(platform);

  return (
    <div className="bar-row">
      <div className="bar-row-name">
        <LinkIcon
          link={link || { platform, url: '' }}
          size={22}
          tone="brand"
          faviconFallback={false}
          className="bar-row-icon"
        />
        <span className="truncate">{label}</span>
      </div>
      <div className="bar-row-track">
        <motion.div
          className="bar-row-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: `linear-gradient(90deg, ${meta.color} 0%, #a855f7 100%)` }}
        />
      </div>
      <div className="bar-row-value">{formatNumber(value)}</div>
    </div>
  );
};

const AnalyticsPage = () => {
  const user = useAuthStore((s) => s.user);
  const [range, setRange] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    analyticsApi
      .summary(range)
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(parseApiError(err).message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  const totals = data?.totals;
  const series = (data?.series || []).map((d) => ({ ...d, label: formatDayLabel(d.date) }));
  const linkRows = data?.links || [];
  const maxClicks = linkRows.reduce((max, l) => Math.max(max, l.clickCount), 0);

  const stats = [
    { Icon: FiEye, label: 'Page views', value: totals?.views ?? 0, hint: 'All-time visitors' },
    { Icon: FiMousePointer, label: 'Link clicks', value: totals?.clicks ?? 0, hint: 'All-time taps' },
    {
      Icon: FiTrendingUp,
      label: 'Click rate',
      value: totals?.clickThroughRate ?? 0,
      format: (n) => `${n}%`,
      hint: 'Clicks ÷ views',
    },
    {
      Icon: FiActivity,
      label: 'Live links',
      value: totals?.activeLinks ?? 0,
      hint: `${totals?.totalLinks ?? 0} total on your page`,
    },
  ];

  return (
    <AppShell>
      <PageTransition className="page">
        <div className="container">
          <div className="page-head">
            <div>
              <h1 className="page-title">Analytics</h1>
              <p className="page-sub">
                Every number here is recorded by the LinkInBio Pro backend — no third-party trackers.
                {totals?.lastViewAt && ` Last visit ${formatRelative(totals.lastViewAt)}.`}
              </p>
            </div>

            <div className="range-toggle" role="tablist" aria-label="Date range">
              {RANGES.map((r) => (
                <button
                  key={r}
                  role="tab"
                  aria-selected={range === r}
                  className={`range-btn${range === r ? ' is-active' : ''}`}
                  onClick={() => setRange(r)}
                >
                  {r} days
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="card card-pad" style={{ borderColor: '#fecaca', background: 'var(--danger-50)' }}>
              <div className="small strong" style={{ color: '#b91c1c' }}>
                {error}
              </div>
            </div>
          )}

          <div className="stat-grid" style={{ marginBottom: 18 }}>
            {loading
              ? [0, 1, 2, 3].map((i) => <StatCardSkeleton key={i} />)
              : stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="stat-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="stat-card-label">
                      <span className="stat-icon">
                        <stat.Icon />
                      </span>
                      {stat.label}
                    </div>
                    <div className="stat-card-value">
                      <AnimatedCounter value={stat.value} format={stat.format || formatNumber} />
                    </div>
                    <div className="stat-card-hint">{stat.hint}</div>
                  </motion.div>
                ))}
          </div>

          <div className="chart-card" style={{ marginBottom: 18 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div className="card-title">Traffic over time</div>
                <p className="hint" style={{ marginTop: 2 }}>
                  linkinbiopro.com/{user?.username} · last {range} days
                </p>
              </div>
              <div className="chart-legend">
                <span>
                  <i className="legend-dot" style={{ background: '#4f46e5' }} />
                  Views
                </span>
                <span>
                  <i className="legend-dot" style={{ background: '#ec4899' }} />
                  Clicks
                </span>
              </div>
            </div>

            {loading ? (
              <Skeleton height={260} radius={12} />
            ) : (
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="aViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="aClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 5" stroke="#eeecf7" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#8f8aa3' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={range === 30 ? 24 : 8}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#8f8aa3' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#d9d6ea', strokeDasharray: '4 4' }} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fill="url(#aViews)"
                      animationDuration={1100}
                      animationEasing="ease-out"
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#ec4899"
                      strokeWidth={2.5}
                      fill="url(#aClicks)"
                      animationDuration={1100}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="chart-card" style={{ marginBottom: 18 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <div className="card-title">Clicks by link</div>
              <span className="badge badge-neutral">Most clicked first</span>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12 }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} height={34} />
                ))}
              </div>
            ) : linkRows.length === 0 ? (
              <div className="empty" style={{ padding: '30px 10px' }}>
                <div className="empty-icon">
                  <FiLink2 />
                </div>
                <div className="strong">No links yet</div>
                <p className="small">Add a link and share your page to start collecting clicks.</p>
              </div>
            ) : (
              <div style={{ paddingTop: 6 }}>
                {linkRows.map((link, i) => (
                  <BarRow
                    key={link.id}
                    label={link.label}
                    value={link.clickCount}
                    max={maxClicks}
                    platform={link.platform}
                    link={link}
                    delay={i * 0.06}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="chart-card">
            <div className="card-title" style={{ marginBottom: 12 }}>
              Last {range} days at a glance
            </div>
            {loading ? (
              <Skeleton height={200} radius={12} />
            ) : (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 5" stroke="#eeecf7" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8f8aa3' }} axisLine={false} tickLine={false} minTickGap={range === 30 ? 24 : 8} />
                    <YAxis tick={{ fontSize: 11, fill: '#8f8aa3' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f4f2fb' }} />
                    <Bar dataKey="views" fill="#4f46e5" radius={[6, 6, 0, 0]} animationDuration={900} maxBarSize={22} />
                    <Bar dataKey="clicks" radius={[6, 6, 0, 0]} animationDuration={900} maxBarSize={22}>
                      {series.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill="#ec4899" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
};

export default AnalyticsPage;
