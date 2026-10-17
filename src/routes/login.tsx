import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Bookmark, GitCompareArrows } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { meta } from '@/lib/meta';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useAuth } from '@/components/auth-provider';

export const Route = createFileRoute('/login')({ head: () => meta('Sign in', 'Sign in to aiBean to manage your AI tool shortlist.'), component: Login });

function Login() {
  const [mode, setMode] = useState<'sign in' | 'sign up'>('sign in');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState('');
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<string | null>(null);
  const { user, isAdmin, loading } = useAuth(); const navigate = useNavigate();
  useEffect(() => { if (!loading && user) void navigate({ to: isAdmin ? '/admin' : '/saved' }); }, [user, isAdmin, loading, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (mode === 'sign up') {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + '/login', data: { display_name: name } } });
      setMsg(error ? error.message : data.session ? null : 'Check your email to confirm your account, then sign in.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    }
    setBusy(false);
  }
  async function google() {
    const r = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin + '/login' });
    if (r.error) setMsg(r.error.message);
  }

  return <div className="max-w-[1100px] mx-auto px-5 lg:px-10 pt-12 grid lg:grid-cols-2 gap-16"><div className="max-w-md"><p className="text-xs font-bold text-primary">YOUR AIBEAN ACCOUNT</p><h1 className="text-4xl font-semibold mt-4">Your stack. Your edge.</h1><p className="text-ink-soft mt-5 leading-relaxed">Keep strong tools close, build your shortlist, and compare what actually moves the needle.</p><div className="border-t mt-10 pt-7 space-y-6">{([{ Icon: Bookmark, label: 'Save tools worth revisiting' }, { Icon: GitCompareArrows, label: 'Compare the details that matter' }]).map(({ Icon, label }) => <div key={label} className="flex items-center gap-4 text-sm font-medium"><Icon className="size-5" />{label}</div>)}</div></div>
    <div className="border border-border rounded-2xl p-7 md:p-10 bg-card self-start"><div className="flex border-b mb-8">{(['sign in', 'sign up'] as const).map(m => <Button key={m} variant="ghost" className={`rounded-none flex-1 capitalize border-b-2 ${mode === m ? 'border-foreground' : 'border-transparent text-muted-foreground'}`} onClick={() => { setMode(m); setMsg(null); }}>{m}</Button>)}</div>
      <h2 className="text-2xl font-semibold">{mode === 'sign in' ? 'Welcome back' : 'Create an account'}</h2>
      <Button variant="outline" className="w-full h-11 mt-6" onClick={() => void google()}>Continue with Google</Button>
      <form onSubmit={submit} className="mt-6 space-y-5">
        {mode === 'sign up' && <label className="text-sm font-semibold block">Display name<Input value={name} onChange={e => setName(e.target.value)} className="mt-2 h-11" /></label>}
        <label className="text-sm font-semibold block">Email address<Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="mt-2 h-11" /></label>
        <label className="text-sm font-semibold block">Password<Input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="mt-2 h-11" /></label>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        <Button type="submit" disabled={busy} className="w-full h-11 capitalize">{mode} <ArrowRight /></Button>
      </form>
      <p className="text-xs text-muted-foreground mt-6 leading-relaxed">You can also <Link to="/saved" className="underline text-foreground">save tools in this browser</Link> without signing in.</p></div></div>;
}
