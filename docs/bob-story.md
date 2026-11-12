# SkillBridge AI — Bob Story

This document records how IBM Bob contributed to the design, implementation, and refinement of SkillBridge AI throughout the IBM Bobathon 2026.

---

## Day 1 — Foundation (6 November 2026)

### Architecture Decisions Made with Bob

**Decision: Demo-first authentication**
Rather than implement full JWT + bcrypt auth that would consume 1–2 days of hackathon time, Bob recommended a pre-seeded demo user with a `POST /api/session/start` reset endpoint. This allows a complete end-to-end demo without a login wall, while keeping the architecture open for real auth post-hackathon. The `users` and `profiles` tables are already structured to support it.

**Decision: Vite proxy for API calls**
Bob recommended configuring the Vite `server.proxy` to forward `/api/*` to the Express server at `http://localhost:3001`. This eliminates the need for absolute URLs in frontend code and removes CORS complexity during development.

**Decision: `better-sqlite3` over async SQLite drivers**
Bob recommended `better-sqlite3` for the synchronous API, which avoids async complexity in a single-user prototype and is significantly simpler to reason about during rapid development.

**Decision: Tailwind component layer in CSS**
Rather than defining component variants in JavaScript, Bob recommended using Tailwind's `@layer components` to define `.btn`, `.btn-primary`, `.card`, `.badge` etc. in `index.css`. This keeps component JSX clean and ensures consistent styling without a component library dependency.

**Decision: Deterministic scoring + LLM explanation separation**
A key architectural decision: match scores are computed in pure backend code from set intersections. The LLM only writes the explanation text. This prevents AI from inventing or inflating scores and makes the system auditable.

### Key Prompts Used

**Prompt 1 — Architecture review:**
> "Act as a senior software architect. Analyse these requirements for a hackathon project called SkillBridge AI and return: product architecture, folder structure, dependencies, database schema, API endpoints, AI workflow, security considerations, development phases, risks, and MVP scope."

**Prompt 2 — Refinement:**
> "We approve the revised SkillBridge AI architecture. Simplify authentication to a demo-first approach. Reduce dependencies to the minimum viable set. Use deterministic backend scoring for opportunity matching. Recommend one LLM provider. Rework the schedule to an achievable 8-day plan."

**Prompt 3 — Day 1 implementation:**
> "Begin Day 1 implementation: Foundation. Create the project structure, React + Vite frontend, Tailwind CSS, Express backend, SQLite schema, demo session, landing page with Start Demo button, GET /api/session and health check endpoints."

### Files Generated on Day 1

| File | Purpose |
|---|---|
| `server/package.json` | Backend dependencies |
| `server/.env.example` | Environment variable template |
| `server/src/app.js` | Express server entry point |
| `server/src/db/database.js` | SQLite init, schema, demo seed |
| `server/src/routes/health.js` | Health check endpoint |
| `server/src/routes/session.js` | Demo session GET/POST |
| `client/package.json` | Frontend dependencies |
| `client/vite.config.js` | Vite + API proxy config |
| `client/tailwind.config.js` | Design system tokens |
| `client/postcss.config.js` | PostCSS config |
| `client/index.html` | HTML entry point |
| `client/src/index.css` | Global styles + component layer |
| `client/src/main.jsx` | React root |
| `client/src/App.jsx` | Router and route declarations |
| `client/src/services/api.js` | Fetch wrapper + endpoint functions |
| `client/src/components/ui/Button.jsx` | Button primitive |
| `client/src/components/ui/Card.jsx` | Card primitive |
| `client/src/components/ui/Badge.jsx` | Badge primitive |
| `client/src/components/layout/SiteHeader.jsx` | Navigation header |
| `client/src/components/layout/SiteFooter.jsx` | Site footer with disclaimer |
| `client/src/components/layout/PageShell.jsx` | Page wrapper |
| `client/src/pages/LandingPage.jsx` | Full landing page |
| `client/src/pages/OnboardingPage.jsx` | Placeholder (Day 2) |
| `client/src/pages/DashboardPage.jsx` | Placeholder (Day 7) |
| `client/src/pages/OpportunitiesPage.jsx` | Placeholder (Day 4) |
| `client/src/pages/RoadmapPage.jsx` | Placeholder (Day 6) |
| `client/public/favicon.svg` | Product favicon |
| `shared/skillTaxonomy.json` | Skill name normalisation map |
| `.gitignore` | Repository exclusions |
| `README.md` | Project documentation |

