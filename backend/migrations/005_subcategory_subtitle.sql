-- Add a hero subtitle to subcategories (shown under the title on the subcategory page)
ALTER TABLE subcategories ADD COLUMN subtitle VARCHAR(255) NULL AFTER name;
