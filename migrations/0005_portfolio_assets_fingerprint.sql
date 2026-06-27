ALTER TABLE student_portfolios
ADD COLUMN fingerprint_traits TEXT NOT NULL DEFAULT '';

ALTER TABLE portfolio_projects
ADD COLUMN source_type TEXT NOT NULL DEFAULT 'link';

ALTER TABLE portfolio_projects
ADD COLUMN asset_key TEXT NOT NULL DEFAULT '';

ALTER TABLE portfolio_projects
ADD COLUMN file_type TEXT NOT NULL DEFAULT '';
