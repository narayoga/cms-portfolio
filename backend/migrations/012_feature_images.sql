-- Technical Feature images: newline-separated list of image paths.
-- When a feature has more than one image the frontend renders a carousel.
-- image_path is kept as the primary/cover (first image) for backward compatibility.
ALTER TABLE sub_subcategory_features ADD COLUMN images TEXT NULL AFTER image_path;
