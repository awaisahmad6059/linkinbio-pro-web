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
  FiAlertTriangle,
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiEye,
  FiExternalLink,
  FiKey,
  FiLink2,
  FiMail,
  FiMousePointer,
  FiSend,
  FiSlash,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiXCircle,
} from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import AdminShell from '../../components/admin/AdminShell.jsx';
import StatCard from '../../components/admin/StatCard.jsx';
import BarRow from '../../components/admin/BarRow.jsx';
import Skeleton, { StatCardSkeleton } from '../../components/common/Skeleton.jsx';
import LinkIcon from '../../components/common/LinkIcon.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import VerifiedBadge from '../../components/common/VerifiedBadge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { adminApi, parseApiError } from '../../lib/api.js';
import { formatDayLabel, formatNumber, formatRelative, publicOrigin } from '../../lib/utils.js';
import { getPlatform } from '../../config/platforms.js';
import { useToastStore } from '../../store/toastStore.js';
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
  const [busy, setBusy] = useState(''); // 'status' | 'verified' | 'password' | 'delete'
  const [resetOpen, setResetOpen] = useState(false);
  const [resetValue, setResetValue] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageValue, setMessageValue] = useState('');
  // Link moderation, tracked per link id so one row's spinner never freezes the
  // rest of the table. The operation is part of it because Block and Delete sit
  // side by side on the same row: without it, actioning one would spin both.
  const [busyLink, setBusyLink] = useState({ id: '', op: '' });
  const busyRow = (id, op) => busyLink.id === id && busyLink.op === op;
  const [blocking, setBlocking] = useState(null); // { link, reason }
  const [deletingLink, setDeletingLink] = useState(null);
  const toastSuccess = useToastStore((s) => s.success);
  const toastError = useToastStore((s) => s.error);

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

  /** Replaces the user record with the server's copy after a mutation. */
  const applyUserUpdate = (updated) =>
    setData((prev) => (prev ? { ...prev, user: updated } : prev));

  /**
   * Runs an action with a standard busy + error path. The busy name doubles as
   * the button id, so only the button being pressed shows its spinner.
   */
  const runAction = async (name, fn) => {
    setBusy(name);
    try {
      await fn();
    } catch (err) {
      toastError(parseApiError(err).message);
    } finally {
      setBusy('');
    }
  };

  const toggleStatus = () =>
    runAction('status', async () => {
      const next = user.status === 'suspended' ? 'active' : 'suspended';
      const updated = await adminApi.setStatus(user.id, next);
      applyUserUpdate(updated);
      toastSuccess(updated.status === 'suspended' ? 'Account suspended' : 'Account re-activated');
    });

  const toggleVerified = () =>
    runAction('verified', async () => {
      const updated = await adminApi.setEmailVerified(user.id, !user.emailVerified);
      applyUserUpdate(updated);
      toastSuccess(updated.emailVerified ? 'Email marked as verified' : 'Email marked as unverified');
    });

  const submitReset = () =>
    runAction('password', async () => {
      await adminApi.resetPassword(user.id, resetValue);
      setResetOpen(false);
      setResetValue('');
      toastSuccess('Password reset — the old one no longer works');
    });

  const submitDelete = () =>
    runAction('delete', async () => {
      await adminApi.removeUser(user.id);
      toastSuccess(`@${user.username} was deleted`);
      navigate('/admin/users');
    });

  const submitMessage = () =>
    runAction('message', async () => {
      await adminApi.notifyUser(user.id, messageValue.trim());
      setMessageOpen(false);
      setMessageValue('');
      toastSuccess(`Message delivered to @${user.username}'s notifications`);
    });

  /* ---------------------------------------------------- link moderation */

  /**
   * Rewrites one link's block state in place, and any sibling row that pointed
   * at the same address.
   *
   * The block is site-wide, so the panel does not pretend otherwise: if another
   * account links the same destination, that row changes too, and the numbers
   * the server reported are carried across so the totals on screen stay true.
   * Patching only the clicked row would leave this page quietly disagreeing with
   * the database.
   */
  const applyBlock = async (link, isBlocked, reason) => {
    const { affectedLinks, affectedAccounts } = await adminApi.setLinkBlocked(link.id, isBlocked, reason);

    setData((prev) => {
      if (!prev) return prev;
      const target = prev.links.find((l) => l.id === link.id);
      if (!target) return prev;
      return {
        ...prev,
        // Matched the way the server matched: on the address key, not the url
        // string. Two rows on this page can point at one destination written
        // differently — `http://` against `https://`, a `www.`, a trailing
        // slash — and a string comparison would leave the second row claiming
        // to be live while the database has it blocked.
        links: prev.links.map((l) =>
          l.id === target.id || (target.blockKey ? l.blockKey === target.blockKey : l.url === target.url)
            ? {
                ...l,
                isBlocked,
                blockedReason: isBlocked ? reason : '',
                blockedAt: isBlocked ? new Date().toISOString() : null,
              }
            : l
        ),
      };
    });

    setBlocking(null);
    if (isBlocked) {
      toastSuccess(
        affectedLinks > 1
          ? `Blocked — ${affectedLinks} links on ${affectedAccounts} account${affectedAccounts === 1 ? '' : 's'} now hidden`
          : 'Link blocked and hidden from the public page'
      );
    } else {
      toastSuccess(
        affectedLinks > 1
          ? `Unblocked — ${affectedLinks} links are live again`
          : 'Link is live again'
      );
    }
  };

  const submitBlock = () => {
    if (!blocking) return;
    const { link, reason } = blocking;
    setBusyLink({ id: link.id, op: 'block' });
    applyBlock(link, true, reason.trim())
      .catch((err) => toastError(parseApiError(err).message))
      .finally(() => setBusyLink({ id: '', op: '' }));
  };

  const unblock = (link) => {
    setBusyLink({ id: link.id, op: 'unblock' });
    applyBlock(link, false, '')
      .catch((err) => toastError(parseApiError(err).message))
      .finally(() => setBusyLink({ id: '', op: '' }));
  };

  const submitLinkDelete = () => {
    if (!deletingLink) return;
    const target = deletingLink;
    setBusyLink({ id: target.id, op: 'delete' });
    adminApi
      .deleteLink(target.id)
      .then(() => {
        // Dropped from the table rather than refetched, matching how the account
        // delete navigates away instead of reloading into a vanished record.
        setData((prev) =>
          prev ? { ...prev, links: prev.links.filter((l) => l.id !== target.id) } : prev
        );
        setDeletingLink(null);
        toastSuccess(`“${target.label}” deleted`);
      })
      .catch((err) => toastError(parseApiError(err).message))
      .finally(() => setBusyLink({ id: '', op: '' }));
  };

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
                      {user?.status === 'suspended' && (
                        <span className="badge badge-warn">
                          <FiUserX /> suspended
                        </span>
                      )}
                      {user?.emailVerified ? (
                        <VerifiedBadge label="verified" title="This account is verified" />
                      ) : (
                        <span className="badge badge-neutral" title="This email has not been verified">
                          <FiXCircle /> unverified
                        </span>
                      )}
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

              <div className="chart-card" style={{ marginBottom: 18 }}>
                <div className="card-title" style={{ marginBottom: 4 }}>Account actions</div>
                <p className="hint" style={{ marginBottom: 14 }}>
                  Changes take effect immediately. A suspended account cannot log in or use any API
                  until it is re-activated.
                </p>

                {user?.role === 'admin' ? (
                  <p className="small muted" style={{ color: 'var(--ink-400)' }}>
                    Administrator accounts are protected — they cannot be changed from this panel.
                  </p>
                ) : (
                  <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                    <Button
                      variant="outline"
                      icon={user?.status === 'suspended' ? FiUserCheck : FiUserX}
                      loading={busy === 'status'}
                      disabled={busy !== '' && busy !== 'status'}
                      onClick={toggleStatus}
                    >
                      {user?.status === 'suspended' ? 'Un-suspend' : 'Suspend'}
                    </Button>
                    <Button
                      variant="outline"
                      icon={user?.emailVerified ? FiXCircle : FiMail}
                      loading={busy === 'verified'}
                      disabled={busy !== '' && busy !== 'verified'}
                      onClick={toggleVerified}
                    >
                      {user?.emailVerified ? 'Mark unverified' : 'Mark verified'}
                    </Button>
                    <Button
                      variant="outline"
                      icon={FiKey}
                      loading={busy === 'password'}
                      disabled={busy !== '' && busy !== 'password'}
                      onClick={() => setResetOpen(true)}
                    >
                      Reset password
                    </Button>
                    {/* The only action here that adds something rather than
                        changing something: it writes to this user's bell and to
                        nobody else on the system. */}
                    <Button
                      variant="outline"
                      icon={FiSend}
                      loading={busy === 'message'}
                      disabled={busy !== '' && busy !== 'message'}
                      onClick={() => setMessageOpen(true)}
                    >
                      Send message
                    </Button>
                    <Button
                      variant="danger"
                      icon={FiTrash2}
                      loading={busy === 'delete'}
                      disabled={busy !== '' && busy !== 'delete'}
                      onClick={() => setDeleteOpen(true)}
                    >
                      Delete account
                    </Button>
                  </div>
                )}
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
                  {/* `admin-table-links` so the narrow-screen rules can drop the
                      platform and clicks columns by position. */}
                  <table className="admin-table admin-table-links">
                    <thead>
                      <tr>
                        <th scope="col">Link</th>
                        <th scope="col">Platform</th>
                        <th scope="col">Destination</th>
                        <th scope="col" className="num">Clicks</th>
                        <th scope="col">State</th>
                        <th scope="col" className="ta-right">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {links.map((link) => (
                        <tr key={link.id} style={link.isBlocked ? { background: 'var(--danger-50)' } : undefined}>
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
                            {/* Only worth saying when the block is wider than this
                                row, which is the part an admin cannot guess. */}
                            {link.isBlocked && link.otherLinksWithUrl > 0 && (
                              <span className="tiny" style={{ color: 'var(--danger)' }}>
                                {link.otherLinksWithUrl} other link{link.otherLinksWithUrl === 1 ? '' : 's'} site-wide
                              </span>
                            )}
                          </td>
                          <td className="num">{formatNumber(link.clickCount || 0)}</td>
                          <td>
                            {link.isBlocked ? (
                              <span className="badge badge-danger" title={link.blockedReason || 'Blocked by an administrator'}>
                                blocked
                              </span>
                            ) : link.isActive ? (
                              <span className="badge badge-success">active</span>
                            ) : (
                              <span className="badge badge-neutral">hidden</span>
                            )}
                          </td>
                          <td className="ta-right">
                            <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                              {/* `loading` already disables the button, so one
                                  flag covers both states. Tracking the id rather
                                  than a single busy boolean keeps the rest of the
                                  table usable while one row is being actioned. */}
                              <Button
                                size="sm"
                                variant={link.isBlocked ? 'outline' : 'danger'}
                                icon={link.isBlocked ? FiCheckCircle : FiSlash}
                                loading={busyRow(link.id, link.isBlocked ? 'unblock' : 'block')}
                                onClick={() =>
                                  link.isBlocked
                                    ? unblock(link)
                                    : setBlocking({ link, reason: '' })
                                }
                              >
                                <span className="link-action-label">
                                  {link.isBlocked ? 'Unblock' : 'Block'}
                                </span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={FiTrash2}
                                loading={busyRow(link.id, 'delete')}
                                onClick={() => setDeletingLink(link)}
                                aria-label={`Delete ${link.label}`}
                              >
                                <span className="link-action-label">Delete</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="tiny muted" style={{ marginTop: 12 }}>
                  Blocking hides a link from its public page and stops its click
                  counter. It also blocks that address site-wide, so nobody can add
                  it again — the owner included. They are told either way.
                </p>
              </div>
            </>
          )}

          {/* Free-text note to one user. Scoped by the server to this account
              alone — there is no "send to everyone" here on purpose. */}
          <Modal open={messageOpen} onClose={() => setMessageOpen(false)} maxWidth={430} labelledBy="send-message-title">
            <h3 className="card-title" id="send-message-title" style={{ fontSize: 18, marginBottom: 6 }}>
              Message @{user?.username}
            </h3>
            <p className="confirm-text">
              This appears in <strong>{user?.email}</strong>&apos;s notification bell on their
              dashboard, and nowhere else. They will see a red dot until they read it.
            </p>
            <label className="small strong" style={{ display: 'block', margin: '12px 0 6px' }} htmlFor="admin-user-message">
              Your message
            </label>
            <textarea
              id="admin-user-message"
              className="input"
              rows={4}
              autoFocus
              maxLength={500}
              value={messageValue}
              onChange={(e) => setMessageValue(e.target.value)}
              placeholder="We couldn't verify this because the domain doesn't match the one on your account."
            />
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
              <span className="tiny muted">Plain text, shown as written.</span>
              <span className="tiny muted">{messageValue.length}/500</span>
            </div>
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setMessageOpen(false)} disabled={busy === 'message'}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={FiSend}
                onClick={submitMessage}
                loading={busy === 'message'}
                disabled={messageValue.trim().length < 2}
              >
                Send message
              </Button>
            </div>
          </Modal>

          {/* Blocking. The scope is the part that needs spelling out: it is not
              just this row, it is the address, everywhere. The count comes from
              the server rather than being guessed, and the reason is what the
              owner is shown, so it is asked for here rather than left implicit. */}
          <Modal
            open={blocking !== null}
            onClose={() => (busyLink.id ? null : setBlocking(null))}
            maxWidth={460}
            labelledBy="block-link-title"
          >
            <h3 className="card-title" id="block-link-title" style={{ fontSize: 18, marginBottom: 6 }}>
              Block &ldquo;{blocking?.link.label}&rdquo;?
            </h3>
            <p className="confirm-text">
              It disappears from the public page and stops counting clicks.{' '}
              <strong>{blocking?.link.url}</strong> is also blocked site-wide, so
              nobody can add it again &mdash; including{' '}
              <strong>@{user?.username}</strong> themselves.
            </p>

            {blocking?.link.otherLinksWithUrl > 0 && (
              <div
                className="card card-pad"
                style={{ marginTop: 12, background: 'var(--danger-50)', borderColor: 'transparent' }}
              >
                <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                  <div className="small strong" style={{ color: '#b91c1c' }}>
                    <FiAlertTriangle style={{ verticalAlign: '-2px', marginRight: 6 }} />
                    This is wider than one link
                  </div>
                </div>
                <p className="small" style={{ color: '#7f1d1d', margin: '4px 0 0' }}>
                  <strong>{formatNumber(blocking.link.otherLinksWithUrl)}</strong> other link
                  {blocking.link.otherLinksWithUrl === 1 ? '' : 's'} on other account
                  {blocking.link.otherLinksWithUrl === 1 ? '' : 's'} point at the same
                  address. They go down too.
                </p>
              </div>
            )}

            <label className="small strong" style={{ display: 'block', margin: '14px 0 6px' }} htmlFor="block-reason">
              Reason (the owner sees this)
            </label>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {['Spam or scam', 'Phishing', 'Impersonating someone else', 'Broken or unsafe'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setBlocking((b) => ({ ...b, reason: preset }))}
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              id="block-reason"
              className="input"
              rows={3}
              maxLength={280}
              value={blocking?.reason || ''}
              onChange={(e) => setBlocking((b) => ({ ...b, reason: e.target.value }))}
              placeholder="Why this link is being taken down."
            />
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
              <span className="tiny muted">Optional, but they will ask.</span>
              <span className="tiny muted">{(blocking?.reason || '').length}/280</span>
            </div>

            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setBlocking(null)} disabled={busyLink.id !== ''}>
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={FiSlash}
                loading={busyRow(blocking?.link.id, 'block')}
                onClick={submitBlock}
              >
                Block link
              </Button>
            </div>
          </Modal>

          <ConfirmDialog
            open={deletingLink !== null}
            // Real curly quotes, not &ldquo;. HTML entities are only decoded in
            // JSX text children — inside a template string they render as the
            // literal characters, which is what the dialog was showing.
            title={`Delete “${deletingLink?.label}”?`}
            message={
              deletingLink?.isBlocked
                ? 'This link is already blocked, so deleting it will not let the address back in. To let it in again, unblock it first.'
                : 'This removes the link and its click history for good. To stop it without deleting it, block it instead.'
            }
            confirmLabel="Delete link"
            icon={<FiTrash2 />}
            loading={busyRow(deletingLink?.id, 'delete')}
            onConfirm={submitLinkDelete}
            onClose={() => (busyLink.id ? undefined : setDeletingLink(null))}
          />

          <Modal open={resetOpen} onClose={() => setResetOpen(false)} maxWidth={430} labelledBy="reset-password-title">
            <h3 className="card-title" id="reset-password-title" style={{ fontSize: 18, marginBottom: 6 }}>
              Reset password
            </h3>
            <p className="confirm-text">
              Set a new password for <strong>{user?.email}</strong>. The previous password stops
              working as soon as this saves.
            </p>
            <label className="small strong" style={{ display: 'block', margin: '12px 0 6px' }} htmlFor="admin-reset-password">
              New password
            </label>
            <input
              id="admin-reset-password"
              className="input"
              type="password"
              autoFocus
              value={resetValue}
              onChange={(e) => setResetValue(e.target.value)}
              placeholder="At least 8 characters"
            />
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setResetOpen(false)} disabled={busy === 'password'}>
                Cancel
              </Button>
              <Button variant="primary" onClick={submitReset} loading={busy === 'password'} disabled={resetValue.length < 8}>
                Reset password
              </Button>
            </div>
          </Modal>

          <ConfirmDialog
            open={deleteOpen}
            title="Delete this account?"
            message={`This permanently deletes @${user?.username}, all of their links and their analytics. This cannot be undone.`}
            confirmLabel="Delete account"
            loading={busy === 'delete'}
            onConfirm={submitDelete}
            onClose={() => setDeleteOpen(false)}
            icon={<FiTrash2 />}
          />
        </div>
      </PageTransition>
    </AdminShell>
  );
};

export default AdminUserDetailPage;
