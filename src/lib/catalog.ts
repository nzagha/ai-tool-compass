export type VerificationStatus = 'Unverified' | 'Auto-Checked' | 'Human Reviewed' | 'Vendor Confirmed' | 'Needs Reverification';
export type ClaimStatus = 'Unclaimed' | 'Claim Pending' | 'Claimed' | 'Claim Disputed';
export type PricingModel = 'Free' | 'Freemium' | 'Paid' | 'Enterprise';
export interface RankingScore { total: number; capability: number; satisfaction: number; value: number; ease: number; reliability: number; businessFit: number; confidence: number }
export interface RatingSummary { average: number; count: number; distribution: number[] }
export interface Category { slug: string; name: string; icon: string; count: number; description: string; subcategories: Subcategory[] }
export interface Subcategory { slug: string; name: string }
export interface UseCase { slug: string; name: string; description: string; category: string }
export interface Vertical { slug: string; name: string }
export interface Review { id: string; toolSlug: string; author: string; role: string; rating: number; title: string; body: string; date: string }
export interface Vendor { id: string; name: string; website: string; claimedTools: string[] }
export interface SavedStack { id: string; name: string; description: string; toolSlugs: string[] }
export interface Submission { id: string; name: string; website: string; status: 'draft' | 'submitted' | 'in review'; createdAt: string }
export interface SponsoredPlacement { id: string; toolSlug: string; label: 'Sponsored' | 'Featured'; location: string; startsAt: string; endsAt: string }
export interface Tool { slug: string; name: string; monogram: string; logoColor: string; tagline: string; description: string; category: string; subcategory: string; useCases: string[]; verticals: string[]; pricing: PricingModel; priceDetail: string; verification: VerificationStatus; claim: ClaimStatus; rating: RatingSummary; score: RankingScore; rank: number; trending: number; platform: string[]; api: boolean; features: string[]; pros: string[]; cons: string[]; integrations: string[]; website: string; updated: string; verified: string; launched: number }
export const categories: Category[] = [
  ['writing-content','Writing & Content','✎',324,'Create, edit, and refine content',['Copywriting','Editing','SEO Writing']],
  ['image-design','Image & Design','◈',281,'Visual creation for every workflow',['Image Generation','Graphic Design','Photo Editing']],
  ['video','Video','▣',196,'Produce and edit moving images',['Video Generation','Video Editing']],
  ['audio-voice','Audio & Voice','◉',173,'Speech, music, and sound',['Transcription','Voice Generation']],
  ['developer-tools','Developer Tools','⌘',258,'Build and ship with AI',['Code Assistants','App Builders']],
  ['productivity','Productivity','▤',412,'Get the important work done',['Notes','Meetings','Workspaces']],
  ['research-search','Research & Search','◎',189,'Find answers and make sense of information',['AI Search','Knowledge Management']],
  ['marketing','Marketing','↗',231,'Plan and execute smarter campaigns',['SEO','Social Media','Campaigns']],
  ['sales','Sales','◇',142,'Prospect and close with context',['Prospecting','Sales Enablement']],
  ['customer-support','Customer Support','☏',117,'Support customers at scale',['Chatbots','Help Desks']],
  ['data-analytics','Data & Analytics','▥',126,'Explore and explain your data',['Business Intelligence','Data Analysis']],
  ['automation','Automation','⟲',203,'Connect systems and automate work',['Workflows','Agents']],
  ['education','Education','▧',98,'Teach, learn, and practice',['Tutoring','Course Creation']],
  ['hr-recruiting','HR & Recruiting','♙',74,'Find and support great teams',['Recruiting','HR Operations']],
  ['legal','Legal','§',63,'Research and draft legal work',['Legal Research','Contract Review']],
  ['finance','Finance','¤',85,'Financial insight and operations',['Accounting','Financial Planning']],
  ['cybersecurity','Cybersecurity','⬡',51,'Protect systems and data',['Threat Detection','Security Operations']],
  ['agents-assistants','Agents & Assistants','✳',167,'Intelligent assistants for complex tasks',['General Assistants','Agent Platforms']],
].map(([slug,name,icon,count,description,subs]) => ({slug: slug as string,name: name as string,icon: icon as string,count: count as number,description: description as string,subcategories: (subs as string[]).map(name => ({slug: name.toLowerCase().replaceAll(' ','-'),name}))}));
export const useCases: UseCase[] = [
  ['write-marketing-copy','Write marketing copy','Turn briefs into compelling, on-brand copy.','Marketing'],['generate-images','Generate images','Create original visuals from a prompt.','Image & Design'],['build-software','Build software','Ship faster with intelligent coding partners.','Developer Tools'],['research-a-topic','Research a topic','Find and synthesize trustworthy information.','Research & Search'],['summarize-documents','Summarize documents','Get to the point of long documents.','Productivity'],['automate-workflows','Automate workflows','Connect tools and remove repetitive work.','Automation'],['generate-video','Generate video','Create and edit video with AI.','Video'],['customer-support-automation','Customer support automation','Resolve questions faster and consistently.','Customer Support'],['sales-prospecting','Sales prospecting','Find the right people and personalize outreach.','Sales'],['analyze-data','Analyze data','Find patterns in your business data.','Data & Analytics'],['create-presentations','Create presentations','Make clear decks without the busywork.','Productivity'],['meeting-notes','Meeting notes','Capture decisions and next steps.','Productivity'],['seo-content','SEO content','Research and publish search-ready content.','Marketing'],['social-media-content','Social media content','Create content across channels.','Marketing'],['recruiting','Recruiting','Screen and engage candidates.','HR & Recruiting'],['legal-research','Legal research','Navigate legal information faster.','Legal']
].map(([slug,name,description,category]) => ({slug:slug as string,name:name as string,description:description as string,category:category as string}));
export const verticals: Vertical[] = ['Real Estate','Healthcare','Legal','Financial Services','Ecommerce','SaaS','Agencies','Education','Media','Retail','Hospitality','Construction','Manufacturing','Nonprofit'].map(name => ({name,slug:name.toLowerCase().replaceAll(' ','-')}));
const score = (total:number): RankingScore => ({total, capability:Math.min(99,total+3),satisfaction:Math.max(70,total-1),value:Math.max(70,total-4),ease:Math.min(98,total+2),reliability:Math.max(70,total-2),businessFit:Math.max(70,total-3),confidence:Math.max(70,total-5)});
const rating = (average:number,count:number): RatingSummary => ({average,count,distribution:[Math.round(count*.69),Math.round(count*.21),Math.round(count*.06),Math.round(count*.03),Math.round(count*.01)]});
const raw = [
  ['chatgpt','ChatGPT','✳','ink','A versatile AI assistant for work and everyday ideas.','Agents & Assistants','General Assistants',['Research a topic','Write marketing copy','Summarize documents'],['SaaS','Education'],'Freemium','Free plan · Plus from $20/mo','Human Reviewed','Claimed',4.8,2840,94,1,87,['Web','iOS','Android','Desktop'],true,'https://chatgpt.com'],
  ['claude','Claude','✺','clay','Thoughtful AI for writing, analysis, and complex work.','Agents & Assistants','General Assistants',['Summarize documents','Research a topic','Build software'],['SaaS','Legal'],'Freemium','Free plan · Pro from $20/mo','Human Reviewed','Unclaimed',4.8,1926,93,2,78,['Web','iOS','Android','Desktop'],true,'https://claude.ai'],
  ['perplexity','Perplexity','◫','teal','An answer engine for research with cited sources.','Research & Search','AI Search',['Research a topic','Summarize documents'],['Education','Media'],'Freemium','Free plan · Pro from $20/mo','Auto-Checked','Unclaimed',4.7,1360,91,3,72,['Web','iOS','Android'],true,'https://perplexity.ai'],
  ['cursor','Cursor','⌁','dark','An AI-first code editor built for shipping software.','Developer Tools','Code Assistants',['Build software','Automate workflows'],['SaaS','Agencies'],'Freemium','Free plan · Pro from $20/mo','Human Reviewed','Claimed',4.8,1145,90,4,94,['Desktop'],false,'https://cursor.com'],
  ['midjourney','Midjourney','M','violet','Create striking images from natural language.','Image & Design','Image Generation',['Generate images','Social media content'],['Agencies','Media'],'Paid','From $10/mo','Vendor Confirmed','Claimed',4.7,1860,89,5,68,['Web'],false,'https://midjourney.com'],
  ['notion-ai','Notion AI','N','ink','Bring AI into notes, projects, and your team workspace.','Productivity','Workspaces',['Meeting notes','Summarize documents','Create presentations'],['SaaS','Education'],'Paid','Included with Notion Business','Auto-Checked','Unclaimed',4.6,982,87,6,62,['Web','iOS','Android','Desktop'],false,'https://notion.so/product/ai'],
  ['canva','Canva Magic Studio','C','cyan','Everyday design tools with AI built in.','Image & Design','Graphic Design',['Generate images','Create presentations','Social media content'],['Agencies','Education'],'Freemium','Free plan · Pro from $15/mo','Vendor Confirmed','Claimed',4.6,1574,86,7,59,['Web','iOS','Android','Desktop'],false,'https://canva.com'],
  ['jasper','Jasper','J','coral','On-brand AI content for marketing teams.','Marketing','Copywriting',['Write marketing copy','SEO content','Social media content'],['Agencies','Ecommerce'],'Paid','From $39/mo','Needs Reverification','Claim Pending',4.4,716,84,8,41,['Web'],true,'https://jasper.ai'],
  ['gemini','Gemini','✦','blue','Google’s multimodal assistant for ideas and productivity.','Agents & Assistants','General Assistants',['Research a topic','Summarize documents','Analyze data'],['SaaS','Education'],'Freemium','Free plan · Advanced available','Auto-Checked','Unclaimed',4.5,1043,85,9,64,['Web','iOS','Android'],true,'https://gemini.google.com'],
  ['runway','Runway','R','lavender','Creative AI tools for video production.','Video','Video Generation',['Generate video','Social media content'],['Media','Agencies'],'Freemium','Free plan · Standard from $12/mo','Auto-Checked','Unclaimed',4.4,642,83,10,82,['Web'],true,'https://runwayml.com'],
  ['elevenlabs','ElevenLabs','Ⅱ','ink','Generate realistic voices and audio experiences.','Audio & Voice','Voice Generation',['Generate video','Create presentations'],['Media','Education'],'Freemium','Free plan · Starter from $5/mo','Human Reviewed','Unclaimed',4.6,892,86,11,77,['Web'],true,'https://elevenlabs.io'],
  ['zapier','Zapier AI','Z','orange','Connect apps and automate repetitive work.','Automation','Workflows',['Automate workflows','Customer support automation'],['SaaS','Agencies'],'Freemium','Free plan · paid plans available','Unverified','Unclaimed',4.3,783,81,12,55,['Web'],true,'https://zapier.com'],
  ['intercom','Intercom Fin','F','blue','Resolve customer questions with an AI support agent.','Customer Support','Chatbots',['Customer support automation'],['SaaS','Ecommerce'],'Enterprise','Contact sales','Auto-Checked','Claim Disputed',4.5,529,82,13,52,['Web'],true,'https://intercom.com'],
  ['gamma','Gamma','γ','violet','Turn your ideas into polished presentations.','Productivity','Workspaces',['Create presentations','Write marketing copy'],['Education','Agencies'],'Freemium','Free plan · Plus from $10/mo','Unverified','Unclaimed',4.4,621,80,14,69,['Web'],false,'https://gamma.app'],
] as const;
export const tools: Tool[] = raw.map(([slug,name,monogram,logoColor,tagline,category,subcategory,useCases,verticals,pricing,priceDetail,verification,claim,average,count,total,rank,trending,platform,api,website]) => ({slug,name,monogram,logoColor,tagline,description:`${name} helps teams ${tagline.charAt(0).toLowerCase()+tagline.slice(1)} Built for people who want useful results without unnecessary complexity.`,category,subcategory,useCases:[...useCases],verticals:[...verticals],pricing,priceDetail,verification,claim,rating:rating(average,count),score:score(total),rank,trending,platform:[...platform],api,website,features:['Natural language workflows','Team-friendly workspace','Flexible output and export','Integrations for everyday work'],pros:['Intuitive to get started','Strong results across common workflows','Active product development'],cons:['Advanced features may require a paid plan','Results still benefit from human review'],integrations:['Google Workspace','Slack','Notion'],updated:'October 2026',verified:'September 2026',launched:2022}));
export const reviews: Review[] = [
  {id:'r1',toolSlug:'chatgpt',author:'Alex M.',role:'Product lead',rating:5,title:'A reliable starting point for almost anything',body:'We use it to turn early research into clearer briefs. The biggest win is how quickly the team can explore an idea before committing to it.',date:'Sep 28, 2026'},
  {id:'r2',toolSlug:'chatgpt',author:'Samira K.',role:'Independent designer',rating:4,title:'Great range, with a little oversight needed',body:'Useful for drafts and brainstorming. I still check facts and polish the final work myself, but it saves me a lot of time.',date:'Sep 16, 2026'},
  {id:'r3',toolSlug:'claude',author:'Jordan P.',role:'Operations manager',rating:5,title:'Especially good with long documents',body:'It gives our team a thoughtful first pass on dense documents and helps make follow-up questions more focused.',date:'Sep 12, 2026'},
];
export const activity = [
  {person:'Maya R.',action:'reviewed',tool:'Claude',detail:'“Excellent for longer research and writing tasks”',time:'2h ago',type:'Review'},
  {person:'aiBean editorial',action:'verified',tool:'Cursor',detail:'Human review completed',time:'5h ago',type:'Verification'},
  {person:'Daniel K.',action:'compared',tool:'ChatGPT + Perplexity',detail:'For research workflows',time:'8h ago',type:'Comparison'},
  {person:'Leah S.',action:'saved',tool:'Midjourney',detail:'to Creative toolkit',time:'Yesterday',type:'Save'},
];
export const getTool = (slug:string) => tools.find(t => t.slug === slug);
export const slugify = (name:string) => name.toLowerCase().replaceAll(/[^a-z0-9]+/g,'-').replaceAll(/^-|-$/g,'');
