-- ============================================================
-- RLS Policies for Sorteum
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- 1. RAFFLES TABLE
-- ============================================================
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;

-- Anyone can read raffles (public listing)
CREATE POLICY "Allow public read raffles"
ON raffles FOR SELECT
TO anon, authenticated
USING (true);

-- Only authenticated users can create raffles (sets admin_id to their user)
CREATE POLICY "Allow authenticated insert raffles"
ON raffles FOR INSERT
TO authenticated
WITH CHECK (admin_id = auth.uid());

-- Only the raffle owner can update their raffles
CREATE POLICY "Allow owner update raffles"
ON raffles FOR UPDATE
TO authenticated
USING (admin_id = auth.uid())
WITH CHECK (admin_id = auth.uid());

-- Only the raffle owner can delete their raffles
CREATE POLICY "Allow owner delete raffles"
ON raffles FOR DELETE
TO authenticated
USING (admin_id = auth.uid());

-- ============================================================
-- 2. TICKETS TABLE
-- ============================================================
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Anyone can read tickets (public grid, status check)
CREATE POLICY "Allow public read tickets"
ON tickets FOR SELECT
TO anon, authenticated
USING (true);

-- Anonymous users can ONLY reserve available tickets
CREATE POLICY "Allow anon reserve available tickets"
ON tickets FOR UPDATE
TO anon
USING (status = 'available')
WITH CHECK (status = 'reserved');

-- Authenticated users can update any ticket (confirm payment, release, mark winner)
CREATE POLICY "Allow authenticated update tickets"
ON tickets FOR UPDATE
TO authenticated
USING (true);

-- Only authenticated users can insert tickets (pg_cron runs as authenticated via service role)
CREATE POLICY "Allow authenticated insert tickets"
ON tickets FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only authenticated users can delete tickets
CREATE POLICY "Allow authenticated delete tickets"
ON tickets FOR DELETE
TO authenticated
USING (true);

-- ============================================================
-- 3. FAQS TABLE
-- ============================================================
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Anyone can read FAQs (public page)
CREATE POLICY "Allow public read faqs"
ON faqs FOR SELECT
TO anon, authenticated
USING (true);

-- Only authenticated users can create FAQs
CREATE POLICY "Allow authenticated insert faqs"
ON faqs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only authenticated users can update FAQs
CREATE POLICY "Allow authenticated update faqs"
ON faqs FOR UPDATE
TO authenticated
USING (true);

-- Only authenticated users can delete FAQs
CREATE POLICY "Allow authenticated delete faqs"
ON faqs FOR DELETE
TO authenticated
USING (true);

-- ============================================================
-- 4. PAYMENT METHODS TABLE
-- ============================================================
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Anyone can read payment methods (shown on public raffle page)
CREATE POLICY "Allow public read payment_methods"
ON payment_methods FOR SELECT
TO anon, authenticated
USING (true);

-- Only authenticated users can create payment methods
CREATE POLICY "Allow authenticated insert payment_methods"
ON payment_methods FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only authenticated users can update payment methods
CREATE POLICY "Allow authenticated update payment_methods"
ON payment_methods FOR UPDATE
TO authenticated
USING (true);

-- Only authenticated users can delete payment methods
CREATE POLICY "Allow authenticated delete payment_methods"
ON payment_methods FOR DELETE
TO authenticated
USING (true);

-- ============================================================
-- 5. SETTINGS TABLE (already has some policies, add missing ones)
-- ============================================================
-- Existing policies:
--   "Allow authenticated read" FOR SELECT TO authenticated
--   "Allow authenticated update" FOR UPDATE TO authenticated
--   "Allow anon read" FOR SELECT TO anon
--
-- No INSERT or DELETE needed (single-row pattern with constraint)
-- No changes required for settings table.

-- ============================================================
-- 6. GRANT EXECUTE on RPC functions to correct roles
-- ============================================================

-- draw_random_winners: only authenticated (admin draws winners)
REVOKE EXECUTE ON FUNCTION draw_random_winners FROM anon;
GRANT EXECUTE ON FUNCTION draw_random_winners TO authenticated;

-- get_random_available_tickets: both anon and authenticated (public quick select)
GRANT EXECUTE ON FUNCTION get_random_available_tickets TO anon, authenticated;

-- process_pending_raffle_tickets: only for pg_cron (runs as postgres/service role)
REVOKE EXECUTE ON FUNCTION process_pending_raffle_tickets FROM anon, authenticated;

-- release_expired_reservations: only for pg_cron
REVOKE EXECUTE ON FUNCTION release_expired_reservations FROM anon, authenticated;

-- deactivate_expired_raffles: only for pg_cron
REVOKE EXECUTE ON FUNCTION deactivate_expired_raffles FROM anon, authenticated;
