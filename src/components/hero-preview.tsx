import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight, Bookmark, Check, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { useApp } from '@/components/app-shell';
import { tools } from '@/lib/catalog';
import { useLocalStorage } from '@/hooks/use-local-storage';

const picks = tools.filter(tool => ['chatgpt', 'claude', 'perplexity'].includes(tool.slug));
type PreviewState = { selected: string; explored: string[] };
const initial: PreviewState = { selected: 'chatgpt', explored: [] };
function validState(value: unknown): value is PreviewState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  return typeof state.selected === 'string' && picks.some(t => t.slug === state.selected)
    && Array.isArray(state.explored) && state.explored.length <= picks.length
    && state.explored.every(slug => typeof slug === 'string' && picks.some(t => t.slug === slug))
    && new Set(state.explored).size === state.explored.length;
}

export function HeroPreview() {
  const { value, setValue, ready, restored, available } = useLocalStorage('aibean-hero-preview-v1', initial, validState);
  const { saved, toggleSave } = useApp();
  const reduced = useReducedMotion();
  const spring = reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 300, damping: 20 };
  const tool = picks.find(t => t.slug === value.selected) ?? picks[0];
  if (!tool) return null;
  const progress = Math.round(20 + value.explored.length / picks.length * 80);
  const inspected = value.explored.includes(tool.slug);
  const isSaved = saved.includes(tool.slug);
  const inspect = (slug: string) => setValue(previous => ({ selected: slug, explored: [...new Set([...previous.explored, slug])] }));

  return <div aria-label="aiBean interactive preview">
    <div className="relative aspect-[4/4.1] min-h-[365px] overflow-hidden rounded-2xl bg-card border border-border p-5 flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <BrandLogo compact className="size-9" />
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
          <motion.span className="size-1.5 rounded-full bg-primary" animate={reduced ? { opacity: 1 } : { opacity: [1, .4, 1] }} transition={{ duration: 2.5, repeat: reduced ? 0 : Infinity }} />
          YOUR NEXT STACK
        </span>
      </div>
      <h2 className="font-display text-2xl font-bold leading-tight mt-3">Less scrolling.<br/><span className="text-highlight">More shipping.</span></h2>
      <div className="grid grid-cols-3 gap-1 mt-4" role="group" aria-label="Preview tools">
        {picks.map(pick => <motion.div key={pick.slug} whileHover={reduced ? undefined : { y: -2 }} whileTap={reduced ? undefined : { scale: .97 }} transition={spring}>
          <Button variant={value.selected === pick.slug ? 'default' : 'ghost'} className="w-full px-1 h-8 text-[11px] gap-1" aria-pressed={value.selected === pick.slug} onClick={() => inspect(pick.slug)}>
            {pick.name}{value.explored.includes(pick.slug) && <Check className="size-3" />}
          </Button>
        </motion.div>)}
      </div>
      <div className="flex-1 min-h-0 mt-3" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tool.slug} initial={{ opacity: 0, y: reduced ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
            <div className="flex justify-between items-center gap-2"><span className="font-semibold text-sm">{tool.useCases[0]}</span><span className="text-primary text-sm font-bold shrink-0">{tool.score.total}<span className="text-muted-foreground font-normal text-[10px]"> /100</span></span></div>
            <p className="text-xs text-ink-soft leading-relaxed mt-1.5">{tool.tagline}</p>
            <p className="text-[10px] text-muted-foreground mt-1.5">{tool.pricing} · {tool.verification} · Demo score</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <motion.div className="flex-1" whileTap={reduced ? undefined : { scale: .97 }} transition={spring}>
          <Button variant="outline" size="sm" className="w-full h-8 px-2" onClick={() => { inspect(tool.slug); toggleSave(tool.slug); }} aria-pressed={isSaved}>
            {isSaved ? <Check /> : <Bookmark />}{isSaved ? 'Saved to your stack' : 'Save to your stack'}
          </Button>
        </motion.div>
        <Button asChild variant="ghost" size="icon" className="size-8" title={`See ${tool.name} details`}>
          <Link to="/tools/$slug" params={{ slug: tool.slug }} aria-label={`See ${tool.name} details`} onClick={() => inspect(tool.slug)}><ArrowUpRight /></Link>
        </Button>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5" aria-live="polite">
          <span className="flex items-center gap-1">{inspected && <motion.span initial={{ scale: reduced ? 1 : 0 }} animate={{ scale: 1 }} transition={spring}><CheckCircle2 className="size-3 text-primary" /></motion.span>}{value.explored.length} / {picks.length} picks explored</span>
          <span title="Includes a 20% starting point; each inspected pick adds to your progress.">{progress}%{!value.explored.length && ' · starting point'}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden" role="progressbar" aria-label="Stack exploration" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={`${value.explored.length} of ${picks.length} picks explored, with a 20% starting point`}>
          <motion.div className="h-full bg-primary rounded-full" initial={false} animate={{ width: `${progress}%` }} transition={spring} />
        </div>
      </div>
    </div>
    <div className="flex justify-between gap-2 border-b border-border py-3 text-[10px] text-muted-foreground min-h-10">
      <span>{ready && !available ? 'THIS VISIT ONLY' : restored && value.explored.length ? 'Welcome back — progress saved' : 'YOUR SHORTLIST STARTS HERE'}</span>
      <span className="shrink-0">{String(value.explored.length).padStart(2, '0')} / 03</span>
    </div>
  </div>;
}