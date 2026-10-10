-- EF Candidate recovery infrastructure — SAFE STAGED MIGRATION
-- Apply only after review and deploy production endpoint. Does not edit existing customers.
-- Existing QA candidates stay unchanged. Retry is not activated until cron job created separately.

ALTER TABLE public.ef_website_applications
  ADD COLUMN IF NOT EXISTS retry_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS processing_until timestamptz;
ALTER TABLE public.ef_website_applications
  DROP CONSTRAINT IF EXISTS ef_website_applications_state_check;
ALTER TABLE public.ef_website_applications
  ADD CONSTRAINT ef_website_applications_state_check
  CHECK (state IN ('RECEIVED','PROCESSING','DELIVERED','DELIVERY_PENDING'));

CREATE INDEX IF NOT EXISTS ef_website_applications_retry_idx
 ON public.ef_website_applications(next_retry_at,created_at)
 WHERE state IN ('RECEIVED','PROCESSING','DELIVERY_PENDING');

CREATE OR REPLACE FUNCTION public.ef_claim_website_application(p_id uuid)
RETURNS SETOF public.ef_website_applications
LANGUAGE sql SECURITY INVOKER SET search_path=''
AS $func$
 UPDATE public.ef_website_applications
 SET state='PROCESSING',
     processing_until=now()+interval '2 minutes',
     retry_attempts=retry_attempts+1
 WHERE id=p_id AND retry_attempts<12
   AND ( (state IN ('RECEIVED','DELIVERY_PENDING') AND next_retry_at<=now())
      OR (state='PROCESSING' AND processing_until<now()) )
 RETURNING *;
$func$;
REVOKE ALL ON FUNCTION public.ef_claim_website_application(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ef_claim_website_application(uuid) TO service_role;

-- Secure scheduler authenticator. No user token or Supabase service key embedded in scheduled SQL.
CREATE SCHEMA IF NOT EXISTS ef_internal;
REVOKE ALL ON SCHEMA ef_internal FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA ef_internal TO service_role;
CREATE TABLE IF NOT EXISTS ef_internal.retry_auth (
 singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
 secret text NOT NULL CHECK(length(secret)>=64),
 created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO ef_internal.retry_auth(singleton,secret)
VALUES(true,encode(gen_random_bytes(32),'hex'))
ON CONFLICT(singleton) DO NOTHING;
REVOKE ALL ON ef_internal.retry_auth FROM PUBLIC,anon,authenticated;
GRANT SELECT ON ef_internal.retry_auth TO service_role;
ALTER TABLE ef_internal.retry_auth ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.ef_verify_website_retry_token(p_token text)
RETURNS boolean
LANGUAGE sql SECURITY INVOKER SET search_path=''
AS $func$
 SELECT coalesce(
  (SELECT secret=p_token FROM ef_internal.retry_auth WHERE singleton=true),
  false
 );
$func$;
REVOKE ALL ON FUNCTION public.ef_verify_website_retry_token(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ef_verify_website_retry_token(text) TO service_role;

-- Scheduler activation (after successful QA & preview review):
-- CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
-- CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
-- SELECT cron.schedule('ef-candidatura-pending-retry','*/15 * * * *',
-- $job$
--   SELECT net.http_post(
--     url:='https://twbriibfrrfcrksnsypd.supabase.co/functions/v1/ef-website-candidatura/retry',
--     headers:=jsonb_build_object('Content-Type','application/json',
--       'x-ef-retry-token',(SELECT secret FROM ef_internal.retry_auth WHERE singleton)),
--     body:='{}'::jsonb,
--     timeout_milliseconds:=18000
--   );
-- $job$);
-- Never schedule before function is tested. Cron does not delete or change customer records.
