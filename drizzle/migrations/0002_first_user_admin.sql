CREATE OR REPLACE FUNCTION public.create_user_profile()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ BEGIN
 INSERT INTO public.profiles(id,display_name) VALUES(NEW.id,coalesce(NEW.raw_user_meta_data->>'display_name',''));
 IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE role='admin') THEN
   INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'admin');
 ELSE
   INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'user');
 END IF;
 RETURN NEW; END $function$;