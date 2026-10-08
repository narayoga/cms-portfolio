-- Projects get a category/tag (e.g. "Governmental Building", "Shopping Center")
-- shown on the project card.
ALTER TABLE projects ADD COLUMN category VARCHAR(120) NULL AFTER title;
