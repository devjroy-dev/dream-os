-- 0060_booking_contact.sql
-- Add contact_phone to couple_bookings so bride can store vendor's number
-- and call/WhatsApp directly from the Vendors room.

ALTER TABLE couple_bookings
  ADD COLUMN IF NOT EXISTS contact_phone text;

COMMENT ON COLUMN couple_bookings.contact_phone IS
  'Vendor contact phone — stored at booking time, used for in-app WA/call buttons';
