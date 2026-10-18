# AI Tool Compass

Build a polished MVP web application for aiBean / BestURL: an AI tools discovery, ranking, reviews, verification, and vendor platform.

PRODUCT GOAL
Create a credible editorial + data-driven directory where users can discover, compare, rank, review, and save AI tools by category, subcategory, business vertical, and use case. Vendors can claim listings and later subscribe or pay for enhanced visibility. The MVP should look like a serious product, not a generic template.

TECH / IMPLEMENTATION
- Full-stack TypeScript app using the platform default stack.
- Tailwind CSS + shadcn/ui.
- Keep the data layer abstracted and ready for Supabase/Postgres. If a local mock dataset is needed initially, centralize it so it can be replaced by database queries.
- Responsive, accessible, fast, SEO-friendly.
- Use reusable components and typed data models.
- Do not add Kubernetes or overcomplicate infrastructure.
- Structure routes and components cleanly so a future Next.js migration is feasible if needed.

BRAND / VISUAL DIRECTION
- Premium minimal editorial-tech aesthetic.
- Primary palette: black, white, warm/off-white, graphite, subtle grays. Use a restrained colorful accent system only for category chips, scores, charts, and verification states.
- Strong modern grotesk typography; if Neue Haas Grotesk/Neue Hans Kendrick is unavailable, use the closest high-quality web-safe/Google alternative.
- Avoid heavy gradients, excessive glassmorphism, neon cyberpunk styling, or generic SaaS illustrations.
- Dense enough to feel information-rich, but with excellent hierarchy and generous whitespace.
- Cards should feel like product/research cards, not ecommerce tiles.

GLOBAL NAVIGATION
Desktop:
Logo / aiBean
Discover
Rankings
Categories
Use Cases
Community
For Vendors
Search
Submit a Tool
Sign In / account
Mobile: compact menu with same IA.

CORE ROUTES TO BUILD NOW
1. /
2. /tools
3. /tools/:slug
4. /categories
5. /categories/:slug
6. /use-cases
7. /use-cases/:slug
8. /rankings
9. /compare
10. /community
11. /submit
12. /vendor
13. /saved
14. /login

HOMEPAGE
Build a strong home page with:
- Hero: “Find the right AI tool. Based on evidence, not hype.”
- Subcopy focused on discovering and ranking AI tools by real use case, business fit, verification, and community signal.
- Universal search with placeholder “Search AI tools, use cases, categories…”
- Quick filters: Marketing, Sales, Design, Coding, Productivity, Research, Video, Customer Support.
- “Top ranked this week” section with ranked tool rows/cards.
- “Browse by category” grid.
- “Best tools for…” use-case section.
- “Verified & reviewed” editorial section explaining verification model.
- “Trending in the community” compact activity feed.
- Vendor CTA for claiming/listing a product.
- Newsletter/insight CTA.
- Rich footer with directory links, company, vendors, legal.

TOOL DIRECTORY /tools
- Searchable, filterable directory.
- Left filter panel desktop; drawer on mobile.
- Filters: category, subcategory, use case, business vertical, pricing model, verification status, rating, platform, API availability.
- Sort: Best match, aiBean rank, rating, most reviewed, newest, trending.
- Result cards/rows with:
  logo, name, one-line positioning, category, pricing, verification badge, rating, review count, aiBean score, rank, key use cases, save button, compare checkbox.
- Show clear empty/loading/error states.
- Pagination or load more.

TOOL DETAIL /tools/:slug
Create a detailed SEO-friendly listing page with:
- Breadcrumbs.
- Logo + tool name + short descriptor.
- Verification badge and claim status.
- CTA buttons: Visit website, Save, Compare, Claim listing (when relevant).
- aiBean Score prominently displayed with score breakdown.
- User rating + review count.
- “Best for” use cases.
- Pricing summary.
- Overview.
- Key features.
- Pros / Cons.
- Use cases.
- Categories + verticals.
- Screenshots/gallery placeholders.
- Integrations/API/platform info.
- Verification panel.
- Ranking history / methodology snippet.
- Reviews section with rating distribution.
- Alternatives / similar tools.
- “People also compare”.
- Vendor disclosure/sponsored disclosure area if applicable.
- Last verified / last updated timestamp.
Use a realistic sample listing such as ChatGPT, Claude, Perplexity, Midjourney, Notion AI, Canva, Jasper, Cursor.

