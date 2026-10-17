import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { DemoLabel, PageIntro } from '@/components/catalog-ui';
import { skills, tools } from '@/lib/catalog';
import { useCatalog } from '@/components/catalog-provider';
import { meta } from '@/lib/meta';

export const Route = createFileRoute('/skills')({
  head: () => meta('AI Skills', 'Learn the practical AI skills builders use every day, with the tools that fit each one.'),
  component: Skills,
});

const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;

function Skills(){const {skills,tools}=useCatalog();
  const [level, setLevel] = useState<(typeof levels)[number]>('All');
  const list = skills.filter((s) => level === 'All' || s.level === level);
  return (
    <div className="max-w-[1440px] mx-auto px-5 lg:px-10 pt-12">
      <PageIntro eyebrow="AIBEAN / AI SKILLS" title="AI Skills" description="The practical skills that turn AI tools into real output. Pick a skill, see what you will be able to do, and the tools that fit." />
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {levels.map((l) => (
          <button key={l} onClick={() => setLevel(l)} className={`rounded-full px-4 py-2 text-sm border transition-colors ${level === l ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>{l}</button>
        ))}
        <DemoLabel />
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((s) => (
          <article key={s.slug} className="bg-card border border-border rounded-2xl p-6 flex flex-col">
            <div className="flex justify-between text-xs text-muted-foreground"><span>{s.category}</span><span className="rounded-full bg-muted px-2.5 py-1">{s.level}</span></div>
            <h2 className="font-display text-xl font-semibold mt-4">{s.name}</h2>
            <p className="text-sm text-ink-soft mt-2">{s.description}</p>
            <ul className="mt-4 space-y-2">{s.outcomes.map((o) => <li key={o} className="flex gap-2 text-sm"><CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />{o}</li>)}</ul>
            <div className="mt-auto pt-5 flex flex-wrap gap-2">
              {s.tools.map((slug) => { const t = tools.find((x) => x.slug === slug); return t ? <Link key={slug} to="/tools/$slug" params={{ slug }} className="text-xs border border-border rounded-full px-3 py-1.5 hover:bg-muted">{t.name} <ArrowUpRight className="inline size-3" /></Link> : null; })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
