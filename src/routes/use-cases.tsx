import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { PageIntro } from '@/components/catalog-ui';
import { useCases } from '@/lib/catalog';
import { meta } from '@/lib/meta';
export const Route=createFileRoute('/use-cases')({head:()=>meta('AI tool use cases','Find the best AI tools for the work you actually need to do.'),component:UseCases});
function UseCases(){return <div className="max-w-[1440px] mx-auto px-5 lg:px-10 pt-12"><PageIntro eyebrow="EXPLORE / USE CASES" title="Start with what you need to do." description="From the first idea to the finished work, find the tools that fit your goal."/><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{useCases.map((u,i)=><Link key={u.slug} to="/use-cases/$slug" params={{slug:u.slug}} className="border border-border bg-card p-6 min-h-52 flex flex-col justify-between hover:border-foreground"><div className="flex justify-between text-xs text-muted-foreground"><span>{String(i+1).padStart(2,'0')} / {u.category}</span><ArrowUpRight className="size-4"/></div><div><h2 className="text-lg font-semibold">{u.name}</h2><p className="text-sm text-muted-foreground mt-2">{u.description}</p></div></Link>)}</div></div>}
