-- Add phone contact on instructor profiles (used by demo instructor upsert + UI).

ALTER TABLE instructor_profiles
  ADD COLUMN phone VARCHAR(32) NULL AFTER specialties;
