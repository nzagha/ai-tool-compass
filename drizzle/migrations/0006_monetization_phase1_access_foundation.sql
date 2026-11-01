-- Phase 1: identity vs capability vs Tool ownership. No pricing, billing or payment objects.
-- New signups never become admin automatically.
CREATE OR REPLACE FUNCTION public.create_user_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 INSERT INTO public.profiles(id,display_name) VALUES(NEW.id,coalesce(NEW.raw_user_meta_data->>'display_name',''));
 INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'user') ON CONFLICT DO NOTHING;
 RETURN NEW; END $$;

CREATE TABLE public.user_capabilities (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capability text NOT NULL CHECK (capability IN ('approved_creator')),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, capability)
);
GRANT SELECT ON public.user_capabilities TO authenticated;
GRANT ALL ON public.user_capabilities TO service_role;
ALTER TABLE public.user_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_own_capabilities ON public.user_capabilities FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Canonical single current owner per Tool (tool_slug is the Lovable Tool identifier).
CREATE TABLE public.vendor_access (
  tool_slug text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_id uuid REFERENCES public.directory_records(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vendor_access_user ON public.vendor_access(user_id);
GRANT SELECT ON public.vendor_access TO authenticated;
GRANT ALL ON public.vendor_access TO service_role;
ALTER TABLE public.vendor_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_own_vendor_access ON public.vendor_access FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.creator_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pitch text NOT NULL CHECK (char_length(pitch) BETWEEN 20 AND 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  review_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE UNIQUE INDEX creator_applications_one_pending ON public.creator_applications(user_id) WHERE status = 'pending';
GRANT SELECT ON public.creator_applications TO authenticated;
GRANT ALL ON public.creator_applications TO service_role;
ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_own_creator_applications ON public.creator_applications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE FUNCTION public.has_capability(_user_id uuid, _capability text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_capabilities WHERE user_id=_user_id AND capability=_capability) $$;
REVOKE ALL ON FUNCTION public.has_capability(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_capability(uuid,text) TO authenticated;

CREATE FUNCTION public.owns_tool(_user_id uuid, _tool_slug text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.vendor_access WHERE user_id=_user_id AND tool_slug=_tool_slug) $$;
REVOKE ALL ON FUNCTION public.owns_tool(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_tool(uuid,text) TO authenticated;

CREATE FUNCTION public.request_creator_access(_pitch text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE new_id uuid; BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  IF public.has_capability(auth.uid(),'approved_creator') THEN RAISE EXCEPTION 'You are already an approved Creator'; END IF;
  IF EXISTS (SELECT 1 FROM public.creator_applications WHERE user_id=auth.uid() AND status='pending') THEN RAISE EXCEPTION 'Your application is already waiting for review'; END IF;
  INSERT INTO public.creator_applications(user_id,pitch) VALUES(auth.uid(),_pitch) RETURNING id INTO new_id;
  INSERT INTO public.admin_audit(actor_id,action,record_kind,record_title,after_data) VALUES(auth.uid(),'creator application','creator_application',new_id::text,jsonb_build_object('status','pending'));
  RETURN new_id; END $$;
REVOKE ALL ON FUNCTION public.request_creator_access(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_creator_access(text) TO authenticated;

CREATE FUNCTION public.review_creator_application(_application_id uuid, _decision text, _reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE app public.creator_applications; BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access is required'; END IF;
  IF _decision NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Choose approve or reject'; END IF;
  SELECT * INTO app FROM public.creator_applications WHERE id=_application_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF app.status <> 'pending' THEN RAISE EXCEPTION 'This application was already reviewed'; END IF;
  UPDATE public.creator_applications SET status=_decision, reviewer_id=auth.uid(), review_reason=_reason, reviewed_at=now() WHERE id=_application_id;
  IF _decision='approved' THEN
    INSERT INTO public.user_capabilities(user_id,capability,granted_by) VALUES(app.user_id,'approved_creator',auth.uid()) ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.admin_audit(actor_id,action,record_kind,record_title,after_data) VALUES(auth.uid(),'creator '||_decision,'creator_application',_application_id::text,jsonb_build_object('user_id',app.user_id,'reason',_reason));
END $$;
REVOKE ALL ON FUNCTION public.review_creator_application(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_creator_application(uuid,text,text) TO authenticated;

CREATE FUNCTION public.revoke_creator_capability(_user_id uuid, _reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access is required'; END IF;
  DELETE FROM public.user_capabilities WHERE user_id=_user_id AND capability='approved_creator';
  INSERT INTO public.admin_audit(actor_id,action,record_kind,record_title,after_data) VALUES(auth.uid(),'creator revoked','user_capability',_user_id::text,jsonb_build_object('reason',_reason));
END $$;
REVOKE ALL ON FUNCTION public.revoke_creator_capability(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_creator_capability(uuid,text) TO authenticated;

-- vendor_access follows admin claim decisions only (latest approved claim wins).
CREATE FUNCTION public.sync_vendor_access(target_slug text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE c record; BEGIN
  IF target_slug IS NULL THEN RETURN; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('vendor_access:'||target_slug));
  SELECT id, owner_id INTO c FROM public.directory_records WHERE kind='claim' AND status='approved' AND payload->>'toolSlug'=target_slug AND owner_id IS NOT NULL ORDER BY updated_at DESC LIMIT 1;
  IF c.owner_id IS NULL THEN DELETE FROM public.vendor_access WHERE tool_slug=target_slug;
  ELSE INSERT INTO public.vendor_access(tool_slug,user_id,claim_id) VALUES(target_slug,c.owner_id,c.id)
    ON CONFLICT (tool_slug) DO UPDATE SET user_id=EXCLUDED.user_id, claim_id=EXCLUDED.claim_id, granted_at=CASE WHEN public.vendor_access.user_id=EXCLUDED.user_id THEN public.vendor_access.granted_at ELSE now() END;
  END IF; END $$;
REVOKE ALL ON FUNCTION public.sync_vendor_access(text) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.sync_vendor_access_trigger() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
  IF TG_OP IN ('UPDATE','DELETE') AND OLD.kind='claim' THEN PERFORM public.sync_vendor_access(OLD.payload->>'toolSlug'); END IF;
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.kind='claim' THEN PERFORM public.sync_vendor_access(NEW.payload->>'toolSlug'); END IF;
  RETURN NULL; END $$;
REVOKE ALL ON FUNCTION public.sync_vendor_access_trigger() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER sync_vendor_access AFTER INSERT OR UPDATE OR DELETE ON public.directory_records FOR EACH ROW EXECUTE FUNCTION public.sync_vendor_access_trigger();

INSERT INTO public.vendor_access(tool_slug,user_id,claim_id)
SELECT DISTINCT ON (payload->>'toolSlug') payload->>'toolSlug', owner_id, id FROM public.directory_records
WHERE kind='claim' AND status='approved' AND owner_id IS NOT NULL AND payload->>'toolSlug' IS NOT NULL
ORDER BY payload->>'toolSlug', updated_at DESC;