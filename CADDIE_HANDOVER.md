# Caddie — Handover Document

**Last updated:** 2026-04-11

---

## About Nico

Nico is the founder and sole developer of Caddie. He is a competent engineer who is comfortable reading and writing React, JavaScript, and SQL, but is not a specialist and benefits from clear, specific explanations when encountering unfamiliar patterns. He prefers concise responses and dislikes unnecessary preamble. He is the `admin`-role user in production and uses the app himself as a student (profile ID: `2dfb89f4-3c40-4c70-a025-7d486d0acda1`).

---

## What Caddie Is

Caddie is a mobile-first golf coaching app for Greenock Golf Club. Students log rounds hole-by-hole on their phones and send them to their coach. The coach sees a dashboard with scorecards, stats, AI-generated putting/short game analysis, and trend charts. There is no public signup — students join via coach-generated invite links.

Three roles exist: `student`, `coach`, and `admin`. Role is stored in `profiles.role` and gates the entire UI. Admin users get access to AdminDashboard but can also switch into a student view of their own rounds.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 (Create React App), all CSS in JS template literals, no component library |
| Backend/DB | Supabase (Postgres + Auth + RLS) |
| AI analysis | Anthropic Claude API (`claude-sonnet-4-20250514`) via `/api/ai.js` serverless function |
| Email notifications | Resend via `/api/notify-coach.js` serverless function |
| Hosting | Vercel (serves CRA build + `/api` serverless functions) |
| Fonts | Playfair Display (headings), Outfit (body) via Google Fonts |

No routing library — screen state is managed in `App.js` via `useState`.

---

## Supabase Project

**URL:** `https://xyruyxfcwxhdyzvrzxqg.supabase.co`

Credentials for scripts live in `.env` (gitignored):
```
SUPABASE_URL=https://xyruyxfcwxhdyzvrzxqg.supabase.co
SUPABASE_SERVICE_KEY=<service role key>
```

The React app uses `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` (set in Vercel env vars, not in `.env`).

AdminDashboard requires `REACT_APP_SUPABASE_SERVICE_KEY` set as a Vercel env var. Without it the admin client falls back to the anon key and RLS filters results incorrectly.

---

## Schema

### `profiles`
| column | type | notes |
|---|---|---|
| id | uuid | FK → `auth.users.id` |
| first_name | text | |
| last_name | text | |
| role | text | `'student'`, `'coach'`, or `'admin'` |
| official_handicap | numeric(4,1) | WHS index stored by student |
| is_premium | bool | unlocks analytics and per-round AI in StudentLogging |
| onboarding_complete | bool | gates StudentOnboarding flow |
| onboarding_complete_coach | bool | gates CoachOnboarding flow |
| phone | text | collected during coach onboarding |
| bio | text | collected during coach onboarding |
| home_courses | text[] or json | collected during coach onboarding |

### `rounds`
| column | type | notes |
|---|---|---|
| id | uuid | |
| student_id | uuid | FK → `profiles.id` |
| course_id | uuid | FK → `courses.id` |
| holes_played | int | 9 or 18 (occasionally other values from older data) |
| total_score | int | null until round is complete |
| total_par | int | stored at time of round; used for vs-par calculations if present |
| total_putts | int | |
| handicap | int | course handicap at time of round |
| whs_index | numeric | WHS index at time of round; used for handicap trend chart |
| sent_to_coach | bool | triggers visibility on coach dashboard |
| sent_at | timestamptz | |
| wind | text | |
| conditions | text | |
| temperature | text | |
| student_note | text | |
| coach_note | text | saved by coach from CoachDashboard |
| historical | bool | true for rounds entered retrospectively via the historical round modal |
| created_at | timestamptz | |

### `round_holes`
| column | type | notes |
|---|---|---|
| id | uuid | |
| round_id | uuid | FK → `rounds.id` |
| hole_number | int | |
| par | int | |
| score | int | |
| putts | int | |
| putt1 | text | first putt distance, e.g. `"12"`, `"20+"`, `"<3"` |
| putt2 | text | second putt distance |
| gir | bool | greens in regulation |
| fairway | text | `'left'`, `'right'`, `'yes'`, `'miss'` |
| approach | text | distance band — see note on en-dash vs hyphen below |
| shots_inside_50 | int | number of shots played inside 50 yards on this hole |
| penalty | text | `'None'` or description e.g. `'OB'`, `'Hazard'` |
| dna | bool | did not attempt (incomplete hole) |
| picked_up | bool | player picked up; scores as net double bogey |
| stroke_index | int | SI stored at time of logging; may be null for older rounds |

