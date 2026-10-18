CREATE OR REPLACE FUNCTION public.prepare_directory_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE reviewer text; BEGIN
 NEW.updated_at=now();
 IF NEW.kind='tool' AND NEW.payload->>'verification' IN ('Human Reviewed','Vendor Confirmed') AND (TG_OP='INSERT' OR NEW.payload->>'verification' IS DISTINCT FROM OLD.payload->>'verification') THEN
 SELECT display_name INTO reviewer FROM public.profiles WHERE id=auth.uid();
 NEW.payload=NEW.payload || jsonb_build_object('verified',to_char(now(),'YYYY-MM-DD'),'verifiedBy',coalesce(nullif(reviewer,''),'aiBean admin'),'updated',to_char(now(),'YYYY-MM-DD'));
 END IF;
 IF NEW.kind='claim' THEN
 IF coalesce(trim(NEW.payload->>'toolSlug'),'')='' THEN RAISE EXCEPTION 'Choose an AI tool'; END IF;
 IF NEW.status NOT IN ('pending','approved','rejected','archived','flagged') THEN RAISE EXCEPTION 'Claims must be pending, approved, rejected, archived or flagged'; END IF;
 IF NEW.status='approved' AND NEW.owner_id IS NULL THEN RAISE EXCEPTION 'A claim must have an account owner'; END IF;
 END IF;
 RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.sync_tool_claim_state(target_slug text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE approved_owner uuid; previous_owner uuid; claim_state text; BEGIN
 IF coalesce(target_slug,'')='' THEN RETURN; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('claim:' || target_slug,0));
 SELECT owner_id INTO approved_owner FROM public.directory_records WHERE kind='claim' AND payload->>'toolSlug'=target_slug AND status='approved' ORDER BY updated_at DESC,id LIMIT 1;
 SELECT owner_id INTO previous_owner FROM public.directory_records WHERE kind='tool' AND slug=target_slug;
 claim_state=CASE WHEN approved_owner IS NOT NULL THEN 'Claimed' WHEN EXISTS(SELECT 1 FROM public.directory_records WHERE kind='claim' AND payload->>'toolSlug'=target_slug AND status IN ('pending','flagged','published')) THEN 'Claim Pending' ELSE 'Unclaimed' END;
 INSERT INTO public.catalog_public(id,kind,slug,title,enabled,payload) VALUES(gen_random_uuid(),'claim-state',target_slug,'',true,jsonb_build_object('claim',claim_state)) ON CONFLICT(kind,slug) DO UPDATE SET enabled=true,payload=EXCLUDED.payload;
 IF approved_owner IS NOT NULL THEN
 UPDATE public.directory_records SET owner_id=approved_owner WHERE kind='tool' AND slug=target_slug AND owner_id IS DISTINCT FROM approved_owner;
 ELSIF previous_owner IS NOT NULL AND EXISTS(SELECT 1 FROM public.directory_records WHERE kind='claim' AND payload->>'toolSlug'=target_slug AND owner_id=previous_owner) THEN
 UPDATE public.directory_records SET owner_id=NULL WHERE kind='tool' AND slug=target_slug;
 END IF;
 END $$;
REVOKE ALL ON FUNCTION public.sync_tool_claim_state(text) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.sync_claim_catalog() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF TG_OP='DELETE' THEN
 IF OLD.kind='claim' THEN PERFORM public.sync_tool_claim_state(OLD.payload->>'toolSlug'); END IF;
 RETURN OLD;
 END IF;
 IF NEW.kind='claim' THEN
 PERFORM public.sync_tool_claim_state(NEW.payload->>'toolSlug');
 IF TG_OP='UPDATE' AND OLD.payload->>'toolSlug' IS DISTINCT FROM NEW.payload->>'toolSlug' THEN PERFORM public.sync_tool_claim_state(OLD.payload->>'toolSlug'); END IF;
 END IF;
 RETURN NEW;
 END $$;
REVOKE ALL ON FUNCTION public.sync_claim_catalog() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER sync_claim_catalog AFTER INSERT OR UPDATE OR DELETE ON public.directory_records FOR EACH ROW EXECUTE FUNCTION public.sync_claim_catalog();