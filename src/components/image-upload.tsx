import { useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

async function uploadImage(file: File, folder: string) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file');
  if (file.size > 5 * 1024 * 1024) throw new Error('Images must be 5 MB or smaller');
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('tool-media').upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage.from('tool-media').createSignedUrl(path, TEN_YEARS);
  if (signError || !data) throw signError ?? new Error('Could not create image link');
  return data.signedUrl;
}

export function ImageUpload({ label, folder, value, onChange, multiple = false, max = 8 }: { label: string; folder: string; value: string[]; onChange: (urls: string[]) => void; multiple?: boolean; max?: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const handle = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setError('');
    try {
      const chosen = Array.from(files).slice(0, multiple ? max - value.length : 1);
      const urls = await Promise.all(chosen.map(f => uploadImage(f, folder)));
      onChange(multiple ? [...value, ...urls] : urls);
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setBusy(false); }
  };
  return <div className="sm:col-span-2">
    <p className="text-sm font-semibold">{label}</p>
    <div className="flex flex-wrap gap-3 mt-2">
      {value.map((url, i) => <div key={url} className={`relative border rounded-xl overflow-hidden bg-paper ${multiple ? 'w-40 h-24' : 'size-20'}`}>
        <img src={url} alt={`${label} ${i + 1}`} className={`w-full h-full ${multiple ? 'object-cover' : 'object-contain p-1'}`} />
        <button type="button" aria-label="Remove image" onClick={() => onChange(value.filter(v => v !== url))} className="absolute top-1 right-1 size-6 rounded-full bg-card border flex items-center justify-center"><X className="size-3" /></button>
      </div>)}
      {(multiple ? value.length < max : value.length === 0) && <label className={`border border-dashed rounded-xl flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground cursor-pointer hover:border-primary hover:text-primary ${multiple ? 'w-40 h-24' : 'size-20'}`}>
        {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
        {busy ? 'Uploading…' : 'Add image'}
        <input type="file" accept="image/*" multiple={multiple} className="sr-only" disabled={busy} onChange={e => { void handle(e.target.files); e.target.value = ''; }} />
      </label>}
    </div>
    {error && <p className="text-xs text-destructive mt-2">{error}</p>}
  </div>;
}
