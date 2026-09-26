import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FiLink2, FiPlus } from 'react-icons/fi';
import LinkCard, { LinkCardOverlay } from './LinkCard.jsx';
import LinkForm from './LinkForm.jsx';
import Button from '../common/Button.jsx';
import { LinkCardSkeleton } from '../common/Skeleton.jsx';
import { linksApi, parseApiError } from '../../lib/api.js';
import { useAuthStore } from '../../store/authStore.js';
import { useToastStore } from '../../store/toastStore.js';

/**
 * Links editor: create, edit, toggle, delete and drag to reorder.
 *
 * Reordering is optimistic — the list animates into its new order immediately and
 * the new order is persisted afterwards.
 */
const LinkManager = () => {
  const links = useAuthStore((s) => s.links);
  const setLinks = useAuthStore((s) => s.setLinks);
  const patchLink = useAuthStore((s) => s.patchLink);
  const status = useAuthStore((s) => s.status);

  const success = useToastStore((s) => s.success);
  const error = useToastStore((s) => s.error);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const sensors = useSensors(
    // Small activation distance so a click on the handle still registers as a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loading = status === 'loading' || status === 'idle';
  const ids = useMemo(() => links.map((l) => l._id), [links]);
  const activeLink = useMemo(() => links.find((l) => l._id === activeId) || null, [links, activeId]);

  // Close the form when navigating away.
  useEffect(() => {
    setEditing(null);
    setFormOpen(false);
  }, []);

  const onDragStart = ({ active }) => setActiveId(active.id);

  const onDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((l) => l._id === active.id);
    const newIndex = links.findIndex((l) => l._id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previous = links;
    const reordered = arrayMove(links, oldIndex, newIndex).map((l, i) => ({ ...l, order: i }));
    setLinks(reordered); // optimistic, framer animates the settle

    linksApi
      .reorder(reordered.map((l) => l._id))
      .then((saved) => setLinks(saved))
      .catch((err) => {
        setLinks(previous); // roll back
        error(parseApiError(err).message);
      });
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editing) {
        const saved = await linksApi.update(editing._id, payload);
        setLinks(links.map((l) => (l._id === saved._id ? saved : l)));
        success('Link updated');
      } else {
        const created = await linksApi.create(payload);
        setLinks([...links, created]);
        success('Link added to your page');
      }
      closeForm();
    } catch (err) {
      error(parseApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (link, next) => {
    setBusyId(link._id);
    try {
      await patchLink(link._id, { isActive: next });
    } catch (err) {
      error(parseApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (link) => {
    const previous = links;
    setBusyId(link._id);
    setLinks(links.filter((l) => l._id !== link._id)); // exit animation runs from here
    try {
      await linksApi.remove(link._id);
      success(`Deleted “${link.label}”`);
    } catch (err) {
      setLinks(previous);
      error(parseApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Your links</div>
          <div className="hint" style={{ marginTop: 2 }}>
            Drag the handle to reorder · toggle to hide without deleting
          </div>
        </div>
        <span className="badge badge-neutral">
          {links.filter((l) => l.isActive).length} live
        </span>
      </div>

      <div className="card-pad" style={{ paddingTop: 14 }}>
        <AnimatePresence initial={false}>
          {formOpen && (
            <div style={{ marginBottom: 12 }}>
              <LinkForm
                key={editing?._id || 'new'}
                initial={editing}
                submitting={submitting}
                onSubmit={handleSubmit}
                onClose={closeForm}
              />
            </div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="link-list">
            {[0, 1, 2].map((i) => (
              <LinkCardSkeleton key={i} />
            ))}
          </div>
        ) : links.length === 0 && !formOpen ? (
          <div className="empty">
            <div className="empty-icon">
              <FiLink2 />
            </div>
            <div className="strong">No links yet</div>
            <p className="small" style={{ maxWidth: 320 }}>
              Add your first link and it will show up on your public page instantly.
            </p>
            <Button icon={FiPlus} onClick={() => setFormOpen(true)} style={{ marginTop: 8 }}>
              Add your first link
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <ul className="link-list">
                <AnimatePresence initial={false} mode="popLayout">
                  {links.map((link, i) => (
                    <motion.li
                      key={link._id}
                      className="link-card-wrap"
                      layout={!activeId}
                      initial={{ opacity: 0, y: 16, scale: 0.97 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { delay: Math.min(i * 0.05, 0.4), duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                      }}
                      exit={{ opacity: 0, x: -40, height: 0, marginBottom: -10, transition: { duration: 0.24 } }}
                      style={{ overflow: 'hidden' }}
                    >
                      <LinkCard
                        link={link}
                        busy={busyId === link._id}
                        onEdit={(l) => {
                          setEditing(l);
                          setFormOpen(true);
                        }}
                        onDelete={handleDelete}
                        onToggle={handleToggle}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </SortableContext>

            <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
              {activeLink ? <LinkCardOverlay link={activeLink} /> : null}
            </DragOverlay>
          </DndContext>
        )}

        {!formOpen && links.length > 0 && (
          <div className="add-link-row">
            <Button variant="soft" icon={FiPlus} onClick={() => setFormOpen(true)} className="btn-block">
              Add a link
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkManager;
