-- Migration: Settings table + automatic reservation expiration
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Settings table (single-row pattern)
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_duration_minutes integer NOT NULL DEFAULT 15,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO settings (reservation_duration_minutes) VALUES (15);

-- Constraint to ensure only 1 row exists
CREATE UNIQUE INDEX settings_single_row ON settings ((true));

-- RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated update" ON settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow anon read" ON settings FOR SELECT TO anon USING (true);

-- 2. Add tickets_created column to raffles (tracks batch ticket creation progress)
ALTER TABLE raffles ADD COLUMN IF NOT EXISTS tickets_created integer NOT NULL DEFAULT 0;

-- 3. Function to process pending raffle tickets in batches (called by pg_cron every minute)
CREATE OR REPLACE FUNCTION process_pending_raffle_tickets()
RETURNS void
LANGUAGE plpgsql
SET statement_timeout = '120s'
AS $$
DECLARE
  r record;
  batch_size integer := 500000;
  current_created integer;
  new_end integer;
BEGIN
  FOR r IN
    SELECT id, total_tickets, tickets_created
    FROM raffles
    WHERE tickets_created < total_tickets
    ORDER BY created_at ASC
    LIMIT 1
  LOOP
    current_created := r.tickets_created;
    new_end := LEAST(current_created + batch_size, r.total_tickets);

    INSERT INTO tickets (raffle_id, ticket_number, status)
    SELECT r.id, gs, 'available'
    FROM generate_series(current_created + 1, new_end) AS gs;

    UPDATE raffles
    SET tickets_created = new_end,
        is_active = CASE
          WHEN new_end >= total_tickets AND end_date > now() THEN true
          ELSE is_active
        END
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- 4. Function to release expired reservations
CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  released_count integer;
BEGIN
  UPDATE tickets
  SET status = 'available',
      purchaser_name = NULL,
      purchaser_email = NULL,
      purchaser_phone_number = NULL,
      purchase_date = NULL,
      reservation_expires_at = NULL,
      is_winner = false
  WHERE status = 'reserved'
    AND reservation_expires_at < now();

  GET DIAGNOSTICS released_count = ROW_COUNT;
  RETURN released_count;
END;
$$;

-- 3. Function to deactivate expired raffles
CREATE OR REPLACE FUNCTION deactivate_expired_raffles()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deactivated_count integer;
BEGIN
  UPDATE raffles
  SET is_active = false
  WHERE is_active = true
    AND end_date < now();

  GET DIAGNOSTICS deactivated_count = ROW_COUNT;
  RETURN deactivated_count;
END;
$$;

-- 7. pg_cron jobs (run every minute)
-- NOTE: pg_cron must be enabled first in Supabase Dashboard > Database > Extensions
SELECT cron.schedule(
  'process-pending-raffle-tickets',
  '* * * * *',
  $$ SELECT process_pending_raffle_tickets(); $$
);

SELECT cron.schedule(
  'release-expired-reservations',
  '* * * * *',
  $$ SELECT release_expired_reservations(); $$
);

SELECT cron.schedule(
  'deactivate-expired-raffles',
  '* * * * *',
  $$ SELECT deactivate_expired_raffles(); $$
);