RANKING MODEL UI
Represent a transparent score, e.g. 0–100, with dimensions:
- Product capability
- User satisfaction
- Value
- Ease of use
- Reliability
- Business fit
- Verification confidence
Do not imply the scoring is objectively final; label methodology clearly.

VERIFICATION MODEL
Support and visually distinguish:
- Unverified
- Auto-Checked
- Human Reviewed
- Vendor Confirmed
- Needs Reverification

CLAIM STATUS
Support:
- Unclaimed
- Claim Pending
- Claimed
- Claim Disputed

MONETIZATION OBJECTS / UI READINESS
Design surfaces for:
- Paid submission
- Paid edit
- Featured placement
- Sponsored campaign
- Vendor subscription
Do not make misleading sponsored placements. Every sponsored/featured surface must be labeled.

CATEGORIES
Include useful top-level categories such as:
Writing & Content
Image & Design
Video
Audio & Voice
Developer Tools
Productivity
Research & Search
Marketing
Sales
Customer Support
Data & Analytics
Automation
Education
HR & Recruiting
Legal
Finance
Cybersecurity
Agents & Assistants
Use nested subcategories where appropriate.

VERTICALS
Examples:
Real Estate, Healthcare, Legal, Financial Services, Ecommerce, SaaS, Agencies, Education, Media, Retail, Hospitality, Construction, Manufacturing, Nonprofit.

USE CASES
Examples:
Write marketing copy, Generate images, Build software, Research a topic, Summarize documents, Automate workflows, Generate video, Customer support automation, Sales prospecting, Analyze data, Create presentations, Meeting notes, SEO content, Social media content, Recruiting, Legal research.

RANKINGS PAGE
- Editorial ranking pages such as “Best AI Tools Overall”, “Best AI Tools for Marketing”, “Best AI Coding Tools”, “Fastest Growing”.
- Ranking cards with transparent reason snippets.
- Methodology CTA.

COMPARE PAGE
- Allow 2–4 tools in a comparison table.
- Rows for aiBean score, price, ratings, best for, key features, integrations, API, verification, pros/cons.
- Preload sample comparison of ChatGPT vs Claude vs Gemini or similar.

COMMUNITY
- Activity-oriented community page rather than forum overload.
- Feed items: reviews, saves, comparisons, newly verified listings, comments.
- Topic chips.
- “Most discussed tools”.
- Keep interaction UI ready but mock auth state acceptable.

SAVED / STACKS
- Users can save tools into named stacks/collections.
- UI for “My AI Stack”.
- Each saved tool card has note, category, remove, compare.
- Empty state explains why stacks are useful.

SUBMIT TOOL
- Multi-step form:
  1 Basics
  2 Category/use cases/verticals
  3 Pricing/platform details
  4 Verification evidence
  5 Contact/vendor details
  6 Review & submit
- Clearly show free submission vs optional paid acceleration/enhancements without dark patterns.

VENDOR AREA
Landing/dashboard-ready page for vendors:
- Claim listing
- Edit profile
- Verification status
- Listing analytics placeholder
- Reviews snapshot
- Subscription/featured opportunities
- Sponsored campaign disclosures
- Explain vendor cannot directly buy ranking score.

AUTH
Build sign-in/sign-up screens and logged-in placeholders. Keep auth adapter-ready.

DATA MODELS
Create typed interfaces/types for:
Tool, Category, Subcategory, UseCase, Vertical, Review, RatingSummary, RankingScore, VerificationStatus, ClaimStatus, PricingModel, Vendor, SavedStack, Submission, SponsoredPlacement.

SAMPLE DATA
Seed enough realistic sample tools to make the experience convincing across categories. Use recognizable current AI tools but make clear ratings/scores are demo data. Include a small “Demo data” label where appropriate.

MICROINTERACTIONS
- Search autocomplete feel
- Save toggles
- Compare selections
- Filter chips
- Sticky compare bar when 2+ tools selected
- Responsive side filters
- Tabs on detail page
- Tooltips on verification and aiBean score.

QUALITY BAR
- No lorem ipsum.
- No broken routes.
- No dead-end primary CTAs where a sensible screen can be built.
- Use consistent spacing, radius, border, typography scale, and button hierarchy.
- Create loading skeletons, empty states, error states.
- Add responsive behavior for phone/tablet/desktop.
- Avoid giant hero sections that push useful content below the fold.

Start by implementing the complete visual MVP and all routes above with realistic mock data. Make the homepage, /tools, and /tools/:slug the strongest pages because they are the core product experience.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b946ed92-5b28-44ba-8a5a-98c934333aed).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
