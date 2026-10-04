import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { PageIntro } from '@/components/catalog-ui';
import { categories } from '@/lib/catalog';
import { meta } from '@/lib/meta';
export const Route=createFileRoute('/categories')({head:()=>meta('AI tool categories','Explore AI tools across writing, design, coding, productivity, marketing, and more.'),component:Categories});
function Categories(){return <div className="max-w-[1440px] mx-auto px-5 lg:px-10 pt-12"><PageIntro eyebrow="EXPLORE / CATEGORIES" title="Explore by category" description="Every tool has a purpose. Start with the kind of work you need to get done."/><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{categories.map(c=><Link key={c.slug} to="/categories/$slug" params={{slug:c.slug}} className="border border-border bg-card rounded-md p-6 min-h-52 hover:border-foreground transition-colors flex flex-col"><div className="flex justify-between"><span className="text-3xl">{c.icon}</span><ArrowUpRight className="size-5"/></div><div className="mt-auto"><h2 className="font-semibold text-xl">{c.name}</h2><p className="text-sm text-muted-foreground mt-1">{c.description}</p><p className="text-xs text-blue-ink mt-4">{c.count} tools · {c.subcategories.map(s=>s.name).slice(0,2).join(', ')}</p></div></Link>)}</div></div>}
