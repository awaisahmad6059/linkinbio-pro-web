import { useEffect } from 'react';
import confetti from 'canvas-confetti';

/** Brand-tuned confetti palette (indigo → violet → pink → amber). */
const COLORS = ['#4f46e5', '#7c3aed', '#a855f7', '#ec4899', '#f59e0b', '#22d3ee'];

/**
 * Fires a one-time celebration burst. Mount it with a `trigger` value; every
 * change from falsy → truthy fires a new burst, and the whole thing is a no-op
 * for users who prefer reduced motion.
 */
const ConfettiBurst = ({ trigger, pieceCount = 90, spread = 70 }) => {
  useEffect(() => {
    if (!trigger) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const fire = (particleCount, origin, opts = {}) => {
      confetti({
        particleCount,
        angle: opts.angle ?? 60,
        spread: opts.spread ?? spread,
        origin,
        colors: COLORS,
        scalar: 1.05,
        ticks: 220,
        gravity: 0.9,
        decay: 0.94,
        zIndex: 200,
        disableForReducedMotion: true,
      });
    };

    fire(Math.round(pieceCount * 0.6), { x: 0.22, y: 0.62 });
    fire(Math.round(pieceCount * 0.6), { x: 0.78, y: 0.62 });
    fire(pieceCount, { x: 0.5, y: 0.52 }, { spread: 100, angle: 90, scalar: 1.25 });
  }, [trigger, pieceCount, spread]);

  return null;
};

export default ConfettiBurst;
