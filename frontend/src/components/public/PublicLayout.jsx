import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import PageLoader from './PageLoader.jsx';
import { useGlobalLoading } from '../../hooks/useGlobalLoading';
import { getPending } from '../../api/cache';

export default function PublicLayout() {
  const pending = useGlobalLoading();
  const location = useLocation();

  // Hold the whole shell hidden until the first paint's data is ready, then
  // reveal header + content + footer together (zero layout shift). After that
  // first boot the shell stays mounted and later navigations render in place.
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    // Read the live counter, not the captured render value: child fetches start
    // in their own effects (which run before this one) so `pending` from render
    // can still be 0 here even though cold fetches are already in flight.
    if (!booted && getPending() === 0) setBooted(true);
  }, [pending, booted]);

  return (
    <>
      {/* Initial load only — in-app navigation is near-instant thanks to the cache
          and prefetching, so it doesn't get a full-screen takeover. */}
      <PageLoader active={!booted} />
      <div className={`public-shell ${booted ? 'is-ready' : ''}`}>
        <Header />
        <main style={{ paddingTop: 'var(--header-h)', minHeight: 'calc(100vh - var(--header-h) - 320px)' }}>
          <div key={location.pathname} className="route-fade">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
