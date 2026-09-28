import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAward, FiBarChart2, FiGrid } from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import AdminShell from '../../components/admin/AdminShell.jsx';
import BarRow from '../../components/admin/BarRow.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import { adminApi, parseApiError } from '../../lib/api.js';
import { formatNumber } from '../../lib/utils.js';
import { getPlatform } from '../../config/platforms.js';
import { AdminErrorNote } from './AdminOverviewPage.jsx';

/** How many ranked creators to show. The server caps this at 100. */
const TOP_LIMIT = 10;

/**
 * How many used platforms to break out as bars. The server sends all 69 so the
 * count of unused keys stays visible, but drawing 69 rows would bury the signal;
 * the rest are summarised by the "and N more" line.
 */
const PLATFORM_ROWS = 12;

const AdminInsightsPage = () => {
  const navigate = useNavigate();
  const [top, setTop] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([adminApi.top(TOP_LIMIT), adminApi.platforms()])
      .then(([topPayload, usagePayload]) => {
        if (cancelled) return;
        setTop(topPayload);
        setUsage(usagePayload);
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
  }, [attempt]);

  const topUsers = top?.topUsers || [];
  const platforms = usage?.platforms || [];
  const used = platforms.filter((p) => p.links > 0).sort((a, b) => b.links - a.links || b.clicks - a.clicks);
  const shown = used.slice(0, PLATFORM_ROWS);
  const maxPlatformLinks = shown.reduce((m, p) => Math.max(m, p.links), 0);
  const maxTopClicks = topUsers.reduce((m, u) => Math.max(m, u.clicks), 0);

  return (
    <AdminShell>
      <PageTransition className="page">
        <div className="container">
          <div className="page-head">
            <div>
              <h1 className="page-title">Insights</h1>
              <p className="page-sub">
                Which creators get the most clicks, and which of the {usage?.totalKeys ?? 69}{' '}
                supported platforms are actually used.
              </p>
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 18 }}>
              <AdminErrorNote message={error} onRetry={() => setAttempt((n) => n + 1)} />
            </div>
          )}

          <div className="admin-insights-grid">
            <div className="chart-card">
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
                <div className="card-title">
                  <FiAward style={{ marginRight: 8, color: 'var(--brand)' }} />
                  Top creators by clicks
                </div>
                <span className="badge badge-neutral">Top {TOP_LIMIT}</span>
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} height={40} />
                  ))}
                </div>
              ) : topUsers.length === 0 ? (
                <div className="empty" style={{ padding: '34px 10px' }}>
                  <div className="empty-icon"><FiBarChart2 /></div>
                  <div className="strong">No clicks recorded yet</div>
                  <p className="small">Once people share their pages, the ranking appears here.</p>
                </div>
              ) : (
                <div className="admin-rank-list">
                  {topUsers.map((u, i) => (
                    <motion.button
                      key={u.id || u._id}
                      className="admin-rank-row"
                      onClick={() => navigate(`/admin/users/${u.id || u._id}`)}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.04 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <span className={`admin-rank-no${i < 3 ? ' is-top' : ''}`}>{i + 1}</span>
                      <Avatar src={u.profilePhotoUrl} name={u.displayName || u.username} size="sm" />
                      <span className="admin-rank-name">
                        <span className="small strong truncate">{u.displayName || u.username}</span>
                        <span className="tiny muted truncate">
                          {formatNumber(u.links)} {u.links === 1 ? 'link' : 'links'}
                        </span>
                      </span>
                      <span className="admin-rank-bar">
                        <motion.span
                          className="admin-rank-fill"
                          initial={{ width: 0 }}
                          animate={{
                            width: maxTopClicks > 0 ? `${(u.clicks / maxTopClicks) * 100}%` : '0%',
                          }}
                          transition={{ duration: 0.8, delay: Math.min(i, 12) * 0.04, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </span>
                      <span className="admin-rank-value">{formatNumber(u.clicks)}</span>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            <div className="chart-card">
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
                <div className="card-title">
                  <FiGrid style={{ marginRight: 8, color: 'var(--brand)' }} />
                  Platform usage
                </div>
                {usage && (
                  <span className="badge badge-neutral">
                    {usage.usedKeys} of {usage.totalKeys} in use
                  </span>
                )}
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} height={34} />
                  ))}
                </div>
              ) : used.length === 0 ? (
                <div className="empty" style={{ padding: '34px 10px' }}>
                  <div className="empty-icon"><FiGrid /></div>
                  <div className="strong">No platforms in use yet</div>
                  <p className="small">This breakdown fills in as people add links.</p>
                </div>
              ) : (
                <>
                  <div style={{ paddingTop: 4 }}>
                    {shown.map((p, i) => (
                      <BarRow
                        key={p.key}
                        label={getPlatform(p.key).label}
                        value={p.links}
                        max={maxPlatformLinks}
                        platform={p.key}
                        delay={i * 0.05}
                        valueLabel={formatNumber(p.links)}
                      />
                    ))}
                  </div>
                  {used.length > PLATFORM_ROWS && (
                    <p className="tiny muted" style={{ marginTop: 10 }}>
                      and {used.length - PLATFORM_ROWS} more {used.length - PLATFORM_ROWS === 1 ? 'platform' : 'platforms'} in use
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {usage && (
            <div className="chart-card" style={{ marginTop: 18, marginBottom: 32 }}>
              <div className="card-title" style={{ marginBottom: 4 }}>
                Every supported platform
              </div>
              <p className="hint" style={{ marginBottom: 12 }}>
                All {usage.totalKeys} keys the server accepts, so an unused one is visible rather
                than hidden.
              </p>

              <div className="admin-chip-grid">
                {platforms.map((p) => (
                  <span
                    key={p.key}
                    className={`admin-chip${p.links > 0 ? ' is-used' : ''}`}
                    title={`${getPlatform(p.key).label} — ${p.links} ${p.links === 1 ? 'link' : 'links'}, ${p.clicks} clicks`}
                  >
                    {getPlatform(p.key).label}
                    {p.links > 0 && <b>{p.links}</b>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </AdminShell>
  );
};

export default AdminInsightsPage;
