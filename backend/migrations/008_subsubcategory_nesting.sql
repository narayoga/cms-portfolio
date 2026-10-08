-- Allow sub-subcategories to nest one (or more) levels and to be either a
-- listing "group" or a leaf "product" page.
ALTER TABLE sub_subcategories
  ADD COLUMN parent_id INT(11) NULL AFTER subcategory_id,
  ADD COLUMN type ENUM('group','product') NOT NULL DEFAULT 'product' AFTER parent_id,
  ADD KEY idx_ss_parent (parent_id),
  ADD CONSTRAINT fk_ss_parent FOREIGN KEY (parent_id) REFERENCES sub_subcategories(id) ON DELETE CASCADE;

-- Door Closers + Floor Hinges brand nodes are listings that hold model children.
UPDATE sub_subcategories SET type = 'group' WHERE slug IN (
  'dormakaba-door-closer', 'tessa-assa-abloy-door-closer', 'calfis-door-closer',
  'dormakaba-floor-hinge', 'tessa-assa-abloy-floor-hinge', 'calfis-floor-hinge'
);