### Implementation Notes

- The `POST /api/session/start` endpoint resets all AI-generated data (skills, matches, gaps, roadmaps) for clean demo restarts without needing to wipe the database.
- All JSON fields in SQLite (arrays, objects) are stored as TEXT and parsed server-side with `safeParseJson` helpers.
- The `skillTaxonomy.json` normalisation map covers 90+ common skill name variants and will be used from Day 3 (skill extraction) onwards.
- The Tailwind design system establishes six brand colours: green (CTA), green-light (highlights), amber (gaps), amber-light (gap backgrounds), surface (page background), and a three-level text scale.

---

## Day 2 — Profile Builder (7 November 2026)

### Objectives
Implement a complete, polished, multi-step profile builder covering: personal information, career interests, skills (technical/soft/domain), projects and experience, certifications and learning, and a review/save step.

### Architecture Decisions Made with Bob

**Decision: Profiles table is already schema-complete**
Inspected the Day 1 `profiles` table — it already has `education`, `experience`, `certifications`, `projects`, `career_interests`, `headline`, `location`, `about`, and `onboarding_step`. Only one new column was needed: `personal_info` (JSON) to store name, email, currentStatus, qualification, institution, graduationYear. Added via a migration function using `ALTER TABLE` wrapped in try/catch so it runs safely on existing databases.

**Decision: Single `PUT /api/profile` endpoint, fully idempotent**
Rather than separate endpoints per section, a single `PUT /api/profile` accepts any combination of fields and updates only what was sent. Skills use `ON CONFLICT DO UPDATE` for upserts — no duplicate records possible.

**Decision: Skills stored in `user_skills` table, not in profiles JSON**
Keeping skills in a normalised table (`user_skills`) enables efficient querying, deduplication, and future AI annotation (Day 3). The profile builder sends the full skills array on save; the API deletes user-added skills and reinserts them.

**Decision: Auto-save on Next, full save on Review**
Each "Next" click saves progress to the backend before advancing. This means progress survives browser refresh, backend restart, and re-opening the app. The `onboarding_step` field records where the user was so they resume at the right step.

**Decision: `mapProfileToForm` / `mapFormToApi` helpers**
Clean separation between the API's snake_case JSON structure and the React form's camelCase state. Avoids leaking backend naming conventions into the UI layer.

**Decision: Three-panel skill entry (technical/soft/domain)**
Rather than a single flat skill list, skills are entered in three separate `SkillTagInput` sections. This makes the distinction explicit and prepares the data for Day 3's AI analysis, which uses category as a signal.

### Key Prompts Used

**Prompt 1 — Day 2 brief:**
> "Implement a complete, functional, polished profile builder. Inspect the existing project files first. [full Day 2 requirements]"

**Prompt 2 — Validation decision:**
> "Should each step save to backend on Next, or only on final Save? What's the best UX for a hackathon demo?"
Bob recommended: save on every Next so progress is durable. Final Review step has explicit "Save My Profile" CTA.

### Files Created on Day 2

| File | Purpose |
|---|---|
| `server/src/routes/profile.js` | `GET /api/profile` and `PUT /api/profile` |
| `client/src/data/skillSuggestions.js` | Curated skill/role/domain suggestions |
| `client/src/components/ui/SkillTagInput.jsx` | Tag/chip input with suggestions |
| `client/src/components/onboarding/StepProgress.jsx` | Step wizard progress indicator |
| `client/src/components/onboarding/StepPersonal.jsx` | Step 1 — personal info |
| `client/src/components/onboarding/StepCareerInterests.jsx` | Step 2 — career interests |
| `client/src/components/onboarding/StepSkills.jsx` | Step 3 — skills |
| `client/src/components/onboarding/StepExperience.jsx` | Step 4 — projects & experience |
| `client/src/components/onboarding/StepCertifications.jsx` | Step 5 — certifications |
| `client/src/components/onboarding/StepReview.jsx` | Step 6 — review & save |

