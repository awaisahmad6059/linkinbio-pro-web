import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiCheckCircle,
  FiCheckSquare,
  FiExternalLink,
  FiHelpCircle,
  FiInbox,
  FiMail,
  FiKey,
  FiMessageCircle,
  FiSlash,
  FiSquare,
  FiTrash2,
  FiUser,
  FiUserX,
  FiXCircle,
} from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import AdminShell from '../../components/admin/AdminShell.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Field from '../../components/common/Field.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { adminApi, parseApiError } from '../../lib/api.js';
import { REQUEST_OUTCOME_LABELS, REQUEST_TYPE_LABELS } from '../../lib/constants.js';
import { formatNumber, formatRelative } from '../../lib/utils.js';
import { useToastStore } from '../../store/toastStore.js';
import { AdminErrorNote } from './AdminOverviewPage.jsx';

const PAGE_SIZE = 25;

const TYPE_META = {
  'verify-email': { Icon: FiMail, color: '#6366f1' },
  'password-reset': { Icon: FiKey, color: '#f59e0b' },
  'account-suspend': { Icon: FiUserX, color: '#ef4444' },
  // Red, because an unblock request is a blocked link sitting in the queue — the
  // same colour as a suspension, so the rows that need a judgement call about
  // content rather than about access look alike.
  'unblock-link': { Icon: FiSlash, color: '#ef4444' },
  other: { Icon: FiHelpCircle, color: '#8b8aa3' },
};
const typeMeta = (type) => TYPE_META[type] || TYPE_META.other;

/**
 * The name the requester typed into the form, as one line. Only verification
 * requests carry one, so this returns empty for the locked-out types raised
 * from the login screen — which is correct, since that form never asks.
 */
