import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSlash, FiSearch, FiShieldOff } from 'react-icons/fi';
import PageTransition from '../../components/common/PageTransition.jsx';
import AdminShell from '../../components/admin/AdminShell.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import Button from '../../components/common/Button.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { adminApi, parseApiError } from '../../lib/api.js';
import { formatNumber, formatRelative } from '../../lib/utils.js';
import { useToastStore } from '../../store/toastStore.js';
import { AdminErrorNote } from './AdminOverviewPage.jsx';

/**
 * The denylist: every address currently off the site.
 *
 * This page exists because a block outlives the links that caused it. Deleting a
 * spam link does not delete the block — that is the whole point, since deleting
 * and re-adding is how a per-link flag gets stepped around — so the last link to
 * an address can be deleted and leave the address blocked with no row left to
 * click Unblock on. This is where that becomes visible and reversible.
 *
 * It is also the only record of *why* something is blocked and who blocked it, so
 * it doubles as the audit trail for moderation decisions that were not tied to a
 * single account.
 */
const AdminBlocksPage = () => {
  const toastSuccess = useToastStore((s) => s.success);
  const toastError = useToastStore((s) => s.error);

  const [blocks, setBlocks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [unblocking, setUnblocking] = useState(null);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    adminApi
      .blocks()
      .then((payload) => {
        if (cancelled) return;
        setBlocks(payload.blocks);
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

  /**
   * Client-side filter only.
   *
   * The list is bounded by the number of distinct addresses ever blocked, which
   * is a handful on a site this size and grows one row at a time, each added by
   * hand. Filtering a loaded array is instant; a server round trip per keystroke
   * would be slower and would add a query parameter that has to be trusted.
   */
  const rows = useMemo(() => {
    const all = blocks || [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (b) => b.url.toLowerCase().includes(q) || (b.reason || '').toLowerCase().includes(q)
    );
  }, [blocks, query]);

  const confirmUnblock = async () => {
    const target = unblocking;
    setBusyId(target.id);
    try {
      const res = await adminApi.unblockAddress(target.id);
      setBlocks((prev) => prev.filter((b) => b.id !== target.id));
      setUnblocking(null);

      // Said out loud because the whole page is about knowing what a block
      // touches. Unblocking an address puts back every link pointing at it, on
      // every account — which is the correct inverse, but not a small act.
      const n = res.affectedLinks || 0;
      toastSuccess(
        n > 0
          ? `Unblocked ${target.url} and restored ${n} link${n === 1 ? '' : 's'}`
          : `Unblocked ${target.url}`
      );
    } catch (err) {
      toastError(parseApiError(err).message);
    } finally {
      setBusyId('');
    }
  };

  const totalLinks = rows.reduce((sum, b) => sum + (b.linkCount || 0), 0);
  const totalAccounts = rows.reduce((sum, b) => sum + (b.accountCount || 0), 0);

  return (
    <AdminShell>
      <PageTransition className="page">
        <div className="container">
          <div className="page-head">
            <div>
              <h1 className="page-title">Blocked links</h1>
              <p className="page-sub">
                Addresses an admin has taken off the site. Nobody can add one again — including the
                person it was blocked from — until it is lifted here.
              </p>
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 18 }}>
              <AdminErrorNote message={error} onRetry={() => setAttempt((n) => n + 1)} />
            </div>
          )}

          {!loading && blocks && blocks.length > 0 && (
            <div className="card" style={{ marginBottom: 18 }}>
              <div className="card-pad">
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-danger">
                    <FiSlash /> {formatNumber(blocks.length)} blocked{' '}
                    {blocks.length === 1 ? 'address' : 'addresses'}
                  </span>
                  <span className="badge badge-neutral">{formatNumber(totalLinks)} links down</span>
                  <span className="badge badge-neutral">{formatNumber(totalAccounts)} accounts affected</span>
                </div>
                <p className="hint" style={{ marginTop: 10 }}>
                  A block covers the address, not one link — so a second account pointing at the same
                  address was taken down with it, and lifting it here restores every copy.
                </p>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: 32 }}>
            <div className="card-head">
              <div className="card-title">
                <FiShieldOff style={{ marginRight: 8, color: 'var(--brand)' }} />
                Block list
              </div>
              {blocks && blocks.length > 6 && (
                <div className="admin-search">
                  <FiSearch />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search address or reason"
                    aria-label="Search blocked addresses"
                  />
                </div>
              )}
            </div>

            <div className="card-pad" style={{ paddingTop: 0 }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} height={54} />
                  ))}
                </div>
              ) : blocks.length === 0 ? (
                <div className="empty" style={{ padding: '34px 10px' }}>
                  <div className="empty-icon"><FiShieldOff /></div>
                  <div className="strong">Nothing is blocked</div>
                  <p className="small">
                    No address has been taken off the site. Block one from a link on any account and it
                    will appear here.
                  </p>
                </div>
              ) : rows.length === 0 ? (
                <div className="empty" style={{ padding: '30px 10px' }}>
                  <div className="strong">No match</div>
                  <p className="small">Nothing on the block list contains “{query.trim()}”.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rows.map((b, i) => (
                    <motion.div
                      key={b.id}
                      className="admin-block-row"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: Math.min(i, 12) * 0.03 }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="small strong truncate" title={b.url}>
                          {b.url}
                        </div>
                        {b.reason && (
                          <div className="tiny muted truncate" style={{ marginTop: 3 }} title={b.reason}>
                            {b.reason}
                          </div>
                        )}
                        <div className="tiny muted" style={{ marginTop: 3 }}>
                          Blocked {formatRelative(b.blockedAt)}
                          {b.linkCount > 0
                            ? ` · ${formatNumber(b.linkCount)} link${b.linkCount === 1 ? '' : 's'} down across ${b.accountCount} ${
                                b.accountCount === 1 ? 'account' : 'accounts'
                              }`
                            : ' · no links pointing at it any more'}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        icon={FiShieldOff}
                        loading={busyId === b.id}
                        disabled={busyId !== '' && busyId !== b.id}
                        onClick={() => setUnblocking(b)}
                      >
                        Unblock
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageTransition>

      <ConfirmDialog
        open={unblocking !== null}
        title={`Unblock “${unblocking?.url}”?`}
        message={
          unblocking?.linkCount > 0
            ? `This puts ${unblocking.linkCount} link${unblocking.linkCount === 1 ? '' : 's'} back on the site across ${unblocking.accountCount} ${
                unblocking.accountCount === 1 ? 'account' : 'accounts'
              }, and lets anyone add this address again.`
            : 'No links point at this address any more, but it becomes addable again by anyone.'
        }
        confirmLabel="Unblock address"
        // Not `danger`. Unblocking restores things; the destructive act here is
        // blocking in the first place, and a red "unblock" button would mislabel
        // which way the decision runs.
        tone="brand"
        icon={<FiShieldOff />}
        loading={busyId === unblocking?.id}
        onConfirm={confirmUnblock}
        // ConfirmDialog already refuses to close while the action is in flight.
        onClose={() => setUnblocking(null)}
      />
    </AdminShell>
  );
};

export default AdminBlocksPage;