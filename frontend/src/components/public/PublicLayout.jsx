import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function PublicLayout() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: 'var(--header-h)', minHeight: 'calc(100vh - var(--header-h) - 320px)' }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
