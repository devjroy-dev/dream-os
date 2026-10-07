-- 0198 · CE-47 · HUB-1 · COLLAB HUB AS THE TRADE'S WORK EXCHANGE: one page for everyone, and "Worked with".
-- Rulings (CE-47, 6 October 2026): one public page at /c/<handle> for a vendor, an organisation or a person;
-- "Worked with" credits shown only after the named person's own yes, from a TDW call or from "a shoot we did
-- together" (city, month), each takeable back by either side; no feed, likes, followers or chat. Additive.
BEGIN;

CREATE TABLE IF NOT EXISTS public.hub_profiles (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_kind       text        NOT NULL CHECK (owner_kind IN ('vendor', 'org', 'person')),
  vendor_id        uuid        NULL UNIQUE REFERENCES public.vendors(id) ON DELETE CASCADE,
  org_id           uuid        NULL UNIQUE REFERENCES public.partner_orgs(id) ON DELETE CASCADE,
  user_id          uuid        NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  handle           text        NOT NULL CHECK (handle ~ '^[a-z0-9._]{1,30}$'),
  display_name     text        NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 120),
  roles            text[]      NOT NULL DEFAULT '{}',
  city             text        NULL,
  open_to          text[]      NOT NULL DEFAULT '{}' CHECK (open_to <@ ARRAY['paid', 'barter', 'credit_only']::text[]),
  instagram_handle text        NULL CHECK (instagram_handle IS NULL OR instagram_handle ~ '^[A-Za-z0-9._]{1,30}$'),
  website          text        NULL CHECK (website IS NULL OR website ~* '^https?://[^\s/$.?#][^\s]*$'),
  work_urls        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  check_state      text        NOT NULL DEFAULT 'unchecked' CHECK (check_state IN ('unchecked', 'checked')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hub_profiles_one_owner CHECK (
    (owner_kind = 'vendor' AND vendor_id IS NOT NULL AND org_id IS NULL AND user_id IS NULL)
    OR (owner_kind = 'org' AND org_id IS NOT NULL AND vendor_id IS NULL AND user_id IS NULL)
    OR (owner_kind = 'person' AND user_id IS NOT NULL AND vendor_id IS NULL AND org_id IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS hub_profiles_handle_once ON public.hub_profiles (lower(handle));
CREATE INDEX IF NOT EXISTS hub_profiles_city_idx ON public.hub_profiles (lower(city));
ALTER TABLE public.hub_profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_profiles TO service_role;   -- after 0170 the server reads and writes only by grant

-- A credit from a TDW call (call_id) or from "a shoot we did together" (shoot_name, city, month). Shown nowhere
-- until state = 'yes'. Either side may take it back ('taken_back'); it then leaves both pages.
CREATE TABLE IF NOT EXISTS public.hub_credits (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id           uuid        NULL REFERENCES public.collab_posts(id) ON DELETE CASCADE,
  shoot_name        text        NULL CHECK (shoot_name IS NULL OR char_length(btrim(shoot_name)) BETWEEN 1 AND 80),
  city              text        NULL,
  month             date        NULL CHECK (month IS NULL OR extract(day FROM month) = 1),
  giver_profile_id  uuid        NOT NULL REFERENCES public.hub_profiles(id) ON DELETE CASCADE,
  person_profile_id uuid        NOT NULL REFERENCES public.hub_profiles(id) ON DELETE CASCADE,
  state             text        NOT NULL DEFAULT 'offered' CHECK (state IN ('offered', 'yes', 'no', 'taken_back')),
  offered_at        timestamptz NOT NULL DEFAULT now(),
  decided_at        timestamptz NULL,
  taken_back_at     timestamptz NULL,
  taken_back_by     uuid        NULL REFERENCES public.hub_profiles(id) ON DELETE SET NULL,
  CONSTRAINT hub_credits_kind CHECK (call_id IS NOT NULL OR (shoot_name IS NOT NULL AND city IS NOT NULL AND month IS NOT NULL)),
  CONSTRAINT hub_credits_not_self CHECK (giver_profile_id <> person_profile_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS hub_credits_call_once ON public.hub_credits (call_id, person_profile_id) WHERE call_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS hub_credits_shoot_once ON public.hub_credits (giver_profile_id, person_profile_id, lower(shoot_name), month) WHERE call_id IS NULL;
CREATE INDEX IF NOT EXISTS hub_credits_person_idx ON public.hub_credits (person_profile_id, state);
CREATE INDEX IF NOT EXISTS hub_credits_giver_idx ON public.hub_credits (giver_profile_id, state, offered_at DESC);
ALTER TABLE public.hub_credits ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_credits TO service_role;   -- after 0170 the server reads and writes only by grant

COMMIT;
