-- Migration 003: Story milestones + partner brands tables
-- Run AFTER 001_init.sql

CREATE TABLE IF NOT EXISTS story_milestones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  year        VARCHAR(10)  NOT NULL,
  content_text TEXT        NOT NULL,
  image_url   VARCHAR(500) DEFAULT NULL,
  sort_order  INT          DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS partner_brands (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  logo_path   VARCHAR(500) DEFAULT NULL,
  sort_order  INT          DEFAULT 0,
  is_active   TINYINT(1)   DEFAULT 1,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
