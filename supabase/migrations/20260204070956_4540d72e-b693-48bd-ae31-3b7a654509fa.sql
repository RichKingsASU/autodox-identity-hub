-- Add new layout types to the landing_base_layout enum
ALTER TYPE landing_base_layout ADD VALUE IF NOT EXISTS 'koala_sign';
ALTER TYPE landing_base_layout ADD VALUE IF NOT EXISTS 'redline_delivery';