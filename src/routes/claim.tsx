import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageIntro } from '@/components/catalog-ui';
import { tools } from '@/lib/catalog';
import { useCatalog } from '@/components/catalog-provider';
import { meta } from '@/lib/meta';
import { useAuth } from '@/components/auth-provider';
import { EvidenceUpload, type EvidenceFile } from '@/components/evidence-upload';
import { createContribution } from '@/lib/account.functions';

export const Route = createFileRoute('/claim')({
  validateSearch: (s: Record<string, unknown>) => ({ tool: typeof s['tool'] === 'string' ? s['tool'] : '' }),
  head: () => meta('Claim your AI tool', 'Vendors can claim ownership of an AI tool listing on aiBean in four steps.'),
  component: Claim,
});

const steps = ['Pick your tool', 'Your details', 'Proof of ownership', 'Review & submit'];

function Claim(){const {tools}=useCatalog();
  const { tool: initial } = Route.useSearch();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [f, setF] = useState({ tool: initial, name: '', role: '', email: '', method: 'Domain email', evidence: '' });
  const { user } = useAuth();
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    if (!user) { setDone(true); return; }
    setSending(true); setErr('');
    try {
      await createContribution({ data: { kind: 'claim', title: `Claim ${tool?.name ?? f.tool}`, payload: { toolSlug: f.tool, name: f.name, role: f.role, email: f.email, method: f.method, evidence: f.evidence || 'See attached files', attachments: files } } });
      setDone(true);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not send your claim.'); }
    finally { setSending(false); }
  };
  const set = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v });
  const tool = tools.find((t) => t.slug === f.tool);
  const domain = tool ? new URL(tool.website).hostname.replace('www.', '') : '';
  const valid = [!!tool && tool.claim !== 'Claimed', !!f.name && !!f.role && /.+@.+\..+/.test(f.email), !!f.evidence || files.length > 0, true][step];

  if (done) return (
    <div className="max-w-xl mx-auto px-5 pt-20 text-center">
      <CheckCircle2 className="size-10 text-primary mx-auto" />
      <h1 className="font-display text-3xl font-semibold mt-5">Claim received.</h1>
      <p className="text-ink-soft mt-3">{tool?.name} now shows <strong>Claim Pending</strong>. An aiBean admin checks your proof, usually within 3 business days, then marks it Claimed.</p>
      <Button asChild className="mt-8"><Link to="/vendor">Back to vendors</Link></Button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-5 lg:px-10 pt-12">
      <PageIntro eyebrow="FOR VENDORS / CLAIM" title="Claim your AI tool." description="Own the listing, keep details accurate, and reply to reviews. Claiming never changes your aiBean score." />
      <ol className="grid grid-cols-4 gap-2 mb-8">{steps.map((s, i) => <li key={s} className={`text-xs border-t-2 pt-2 ${i <= step ? 'border-primary text-foreground' : 'border-border text-muted-foreground'}`}>{i + 1}. {s}</li>)}</ol>
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-4">
        {step === 0 && <>
          <label className="text-sm font-semibold block" htmlFor="tool">Which tool do you own?</label>
          <select id="tool" value={f.tool} onChange={(e) => set('tool', e.target.value)} className="w-full h-10 border border-border bg-card rounded-md px-3 text-sm">
            <option value="">Select a tool</option>
            {tools.map((t) => <option key={t.slug} value={t.slug}>{t.name} ({t.claim})</option>)}
          </select>
          {tool?.claim === 'Claimed' && <p className="text-sm text-amber-ink">This tool is already claimed. If you believe that is wrong, contact us to open a dispute.</p>}
          <p className="text-xs text-muted-foreground">Not listed yet? <Link to="/submit" className="underline">Submit your tool</Link> first.</p>
        </>}
        {step === 1 && <>
          <Input placeholder="Full name" value={f.name} onChange={(e) => set('name', e.target.value)} />
          <Input placeholder="Role, e.g. Head of Marketing" value={f.role} onChange={(e) => set('role', e.target.value)} />
          <Input placeholder={`Work email${domain ? ` (ideally @${domain})` : ''}`} value={f.email} onChange={(e) => set('email', e.target.value)} />
        </>}
        {step === 2 && <>
          <p className="text-sm font-semibold">How can we confirm you own {tool?.name}?</p>
          {['Domain email', 'DNS TXT record', 'Meta tag on website'].map((m) => <label key={m} className="flex gap-2 text-sm"><input type="radio" checked={f.method === m} onChange={() => set('method', m)} />{m}</label>)}
          <textarea value={f.evidence} onChange={(e) => set('evidence', e.target.value)} placeholder="Add a link or note our admin can check, e.g. company page listing you" className="w-full min-h-28 border border-border rounded-md p-3 text-sm bg-card" />
          {user ? <EvidenceUpload userId={user.id} value={files} onChange={setFiles} /> : <p className="text-sm text-muted-foreground"><Link to="/login" className="underline">Sign in</Link> to attach documents or images (up to 5 files).</p>}
        </>}
        {step === 3 && <dl className="text-sm">{[['Tool', tool?.name], ['Name', f.name], ['Role', f.role], ['Email', f.email], ['Verification', f.method], ['Evidence', f.evidence], ['Attachments', files.length ? files.map(x => x.name).join(', ') : 'None']].map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-t py-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{v}</dd></div>)}</dl>}
      </div>
      <div className="flex justify-between mt-6">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft />Back</Button>
        {step < 3 ? <Button disabled={!valid} onClick={() => setStep(step + 1)}>Continue <ArrowRight /></Button> : <Button disabled={sending} onClick={() => void submit()}>{sending ? 'Sending…' : 'Submit claim'}</Button>}
      </div>
      {err && <p className="text-sm text-destructive mt-4">{err}</p>}
      {!user && <p className="text-xs text-muted-foreground mt-6">Sign in so your claim and files are saved to your account for admin review.</p>}
    </div>
  );
}
