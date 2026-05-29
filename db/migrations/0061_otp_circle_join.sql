-- 0061_otp_circle_join.sql
-- Allow 'circle_join' as an otp_sessions.purpose value.
--
-- The circle invite → co-planner join flow (src/api/circle/join.js) sends an
-- invite-scoped OTP to a brand-new invitee phone. It uses purpose='circle_join'
-- so a join code can never be mistaken for a login/reset code at verify time.
--
-- Prior constraint (0057): purpose in ('login', 'reset', 'demo_enquiry').

alter table otp_sessions
  drop constraint if exists otp_sessions_purpose_check;

alter table otp_sessions
  add constraint otp_sessions_purpose_check
  check (purpose in ('login', 'reset', 'demo_enquiry', 'circle_join'));
