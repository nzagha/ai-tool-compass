CREATE TABLE public.catalog_public (id uuid PRIMARY KEY, kind text NOT NULL, slug text NOT NULL, title text NOT NULL, enabled boolean NOT NULL DEFAULT false, payload jsonb NOT NULL DEFAULT '{}', UNIQUE(kind,slug));
GRANT SELECT ON public.catalog_public TO anon,authenticated; GRANT ALL ON public.catalog_public TO service_role;
ALTER TABLE public.catalog_public ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_catalog_read ON public.catalog_public FOR SELECT TO anon,authenticated USING(true);
CREATE FUNCTION public.refresh_catalog_public() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NEW.kind IN ('tool','skill','category','use-case','vertical','editorial','review','placement') THEN
 INSERT INTO public.catalog_public(id,kind,slug,title,enabled,payload) VALUES(NEW.id,NEW.kind,NEW.slug,CASE WHEN NEW.status IN ('published','active') THEN NEW.title ELSE '' END,NEW.status IN ('published','active'),CASE WHEN NEW.status IN ('published','active') THEN NEW.payload ELSE '{}'::jsonb END)
 ON CONFLICT(kind,slug) DO UPDATE SET title=EXCLUDED.title,enabled=EXCLUDED.enabled,payload=EXCLUDED.payload;
 END IF; RETURN NEW; END $$;
CREATE TRIGGER refresh_public AFTER INSERT OR UPDATE ON public.directory_records FOR EACH ROW EXECUTE FUNCTION public.refresh_catalog_public();