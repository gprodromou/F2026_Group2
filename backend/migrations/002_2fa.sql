-- 002_2fa.sql
-- This file adds 2FA (login with a code from your phone) to the users table.
-- It adds 2 new columns:
--   totp_secret  = the user's secret key (their phone app uses it to make the codes)
--   totp_enabled = is 2FA on? 0 = no, 1 = yes
ALTER TABLE users
ADD COLUMN totp_secret TEXT;
ALTER TABLE users
ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0;