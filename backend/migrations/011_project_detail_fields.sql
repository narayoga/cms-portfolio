-- Project detail spec fields shown on the project detail page.
ALTER TABLE projects
  ADD COLUMN location   VARCHAR(190) NULL AFTER category,
  ADD COLUMN products   VARCHAR(190) NULL AFTER location,
  ADD COLUMN owner      VARCHAR(255) NULL AFTER products,
  ADD COLUMN architect  VARCHAR(190) NULL AFTER owner,
  ADD COLUMN contractor VARCHAR(190) NULL AFTER architect;
