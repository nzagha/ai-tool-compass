import { z } from 'zod';

export const kinds = ['tool','skill','category','use-case','vertical','submission','claim','review','vendor','placement','setting','report','editorial'] as const;
export type RecordKind = typeof kinds[number];
export const statuses = ['draft','pending','published','approved','rejected','archived','active','paused','flagged'] as const;
export type RecordStatus = typeof statuses[number];
export type AdminRecord = { id?: string; kind: RecordKind; slug: string; title: string; status: RecordStatus; payload: Record<string, unknown>; owner_id?: string | null; updated_at?: string; source?: 'demo' | 'saved' };
export const verificationStates = ['Unverified','Auto-Checked','Human Reviewed','Vendor Confirmed','Needs Reverification'] as const;
export const skillFields = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'Use a valid web address name.'),
  name: z.string().trim().min(1, 'Add a skill name.'),
  description: z.string().trim().min(1, 'Add a description.'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  category: z.string().trim().min(1, 'Choose a category.'),
  tools: z.array(z.string().min(1)),
  outcomes: z.array(z.string().trim().min(1)),
});
const url = z.string().max(2000).refine(v => !v || /^https?:\/\//i.test(v), 'Use an http or https URL');
const score = z.number().min(0).max(100);
export const toolFields = z.object({
  slug: z.string(), name: z.string().min(1), monogram: z.string().min(1), logoColor: z.string(), tagline: z.string().min(1), description: z.string(),
  category: z.string().min(1), subcategory: z.string(), useCases: z.array(z.string()), verticals: z.array(z.string()),
  pricing: z.enum(['Free','Freemium','Paid','Enterprise']), priceDetail: z.string(), startingPrice: z.string().max(200).optional(), freePlan: z.boolean().optional(), verification: z.enum(verificationStates),
  claim: z.enum(['Unclaimed','Claim Pending','Claimed','Claim Disputed']),
  rating: z.object({ average: z.number().min(0).max(5), count: z.number().int().min(0), distribution: z.array(z.number().int().min(0)).length(5) }),
  score: z.object({total:score,capability:score,satisfaction:score,value:score,ease:score,reliability:score,businessFit:score,confidence:score}),
  rank:z.number().int().min(1),trending:score,platform:z.array(z.string()),api:z.boolean(),features:z.array(z.string()),pros:z.array(z.string()),cons:z.array(z.string()),integrations:z.array(z.string()),website:url,
  updated:z.string(),verified:z.string(),verifiedBy:z.string(),limitations:z.array(z.string()),launched:z.number().int().min(1900).max(2200),logoUrl:z.string().max(2000).optional(),screenshots:z.array(z.string().max(2000)).max(12).optional(),
});
export const recordInput = z.object({kind:z.enum(kinds),slug:z.string().regex(/^[a-z0-9][a-z0-9-]*$/).max(150),title:z.string().min(1).max(200),status:z.enum(statuses),payload:z.record(z.unknown()),owner_id:z.string().uuid().nullable().optional()}).superRefine((v,c)=>{
  if(v.kind==='tool'){const result=toolFields.safeParse(v.payload);if(!result.success)c.addIssue({code:'custom',message:result.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')});}
  if(v.kind==='placement'){
    if(!['Featured','Sponsored'].includes(String(v.payload['label'])))c.addIssue({code:'custom',message:'Every placement must be labeled Featured or Sponsored'});
    const start=Date.parse(String(v.payload['startsAt'])),end=Date.parse(String(v.payload['endsAt']));
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)c.addIssue({code:'custom',message:'Placement end must follow its start'});
  }
  if(v.kind==='review'&&!(Number(v.payload['rating'])>=1&&Number(v.payload['rating'])<=5))c.addIssue({code:'custom',message:'Review rating must be 1–5'});
  if(v.kind==='claim'&&v.status==='approved'&&!v.owner_id)c.addIssue({code:'custom',message:'An approved claim must belong to a signed-in vendor'});
});
export function canAdmin(role: string | undefined) { return role === 'admin'; }

export const sections = [
  {key:'overview',label:'Overview',group:'Workspace'},
  {key:'tool',label:'AI Tools',group:'Directory'}, {key:'skill',label:'AI Skills',group:'Directory'},
  {key:'category',label:'Categories',group:'Directory'}, {key:'use-case',label:'Use cases',group:'Directory'}, {key:'vertical',label:'Business verticals',group:'Directory'},
  {key:'verification',label:'aiBean Verified',group:'Editorial'}, {key:'ranking',label:'Rankings & scores',group:'Editorial'}, {key:'editorial',label:'Editorial content',group:'Editorial'},
  {key:'submission',label:'Submissions',group:'Moderation'}, {key:'claim',label:'Owner claims',group:'Moderation'}, {key:'review',label:'User reviews',group:'Moderation'}, {key:'report',label:'Reports',group:'Moderation'},
  {key:'vendor',label:'Vendors',group:'Business'}, {key:'placement',label:'Featured & sponsored',group:'Business'},
  {key:'users',label:'Users & access',group:'System'}, {key:'setting',label:'Site settings',group:'System'}, {key:'audit',label:'Audit history',group:'System'},
] as const;
export type AdminSection = typeof sections[number]['key'];