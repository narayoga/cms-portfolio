import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import Lenis from 'lenis';

import PublicLayout from './components/public/PublicLayout.jsx';
import ProtectedRoute from './components/admin/ProtectedRoute.jsx';

import Home from './pages/public/Home.jsx';
import Services from './pages/public/Services.jsx';
import DownloadCenter from './pages/public/DownloadCenter.jsx';
import Contact from './pages/public/Contact.jsx';
import CategoryList from './pages/public/CategoryList.jsx';
import CategoryRedirect from './pages/public/CategoryRedirect.jsx';
import SubcategoryList from './pages/public/SubcategoryList.jsx';
import ProductList from './pages/public/ProductList.jsx';
import ProductLeaf from './pages/public/ProductLeaf.jsx';
import ProjectList from './pages/public/ProjectList.jsx';
import ProjectDetail from './pages/public/ProjectDetail.jsx';
import PublicationList from './pages/public/PublicationList.jsx';
import PublicationDetail from './pages/public/PublicationDetail.jsx';
import NotFound from './pages/public/NotFound.jsx';

// Admin pages are lazy-loaded so public visitors never download the admin
// panel (pages, editor components, admin.css). Chunks load on first /admin visit.
const AdminLayout = lazy(() => import('./components/admin/AdminLayout.jsx'));
const Login = lazy(() => import('./pages/admin/Login.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const Users = lazy(() => import('./pages/admin/Users.jsx'));
const Categories = lazy(() => import('./pages/admin/Categories.jsx'));
const Subcategories = lazy(() => import('./pages/admin/Subcategories.jsx'));
const CatalogItems = lazy(() => import('./pages/admin/CatalogItems.jsx'));
const Products = lazy(() => import('./pages/admin/Products.jsx'));
const Projects = lazy(() => import('./pages/admin/Projects.jsx'));
const Publications = lazy(() => import('./pages/admin/Publications.jsx'));
const Downloads = lazy(() => import('./pages/admin/Downloads.jsx'));
const ServicePage = lazy(() => import('./pages/admin/ServicePage.jsx'));
const Banners = lazy(() => import('./pages/admin/Banners.jsx'));
const NavMenus = lazy(() => import('./pages/admin/NavMenus.jsx'));
const Settings = lazy(() => import('./pages/admin/Settings.jsx'));

import { cachedGet } from './api/cache';
import { initGA, trackPageview } from './utils/ga';

export default function App() {
  const location = useLocation();
  const [gaId, setGaId] = useState(null);
  const lenisRef = useRef(null);

  // Global smooth (momentum) scrolling on every page.
  useEffect(() => {
    const lenis = new Lenis();
    lenisRef.current = lenis;
    let rafId;
    const raf = (time) => { lenis.raf(time); rafId = requestAnimationFrame(raf); };
    rafId = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(rafId); lenis.destroy(); lenisRef.current = null; };
  }, []);

  useEffect(() => {
    cachedGet('/public/settings')
      .then(s => { if (s?.ga_id) { setGaId(s.ga_id); initGA(s.ga_id); } })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (gaId) trackPageview(location.pathname);
    // Jump to top on route change (immediate, so Lenis state stays in sync).
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [location.pathname, gaId]);

  return (
    <Suspense fallback={<div className="spinner" />}>
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/categories" element={<Categories />} />
          <Route path="/admin/subcategories" element={<Subcategories />} />
          <Route path="/admin/catalog-items" element={<CatalogItems />} />
          <Route path="/admin/products" element={<Products />} />
          <Route path="/admin/projects" element={<Projects />} />
          <Route path="/admin/publications" element={<Publications />} />
          <Route path="/admin/downloads" element={<Downloads />} />
          <Route path="/admin/service" element={<ServicePage />} />
          <Route path="/admin/banners" element={<Banners />} />
          <Route path="/admin/nav-menus" element={<NavMenus />} />
          <Route path="/admin/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/download-center" element={<DownloadCenter />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/products" element={<CategoryList />} />
        <Route path="/products/:catSlug" element={<CategoryRedirect />} />
        <Route path="/products/:catSlug/:subSlug" element={<SubcategoryList />} />
        <Route path="/products/:catSlug/:subSlug/:subSubSlug" element={<ProductList />} />
        <Route path="/products/:catSlug/:subSlug/:subSubSlug/:leafSlug" element={<ProductLeaf />} />

        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />

        <Route path="/publications" element={<PublicationList />} />
        <Route path="/publications/:slug" element={<PublicationDetail />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </Suspense>
  );
}
