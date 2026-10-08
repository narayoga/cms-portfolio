-- Sub-subcategory landing page (brand line): brand logo + key advantages
ALTER TABLE sub_subcategories ADD COLUMN brand_logo VARCHAR(500) NULL AFTER image_path;

CREATE TABLE IF NOT EXISTS sub_subcategory_advantages (
  id INT(11) NOT NULL AUTO_INCREMENT,
  sub_subcategory_id INT(11) NOT NULL,
  label VARCHAR(255) NOT NULL,
  sort_order SMALLINT(5) UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY sub_subcategory_id (sub_subcategory_id),
  CONSTRAINT fk_ssa_subsub FOREIGN KEY (sub_subcategory_id) REFERENCES sub_subcategories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
