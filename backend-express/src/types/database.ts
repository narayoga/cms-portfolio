/**
 * The shape of one row in each database table.
 * Dates are strings ("2026-10-08" / "2026-10-08 13:45:00") because the
 * database connection uses dateStrings: true.
 */

export type UserRow = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'editor';
  created_at: string;
  updated_at: string;
};

export type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type SubcategoryRow = {
  id: number;
  category_id: number;
  name: string;
  subtitle: string | null;
  slug: string;
  description: string | null;
  image_path: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type SubSubcategoryRow = {
  id: number;
  subcategory_id: number;
  parent_id: number | null;
  type: 'group' | 'product';
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  brand_logo: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
};

export type SubSubcategoryFeatureRow = {
  id: number;
  sub_subcategory_id: number;
  title: string;
  image_path: string | null;
  images: string | null; // image paths separated by new lines
  description: string | null;
  sort_order: number;
  created_at: string;
};

export type ProductRow = {
  id: number;
  subcategory_id: number;
  name: string;
  slug: string;
  short_desc: string | null;
  content_html: string | null;
  cover_image: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type ProjectRow = {
  id: number;
  title: string;
  category: string | null;
  location: string | null;
  products: string | null;
  owner: string | null;
  architect: string | null;
  contractor: string | null;
  slug: string;
  cover_image: string | null;
  content_html: string | null;
  published_at: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type PublicationRow = {
  id: number;
  title: string;
  slug: string;
  cover_image: string | null;
  content_html: string | null;
  published_at: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type DownloadRow = {
  id: number;
  title: string;
  section: string;
  description: string | null;
  image_path: string | null;
  file_path: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type BannerRow = {
  id: number;
  image_path: string;
  title: string | null;
  subtitle: string | null;
  link: string | null;
  sort_order: number;
  is_active: number;
};

export type NavMenuRow = {
  id: number;
  location: 'header' | 'footer_explore' | 'footer_resources';
  label: string;
  url: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type SettingRow = {
  key: string;
  value: string | null;
};
