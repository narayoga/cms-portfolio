import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

import PublicLayout from './components/public/PublicLayout.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import ProtectedRoute from './components/admin/ProtectedRoute.jsx';

import Home from './pages/public/Home.jsx';
import Services from './pages/public/Services.jsx';
import DownloadCenter from './pages/public/DownloadCenter.jsx';
import Contact from './pages/public/Contact.jsx';
import CategoryList from './pages/public/CategoryList.jsx';
import SubcategoryList from './pages/public/SubcategoryList.jsx';
import ProductList from './pages/public/ProductList.jsx';
import ProductDetail from './pages/public/ProductDetail.jsx';
import ProjectList from './pages/public/ProjectList.jsx';
import ProjectDetail from './pages/public/ProjectDetail.jsx';
import PublicationList from './pages/public/PublicationList.jsx';
import PublicationDetail from './pages/public/PublicationDetail.jsx';
import NotFound from './pages/public/NotFound.jsx';

import Login from './pages/admin/Login.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Users from './pages/admin/Users.jsx';
import Categories from './pages/admin/Categories.jsx';
import Subcategories from './pages/admin/Subcategories.jsx';
import Products from './pages/admin/Products.jsx';
import Projects from './pages/admin/Projects.jsx';
import Publications from './pages/admin/Publications.jsx';
import Downloads from './pages/admin/Downloads.jsx';
import ServicePage from './pages/admin/ServicePage.jsx';
import Banners from './pages/admin/Banners.jsx';
import NavMenus from './pages/admin/NavMenus.jsx';
import Settings from './pages/admin/Settings.jsx';

import { api } from './api/client';
import { initGA, trackPageview } from './utils/ga';

export default function App() {
  const location = useLocation();
  const [gaId, setGaId] = useState(null);

  useEffect(() => {
    api.get('/public/settings')
      .then(s => { if (s?.ga_id) { setGaId(s.ga_id); initGA(s.ga_id); } })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (gaId) trackPageview(location.pathname);
    window.scrollTo(0, 0);
  }, [location.pathname, gaId]);

  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/categories" element={<Categories />} />
          <Route path="/admin/subcategories" element={<Subcategories />} />
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
        <Route path="/products/:catSlug" element={<SubcategoryList />} />
        <Route path="/products/:catSlug/:subSlug" element={<ProductList />} />
        <Route path="/products/:catSlug/:subSlug/:prodSlug" element={<ProductDetail />} />

        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />

        <Route path="/publications" element={<PublicationList />} />
        <Route path="/publications/:slug" element={<PublicationDetail />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
