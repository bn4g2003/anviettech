-- Makes a retried create request return its original stock move instead of creating another one.
ALTER TABLE stock_moves ADD COLUMN IF NOT EXISTS request_id uuid;
ALTER TABLE stock_moves ADD COLUMN IF NOT EXISTS request_hash varchar(64);

CREATE UNIQUE INDEX IF NOT EXISTS stock_moves_owner_request_id_unique
  ON stock_moves(owner_id, request_id)
  WHERE request_id IS NOT NULL AND deleted_at IS NULL;