### Files Modified on Day 2

| File | Change |
|---|---|
| `server/src/db/database.js` | Added `runMigrations()` to add `personal_info` column |
| `server/src/app.js` | Registered `/api/profile` route |
| `client/src/services/api.js` | Added `getProfile()` and `updateProfile()` |
| `client/src/components/ui/index.js` | Exported `SkillTagInput` |
| `client/src/pages/OnboardingPage.jsx` | Full implementation replacing placeholder |
| `client/src/pages/DashboardPage.jsx` | Post-save landing page with profile summary |

### Testing Performed

- ✅ Start Demo → navigates to /onboarding
- ✅ Step 1 validates: blocks Next if fullName or currentStatus empty
- ✅ Skill chips: add by typing+Enter, add by clicking suggestion, remove with × button
- ✅ Experience accordion: add, expand, fill, collapse, delete multiple entries
- ✅ Certifications: add, fill, remove entries
- ✅ Review step shows all entered data; Edit buttons navigate back to correct step
- ✅ Next saves progress; browser refresh resumes at correct step
- ✅ Save My Profile → navigates to /dashboard showing name and skills
- ✅ GET /api/profile returns full profile including skills array
- ✅ PUT /api/profile twice does not create duplicate skill records
- ✅ Empty experience/certifications allowed (zero items)

## Day 3 — AI Skill Extraction (8 November 2026)

### Objectives
Build a backend-orchestrated skill extraction workflow using IBM watsonx.ai (Granite 4.0) with a deterministic keyword-match fallback, a full user review UI, and category standardisation throughout the application.

### IBM watsonx.ai — Verified Facts (from official docs, searched during Day 3)

| Fact | Verified value |
|---|---|
| Lite plan token quota | **300,000 tokens/month** (updated July 2025; FAQ showing 50k is outdated) |
| Lite plan rate limit | **2 requests/second** |
| Multitenant model (current) | **`ibm/granite-4-h-small`** — Granite 4.0, 30B params, Dallas/Frankfurt |
| Withdrawn models | `granite-3-8b-instruct`, `granite-3-3-8b-instruct`, `granite-3-2-8b-instruct` withdrawn Feb 2026 — NOT to be used |
| Node.js SDK auth | `WATSONX_AI_AUTH_TYPE=iam` + `WATSONX_AI_APIKEY` via `process.env`, `WatsonXAI.newInstance({version, serviceUrl})` |
| SDK install | `npm install @ibm-cloud/watsonx-ai` |

### IBM watsonx Orchestrate — Deliberate Non-Integration
Researched watsonx Orchestrate during Day 3 planning. Documented conclusion: Orchestrate is an enterprise workflow automation platform (Salesforce/SAP connectors, conversational agents for business users). It is not a general-purpose LLM inference API and is not appropriate for embedding into a custom web application. The correct IBM service for server-side inference is watsonx.ai. This decision is recorded for the Bob Story and hackathon presentation.

### Architecture Decisions Made with Bob

**Decision: `ibm/granite-4-h-small` as the inference model**
All Granite 3.x multitenant models were withdrawn from IBM Cloud on 22 February 2026. Bob searched the official watsonx.ai release notes and confirmed that `granite-4-h-small` (Granite 4.0, 30B) is the current active multitenant model for Dallas and Frankfurt regions.

**Decision: Modular LLM client with auto-fallback**
`llmClient.js` checks for credentials on initialisation. If any of `WATSONX_AI_APIKEY`, `WATSONX_AI_URL`, or `WATSONX_AI_PROJECT_ID` are absent, `isAvailable()` returns false and the extractor falls back automatically to keyword matching. No code changes needed to switch between modes.

**Decision: Evidence validation step**
After AI extraction, every evidence string is verified against the actual profile text using substring matching. Unverifiable evidence is replaced with a section-level attribution ("Certifications and learning") so users always see a traceable reference — never a hallucinated quote.

**Decision: `keyword_match` source label, no confidence score**
Keyword-matched skills are labelled `matchMethod: 'keyword_match'` and carry no `confidence` value. Displaying an arbitrary 0.7 score would misrepresent certainty. The UI clearly distinguishes the two methods.

