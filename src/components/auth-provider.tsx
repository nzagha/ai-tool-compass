import { createContext,useContext,useEffect,useState,type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
type Auth={user:User|null;isAdmin:boolean;loading:boolean};
const AuthContext=createContext<Auth>({user:null,isAdmin:false,loading:true});
export function AuthProvider({children}:{children:ReactNode}){
  const [auth,setAuth]=useState<Auth>({user:null,isAdmin:false,loading:true});
  const router=useRouter();const queries=useQueryClient();
  useEffect(()=>{
    let active=true;let version=0;
    async function refresh(){const mine=++version;const {data}=await supabase.auth.getUser();const user=data.user;
      const {data:admin}=user?await supabase.rpc('has_role',{_user_id:user.id,_role:'admin'}):{data:false};
      if(active&&mine===version)setAuth({user,isAdmin:!!admin,loading:false});
    }
    const {data:{subscription}}=supabase.auth.onAuthStateChange(event=>{
      if(!['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event))return;
      if(event==='SIGNED_OUT'){++version;setAuth({user:null,isAdmin:false,loading:false});queries.clear();}
      else setTimeout(()=>void refresh(),0);
      void router.invalidate();if(event!=='SIGNED_OUT')void queries.invalidateQueries();
    });
    void refresh();return()=>{active=false;subscription.unsubscribe();};
  },[router,queries]);
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);