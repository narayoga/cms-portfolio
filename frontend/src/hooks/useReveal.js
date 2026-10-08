import { useCallback, useRef, useState } from 'react';

/**
 * useReveal — scroll-into-view trigger for the animation library.
 *
 * Returns [ref, visible]. Attach `ref` to the element you want to watch and
 * add the `is-visible` class when `visible` is true; children marked with
 * `.reveal` (see animations.css) then play their entrance animation.
 *
 *   const [ref, visible] = useReveal();
 *   <section ref={ref} className={visible ? 'is-visible' : ''}> … </section>
 *
 * `ref` is a callback ref, so it correctly attaches the observer whenever the
 * node mounts — including elements rendered only after an async load finishes.
 *
 * By default the entrance fires only once the element scrolls up to roughly
 * the middle of the screen (via a negative bottom rootMargin), so the user has
 * time to scroll before the animation plays.
 *
 * @param {number}  threshold   fraction of the element that must be in view (0–1)
 * @param {string}  rootMargin  IO root margin; negative bottom = trigger higher up
 * @param {boolean} once        fire only the first time (default true)
 */
export function useReveal({
  threshold = 0,
  rootMargin = '0px 0px -40% 0px',
  once = true,
} = {}) {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef(null);

  const ref = useCallback((node) => {
    // Tear down any previous observer (node changed or unmounted)
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        if (once) obs.disconnect();
      } else if (!once) {
        setVisible(false);
      }
    }, { threshold, rootMargin });

    obs.observe(node);
    observerRef.current = obs;
  }, [threshold, rootMargin, once]);

  return [ref, visible];
}
