import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../../api/client';
import SmoothImg from './SmoothImg.jsx';
import './HeroSlider.css';

const DURATION = 6000; // ms per slide

export default function HeroSlider({ banners = [] }) {
  const n = banners.length;

  const [idx,     setIdx]     = useState(0);
  const [exitIdx, setExitIdx] = useState(null); // slide animating out
  const [preIdx,  setPreIdx]  = useState(null); // slide pre-positioned (prev dir)
  const [dir,     setDir]     = useState('next');
  const locked = useRef(false);

  // Track a unique key per slide activation so content re-mounts
  // and text animations restart every time a slide becomes active.
  const activationCount = useRef(0);
  const [contentSlotKey, setContentSlotKey] = useState({});

  /* ── Navigation ─────────────────────────────────────────── */
  const go = useCallback((nextIdx, direction) => {
    if (locked.current || nextIdx === idx) return;
    locked.current = true;
    setDir(direction);
    setExitIdx(idx);

    const count = ++activationCount.current;
    setContentSlotKey(prev => ({ ...prev, [nextIdx]: `act-${count}` }));

    if (direction === 'prev') {
      // Pre-position entering slide at -100% (left, no animation),
      // then two rAFs later trigger the animation so the browser
      // sees the position change before the class switch.
      setPreIdx(nextIdx);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setIdx(nextIdx);
          setPreIdx(null);
          setTimeout(() => { setExitIdx(null); locked.current = false; }, 700);
        })
      );
    } else {
      // next: entering slide is already off-screen right (standby)
      setIdx(nextIdx);
      setTimeout(() => { setExitIdx(null); locked.current = false; }, 700);
    }
  }, [idx]);

  const next = useCallback(() => go((idx + 1) % n, 'next'), [go, idx, n]);
  const prev = useCallback(() => go((idx - 1 + n) % n, 'prev'), [go, idx, n]);

  /* ── Auto-advance ────────────────────────────────────────── */
  useEffect(() => {
    if (n <= 1) return;
    const id = setTimeout(next, DURATION);
    return () => clearTimeout(id);
  }, [idx, n, next]);

  /* ── Drag / swipe (pointer events work for mouse + touch) ── */
  const drag = useRef({ x: 0, active: false });

  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, active: true };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerUp = (e) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const delta = drag.current.x - e.clientX;
    if (delta >  60) next();
    if (delta < -60) prev();
  };

  /* ── Empty state ─────────────────────────────────────────── */
  if (!n) return (
    <div className="hero-empty">
      <div className="container">
        <h1>Welcome</h1>
        <p className="text-muted">Add banners from the admin panel.</p>
      </div>
    </div>
  );

  const isTransitioning = exitIdx !== null || preIdx !== null;

  return (
    <div
      className="hero-slider"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* ── Slides ─────────────────────────────────────────── */}
      {banners.map((b, i) => {
        const isActive  = i === idx;
        const isExiting = i === exitIdx;
        const isPre     = i === preIdx;

        let cls = 'hero-slide';
        if (isPre)                              cls += ' is-pre';
        // Pre-frame (prev dir): this slide is both the current idx and the
        // exiting one. Hold it static at translateX(0) so it doesn't jump
        // off-screen before the entering slide is ready → no black flash.
        else if (isActive && isExiting)         cls += ' is-visible';
        else if (isActive && isTransitioning)   cls += ` is-active dir-${dir}`;
        else if (isActive && !isTransitioning)  cls += ' is-visible';
        else if (isExiting)                     cls += ` is-exiting dir-${dir}`;
        else                                    cls += ' is-standby';

        return (
          <div key={b.id} className={cls}>
            <SmoothImg
              src={mediaUrl(b.image_path)}
              alt={b.title || ''}
              draggable={false}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchpriority={i === 0 ? 'high' : 'low'}
              decoding="async"
            />
            <div className="hero-overlay" />
            <div key={contentSlotKey[i] ?? `init-${i}`} className="container hero-content">
              {b.title    && <h1>{b.title}</h1>}
              {b.subtitle && <p>{b.subtitle}</p>}
              {b.link     && (
                <Link to={b.link} className="hero-btn">Discover More</Link>
              )}
            </div>
          </div>
        );
      })}

      {/* ── Arrows ─────────────────────────────────────────── */}
      {n > 1 && (
        <>
          <button className="hero-arrow hero-arrow--prev" onClick={prev} onPointerDown={(e) => e.stopPropagation()} aria-label="Previous slide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button className="hero-arrow hero-arrow--next" onClick={next} onPointerDown={(e) => e.stopPropagation()} aria-label="Next slide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* ── Progress bars ──────────────────────────────────── */}
      {n > 1 && (
        <div className="hero-progress">
          {banners.map((_, i) => (
            <div key={i} className="hero-progress-track">
              {/* key includes idx so the fill element re-mounts and restarts animation */}
              <div
                key={`${i}-${idx}`}
                className={[
                  'hero-progress-fill',
                  i === idx ? 'is-running' : '',
                  i < idx   ? 'is-done'    : '',
                ].filter(Boolean).join(' ')}
                style={i === idx ? { animationDuration: `${DURATION}ms` } : {}}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
