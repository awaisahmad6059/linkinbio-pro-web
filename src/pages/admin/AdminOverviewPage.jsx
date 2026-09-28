import { useEffect, useState } from 'react';
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
import {
  FiAlertTriangle,
  FiEye,
  FiLink2,
  FiMousePointer,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import AdminShell from '../../components/admin/AdminShell.jsx';
import StatCard from '../../components/admin/StatCard.jsx';
import Skeleton, { StatCardSkeleton } from '../../components/common/Skeleton.jsx';
import { adminApi, parseApiError } from '../../lib/api.js';
import { formatDayLabel, formatNumber } from '../../lib/utils.js';

const RANGES = [7, 30];

// The same two hues the personal analytics page uses, so a chart means the same
// thing wherever it appears in the product.
const VIEWS = '#4f46e5';
const CLICKS = '#ec4899';
const SIGNUPS = '#10b981';

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e7e5f0',
  boxShadow: '0 10px 30px rgba(30,27,46,.12)',
  fontSize: 12,
};

/** Inline panel-level error, including the 403 an admin-only screen can produce. */
const ErrorNote = ({ message, onRetry }) => (
  <div
    className="card card-pad"
    style={{ borderColor: '#fecaca', background: 'var(--danger-50)' }}
    role="alert"
  >
    <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
      <FiAlertTriangle style={{ color: '#b91c1c', marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div className="small strong" style={{ color: '#b91c1c' }}>
          {message}
        </div>
      </div>
      {onRetry && (
        <button className="btn btn-outline btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  </div>
);

export const AdminErrorNote = ErrorNote;

const AdminOverviewPage = () => {
  const [range, setRange] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    adminApi
      .overview(range)
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
  }, [range, attempt]);

  const totals = data?.totals;
  const series = (data?.series || []).map((d) => ({ ...d, label: formatDayLabel(d.date) }));
  const lastDay = series[series.length - 1];

  const stats = [
    {
      Icon: FiUsers,
      label: 'Total users',
      value: totals?.users ?? 0,
      hint: `${totals?.publishedProfiles ?? 0} published a page`,
    },
    { Icon: FiLink2, label: 'Total links', value: totals?.links ?? 0, hint: 'Across every page' },
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
      Icon: FiUserCheck,
      label: 'Signed up today',
      value: lastDay?.signups ?? 0,
      hint: lastDay ? formatDayLabel(lastDay.date) : '—',
    },
  ];

  return (
    <AdminShell>
      <PageTransition className="page">
        <div className="container">
          <div className="page-head">
            <div>
              <h1 className="page-title">Platform overview</h1>
              <p className="page-sub">
                Every figure is counted by the LinkInBio Pro backend. Views and clicks are
                recorded per event; signups come from account creation.
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
            <div style={{ marginBottom: 18 }}>
              <ErrorNote message={error} onRetry={() => setAttempt((n) => n + 1)} />
            </div>
          )}

          <div className="stat-grid">
            {loading
              ? [0, 1, 2, 3, 4, 5].map((i) => <StatCardSkeleton key={i} />)
              : stats.map((stat, i) => (
                  <StatCard
                    key={stat.label}
                    Icon={stat.Icon}
                    label={stat.label}
                    value={stat.value}
                    hint={stat.hint}
                    format={stat.format}
                    delay={i * 0.05}
                  />
                ))}
          </div>

          <div className="chart-card" style={{ marginTop: 18 }}>
            <div
              className="row"
              style={{ justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}
            >
              <div>
                <div className="card-title">Traffic and signups</div>
                <p className="hint" style={{ marginTop: 2 }}>
                  Last {range} days across all public pages
                </p>
              </div>
              <div className="chart-legend">
                <span>
                  <i className="legend-dot" style={{ background: VIEWS }} />
                  Views
                </span>
                <span>
                  <i className="legend-dot" style={{ background: CLICKS }} />
                  Clicks
                </span>
                <span>
                  <i className="legend-dot" style={{ background: SIGNUPS }} />
                  Signups
                </span>
              </div>
            </div>

            {loading ? (
              <Skeleton height={280} radius={12} />
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="admViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={VIEWS} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={VIEWS} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="admClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CLICKS} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={CLICKS} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="admSignups" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={SIGNUPS} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={SIGNUPS} stopOpacity={0} />
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
                    <YAxis
                      tick={{ fontSize: 11, fill: '#8f8aa3' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#d9d6ea', strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="views" stroke={VIEWS} strokeWidth={2.5} fill="url(#admViews)" animationDuration={1100} />
                    <Area type="monotone" dataKey="clicks" stroke={CLICKS} strokeWidth={2.5} fill="url(#admClicks)" animationDuration={1100} />
                    <Area type="monotone" dataKey="signups" stroke={SIGNUPS} strokeWidth={2.5} fill="url(#admSignups)" animationDuration={1100} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="chart-card" style={{ marginTop: 18 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <div className="card-title">Daily signups</div>
              <span className="badge badge-neutral">
                {formatNumber(totals?.users ?? 0)} accounts in total
              </span>
            </div>

            {loading ? (
              <Skeleton height={200} radius={12} />
            ) : (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 5" stroke="#eeecf7" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#8f8aa3' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={range === 30 ? 24 : 8}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#8f8aa3' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f4f2fb' }} />
                    <Bar dataKey="signups" radius={[6, 6, 0, 0]} animationDuration={900} maxBarSize={26}>
                      {series.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={SIGNUPS} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </PageTransition>
    </AdminShell>
  );
};

export default AdminOverviewPage;
