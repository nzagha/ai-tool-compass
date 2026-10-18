import { useState } from 'react';
import { FileText, Loader2, Paperclip, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const MAX_EVIDENCE_FILES = 5;
export type EvidenceFile = { name: string; path: string; size: number };

export function EvidenceUpload({ userId, value, onChange }: { userId: string; value: EvidenceFile[]; onChange: (files: EvidenceFile[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const handle = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true); setError('');
    try {
      const chosen = Array.from(list).slice(0, MAX_EVIDENCE_FILES - value.length);
      if (list.length > chosen.length) setError(`You can attach up to ${MAX_EVIDENCE_FILES} files.`);
      const added = await Promise.all(chosen.map(async (file) => {
        if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} is over 10 MB`);
        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: e } = await supabase.storage.from('claim-evidence').upload(path, file, { contentType: file.type || 'application/octet-stream' });
        if (e) throw e;
        return { name: file.name, path, size: file.size };
      }));
      onChange([...value, ...added]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setBusy(false); }
  };
  const remove = (f: EvidenceFile) => { void supabase.storage.from('claim-evidence').remove([f.path]); onChange(value.filter(v => v.path !== f.path)); };
  return <div>
    <p className="text-sm font-semibold">Attachments <span className="font-normal text-muted-foreground">({value.length}/{MAX_EVIDENCE_FILES})</span></p>
    <p className="text-xs text-muted-foreground">Documents, images, or PDFs. Up to {MAX_EVIDENCE_FILES} files, 10 MB each.</p>
    <ul className="mt-3 space-y-2">{value.map(f => <li key={f.path} className="flex items-center gap-2 border border-border rounded-md px-3 py-2 text-sm">
      <FileText className="size-4 text-muted-foreground" /><span className="flex-1 truncate">{f.name}</span>
      <span className="text-xs text-muted-foreground">{Math.ceil(f.size / 1024)} KB</span>
      <button type="button" aria-label={`Remove ${f.name}`} onClick={() => remove(f)}><X className="size-4" /></button>
    </li>)}</ul>
    {value.length < MAX_EVIDENCE_FILES && <label className="mt-3 inline-flex items-center gap-2 border border-dashed border-border rounded-md px-4 py-2 text-sm cursor-pointer hover:border-primary hover:text-primary">
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}{busy ? 'Uploading…' : 'Attach files'}
      <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx" className="sr-only" disabled={busy} onChange={e => { void handle(e.target.files); e.target.value = ''; }} />
    </label>}
    {error && <p className="text-xs text-destructive mt-2">{error}</p>}
  </div>;
}