**Decision: Standardise categories to `technical | soft | transferable`**
The previous `domain` category was renamed to `transferable` throughout: DB migration, profile route validation, all frontend components, skill tag colours. A legacy alias is preserved for backward compatibility with saved profiles.

**Decision: User-added skills are never overwritten**
`POST /api/skills/confirm` checks each skill against `source = 'user_added'`. User-entered skills always take precedence. Only `ai_extracted` skills can be updated via the confirmation endpoint.

### Key Prompts Used

**Prompt 1 — Architecture recommendation:**
> "Recommend a Day 3 implementation approach. Does not require paid API key. Evaluate IBM watsonx Orchestrate trial. Explain which services are actually needed."

**Prompt 2 — Verification and refinement:**
> "Verify currently available Granite model IDs and actual Lite-plan quota. Follow current official Node.js SDK docs. Standardise skill categories. Validate evidence. No arbitrary confidence scores. Never save unconfirmed skills."

### Files Created on Day 3

| File | Purpose |
|---|---|
| `server/src/services/llmClient.js` | watsonx.ai Node.js SDK wrapper — lazy init, credential check, `generate()` |
| `server/src/services/skillExtractor.js` | Profile aggregation, AI extraction, keyword fallback, evidence validation |
| `server/src/routes/skills.js` | `GET /api/skills`, `POST /api/skills/extract`, `POST /api/skills/confirm`, `DELETE /api/skills/:id` |
| `client/src/pages/SkillExtractionPage.jsx` | Review UI — accept/edit/reject per suggestion, bulk actions, save footer |

### Files Modified on Day 3

| File | Change |
|---|---|
| `server/src/db/database.js` | Added `domain → transferable` data migration in `runMigrations()` |
| `server/src/routes/profile.js` | Updated category validation: `domain` → `transferable` |
| `server/src/app.js` | Registered `/api/skills` route |
| `server/.env.example` | Added watsonx.ai configuration with model notes and setup guide |
| `client/src/services/api.js` | Added `getSkills()`, `extractSkills()`, `confirmSkills()`, `deleteSkill()` |
| `client/src/data/skillSuggestions.js` | Renamed `DOMAIN_SKILLS` → `TRANSFERABLE_SKILLS`, updated ALL_SUGGESTIONS categories |
| `client/src/components/onboarding/StepSkills.jsx` | Updated to `transferable` category throughout |
| `client/src/components/onboarding/StepReview.jsx` | Updated skill filter and badge label |
| `client/src/components/ui/SkillTagInput.jsx` | Added `transferable` to colour map |
| `client/src/pages/DashboardPage.jsx` | Wired "AI Skill Analysis" card to `/skills/review` route |
| `client/src/App.jsx` | Registered `/skills/review` → `SkillExtractionPage` route |

### Testing Performed

- ✅ Keyword fallback: POST /api/skills/extract without watsonx.ai credentials → returns keyword_match results with source sections as evidence
- ✅ Category migration: `domain` skills in DB updated to `transferable` on server restart
- ✅ Profile route: accepts `transferable` category; rejects unknown values
- ✅ Confirm endpoint: saving same skill twice does not create duplicate; `user_added` skills preserved
- ✅ Evidence validation: unverifiable AI evidence replaced with section reference, flagged as `evidenceVerified: false`
- ✅ Review UI: accept/reject toggles work; edit name inline; bulk accept/reject; save sends only accepted skills
- ✅ UI: `keyword_match` banner shown correctly; no confidence score displayed for keyword matches
- ✅ Rejected suggestions do not appear in confirmed save payload
- ✅ Dashboard "AI Skill Analysis" card navigates to `/skills/review`

## Day 4 — Opportunity Data + Matching (9 November 2026)

### Objectives
Build a deterministic opportunity matching engine, a 20-entry curated dataset, a full opportunities discovery page with search/filter/save, and an opportunity detail page with skill breakdown.

### Architecture Decisions Made with Bob

