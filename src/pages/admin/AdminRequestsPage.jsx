import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiCheckCircle,
  FiHelpCircle,
  FiInbox,
  FiMail,
  FiKey,
  FiUserX,
} from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import AdminShell from '../../components/admin/AdminShell.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import Button from '../../components/common/Button.jsx';
import { adminApi, parseApiError } from '../../lib/api.js';
import { REQUEST_TYPE_LABELS } from '../../lib/constants.js';
import { formatNumber, formatRelative } from '../../lib/utils.js';
import { useToastStore } from '../../store/toastStore.js';
import { AdminErrorNote } from './AdminOverviewPage.jsx';

const PAGE_SIZE = 25;

const TYPE_META = {
  'verify-email': { Icon: FiMail, color: '#6366f1' },
  'password-reset': { Icon: FiKey, color: '#f59e0b' },
  'account-suspend': { Icon: FiUserX, color: '#ef4444' },
  other: { Icon: FiHelpCircle, color: '#8b8aa3' },
};
const typeMeta = (type) => TYPE_META[type] || TYPE_META.other;

/**
 * The admin side of the user->admin help desk.
 *
 * Rows arrive from the public `/api/requests` form: the dashboard's "Lost the
 * code?" card, the login screen's "Trouble signing in?" link, and the suspended-
 * account message. Resolving a request is bookkeeping — the actual remedies
 * (verify, resend a code, reset password, un-suspend) live on the account detail
 * screen, linked from each row.
 */
const AdminRequestsPage = () => {
  const navigate = useNavigate();
  const toastSuccess = useToastStore((s) => s.success);
  const toastError = useToastStore((s) => s.error);

  const [tab, setTab] = useState('open');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    adminApi
      .requests({ status: tab, page, limit: PAGE_SIZE })
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
  }, [tab, page, attempt]);

  const requests = data?.requests || [];
  const total = data?.total ?? 0;
  const pages = data?.totalPages || 1;

  const switchTab = (next) => {
    if (next === tab) return;
    setTab(next);
    setPage(1);
  };

  const resolve = async (id) => {
    setBusyId(id);
    try {
      await adminApi.setRequestStatus(id, 'resolved');
      toastSuccess('Request resolved');
      // Drop the row from the open queue immediately.
      setData((prev) =>
        prev ? { ...prev, requests: prev.requests.filter((r) => r.id !== id), total: Math.max(0, prev.total - 1) } : prev
      );
    } catch (err) {
      toastError(parseApiError(err).message);
    } finally {
      setBusyId('');
    }
  };

  return (
    <AdminShell>
      <PageTransition className="page">
        <div className="container">
          <div className="page-head">
            <div>
              <h1 className="page-title">Requests</h1>
              <p className="page-sub">
                Help requests from users — a missed verification code, a forgotten password,
                a suspended account. Resolve one and it leaves the open queue.
              </p>
            </div>
          </div>

          <div className="range-toggle">
            <button
              className={`range-btn${tab === 'open' ? ' is-active' : ''}`}
              onClick={() => switchTab('open')}
            >
              Open
            </button>
            <button
              className={`range-btn${tab === 'resolved' ? ' is-active' : ''}`}
              onClick={() => switchTab('resolved')}
            >
              Resolved
            </button>
          </div>

          {error && (
            <div style={{ marginTop: 18 }}>
              <AdminErrorNote message={error} onRetry={() => setAttempt((n) => n + 1)} />
            </div>
          )}

          <div className="chart-card admin-table-card" style={{ padding: 0, overflow: 'hidden', marginTop: 18 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} height={64} />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="empty" style={{ padding: '48px 20px' }}>
                <div className="empty-icon">
                  <FiInbox />
                </div>
                <div className="strong">
                  {tab === 'open' ? 'No open requests' : 'Nothing resolved yet'}
                </div>
                <p className="small">
                  {tab === 'open'
                    ? 'When a user asks for help, their request lands here.'
                    : 'Resolving an open request moves it into this list.'}
                </p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Type</th>
                      <th scope="col">Who</th>
                      <th scope="col">Message</th>
                      <th scope="col">Age</th>
                      <th scope="col" className="ta-right">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r, i) => {
                      const { Icon, color } = typeMeta(r.type);
                      return (
                        <motion.tr
                          key={r.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.28, delay: Math.min(i, 12) * 0.03 }}
                        >
                          <td style={{ borderLeft: `3px solid ${color}`, paddingLeft: 14 }}>
                            <div className="small strong" style={{ whiteSpace: 'nowrap' }}>
                              <span style={{ marginRight: 6 }}><Icon style={{ color, verticalAlign: '-2px' }} /></span>
                              {REQUEST_TYPE_LABELS[r.type] || r.type}
                            </div>
                          </td>
                          <td style={{ minWidth: 200 }}>
                            <button
                              className="small strong"
                              style={{ display: 'block', background: 'none', border: 'none', padding: 0, cursor: r.user ? 'pointer' : 'default', textAlign: 'left' }}
                              disabled={!r.user}
                              onClick={() => r.user && navigate(`/admin/users/${r.user.id}`)}
                              title={r.user ? 'Open this account' : 'No account with this email'}
                            >
                              {r.user?.displayName || r.user?.username || r.email}
                            </button>
                            <div className="tiny muted truncate">{r.email}</div>
                          </td>
                          <td>
                            <div className="small truncate" style={{ maxWidth: 300 }} title={r.message}>
                              {r.message || <span className="tiny muted">No message left</span>}
                            </div>
                          </td>
                          <td className="small muted" style={{ whiteSpace: 'nowrap' }}>
                            {formatRelative(r.createdAt)}
                          </td>
                          <td className="ta-right">
                            {tab === 'open' && (
                              <Button
                                size="sm"
                                variant="outline"
                                icon={FiCheckCircle}
                                loading={busyId === r.id}
                                disabled={busyId !== '' && busyId !== r.id}
                                onClick={() => resolve(r.id)}
                              >
                                Resolve
                              </Button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && requests.length > 0 && (
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 14, gap: 10 }}>
              <span className="small muted">
                {formatNumber(total)} {total === 1 ? 'request' : 'requests'}
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
        </div>
      </PageTransition>
    </AdminShell>
  );
};

export default AdminRequestsPage;