const submittedName = (r) => [r.firstName, r.lastName].filter(Boolean).join(' ').trim();

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
  // The request currently being closed out, plus the answer being composed.
  const [closing, setClosing] = useState(null);
  // Ids ticked for deletion. Held as a Set so ticking a row is O(1) and the
  // select-all tick is a single swap rather than a walk over every id.
  const [selected, setSelected] = useState(() => new Set());
  // Set when "select all" has pulled in the whole tab, so the header checkbox
  // can show a third state instead of claiming less than is actually ticked.
  const [allInTab, setAllInTab] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  /**
   * Lifts the block on an address straight from the queue, then closes the
   * request as resolved.
   *
   * One action rather than two, because they are never wanted apart: an admin
   * who has decided to unblock has by definition resolved the request, and
   * leaving two buttons invites unblocking the address and then marking the
   * request resolved anyway — which is the same result by accident, but says
   * nothing about who decided.
   *
   * The request row carries the address, so this works even when the link is
   * gone. That is the case this whole feature exists for: the owner cannot reach
   * the per-link Unblock button once their link has been deleted, and the queue
   * is where they are actually asking.
   */
  const unblockAndResolve = async (request) => {
    if (!request.blockId) {
      toastError('That address is not on the block list any more');
      return;
    }

    setBusyId(request.id);

    // The two calls cannot be atomic, and the order matters: the block is lifted
    // first because that is the part the user asked for. If closing the request
    // then fails, the address is already live — so the row comes off the queue
    // anyway and the admin is told the bookkeeping did not save, rather than being
    // left a row whose action now fails every time they press it.
    let affected = 0;
    try {
      const res = await adminApi.unblockAddress(request.blockId);
      affected = res.affectedLinks || 0;
    } catch (err) {
      toastError(parseApiError(err).message);
      setBusyId('');
      return;
    }

    const dropRow = () =>
      setData((prev) =>
        prev ? { ...prev, requests: prev.requests.filter((r) => r.id !== request.id), total: Math.max(0, prev.total - 1) } : prev
      );

    try {
      await adminApi.setRequestStatus(request.id, 'resolved', {
        outcome: 'resolved',
        note: 'Unblocked after review.',
      });
      dropRow();
      toastSuccess(
        affected > 0
          ? `Address unblocked and ${affected} link${affected === 1 ? '' : 's'} restored`
          : 'Address unblocked'
      );
    } catch (err) {
      dropRow();
      toastError(`Address unblocked, but closing the request failed: ${parseApiError(err).message}`);
    } finally {
      setBusyId('');
    }
  };

  /**
   * Opens the close-out dialog for one request.
   *
   * Closing a request is two decisions at once — did you do what was asked, or
   * turn it down, and did you want to tell the user why — so it asks for both
   * rather than guessing a cheerful "resolved".
   */
  const openCloseDialog = (request) => {
    setClosing({
      request,
      outcome: 'resolved',
      note: '',
    });
  };

  const confirmClose = async () => {
    const { request, outcome, note } = closing;
    const id = request.id;

    setBusyId(id);
    try {
      await adminApi.setRequestStatus(id, 'resolved', { outcome, note: note.trim() });
      toastSuccess(
        outcome === 'rejected'
          ? `Request declined — ${request.user?.username || 'the user'} has been told`
          : 'Request resolved — the user has been told'
      );
      setClosing(null);

      // Drop the row from the open queue immediately.
      setData((prev) =>
        prev ? { ...prev, requests: prev.requests.filter((r) => r.id !== id), total: Math.max(0, prev.total - 1) } : prev
      );

      // Send the admin to the account so the actual remedy — verify, suspend,
      // reset — is one click away instead of a second navigation later. A row
      // with no account behind it has nowhere to go, so it just closes.
      if (outcome === 'resolved' && request.user?.id) {
        navigate(`/admin/users/${request.user.id}`);
      }
    } catch (err) {
      toastError(parseApiError(err).message);
    } finally {
      setBusyId('');
    }
  };

  /* ------------------------------------------------------------ selection */

  // A selection belongs to the rows it was made against. Switching tab or page
  // shows a different set, so carrying the ticks over would mean deleting
  // something the admin could not see ticked.
  useEffect(() => {
    setSelected(new Set());
    setAllInTab(false);
  }, [tab, page, attempt]);

  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    // Unticking anything means the tab is no longer fully selected, whatever
    // the header happens to show a moment later.
    setAllInTab(false);
  };

  /**
   * Select-all, twice: the rows on screen, and the rest of the tab.
   *
   * Only the visible page can be ticked from what is already loaded, so
   * "everything" needs the tab's id list from the server. Without that, an admin
   * with 60 open requests on a 25-row page would select all, press delete, and
   * remove 25 of 60 while the toast said 25 — so the scope has to be explicit
   * and the count has to be real.
   */
  const clearSelection = () => {
    setSelected(new Set());
    setAllInTab(false);
  };

  const toggleSelectAll = async () => {
    const visibleIds = requests.map((r) => r.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

    if (allVisibleSelected || allInTab) {
      clearSelection();
      return;
    }

    setSelected(new Set(visibleIds));
    setSelectingAll(true);
    try {
      const { ids } = await adminApi.requestIds(tab);
      setSelected(new Set(ids));
      setAllInTab(true);
    } catch (err) {
      // The page is still ticked, so the admin can delete what they can see;
      // the toast says the rest of the tab was left alone.
      toastError(parseApiError(err).message);
    } finally {
      setSelectingAll(false);
    }
  };

  /**
   * Deletes the ticked requests and drops them from the table.
   *
   * The rows are removed locally rather than triggering a refetch, so the table
   * settles in place instead of flashing a skeleton. The count falls by exactly
   * what the server reports, which is lower than the number ticked if some ids
   * were already gone — the toast says so rather than quietly claiming success.
   */
  const confirmBulkDelete = async () => {
    const ids = [...selected];
    if (!ids.length) return;

    setDeleting(true);
    try {
      const { deleted } = await adminApi.deleteRequests(ids);
      setConfirmDelete(false);
      clearSelection();

      setData((prev) => {
        if (!prev) return prev;
        const gone = new Set(ids);
        return {
          ...prev,
          requests: prev.requests.filter((r) => !gone.has(r.id)),
          total: Math.max(0, prev.total - deleted),
        };
      });

      if (deleted === ids.length) {
        toastSuccess(`${deleted} request${deleted === 1 ? '' : 's'} deleted`);
      } else {
        toastError(`Deleted ${deleted} of ${ids.length} — the rest were already gone`);
      }
    } catch (err) {
      toastError(parseApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const selectedCount = selected.size;
  const visibleIds = requests.map((r) => r.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someVisibleSelected = visibleIds.some((id) => selected.has(id)) && !allVisibleSelected;

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

          {/* Bulk actions live in their own bar rather than in the page header,
              so they appear only once there is something to delete and the
              permanent-ness of the action stays visually separated from the
              harmless tab switch above it. */}
          {!loading && requests.length > 0 && (
            <div className="row" style={{ marginTop: 16, gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={toggleSelectAll}
                disabled={selectingAll}
                aria-pressed={allInTab}
              >
                {allInTab ? <FiCheckSquare /> : <FiSquare />}
                {selectingAll ? 'Selecting…' : allInTab ? 'Clear selection' : 'Select all'}
              </button>

              {selectedCount > 0 && (
                <>
                  <span className="small muted">
                    {formatNumber(selectedCount)} selected
                    {allInTab && total > visibleIds.length ? ` of ${formatNumber(total)} in this tab` : ''}
                  </span>
                  <button
                    type="button"
                    className="tiny strong"
                    onClick={clearSelection}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)' }}
                  >
                    Clear
                  </button>
                  <div style={{ marginLeft: 'auto' }}>
                    <Button
                      size="sm"
                      variant="danger"
                      icon={FiTrash2}
                      onClick={() => setConfirmDelete(true)}
                    >
                      Delete selected
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="chart-card admin-table-card" style={{ padding: 0, overflow: 'hidden', marginTop: selectedCount > 0 ? 10 : 18 }}>
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
                      <th scope="col" style={{ width: 40 }}>
                        {/* Tri-state rather than a plain on/off: after "select
                            all" the header has to be able to say "some of the
                            tab is ticked" or the admin cannot tell what the
                            next click will do. */}
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={allVisibleSelected || allInTab}
                          ref={(el) => {
                            if (el) el.indeterminate = someVisibleSelected;
                          }}
                          onChange={toggleSelectAll}
                          disabled={selectingAll}
                          aria-label="Select all requests in this tab"
                        />
                      </th>
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
                      const ticked = selected.has(r.id);
                      return (
                        <motion.tr
                          key={r.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.28, delay: Math.min(i, 12) * 0.03 }}
                          // Tinted so it is obvious which rows a delete will
                          // take. A tick that is easy to miss is how the wrong
                          // rows get deleted.
                          style={ticked ? { background: 'var(--brand-50)' } : undefined}
                        >
                          <td>
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={selected.has(r.id)}
                              onChange={() => toggleRow(r.id)}
                              aria-label={`Select the ${REQUEST_TYPE_LABELS[r.type] || r.type} request from ${r.email}`}
                            />
                          </td>
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
                            {/* The name the person typed into the form. Preferred
                                over the account's display name when both exist,
                                because it is what was actually submitted for
                                this request. */}
                            {submittedName(r) && (
                              <div className="tiny" style={{ color: 'var(--ink-500)', marginTop: 3 }}>
                                <FiUser style={{ verticalAlign: '-2px', marginRight: 4 }} />
                                {submittedName(r)}
                              </div>
                            )}
                          </td>
                          <td>
                            {/* The address an unblock request is actually about.
                                Shown above the message because it is what the admin
                                has to rule on — the message is only the owner's
                                account of it. */}
                            {r.type === 'unblock-link' && r.url && (
                              <div className="small strong truncate" style={{ maxWidth: 300 }} title={r.url}>
                                <FiSlash style={{ verticalAlign: '-2px', marginRight: 4, color: '#ef4444' }} />
                                {r.url}
                              </div>
                            )}
                            <div className="small truncate" style={{ maxWidth: 300, marginTop: r.url ? 3 : 0 }} title={r.message}>
                              {r.message || <span className="tiny muted">No message left</span>}
                            </div>
                            {/* The answer the user was given, kept visible so the
                                history reads as a conversation rather than a row
                                that silently changed colour. */}
                            {r.note && (
                              <div
                                className="tiny muted truncate"
                                style={{ maxWidth: 300, marginTop: 3 }}
                                title={r.note}
                              >
                                <FiMessageCircle style={{ verticalAlign: '-2px', marginRight: 4 }} />
                                {r.note}
                              </div>
                            )}
                          </td>
                          <td className="small muted" style={{ whiteSpace: 'nowrap' }}>
                            {formatRelative(r.createdAt)}
                          </td>
                          <td className="ta-right">
                            {tab === 'open' && (
                              <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                                {/* An unblock request gets the remedy on its own row. Everywhere else the
                                    remedy lives on the account screen, but here
                                    the address may have no link left to go and
                                    look at, so the queue is the only place the
                                    decision can be carried out. */}
                                {r.type === 'unblock-link' && (
                                  r.blockId ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      icon={FiSlash}
                                      loading={busyId === r.id}
                                      disabled={busyId !== '' && busyId !== r.id}
                                      onClick={() => unblockAndResolve(r)}
                                    >
                                      Unblock
                                    </Button>
                                  ) : (
                                    <span
                                      className="badge badge-neutral"
                                      title="This address is no longer on the block list, so nothing needs lifting"
                                    >
                                      already unblocked
                                    </span>
                                  )
                                )}
                                {/* Going to the account is the common case: most
                                    requests are answered by a change there, not
                                    by ticking a box. */}
                                {r.user?.id && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    icon={FiExternalLink}
                                    onClick={() => navigate(`/admin/users/${r.user.id}`)}
                                  >
                                    Open
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  icon={FiCheckCircle}
                                  loading={busyId === r.id}
                                  disabled={busyId !== '' && busyId !== r.id}
                                  onClick={() => openCloseDialog(r)}
                                >
                                  Close
                                </Button>
                              </div>
                            )}
                            {tab === 'resolved' && (
                              <span className={`badge ${r.outcome === 'rejected' ? 'badge-warn' : 'badge-success'}`}>
                                {r.outcome === 'rejected' ? <FiXCircle /> : <FiCheckCircle />}
                                {REQUEST_OUTCOME_LABELS[r.outcome] || REQUEST_OUTCOME_LABELS.resolved}
                              </span>
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

      {/* Deleting is the only way a request leaves the panel without being
          handled, so it cannot be undone from anywhere in the UI. The wording
          states the count either way, and says "tab" when the selection spans
          more than the visible page — otherwise a select-all looks like it
          removed a screenful when it removed a queue. */}
      <ConfirmDialog
        open={confirmDelete}
        title={allInTab ? 'Delete every request in this tab?' : 'Delete the selected requests?'}
        message={
          allInTab
            ? `This permanently deletes all ${formatNumber(selectedCount)} requests in the ${tab} tab, including any on other pages. This cannot be undone.`
            : `This permanently deletes ${formatNumber(selectedCount)} selected request${selectedCount === 1 ? '' : 's'}. This cannot be undone.`
        }
        confirmLabel="Delete"
        icon={<FiTrash2 />}
        loading={deleting}
        onConfirm={confirmBulkDelete}
        onClose={() => (deleting ? undefined : setConfirmDelete(false))}
      />

      {/* Closing a request is a decision with two parts — did you do it, and do
          you want to say why — so it gets a dialog rather than a bare button.
          The note is optional: an admin who just ticks "resolved" should not be
          forced to type an explanation they have nothing to add. */}
      <Modal
        open={closing !== null}
        onClose={() => (busyId ? null : setClosing(null))}
        maxWidth={460}
        labelledBy="close-request-title"
      >
        <>
          <h3 className="card-title" id="close-request-title" style={{ fontSize: 18, marginBottom: 4 }}>
            Close this request
          </h3>
          <p className="hint" style={{ marginBottom: 16 }}>
            {closing?.request?.user?.username
              ? `This tells ${closing.request.user.username} what you decided.`
              : 'This request has no account behind it, so there is nobody to notify.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="label">What did you decide?</span>
            <div className="row" style={{ gap: 8 }}>
              {['resolved', 'rejected'].map((value) => {
                const active = closing?.outcome === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline'}`}
                    aria-pressed={active}
                    onClick={() => setClosing((c) => ({ ...c, outcome: value }))}
                  >
                    {value === 'resolved' ? <FiCheckCircle /> : <FiXCircle />}
                    {REQUEST_OUTCOME_LABELS[value]}
                  </button>
                );
              })}
            </div>
            <p className="hint" style={{ marginTop: -4 }}>
              {closing?.outcome === 'rejected'
                ? 'The user is told the request was declined, so keep the reason short and kind.'
                : 'The user is told it was handled. Make the actual change on their account too.'}
            </p>

            <Field
              label="Note to the user (optional)"
              as="textarea"
              rows={3}
              maxLength={500}
              placeholder="We couldn't verify this because the domain doesn't match the one on the account."
              value={closing?.note || ''}
              onChange={(e) => setClosing((c) => ({ ...c, note: e.target.value }))}
              counter={`${(closing?.note || '').length}/500`}
            />
          </div>

          <div className="row" style={{ gap: 8, marginTop: 18 }}>
            <Button variant="ghost" className="btn-block" onClick={() => setClosing(null)} disabled={!!busyId}>
              Cancel
            </Button>
            <Button
              className="btn-block"
              variant={closing?.outcome === 'rejected' ? 'danger' : 'primary'}
              icon={closing?.outcome === 'rejected' ? FiXCircle : FiCheckCircle}
              loading={busyId !== ''}
              onClick={confirmClose}
            >
              {closing?.outcome === 'rejected' ? 'Decline request' : 'Resolve request'}
            </Button>
          </div>
        </>
      </Modal>
    </AdminShell>
  );
};

export default AdminRequestsPage;