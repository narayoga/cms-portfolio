-- Migration 004: sub_subcategories table
-- Level 3 in catalog taxonomy: Category > Subcategory > Sub-subcategory > Product

CREATE TABLE IF NOT EXISTS sub_subcategories (
    id            INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    subcategory_id INT(11) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    slug          VARCHAR(255) NOT NULL,
    description   TEXT,
    image_path    VARCHAR(500),
    sort_order    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    is_active     TINYINT(1) NOT NULL DEFAULT 1,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE,
    UNIQUE KEY uq_subsub_slug (subcategory_id, slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