### `courses`
| column | type | notes |
|---|---|---|
| id | uuid | |
| name | text | |

### `course_holes`
| column | type | notes |
|---|---|---|
| course_id | uuid | FK → `courses.id` |
| hole_number | int | |
| par | int | |
| yardage | int | nullable |
| stroke_index | int | used for Stableford calc and prorated handicap |

### `coach_students`
| column | type | notes |
|---|---|---|
| coach_id | uuid | FK → `profiles.id` |
| student_id | uuid | FK → `profiles.id` |

Supports multiple rows per student (multiple coaches). Free students are limited to 1 coach in the UI; premium students can link up to 3.

### `invites`
| column | type | notes |
|---|---|---|
| id | uuid | |
| code | text | random alphanumeric, used in invite URL |
| coach_id | uuid | FK → `profiles.id` |
| invite_type | text | `'student'` (default) or `'coach'` |
| used_by | uuid | FK → `profiles.id`, set on redemption |

### `course_flags`
| column | type | notes |
|---|---|---|
| id | uuid | |
| course_id | uuid | FK → `courses.id` |
| note | text | student-submitted course correction note |
| created_at | timestamptz | |
| resolved | bool | admin marks resolved |
| flagged_by | uuid | FK → `profiles.id` |

### `feedback`
| column | type | notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK → `profiles.id` |
| category | text | `'Bug'`, `'Suggestion'`, or `'General'` |
| message | text | |
| page | text | which screen the feedback came from |
| created_at | timestamptz | |

### Computed fields (not stored — derived client-side from `round_holes`)
`gir_count`, `three_putt_count`, `attempted_holes`, `fw_hit`, `fw_holes`, `stableford_total`, `stableford_holes`, `scrambling_made`, `scrambling_opps` are all computed when enriching rounds for display. Do not add these as DB columns.

---

## Courses

| Course | ID | Par | Holes | Hole pars |
|---|---|---|---|---|
| Wee Course | `89e2ad4e-8d5a-4244-8568-b2c8a448a77f` | 32 | 9 | 4,4,3,4,3,4,4,3,3 |
| Greenock Golf Club — Big Course | `b1a2c3d4-e5f6-7890-abcd-ef1234567890` | 68 | 18 | 4,4,3,4,5,4,3,4,4,3,4,4,3,4,4,3,4,4 |

The `COURSE_PAR` lookup object appears in both `StudentDashboard.jsx` and `CoachHome.jsx` — keep them in sync.

---

## Test Accounts

