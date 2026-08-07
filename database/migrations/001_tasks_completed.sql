-- Safe for new and existing databases. Applied by the compose migrate service.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES users(id);
