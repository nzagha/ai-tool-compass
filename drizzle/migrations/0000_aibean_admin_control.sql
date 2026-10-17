CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, display_name text NOT NULL DEFAULT '', avatar_url text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated; GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, UNIQUE(user_id,role));
GRANT SELECT ON public.user_roles TO authenticated; GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated;
CREATE POLICY own_roles ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY read_profiles ON public.profiles FOR SELECT TO authenticated USING(id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY update_profile ON public.profiles FOR UPDATE TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
CREATE FUNCTION public.create_user_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.profiles(id,display_name) VALUES(NEW.id,coalesce(NEW.raw_user_meta_data->>'display_name','')); INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'user'); RETURN NEW; END $$;
CREATE TRIGGER create_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();
CREATE TABLE public.directory_records (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL CHECK(kind IN ('tool','skill','category','use-case','vertical','submission','claim','review','vendor','placement','setting','report','editorial')), slug text NOT NULL, title text NOT NULL, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending','published','approved','rejected','archived','active','paused','flagged')), payload jsonb NOT NULL DEFAULT '{}', owner_id uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(kind,slug));
GRANT SELECT ON public.directory_records TO anon; GRANT SELECT,INSERT,UPDATE,DELETE ON public.directory_records TO authenticated; GRANT ALL ON public.directory_records TO service_role;
ALTER TABLE public.directory_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY published_records ON public.directory_records FOR SELECT TO anon,authenticated USING((kind IN ('tool','skill','category','use-case','vertical','editorial','review') AND status='published') OR (kind='placement' AND status='active'));
CREATE POLICY admin_records ON public.directory_records FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE POLICY own_requests ON public.directory_records FOR SELECT TO authenticated USING(owner_id=auth.uid() AND kind IN ('submission','claim','review','report'));
CREATE POLICY submit_requests ON public.directory_records FOR INSERT TO authenticated WITH CHECK(owner_id=auth.uid() AND kind IN ('submission','claim','review','report') AND status='pending');
CREATE INDEX directory_kind_status ON public.directory_records(kind,status);
CREATE TABLE public.admin_audit (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid, action text NOT NULL, record_kind text NOT NULL, record_title text NOT NULL, before_data jsonb, after_data jsonb, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.admin_audit TO authenticated; GRANT ALL ON public.admin_audit TO service_role;
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_admin ON public.admin_audit FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.audit_directory_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF TG_OP='DELETE' THEN INSERT INTO public.admin_audit(actor_id,action,record_kind,record_title,before_data) VALUES(auth.uid(),'delete',OLD.kind,OLD.title,to_jsonb(OLD)); RETURN OLD; END IF;
 INSERT INTO public.admin_audit(actor_id,action,record_kind,record_title,before_data,after_data) VALUES(auth.uid(),lower(TG_OP),NEW.kind,NEW.title,CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE NULL END,to_jsonb(NEW)); RETURN NEW; END $$;
CREATE TRIGGER audit_records AFTER INSERT OR UPDATE OR DELETE ON public.directory_records FOR EACH ROW EXECUTE FUNCTION public.audit_directory_change();
CREATE FUNCTION public.prepare_directory_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE reviewer text; BEGIN
 NEW.updated_at=now();
 IF NEW.kind='tool' AND NEW.payload->>'verification' IN ('Human Reviewed','Vendor Confirmed') AND (TG_OP='INSERT' OR NEW.payload->>'verification' IS DISTINCT FROM OLD.payload->>'verification') THEN
 SELECT display_name INTO reviewer FROM public.profiles WHERE id=auth.uid();
 NEW.payload=NEW.payload || jsonb_build_object('verified',to_char(now(),'YYYY-MM-DD'),'verifiedBy',coalesce(nullif(reviewer,''),'aiBean admin'),'updated',to_char(now(),'YYYY-MM-DD'));
 END IF;
 IF NEW.kind='claim' AND NEW.status='approved' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM 'approved') THEN
 IF NOT EXISTS(SELECT 1 FROM public.directory_records WHERE kind='tool' AND slug=NEW.payload->>'toolSlug') THEN RAISE EXCEPTION 'Tool listing must exist before approving this claim'; END IF;
 UPDATE public.directory_records SET payload=payload || jsonb_build_object('claim','Claimed'),owner_id=NEW.owner_id WHERE kind='tool' AND slug=NEW.payload->>'toolSlug';
 END IF;
 RETURN NEW; END $$;
CREATE TRIGGER prepare_record BEFORE INSERT OR UPDATE ON public.directory_records FOR EACH ROW EXECUTE FUNCTION public.prepare_directory_change();
CREATE FUNCTION public.set_member_role(target_user uuid, desired_role public.app_role) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF target_user=auth.uid() AND desired_role<>'admin' THEN RAISE EXCEPTION 'You cannot remove your own admin access'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=target_user) THEN RAISE EXCEPTION 'Account not found'; END IF;
 DELETE FROM public.user_roles WHERE user_id=target_user;
 INSERT INTO public.user_roles(user_id,role) VALUES(target_user,desired_role);
 INSERT INTO public.admin_audit(actor_id,action,record_kind,record_title,after_data) VALUES(auth.uid(),'role change','user',target_user::text,jsonb_build_object('role',desired_role));
 END $$;
REVOKE ALL ON FUNCTION public.set_member_role(uuid,public.app_role) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.set_member_role(uuid,public.app_role) TO authenticated;