| Name | Email | Password | Role | Profile ID |
|---|---|---|---|---|
| Nico McNelis | *(Nico's real account)* | — | admin | `2dfb89f4-3c40-4c70-a025-7d486d0acda1` |
| Coach Demo | *(coach's real account)* | — | coach | `2390d6cf-b83f-43e3-9810-e3bd225c876e` |
| Jamie Stewart | `jamie@caddie-test.com` | `CaddieTest123!` | student | *(recreated on each seed run)* |
| Craig Burns | `craig@caddie-test.com` | `CaddieTest123!` | student | *(recreated on each seed run)* |

Jamie has 12 rounds trending **improving** (+14 → +8 vs par, course handicap 14 → 8, official WHS index seeded at 4.0).
Craig has 12 rounds trending **worsening** (+8 → +14 vs par, course handicap 8 → 14, official WHS index seeded at 10.0).
Both are linked to Coach Demo via `coach_students`. Every 3rd round in the seed is 18-hole; the rest are 9-hole.

---

## Source File Map

| File | Purpose |
|---|---|
| `src/App.js` | Root — auth state, role routing, screen state machine |
| `src/CaddieAuth.jsx` | Login / signup / invite redemption |
| `src/StudentOnboarding.jsx` | Multi-step onboarding for new students (gated by `onboarding_complete`) |
| `src/CoachOnboarding.jsx` | Multi-step onboarding for new coaches: Welcome → Beta → Profile → Home course → Invite → Done (gated by `onboarding_complete_coach`) |
| `src/StudentDashboard.jsx` | Student home: hero stats, coach section, trend charts, analytics, round list, historical round entry modal |
| `src/StudentLogging.jsx` | Hole-by-hole round entry + overview + send-to-coach |
| `src/CoachHome.jsx` | Coach home: student list, round history, trend charts, analytics tab |
| `src/CoachDashboard.jsx` | Coach round detail: scorecard, stats, AI analysis, coach notes |
| `src/AdminDashboard.jsx` | Admin: coaches table, students table, relationships, courses, course flags, feedback |
| `src/ProfilePage.jsx` | Profile editing for students and coaches |
| `src/StudentSettings.jsx` | Student settings screen |
| `src/CourseForm.jsx` | Add / edit course form (accessible from logging and profile) |
| `src/FeedbackButton.jsx` | Floating feedback button shown on most screens |
| `src/supabaseClient.js` | Supabase client initialisation (anon key) |
| `api/ai.js` | Vercel serverless function — proxies to Anthropic API, injects golf-specific system prompt |
| `api/notify-coach.js` | Vercel serverless function — fires email to coach via Resend when student sends a round |
| `scripts/seed-test-data.js` | Seeds Jamie & Craig with 12 rounds each |
| `scripts/setup-demo.js` | Sets demo credentials (jamie@caddie-test.com / craig@caddie-test.com), purges test users |
| `scripts/migrate-official-handicap.js` | One-off migration script for `official_handicap` column |
| `scripts/add-profile-columns.js` | One-off migration script for new profile columns |

---

## Key Definitions

### Approach bands
Stored in `round_holes.approach`. Two sources write this field with different dash characters:

| Source | Format | Example |
|---|---|---|
| `scripts/seed-test-data.js` | **en-dash** | `"50–75"` |
| `src/StudentLogging.jsx` (live rounds) | **hyphen** | `"50-75"` |

Analytics in both `CoachHome.jsx` and `StudentDashboard.jsx` filter with **en-dash** keys, meaning they will match seeded/imported data but **not** live rounds logged by students. This is a known data inconsistency.

`StudentLogging.jsx` uses `BAND_KEYS` (hyphens) for state and `BAND_LABELS` (en-dashes) for display only — the value written to the DB is the hyphen form.

### `parseFt(v)` — first putt distance parser
Two slightly different implementations exist:

- **CoachHome / CoachDashboard**: `!v → 0`, `"30+" or "20+" → parseInt + 2`, `"7+" → 8`, else `parseInt`
- **StudentDashboard / StudentLogging**: `!v → null`, `"<3" → 1.5`, `"30+" → 32`, else `parseFloat`

The StudentDashboard version is more precise. CoachDashboard's version returns 0 for missing values rather than null.

### `parsePutt2(v)` — second putt distance parser
Consistent across files: `!v → null`, `"<1" → 0.5`, else `parseFloat`.

### `getCoursePar(round)`
- Prefers `round.total_par` (stored at round time)
- Falls back to `COURSE_PAR` lookup by `course_id` (StudentDashboard only)
- Then falls back to `holes_played`: 18 → 68, 9 → 32
- CoachHome also has a proportional fallback: `Math.round(holes_played * 68 / 18)` for non-standard lengths

### Stableford
Computed from `stroke_index` (stored on `round_holes`) with fallback to `course_holes` SI map. Holes with `dna = true` are excluded; `picked_up` holes score 0 points but count toward the denominator. Displayed as points-per-hole for cross-round comparison.

### Handicap (prorated)
`prorateHandicap(round, holeStatsMap)` computes how many handicap shots the player received across the holes actually played, using stored stroke indexes. Used for net vs par chart.

### Analytics — round selection
Both `AnalyticsTab` (CoachHome) and `StudentAnalytics` (StudentDashboard) default to **Last 5** rounds and support 5/10/20/50 selectors. `N = analyticsCount` is used raw with no bounds validation.

- **CoachHome**: receives only `sent_to_coach = true` rounds (filtered at DB query)
- **StudentDashboard**: receives all completed rounds regardless of `sent_to_coach` status

### AI model
All AI calls use `claude-sonnet-4-20250514` with `max_tokens` of 800 (CoachHome pattern analysis / overview) or 1000 (CoachDashboard round detail). `/api/ai.js` injects a detailed golf system prompt covering approach interpretation, GIR, putting, scrambling, Stableford, and tone guidelines.

### Email notifications
`/api/notify-coach.js` is called fire-and-forget (`fetch(...).catch(() => {})`) when a student sends a round. It sends one email per coach via Resend. Requires `RESEND_API_KEY` in Vercel env vars. If the key is absent the function returns `{ ok: true }` silently. Currently sends from `onboarding@resend.dev` (Resend sandbox) — a custom domain must be configured in Resend before going to production.

---

## Known Issues / Gotchas

**Approach band en-dash/hyphen mismatch**: Live rounds written by `StudentLogging.jsx` store hyphen-separated approach values (`"50-75"`). Analytics code in both CoachHome and StudentDashboard filters with en-dash keys (`"50–75"`), matching only seeded data. Live student rounds will show no data in the analytics approach table.

**`no-unused-vars` ESLint warning**: Destructured variables only used in removed code trigger warnings that block clean builds. Always remove unused destructured vars before committing.

**Hooks before early returns**: `useState` must be called before any conditional `return null`. Relevant in `StudentRoundTrends` and `StudentAnalytics`.

**`trendDirection` empty-reduce crash**: `vals.slice(0, -3)` is empty when `vals.length === 3`. Guard with `if (!olderVals.length) return null` and pass `0` as initial value to `.reduce()`.

**`slice(-10)` vs `slice(0, 10).reverse()`**: Rounds come from Supabase ordered newest-first. Use `.slice(0, 10).reverse()` to get the 10 most recent in chronological order for chart display.

**`attempted_holes`, `gir_count`, etc. are not DB columns**: Do not try to insert them into `rounds`.

**`profiles.id` requires a real `auth.users` entry**: Use `supabase.auth.admin.createUser()` first, then upsert the profile.

**`invites.used_by` FK blocks profile deletion**: Null it out before deleting: `UPDATE invites SET used_by = NULL WHERE used_by = '<id>'`.

**`holes_played` strict equality filtering**: Both trend chart splits (`r9`/`r18`) use `=== 9` and `=== 18`. Rounds with non-standard `holes_played` values (e.g. 10, which has appeared in Nico's data) are silently excluded from both tabs.

**AdminDashboard needs `REACT_APP_SUPABASE_SERVICE_KEY`**: Must be set in Vercel env vars. Without it the admin client uses the anon key and RLS filters results, breaking the admin view.

**Stableford excluded when SI is 0**: Holes with unknown stroke index (`si === 0`) are excluded from the Stableford denominator, which can cause a round to be excluded from the Stableford chart entirely if no SI data is available.

---

## Monetisation

Premium access is controlled by `profiles.is_premium` (toggled by admin in AdminDashboard). Premium unlocks:

- **Putting Analytics tab** in StudentDashboard (`StudentAnalytics` component)
- **AI round summary** in StudentLogging overview screen (after round complete or sent)

Free users see upgrade prompts for both. There is currently no payment flow — premium is granted manually by admin.

---

## Marketing

Caddie is in private beta at Greenock Golf Club. There is no public signup. Students join via invite link generated by their coach. Coach accounts are created by admin or via a `'coach'`-type invite. The primary growth mechanism is coach word-of-mouth within the club.

---

## Priority Tasks

- [x] Coach ability to add written feedback on a round — textarea in CoachDashboard saves to `rounds.coach_note`
- [x] Student-facing view of coach notes — displayed on round cards in StudentDashboard when `coach_note` is set
- [x] Email alerts when a student sends a round to their coach — implemented via `/api/notify-coach.js` + Resend
- [x] Multiple coaches per student — students can link up to 3 coaches (premium gate), free limited to 1
- [x] Coach onboarding flow — CoachOnboarding component, 6-step, gated by `onboarding_complete_coach`
- [x] Admin dashboard improvements — coaches/students split into separate tables, round stats, premium toggle, feedback delete
- [x] Historical round entry — students can log past rounds via a modal in StudentDashboard
- [x] WHS index tracking — stored per round, rendered as Handicap trend chart in StudentDashboard
- [ ] **Fix approach band key mismatch** — `StudentLogging.jsx` writes hyphens; analytics code expects en-dashes; live rounds show no data in analytics approach table
- [ ] Handicap tracking over time (chart exists; needs more rounds with `whs_index` populated)
- [ ] Invite link expiry / single-use enforcement
- [ ] Round editing after send (currently locked once sent to coach)
- [ ] Mobile PWA / add-to-home-screen manifest
- [ ] Multi-course support beyond Wee Course and Big Course
- [ ] Resend custom domain — currently sends from `onboarding@resend.dev` (sandbox); configure real domain before broader rollout
- [ ] Push notifications (email is done; native push is not)

---

## Response Preferences

- Be concise. No preamble, no trailing summaries.
- Show exact file paths and line numbers when referencing code.
- Do not add features, refactor, or clean up surrounding code beyond what was asked.
- Do not add comments, docstrings, or type annotations to unchanged code.
- Do not create helper abstractions for one-off operations.
- When making changes, check for unused variables before committing — ESLint treats them as warnings that can block builds.
- Commit messages: lowercase imperative, e.g. `fix: align analytics defaults` or `feat: multiple coaches`.
