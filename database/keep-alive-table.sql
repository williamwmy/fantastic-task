-- Keep-alive heartbeat table
-- This table is used by the GitHub Actions workflow to maintain database activity

CREATE TABLE IF NOT EXISTS keep_alive_pings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pinged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'github-actions'
);

-- Create an index for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_keep_alive_pings_pinged_at ON keep_alive_pings(pinged_at);

-- Optional: Add a policy to auto-delete old pings (keeps table small)
-- This will automatically delete pings older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_pings()
RETURNS void AS $$
BEGIN
  DELETE FROM keep_alive_pings WHERE pinged_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Note: You can manually run this cleanup function periodically if needed:
-- SELECT cleanup_old_pings();
