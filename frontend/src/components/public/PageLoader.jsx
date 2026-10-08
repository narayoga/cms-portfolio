import { useEffect, useRef, useState } from 'react';

// Don't flash the overlay for loads that finish almost immediately, and once it
// is on screen keep it there long enough that the exit animation reads as
// intentional rather than a blink.
const SHOW_DELAY = 150;   // ms of loading before the overlay appears at all
const MIN_VISIBLE = 400;  // ms the overlay stays once shown
const EXIT_MS = 550;      // must match the CSS exit animation

// Full-screen frosted-glass loader shown on the initial page load only.
// Pulsing monochrome bars; on completion it fades and scales away, "lifting off"
// to reveal the page that has already rendered underneath.
export default function PageLoader({ active }) {
  const [phase, setPhase] = useState('idle'); // idle | visible | exiting | gone
  const shownAt = useRef(0);

  useEffect(() => {
    if (active) {
      if (phase !== 'idle') return;
      const t = setTimeout(() => {
        shownAt.current = Date.now();
        setPhase('visible');
      }, SHOW_DELAY);
      return () => clearTimeout(t);
    }

    // Loading finished. If we never showed the overlay, stay out of the way.
    if (phase !== 'visible') return;
    const wait = Math.max(0, MIN_VISIBLE - (Date.now() - shownAt.current));
    const t = setTimeout(() => setPhase('exiting'), wait);
    return () => clearTimeout(t);
  }, [active, phase]);

  useEffect(() => {
    if (phase !== 'exiting') return;
    const t = setTimeout(() => setPhase('gone'), EXIT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'idle' || phase === 'gone') return null;

  return (
    <div
      className={`page-loader ${phase === 'exiting' ? 'is-exiting' : ''}`}
      role="status"
      aria-label="Loading"
    >
      <div className="page-loader__bars" aria-hidden="true">
        <span /><span /><span /><span /><span />
      </div>
    </div>
  );
}
