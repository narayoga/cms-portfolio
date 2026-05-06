<?php
declare(strict_types=1);

namespace App\controllers;

use App\Db;
use App\Response;

class PublicController
{
    public function homepage(): void
    {
        $banners = Db::all(
            'SELECT id, image_path, title, subtitle, link FROM homepage_banners WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
        );
        $featuredCategories = Db::all(
            'SELECT id, name, slug, image_path, description FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC LIMIT 8'
        );
        $marqueeProjects = Db::all(
            'SELECT id, title, slug, cover_image FROM projects WHERE is_active = 1 ORDER BY published_at DESC, id DESC LIMIT 20'
        );
        $storyMilestones = Db::all(
            'SELECT id, year, content_text, image_url FROM story_milestones ORDER BY sort_order ASC, year ASC'
        );
        $partnerBrands = Db::all(
            'SELECT id, name, logo_path FROM partner_brands WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
        );

        // Homepage-specific site settings
        $settingKeys = [
            'homepage_services_headline',
            'homepage_services_subtext',
            'homepage_services_image',
            'homepage_marquee_headline',
            'homepage_about_logo',
            'homepage_about_text',
            'homepage_about_headline_prefix',
            'homepage_about_headline_words',
            'homepage_partners_title',
        ];
        $rows = Db::all('SELECT `key`, `value` FROM site_settings WHERE `key` IN (' . implode(',', array_fill(0, count($settingKeys), '?')) . ')', $settingKeys);
        $homepageSettings = [];
        foreach ($rows as $r) {
            $homepageSettings[$r['key']] = $r['value'];
        }

        Response::ok(compact('banners', 'featuredCategories', 'marqueeProjects', 'storyMilestones', 'partnerBrands', 'homepageSettings'));
    }

    public function categories(): void
    {
        $rows = Db::all('SELECT id, name, slug, image_path, description FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC');
        Response::ok($rows);
    }

    public function categoryDetail(array $p): void
    {
        $cat = Db::one('SELECT id, name, slug, image_path, description FROM categories WHERE slug = ? AND is_active = 1', [$p['slug']]);
        if (!$cat) Response::error('Not found', 404);
        $cat['subcategories'] = Db::all(
            'SELECT id, name, slug, image_path, description FROM subcategories WHERE category_id = ? AND is_active = 1 ORDER BY sort_order ASC, id ASC',
            [$cat['id']]
        );
        Response::ok($cat);
    }

    public function subcategoryDetail(array $p): void
    {
        $row = Db::one(
            'SELECT s.id, s.name, s.slug, s.image_path, s.description, c.name AS category_name, c.slug AS category_slug
             FROM subcategories s JOIN categories c ON c.id = s.category_id
             WHERE s.slug = ? AND c.slug = ? AND s.is_active = 1 AND c.is_active = 1',
            [$p['subSlug'], $p['catSlug']]
        );
        if (!$row) Response::error('Not found', 404);
        $row['products'] = Db::all(
            'SELECT id, name, slug, short_desc, cover_image FROM products WHERE subcategory_id = ? AND is_active = 1 ORDER BY sort_order ASC, id ASC',
            [$row['id']]
        );
        Response::ok($row);
    }

    public function productDetail(array $p): void
    {
        $row = Db::one(
            'SELECT pr.*, s.name AS subcategory_name, s.slug AS subcategory_slug, c.name AS category_name, c.slug AS category_slug
             FROM products pr
             JOIN subcategories s ON s.id = pr.subcategory_id
             JOIN categories c ON c.id = s.category_id
             WHERE pr.slug = ? AND s.slug = ? AND c.slug = ?
               AND pr.is_active = 1 AND s.is_active = 1 AND c.is_active = 1',
            [$p['prodSlug'], $p['subSlug'], $p['catSlug']]
        );
        if (!$row) Response::error('Not found', 404);
        $row['images'] = Db::all('SELECT image_path FROM product_images WHERE product_id = ? ORDER BY sort_order, id', [$row['id']]);
        Response::ok($row);
    }

    public function projects(): void
    {
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int) ($_GET['limit'] ?? 12)));
        $offset = ($page - 1) * $limit;
        $items = Db::all(
            'SELECT id, title, slug, cover_image, published_at FROM projects WHERE is_active = 1 ORDER BY published_at DESC, id DESC LIMIT ' . $limit . ' OFFSET ' . $offset
        );
        $total = (int) (Db::one('SELECT COUNT(*) AS c FROM projects WHERE is_active = 1')['c'] ?? 0);
        Response::ok(compact('items', 'total', 'page', 'limit'));
    }

    public function projectDetail(array $p): void
    {
        $row = Db::one('SELECT * FROM projects WHERE slug = ? AND is_active = 1', [$p['slug']]);
        if (!$row) Response::error('Not found', 404);
        Response::ok($row);
    }

    public function publications(): void
    {
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int) ($_GET['limit'] ?? 12)));
        $offset = ($page - 1) * $limit;
        $items = Db::all(
            'SELECT id, title, slug, cover_image, published_at FROM publications WHERE is_active = 1 ORDER BY published_at DESC, id DESC LIMIT ' . $limit . ' OFFSET ' . $offset
        );
        $total = (int) (Db::one('SELECT COUNT(*) AS c FROM publications WHERE is_active = 1')['c'] ?? 0);
        Response::ok(compact('items', 'total', 'page', 'limit'));
    }

    public function publicationDetail(array $p): void
    {
        $row = Db::one('SELECT * FROM publications WHERE slug = ? AND is_active = 1', [$p['slug']]);
        if (!$row) Response::error('Not found', 404);
        Response::ok($row);
    }

    public function downloads(): void
    {
        $rows = Db::all('SELECT id, title, description, image_path, file_path FROM downloads WHERE is_active = 1 ORDER BY sort_order ASC, id DESC');
        Response::ok($rows);
    }

    public function service(): void
    {
        $row = Db::one('SELECT content_html, hero_image FROM services_page WHERE id = 1');
        Response::ok($row ?: ['content_html' => '', 'hero_image' => null]);
    }

    public function settings(): void
    {
        $allowed = ['site_name', 'contact_email', 'contact_phone', 'contact_address', 'ga_id', 'social_facebook', 'social_instagram', 'social_linkedin'];
        $rows = Db::all('SELECT `key`, `value` FROM site_settings');
        $out = [];
        foreach ($rows as $r) {
            if (in_array($r['key'], $allowed, true)) $out[$r['key']] = $r['value'];
        }
        Response::ok($out);
    }

    public function navMenus(): void
    {
        $rows = Db::all(
            'SELECT id, location, label, url, sort_order FROM nav_menus WHERE is_active = 1 ORDER BY location ASC, sort_order ASC'
        );

        // Group by location
        $out = [
            'header'           => [],
            'footer_explore'   => [],
            'footer_resources' => [],
        ];
        foreach ($rows as $r) {
            $loc = $r['location'];
            if (array_key_exists($loc, $out)) {
                $out[$loc][] = ['id' => (int)$r['id'], 'label' => $r['label'], 'url' => $r['url']];
            }
        }
        Response::ok($out);
    }
}
