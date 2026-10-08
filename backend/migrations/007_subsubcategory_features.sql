-- Technical Features for a sub-subcategory (brand line):
-- each row = one feature block (title + image + description/bullets)
CREATE TABLE IF NOT EXISTS sub_subcategory_features (
  id INT(11) NOT NULL AUTO_INCREMENT,
  sub_subcategory_id INT(11) NOT NULL,
  title VARCHAR(255) NOT NULL,
  image_path VARCHAR(500) NULL,
  description TEXT NULL,            -- newline-separated lines render as a bullet list
  sort_order SMALLINT(5) UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY sub_subcategory_id (sub_subcategory_id),
  CONSTRAINT fk_ssf_subsub FOREIGN KEY (sub_subcategory_id) REFERENCES sub_subcategories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