**Decision: All scoring is deterministic — no AI involved**
Match scores are computed entirely from set intersections in `opportunityMatcher.js`. The LLM is not called for matching. This keeps scores reproducible, auditable, and independent of AI availability. Template-generated explanations reference the actual computed numbers.

**Decision: Static-path routes before /:id in Express**
`/saved/list` and `/meta` must be registered before `/:id` to prevent Express matching `saved` and `meta` as opportunity IDs. All static routes are placed in definition order above the parameterised route.

**Decision: URL-driven filters with `useSearchParams`**
Filter state lives in the URL query string (via React Router `useSearchParams`). This means filter state survives page refresh and is shareable by URL — a UX improvement over local component state at zero extra cost.

**Decision: Saved tab fetches on demand**
The Saved tab calls the API only when first activated, not on every render. This avoids redundant requests on a page that most users don't immediately navigate to.

### Scoring Formula (documented)

| Component | Weight | Formula |
|---|---|---|
| Core (required skills) | 70 pts max | `(presentRequired / requiredSkills.length) * 70` |
| Preferred skills | 30 pts max | `(presentPreferred / preferredSkills.length) * 30` |
| No requirements | Partial | `35 pts` (credit when no requirements listed) |
| Cap | 100 | `Math.min(100, round(core + preferred))` |

Tier labels: Strong Match (≥80), Good Match (≥55), Partial Match (≥30), Low Match (<30).

### Files Created on Day 4

| File | Purpose |
|---|---|
| `server/src/data/opportunities.json` | 20 curated fictional opportunities with Bengaluru context |
| `server/src/services/opportunityMatcher.js` | Deterministic scoring engine + explanation builder |
| `server/src/routes/opportunities.js` | 5 API endpoints (list, meta, saved, detail, save toggle) |
| `client/src/components/opportunities/OpportunityCard.jsx` | Opportunity card with match score, skill chips, save button |
| `client/src/pages/OpportunityDetailPage.jsx` | Full detail page with skill breakdown and save action |

### Files Modified on Day 4

| File | Change |
|---|---|
| `server/src/app.js` | Registered `/api/opportunities` |
| `client/src/services/api.js` | Added 5 opportunity endpoint functions |
| `client/src/pages/OpportunitiesPage.jsx` | Full implementation replacing placeholder |
| `client/src/pages/DashboardPage.jsx` | "Discover Opportunities" card wired to `/opportunities` |
| `client/src/App.jsx` | Registered `/opportunities` and `/opportunities/:id` routes |

### Dataset Summary

20 opportunities across 9 domains:
- Web Development: 7 (frontend, backend, fullstack, Node.js, TypeScript/React, Angular/Vue, React Native)
- Data Analytics: 1
- Data Science & AI: 2 (Data Science Intern, ML Engineer Intern)
- Quality Assurance: 1
- Business Analysis: 1
- Cloud & DevOps: 2
- Technical Writing: 1
- IT Support: 1
- Product Management: 1
- Digital Marketing: 1

Work arrangements: 8 onsite, 7 hybrid, 5 remote
Opportunity types: 13 full-time, 7 internship

### Testing Performed

- ✅ GET /api/opportunities returns all 20 with match scores
- ✅ GET /api/opportunities/meta returns correct domain/arrangement/type lists
- ✅ GET /api/opportunities/saved/list returns only saved (not /:id confusion)
- ✅ GET /api/opportunities/opp-001 returns correct single opportunity
- ✅ POST /api/opportunities/opp-001/save toggles saved state correctly
- ✅ Score of 0 skills → all scores are 0% or 35% (no requirements), no false matches
- ✅ Score formula reproducible: same skills always produce same score
- ✅ Filter by domain reduces results correctly
- ✅ Filter by workArrangement reduces results correctly
- ✅ Search by title/company works
- ✅ Opportunity card navigation to detail page works
- ✅ Dashboard "Discover Opportunities" card navigates to /opportunities

## Day 5 — Opportunity Detail + Gap Analysis (10 November 2026)
*(To be completed)*

## Day 6 — Learning Roadmap (11 November 2026)
*(To be completed)*

## Day 7 — Dashboard + Polish (12 November 2026)
*(To be completed)*

## Day 8 — Hardening + Submission (13–14 November 2026)
*(To be completed)*
