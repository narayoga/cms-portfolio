-- Download Center groups items into sections: 'catalogues' (Product Catalogues)
-- and 'manuals' (Product Manuals).
ALTER TABLE downloads ADD COLUMN section VARCHAR(32) NOT NULL DEFAULT 'catalogues' AFTER title;
