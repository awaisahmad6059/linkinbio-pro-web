import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiExternalLink, FiSearch, FiUser, FiUserX, FiUsers } from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import AdminShell from '../../components/admin/AdminShell.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import { adminApi, parseApiError } from '../../lib/api.js';
import { useDebounced, formatNumber, formatRelative, publicOrigin } from '../../lib/utils.js';
import { AdminErrorNote } from './AdminOverviewPage.jsx';

const PAGE_SIZE = 25;

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  // Typing a search should not fire a request per keystroke.
  const debounced = useDebounced(term, 400);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    adminApi
      .users({ q: debounced.trim(), page, limit: PAGE_SIZE })
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
  }, [debounced, page, attempt]);

  const users = data?.users || [];
  const pages = data?.totalPages || 1;
  const total = data?.total ?? 0;

  return (
    <AdminShell>
      <PageTransition className="page">
        <div className="container">
          <div className="page-head">
            <div>
              <h1 className="page-title">Users</h1>
              <p className="page-sub">
                Search by email or username. Open an account to see its page, links and
                analytics — read-only.
              </p>
            </div>

            <div className="admin-search">
              <FiSearch />
              <input
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search email or username"
                aria-label="Search users"
              />
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 18 }}>
              <AdminErrorNote message={error} onRetry={() => setAttempt((n) => n + 1)} />
            </div>
          )}

          <div className="chart-card admin-table-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} height={44} />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="empty" style={{ padding: '48px 20px' }}>
                <div className="empty-icon">
                  <FiUser />
                </div>
                <div className="strong">
                  {debounced.trim() ? 'No accounts match that search' : 'No accounts yet'}
                </div>
                <p className="small">
                  {debounced.trim()
                    ? 'Try part of an email address, or the username without the leading slash.'
                    : 'Accounts will appear here as people sign up.'}
                </p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Account</th>
                      <th scope="col">Links</th>
                      <th scope="col">Clicks</th>
                      <th scope="col">Joined</th>
                      <th scope="col" className="ta-right">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <motion.tr
                        key={u.id || u._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, delay: Math.min(i, 12) * 0.03 }}
                      >
                        <td>
                          <div className="row" style={{ gap: 10 }}>
                            <Avatar
                              src={u.profilePhotoUrl}
                              name={u.displayName || u.username}
                              size="sm"
                            />
                            <div style={{ minWidth: 0 }}>
                              <div className="small strong truncate">
                                {u.displayName || u.username}
                                {u.role === 'admin' && (
                                  <span className="badge badge-brand" style={{ marginLeft: 8 }}>
                                    admin
                                  </span>
                                )}
                                {u.status === 'suspended' && (
                                  <span className="badge badge-warn" style={{ marginLeft: 8 }}>
                                    <FiUserX /> suspended
                                  </span>
                                )}
                              </div>
                              <div className="tiny muted truncate">
                                {u.email}
                                <span
                                  className={u.emailVerified ? 'badge badge-success' : 'badge badge-neutral'}
                                  style={{ marginLeft: 8, height: 18 }}
                                >
                                  {u.emailVerified ? <FiCheckCircle /> : null}
                                  {u.emailVerified ? 'verified' : 'unverified'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="num">{formatNumber(u.links ?? 0)}</td>
                        <td className="num">{formatNumber(u.clicks ?? 0)}</td>
                        <td>
                          <div className="small">{formatDate(u.createdAt)}</div>
                          <div className="tiny muted">{formatRelative(u.createdAt)}</div>
                        </td>
                        <td className="ta-right">
                          <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                            <a
                              className="btn btn-outline btn-sm"
                              href={`${publicOrigin()}/${u.username}`}
                              target="_blank"
                              rel="noreferrer noopener"
                              title="Open the public page in a new tab"
                            >
                              <FiExternalLink />
                              <span className="sr-only">Public page for {u.username}</span>
                            </a>
                            <button
                              className="btn btn-sm"
                              onClick={() => navigate(`/admin/users/${u.id || u._id}`)}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && users.length > 0 && (
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 14, gap: 10 }}>
              <span className="small muted">
                {formatNumber(total)} {total === 1 ? 'account' : 'accounts'}
                {debounced.trim() ? ' matching' : ''}
                {pages > 1 ? ` · page ${data.page} of ${pages}` : ''}
              </span>

              {pages > 1 && (
                <div className="row" style={{ gap: 8 }}>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page >= pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {!loading && users.length === 0 && !debounced.trim() && (
            <p className="tiny muted" style={{ marginTop: 14 }}>
              <FiUsers style={{ marginRight: 6 }} />
              Tip: once accounts exist they are listed newest first.
            </p>
          )}
        </div>
      </PageTransition>
    </AdminShell>
  );
};

export default AdminUsersPage;
