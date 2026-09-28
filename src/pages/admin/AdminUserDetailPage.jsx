import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import {
  FiArrowLeft,
  FiCalendar,
  FiEye,
  FiExternalLink,
  FiLink2,
  FiMousePointer,
} from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import AdminShell from '../../components/admin/AdminShell.jsx';
import StatCard from '../../components/admin/StatCard.jsx';
import BarRow from '../../components/admin/BarRow.jsx';
import Skeleton, { StatCardSkeleton } from '../../components/common/Skeleton.jsx';
import LinkIcon from '../../components/common/LinkIcon.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import { adminApi, parseApiError } from '../../lib/api.js';
import { formatDayLabel, formatNumber, formatRelative, publicOrigin } from '../../lib/utils.js';
import { getPlatform } from '../../config/platforms.js';
import { AdminErrorNote } from './AdminOverviewPage.jsx';

const VIEWS = '#4f46e5';
const CLICKS = '#ec4899';

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e7e5f0',
  boxShadow: '0 10px 30px rgba(30,27,46,.12)',
  fontSize: 12,
};

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    adminApi
      .user(id)
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
  }, [id, attempt]);

  const user = data?.user;
  const links = data?.links || [];
  const analytics = data?.analytics;
  const series = (analytics?.series || []).map((d) => ({ ...d, label: formatDayLabel(d.date) }));
  const maxClicks = links.reduce((m, l) => Math.max(m, l.clickCount || 0), 0);

  const stats = [
    { Icon: FiEye, label: 'Page views', value: analytics?.views ?? 0, hint: 'All-time visitors' },
    { Icon: FiMousePointer, label: 'Link clicks', value: analytics?.clicks ?? 0, hint: 'All-time taps' },
    { Icon: FiLink2, label: 'Links', value: links.length, hint: 'On this page' },
    {
      Icon: FiCalendar,
      label: 'Last visit',
      value: analytics?.lastViewAt ? formatRelative(analytics.lastViewAt) : '—',
      // A relative time is a string, not a number to count up to.
      raw: true,
      hint: analytics?.lastViewAt ? formatDate(analytics.lastViewAt) : 'No views recorded',
    },
  ];

  return (
    <AdminShell>
      <PageTransition className="page">
        <div className="container">
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/users')} style={{ marginBottom: 16 }}>
            <FiArrowLeft /> All users
          </button>

          {error ? (
            <AdminErrorNote message={error} onRetry={() => setAttempt((n) => n + 1)} />
          ) : loading ? (
            <>
              <div className="card card-pad" style={{ marginBottom: 18 }}>
                <Skeleton height={72} radius={12} />
              </div>
              <div className="stat-grid">
                {[0, 1, 2, 3].map((i) => (
                  <StatCardSkeleton key={i} />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="card card-pad admin-profile" style={{ marginBottom: 18 }}>
                <div className="row" style={{ gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <Avatar
                    src={user?.profilePhotoUrl}
                    name={user?.displayName || user?.username}
                    size="lg"
                  />
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                      <h1 className="page-title" style={{ fontSize: 22, margin: 0 }}>
                        {user?.displayName || user?.username}
                      </h1>
                      {user?.role === 'admin' && <span className="badge badge-brand">admin</span>}
                      {user?.publishedAt && <span className="badge badge-success">published</span>}
                    </div>
                    <div className="small muted truncate" style={{ marginTop: 2 }}>
                      {user?.email} · /{user?.username}
                    </div>
                    {user?.bio && <p className="small" style={{ marginTop: 8 }}>{user.bio}</p>}
                    <div className="row" style={{ gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
                      <span className="tiny muted">
                        Joined {formatDate(user?.createdAt)} ({formatRelative(user?.createdAt)})
                      </span>
                      <span className="tiny muted">Theme: {user?.selectedTheme || 'default'}</span>
                    </div>
                  </div>

                  <a
                    className="btn btn-outline btn-sm"
                    href={`${publicOrigin()}/${user?.username}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <FiExternalLink /> View public page
                  </a>
                </div>
              </div>

              <div className="stat-grid">
                {stats.map((stat, i) =>
                  stat.raw ? (
                    <motion.div
                      key={stat.label}
                      className="stat-card"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                    >
                      <div className="stat-card-label">
                        <span className="stat-icon" style={{ color: 'var(--brand)' }}>
                          <stat.Icon />
                        </span>
                        {stat.label}
                      </div>
                      <div className="stat-card-value" style={{ fontSize: 24 }}>
                        {stat.value}
                      </div>
                      <div className="stat-card-hint">{stat.hint}</div>
                    </motion.div>
                  ) : (
                    <StatCard
                      key={stat.label}
                      Icon={stat.Icon}
                      label={stat.label}
                      value={stat.value}
                      hint={stat.hint}
                      delay={i * 0.05}
                    />
                  )
                )}
              </div>

              <div className="chart-card" style={{ marginTop: 18 }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div className="card-title">Traffic over time</div>
                    <p className="hint" style={{ marginTop: 2 }}>
                      Last 30 days
                    </p>
                  </div>
                  <div className="chart-legend">
                    <span><i className="legend-dot" style={{ background: VIEWS }} />Views</span>
                    <span><i className="legend-dot" style={{ background: CLICKS }} />Clicks</span>
                  </div>
                </div>

                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="admUserViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={VIEWS} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={VIEWS} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="admUserClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CLICKS} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={CLICKS} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 5" stroke="#eeecf7" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#8f8aa3' }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={24}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#8f8aa3' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#d9d6ea', strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="views" stroke={VIEWS} strokeWidth={2.5} fill="url(#admUserViews)" animationDuration={1100} />
                      <Area type="monotone" dataKey="clicks" stroke={CLICKS} strokeWidth={2.5} fill="url(#admUserClicks)" animationDuration={1100} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card" style={{ marginTop: 18, marginBottom: 24 }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                  <div className="card-title">Clicks by link</div>
                  <span className="badge badge-neutral">{links.length} links</span>
                </div>

                {links.length === 0 ? (
                  <div className="empty" style={{ padding: '30px 10px' }}>
                    <div className="empty-icon"><FiLink2 /></div>
                    <div className="strong">No links on this page</div>
                    <p className="small">This account has not added any links yet.</p>
                  </div>
                ) : (
                  <div style={{ paddingTop: 6 }}>
                    {links.map((link, i) => (
                      <BarRow
                        key={link.id}
                        label={link.label || getPlatform(link.platform).label}
                        value={link.clickCount || 0}
                        max={maxClicks}
                        platform={link.platform}
                        link={link}
                        delay={i * 0.05}
                        valueLabel={formatNumber(link.clickCount || 0)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="chart-card" style={{ marginBottom: 32 }}>
                <div className="card-title" style={{ marginBottom: 10 }}>
                  Links
                </div>
                <div className="table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th scope="col">Link</th>
                        <th scope="col">Platform</th>
                        <th scope="col">Destination</th>
                        <th scope="col" className="num">Clicks</th>
                        <th scope="col">State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {links.map((link) => (
                        <tr key={link.id}>
                          <td>
                            <div className="row" style={{ gap: 9 }}>
                              <LinkIcon link={link} size={22} />
                              <span className="small strong truncate">{link.label}</span>
                            </div>
                          </td>
                          <td className="small">{getPlatform(link.platform).label}</td>
                          <td className="small muted" style={{ maxWidth: 260 }}>
                            <span className="truncate" style={{ display: 'block' }} title={link.url}>
                              {link.url}
                            </span>
                          </td>
                          <td className="num">{formatNumber(link.clickCount || 0)}</td>
                          <td>
                            {link.isActive ? (
                              <span className="badge badge-success">active</span>
                            ) : (
                              <span className="badge badge-neutral">hidden</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </PageTransition>
    </AdminShell>
  );
};

export default AdminUserDetailPage;
