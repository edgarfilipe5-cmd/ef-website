-- EF Coaching / Candidatura Nativa -- PROPOSTA, NAO EXECUTAR SEM APROVACAO.
-- Este ficheiro e apenas uma proposta de DDL guardada no ramo QA do website.
-- Nao foi aplicada nenhuma alteracao na base de dados de producao.

CREATE TABLE IF NOT EXISTS public.ef_website_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_key uuid NOT NULL UNIQUE,
    email text NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    goal text NOT NULL,
    situation text NOT NULL,
    experience text NOT NULL,
    frequency smallint NOT NULL CHECK (frequency BETWEEN 1 AND 7),
    environment text NOT NULL,
    start_when text,
    commitment text NOT NULL,
    notes text,
    origin text NOT NULL DEFAULT 'website-ef',
    submitted_on date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Lisbon')::date,
    ip_hash text NOT NULL,
    state text NOT NULL DEFAULT 'RECEIVED' CHECK (state IN ('RECEIVED','DUPLICATE','DELIVERED','DELIVERY_PENDING')),
    notion_page_id text,
    notion_synced_at timestamptz,
    email_notified_at timestamptz,
    last_delivery_error text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (email,submitted_on)
);
CREATE INDEX IF NOT EXISTS ef_website_applications_delivery_idx
  ON public.ef_website_applications(state,created_at);
CREATE TABLE IF NOT EXISTS public.ef_website_application_limits (
   ip_hash text NOT NULL,
   hour_start timestamptz NOT NULL,
   attempts integer NOT NULL DEFAULT 0,
   PRIMARY KEY (ip_hash,hour_start)
);
ALTER TABLE public.ef_website_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ef_website_application_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ef_website_applications FROM PUBLIC,anon,authenticated;
REVOKE ALL ON public.ef_website_application_limits FROM PUBLIC,anon,authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ef_website_applications TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.ef_website_application_limits TO service_role;

CREATE OR REPLACE FUNCTION public.ef_accept_website_application(
   p_payload jsonb,
   p_ip_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $$
DECLARE
   v_hour timestamptz := date_trunc('hour',now());
   v_attempts integer;
   v_id uuid;
   v_key uuid := (p_payload->>'submissionKey')::uuid;
   v_email text := lower(trim(p_payload->>'email'));
BEGIN
   IF length(v_email) < 6 OR length(v_email) > 180 OR length(p_ip_hash) <> 64 THEN
     RETURN jsonb_build_object('status','INVALID');
   END IF;
   INSERT INTO public.ef_website_application_limits(ip_hash,hour_start,attempts)
   VALUES(p_ip_hash,v_hour,1)
   ON CONFLICT (ip_hash,hour_start) DO UPDATE
     SET attempts = public.ef_website_application_limits.attempts + 1
   RETURNING attempts INTO v_attempts;
   IF v_attempts > 5 THEN
     RETURN jsonb_build_object('status','RATE_LIMIT');
   END IF;
   INSERT INTO public.ef_website_applications(
      submission_key,email,full_name,phone,goal,situation,experience,frequency,
      environment,start_when,commitment,notes,ip_hash
   ) VALUES (
      v_key,v_email,trim(p_payload->>'fullName'),trim(p_payload->>'phone'),
      p_payload->>'goal',p_payload->>'situation',p_payload->>'experience',
      (p_payload->>'frequency')::smallint,p_payload->>'environment',
      nullif(p_payload->>'startWhen',''),p_payload->>'commitment',
      nullif(p_payload->>'notes',''),p_ip_hash
   )
   ON CONFLICT DO NOTHING
   RETURNING id INTO v_id;
   IF v_id IS NULL THEN
     -- Pedido repetido: nao criar uma nova candidatura nem reenviar notificacao.
     RETURN jsonb_build_object('status','DUPLICATE');
   END IF;
   RETURN jsonb_build_object('status','CREATED','id',v_id);
END;
$$;
REVOKE ALL ON FUNCTION public.ef_accept_website_application(jsonb,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ef_accept_website_application(jsonb,text)
  TO service_role;

-- Operacao futura: criar rotina autorizada de reenvio para rows DELIVERY_PENDING.
-- Nao expor o backend de candidaturas ao anon/authenticated atraves de tabelas.
-- Antes de executar: rever politicas RGPD, contratos subprocessadores e backups.
