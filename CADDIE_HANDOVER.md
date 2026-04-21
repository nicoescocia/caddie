# Caddie — Handover Document

**Last updated:** 2026-04-21

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
| is_premium | bool | unlocks analytics and per-round AI in StudentLogging; also gates pre-lesson AI brief for coaches |
| ai_brief_enabled | bool | coach-only; if false, suppresses AI brief generation even for premium coaches; defaults to true |
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
| ai_analysis | text | nullable; cached JSON `{ putting, sg }` from CoachDashboard AI call — set once on first coach view, never cleared |
| historical | bool | true for rounds entered retrospectively via the historical round modal |
| created_at | timestamptz | |

### `round_holes`
| column | type | notes |
|---|---|---|
| id | uuid | |
| round_id | uuid | FK → `rounds.id` |
| hole_number | int | |
| par | int | |
| score | int | null for `dna = true` holes; stores net double bogey for `picked_up = true` holes (computed at log time from par, stroke index, and handicap) |
| putts | int | |
| putt1 | text | first putt distance, e.g. `"12"`, `"20+"`, `"<3"` |
| putt2 | text | second putt distance |
| putt3 | text | third putt distance (full putt tracking mode only) |
| gir | bool | greens in regulation |
| fairway | text | par 4/5: `'yes'`, `'left'`, `'right'`; par 3 miss direction: `'left'`, `'short'`, `'right'`, `'long'` |
| approach | text | distance band — en-dash format e.g. `"50–75"` (see Approach bands below); auto-set from course yardage for par 3 GIR holes |
| shots_inside_50 | int | number of shots played inside 50 yards on this hole |
| sg_reason | text | short game miss reason (free text, optional) |
| penalty | text[] | array of penalty types — one entry per penalty stroke e.g. `['Lost ball (tee)', 'Lost ball (tee)', 'OOB']`; null if no penalties. Valid types: `Lost ball (tee)`, `Lost ball (fairway)`, `OOB`, `Hazard`, `Unplayable`. Legacy rows may contain a plain string. |
| dna | bool | did not attempt (incomplete hole) |
| picked_up | bool | player picked up; scores as net double bogey |
| pickup_reason | text[] | optional reasons for pick-up; valid values: `Lost ball (tee)`, `Lost ball (fairway)`, `Score too high`, `Running out of time`, `Injury/other`; null if not set |
| pickup_note | text | optional free-text note for picked-up hole; null if not set |
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

### `ai_cache`
| column | type | notes |
|---|---|---|
| id | uuid | PK, `gen_random_uuid()` |
| coach_id | uuid | FK → `profiles.id` ON DELETE CASCADE |
| student_id | uuid | FK → `profiles.id` ON DELETE CASCADE |
| cache_type | text | e.g. `'patterns'` |
| content | text | cached AI response string |
| round_ids | text[] | sorted array of round IDs the response was generated from |
| created_at | timestamptz | `now()` |

Unique constraint on `(coach_id, student_id, cache_type)`. Upserted on each successful API call; invalidated when `round_ids` no longer match the current set of sent rounds.

### `lessons`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| coach_id | uuid | FK → `profiles.id` |
| student_id | uuid | FK → `profiles.id` |
| lesson_date | date | scheduled date of the lesson |
| lesson_time | text | e.g. `"10:00"` (24h); nullable |
| prep_notes | text | coach's prep notes; nullable |
| session_notes | text | notes written after the session completes; nullable |
| drills | text | drills assigned after the session; nullable |
| status | text | `'upcoming'` or `'completed'` |
| ai_brief | text | pre-generated AI brief from recent round data; nullable |
| round_context | jsonb | snapshot of recent round stats at time of scheduling; nullable |
| created_at | timestamptz | |

RLS: coaches can insert/update/delete their own lessons (`coach_id = auth.uid()`). Students can select lessons where `student_id = auth.uid()`.

Lesson lifecycle: scheduled as `upcoming` → coach clicks "Log session notes" (filling `session_notes` / `drills`) → status becomes `completed`.

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
| `src/CoachDirectory.jsx` | Searchable coach directory for students — browse by name/club, view coach profile, redeem invite code |
| `src/AdminDashboard.jsx` | Admin: coaches table, students table, relationships, courses, course flags, feedback |
| `src/ProfilePage.jsx` | Profile editing for students and coaches |
| `src/StudentSettings.jsx` | Student settings screen |
| `src/CourseForm.jsx` | Add / edit course form (accessible from logging and profile) |
| `src/FeedbackButton.jsx` | Floating feedback button shown on most screens |
| `src/supabaseClient.js` | Supabase client initialisation (anon key) |
| `api/ai.js` | Vercel serverless function — proxies to Anthropic API, injects golf-specific system prompt |
| `api/notify-coach.js` | Vercel serverless function — fires email to coach via Resend when student sends a round |
| `api/weekly-coach-update.js` | Vercel serverless function — weekly digest email to each coach; triggered by Vercel cron, auth-gated by `CRON_SECRET` |
| `vercel.json` | Vercel cron config — schedules `/api/weekly-coach-update` every Monday at 08:00 UTC |
| `scripts/seed-test-data.js` | Seeds Jamie & Craig with 12 rounds each |
| `scripts/setup-demo.js` | Sets demo credentials (jamie@caddie-test.com / craig@caddie-test.com), purges test users |
| `scripts/migrate-official-handicap.js` | One-off migration script for `official_handicap` column |
| `scripts/add-profile-columns.js` | One-off migration script for new profile columns |
| `scripts/add-ai-cache.js` | Migration script — adds `rounds.ai_analysis` column and creates `ai_cache` table |
| `scripts/migrate-approach-bands.js` | Migration script — migrates old `'Under 50'` approach values to `'25–50'`; dry-run by default, pass `--apply` to execute |
| `scripts/add-pickup-note.js` | Migration script — adds `pickup_note text` column to `round_holes`; prints required SQL (must be run in Supabase SQL editor), then verifies with `--apply` |

---

## Key Definitions

### Approach bands
Stored in `round_holes.approach`. Values use **en-dash** format: `"Under 25"`, `"25–50"`, `"50–75"`, `"75–100"`, `"100–125"`, `"125–150"`, `"150+"`.

The former `"Under 50"` band was split into `"Under 25"` and `"25–50"` (2026-04-19). `scripts/migrate-approach-bands.js` migrates any remaining `"Under 50"` DB values to `"25–50"`.

Older rounds logged before 2026-04-11 have hyphen values (`"50-75"`) in the DB and will not match analytics filters — there is no backfill for those.

Analytics in both `CoachHome.jsx` and `StudentDashboard.jsx` filter with en-dash keys. `APPROACH_BANDS` arrays in all three files (`StudentLogging.jsx`, `CoachHome.jsx`, `StudentDashboard.jsx`) must stay in sync.

### `parseFt(v)` — first putt distance parser
All three files (`CoachHome.jsx`, `CoachDashboard.jsx`, `StudentDashboard.jsx`) now use the same implementation (aligned 2026-04-11):

- `!v → null`
- `"<3" → 1.5`
- `"30+"`, `"20+"`, `"7+" → parseFloat(v) + 2`
- else `parseFloat(v)`

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

### AI caching

**Per-round analysis** (`CoachDashboard`): On first coach view of a round, two AI calls are made (putting insight + short game insight). On success, both results are stored as `{ putting, sg }` JSON in `rounds.ai_analysis`. Subsequent views read from the column and skip the API. The cache is never invalidated — `coach_note` saves do not touch `ai_analysis`. On API failure nothing is written.

**Multi-round pattern analysis** (`CoachHome` → `RoundHistory`): Before calling the API, checks `ai_cache` for a row matching `(coach_id, student_id, cache_type='patterns')`. If found, compares the stored `round_ids` (sorted) against the current last-5 sent round IDs (sorted). An exact match serves the cached content. Any mismatch (e.g. a new round was sent) triggers a fresh API call. On success, upserts to `ai_cache` using the unique constraint `(coach_id, student_id, cache_type)`. On failure, shows the error string and writes nothing.

### `HANDICAP_BENCHMARKS`
A lookup table defined at module level in both `StudentLogging.jsx` and `CoachHome.jsx`. Keyed by handicap bracket (0, 5, 10, 15, 20, 25, 30). Fields include `proximity_u25`, `proximity_25_50`, `proximity_50_75`, `proximity_75_100`, `proximity_100_125`, `proximity_125_150`, `proximity_150plus`, `scrambling`, `gir`, `fairways`, `putts_per_round`. `getBenchmark(handicap)` finds the nearest bracket. Used to inject a benchmark line into AI prompts — the model uses these internally to judge performance but must not quote the numbers to the player.

### Penalty field
`round_holes.penalty` is a `text[]` column. Each penalty stroke is stored as one array entry — the same type may appear multiple times e.g. `['Lost ball (tee)', 'Lost ball (tee)', 'OOB']` = 3 penalty strokes. Null means no penalties. Valid types: `Lost ball (tee)`, `Lost ball (fairway)`, `OOB`, `Hazard`, `Unplayable`.

Legacy rows (pre-2026-04-20) may contain a plain string. All client code normalises via: `Array.isArray(row.penalty) ? row.penalty : (row.penalty && row.penalty !== "None" ? [row.penalty] : [])`.

Counting total strokes: sum `penalty.length` across all holes. Counting holes with any penalty: filter `penalty.length > 0`.

### Pick-up reason and note
`round_holes.pickup_reason` is a `text[]` column (nullable). `round_holes.pickup_note` is a `text` column (nullable). Both are only written when `picked_up = true`. Valid pickup reasons: `Lost ball (tee)`, `Lost ball (fairway)`, `Score too high`, `Running out of time`, `Injury/other`. These fields were added 2026-04-20; `pickup_note` requires `ALTER TABLE round_holes ADD COLUMN IF NOT EXISTS pickup_note text` (see `scripts/add-pickup-note.js`).

### Par 3 logging
**Miss direction**: stored in the `fairway` field using values `'left'`, `'short'`, `'right'`, `'long'`. The normal fairway hit/miss UI (`'yes'`/`'left'`/`'right'`) is only shown for par 4/5 holes. Par 3s show a 4-option miss direction selector when GIR is false.

**Auto-approach**: when a par 3 hole is hit in regulation (GIR = true), `approach` is automatically set to the band matching `course_holes.yardage` via `yardageToBand()`. The approach selector is hidden for par 3 GIR holes. For par 3 missed GIR the approach selector shows normally so the player can record their chip/pitch distance.

**CoachDashboard**: a dedicated "Par 3 performance" section shows GIR rate for par 3s and a miss direction breakdown bar chart (Left/Short/Right/Long), separate from the fairway miss section which is now explicitly labelled "(par 4 & 5)".

### AI prompt content — per-round student analysis (`StudentLogging` / `OverviewScreen`)
The AI prompt includes:
- Round summary stats (score, putts, GIR, fairways, etc.)
- Approach breakdown by band: count, GIR hits (for bands ≥50 yds), avg first putt distance
- 3-putt detail: count, per-hole breakdown with first putt distance if recorded
- Missed short putts (putt2 ≤ 3ft AND putts ≥ 3)
- Scrambling %, penalty breakdown by type with total stroke count, any picked-up holes today
- Historical context (fetched lazily on AI trigger): avg vs par per hole, avg putts per hole across last 2 months / 5 rounds; hole struggles/strengths/recurring pick-ups if ≥ 3 same-course rounds available
- Handicap benchmark line injected from `HANDICAP_BENCHMARKS`

### AI prompt content — multi-round coach pattern analysis (`CoachHome` / `RoundHistory`)
The AI prompt includes for each of the last 5 sent rounds:
- Score vs par, putts, GIR, fairways, stableford, wind, conditions, student note
- Approach distribution by band (count per band)
- Avg first putt distance per band
- Penalty breakdown by type (e.g. `Lost ball (tee) ×2, OOB ×1`) — omitted if no penalties
- Handicap benchmark line from `HANDICAP_BENCHMARKS` using `whs_index` (falling back to `official_handicap`)

### AI prompt content — per-round coach analysis (`CoachDashboard`)
Per-hole lines include picked-up hole annotation (`PICKED UP`, pickup reasons, pickup note) and penalty types inline. A round-level penalty summary line is appended: `Total penalties: Lost ball (tee) ×2, OOB ×1 (3 penalty strokes)`.

### AI model
All AI calls use `claude-sonnet-4-20250514` with `max_tokens` of 800 (CoachHome pattern analysis / overview) or 1000 (CoachDashboard round detail). `/api/ai.js` injects a detailed golf system prompt covering approach interpretation, GIR, putting, scrambling, Stableford, benchmark usage, penalty framing, and tone guidelines (including mandatory dry humour opener on bad rounds).

### Pre-lesson AI brief
When a coach schedules a lesson, a `useEffect` in `StudentList` (CoachHome) fires automatically once a student and date are selected. It fetches and enriches the student's last 3 sent rounds, builds a round context snapshot, then calls `/api/ai` with `type: "pre_lesson_brief"`. The result is displayed in the schedule panel before saving. On save, the brief and `round_context` are written to the `lessons` row.

Gated by two flags: `coachProfile.is_premium` (if false, upgrade prompt shown; API not called) and `coachProfile.ai_brief_enabled` (if false, brief suppressed entirely even for premium coaches; togglable in ProfilePage). The `ai_brief_enabled` column requires `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_brief_enabled boolean DEFAULT true`.

### Weekly coach update email
`/api/weekly-coach-update` sends a digest email to each coach every Monday at 08:00 UTC (Vercel cron defined in `vercel.json`). Auth-gated by `Authorization: Bearer <CRON_SECRET>` header — returns 401 if missing or wrong. Uses the Supabase service role key (`REACT_APP_SUPABASE_SERVICE_KEY`) to bypass RLS and read all coaches, students, and rounds.

Per-student categorisation (evaluated per round this week, not per student):
- **Played well**: net score (total_score − round.handicap) ≤ course par for that round
- **Struggled**: net score ≥ course par + 9 (18-hole rounds) or course par + 5 (9-hole rounds)
- **Gone quiet**: no sent rounds in the last 21 days
- A round can appear in both played_well and struggled if criteria overlap (no priority rule)
- A coach is skipped entirely if all three lists are empty

Course par = `round.total_par` if available, else `holes_played === 9 ? 32 : 68`.

Requires `CRON_SECRET` and `RESEND_API_KEY` in Vercel env vars. Sends from `onboarding@resend.dev` (Resend sandbox) — configure custom domain before production.

### Email notifications
`/api/notify-coach.js` is called fire-and-forget (`fetch(...).catch(() => {})`) when a student sends a round. It sends one email per coach via Resend. Requires `RESEND_API_KEY` in Vercel env vars. If the key is absent the function returns `{ ok: true }` silently. Currently sends from `onboarding@resend.dev` (Resend sandbox) — a custom domain must be configured in Resend before going to production.

---

## Known Issues / Gotchas

**Approach band hyphen/en-dash mismatch (historical data only)**: Rounds logged before 2026-04-11 have hyphen values (`"50-75"`) in the DB and will not appear in analytics approach tables. No backfill has been done for those. Rounds with `"Under 50"` values (logged between 2026-04-11 and the band split on 2026-04-19) can be migrated via `scripts/migrate-approach-bands.js --apply`.

**Picked-up holes had null score before 2026-04-19**: `round_holes.score` was written as `null` for picked-up holes. Fixed to store net double bogey (par + 2 + handicap strokes). Rounds saved before this fix may have an incorrect `total_score` if pick-ups were involved — no backfill has been done.

**`parseFt` inconsistency resolved**: All three files now use the same implementation as of 2026-04-11. No longer a source of divergence.

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

**`scripts/add-ai-cache.js` requires manual SQL**: The migration script cannot execute DDL via the Supabase service role key (PostgREST does not support DDL). It prints the required SQL when `exec_sql` RPC is absent, then verifies schema state via SELECT. Run SQL in the Supabase SQL editor, then re-run the script to confirm.

**Save failures in `upsertHole` now visible**: `upsertHole` returns the Supabase error (or null) and `saveHole` checks it. On failure, a red banner appears above the Save button with the message "Failed to save hole — please check your connection and try again." and a Retry button. Advancement to the next hole is blocked until the save succeeds. Rule: always run DB migrations before deploying payload changes that reference new columns — a 400 error will now be visible to the player rather than silent.

**Weekly email requires `CRON_SECRET` and `RESEND_API_KEY` in Vercel env vars**: Without `CRON_SECRET` the endpoint returns 401 for all requests including the Vercel cron trigger. Without `RESEND_API_KEY` no emails are sent (silent skip per coach). Both must be set in the Vercel dashboard under Environment Variables.

**Student AI analysis regenerates on every view**: `StudentLogging`'s per-round AI summary is called fresh each time the overview screen is shown. There is no caching on the student side (unlike CoachDashboard which caches to `rounds.ai_analysis`). Repeated views of the same completed round each consume API tokens.

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
- [x] Fix approach band key mismatch — `StudentLogging.jsx` now writes en-dashes; analytics code and DB values are aligned for new rounds
- [x] Duplicate account prevention via invite — `CaddieAuth.jsx` checks Supabase auth error message and `identities.length === 0` to block re-registration with an existing email
- [x] Per-round AI analysis caching — `rounds.ai_analysis` stores putting + short game JSON; CoachDashboard reads cache before calling API
- [x] Multi-round pattern analysis caching — `ai_cache` table stores pattern analysis keyed by `(coach_id, student_id, cache_type)`; invalidated when sent round IDs change
- [x] AI retry with backoff on 529 errors — `/api/ai.js` retries up to 3 times with 0 / 2s / 4s delays on 529 overloaded responses; other errors fail immediately
- [x] **Penalty categorisation** — `round_holes.penalty` now stores a `text[]` with structured types (Lost ball (tee), Lost ball (fairway), OOB, Hazard, Unplayable); chip-tap UI in StudentLogging; penalty breakdown in all AI prompts
- [x] **Pick-up reason selector** — `pickup_reason text[]` and `pickup_note text` added to `round_holes`; multi-select UI in StudentLogging; annotation in CoachDashboard AI prompt
- [x] **Coach-side penalty visibility** — CoachDashboard scorecard shows abbreviated badge chips (LB(T), OOB, HAZ, etc.) per hole; AI prompt includes per-hole penalty types and round-level summary
- [x] **Par 3 miss direction logging** — when par 3 GIR is false, a Left/Short/Right/Long selector is shown; direction stored in `round_holes.fairway`; auto-approach set from course yardage when GIR is true
- [x] **Par 3 performance section in CoachDashboard** — new section in Short game card showing GIR rate for par 3s and miss direction breakdown; fairway miss section explicitly labelled "(par 4 & 5)"
- [x] **Lesson scheduling and history** — coaches can schedule lessons from the coach home screen; lessons appear in student history timeline; upcoming/completed lifecycle with "Log session notes" flow
- [x] **Student gone quiet alerts** — implemented as part of weekly coach update email (gone quiet = no rounds in 21 days)
- [x] **upsertHole error handling** — visible red banner with retry button on save failure; hole advancement blocked until save succeeds
- [x] **AI humour suppression for coach analysis** — dry humour opener only applies to student-facing analysis; coach-facing analysis (pre-lesson brief, pattern analysis) is always professional
- [x] **Student card stats redesign** — student cards now show Avg vs par/hole with trend arrow, Hcp with trend, and This month round count
- [ ] **Resend custom domain** — currently sends from `onboarding@resend.dev` (sandbox); blocks production email delivery; configure real domain in Resend dashboard before broader rollout
- [ ] **Stripe integration** — premium is currently granted manually by admin; build a payment flow so students and coaches can self-serve upgrade
- [ ] **Student-facing AI analysis caching** — StudentLogging's AI round summary regenerates on every view; add caching (e.g. a `student_ai_analysis` column on `rounds`) so it is computed once and read on repeat views
- [ ] **Handicap trajectory chart with lesson markers** — overlay scheduled/completed lessons on the WHS index trend chart so coaches can see impact of lessons on handicap progression
- [ ] **Pre-lesson brief UI refinement** — brief currently shown in a plain text box in the schedule panel; consider richer formatting, ability to edit before saving, and display in student timeline
- [ ] **Roster-wide insights** (month 6+) — coach home screen summary of patterns across all students (e.g. most common miss, average scoring trend)
- [ ] **Monthly progress report** — automated monthly email to each student summarising their improvement vs the previous month
- [ ] **Pre-lesson questions** — students answer 2–3 coach-defined questions before each lesson; answers stored and surfaced in the pre-lesson brief
- [ ] **Par 3 performance section in StudentDashboard** — CoachDashboard has par 3 stats; StudentDashboard analytics does not yet show par 3 GIR rate or miss direction breakdown
- [ ] **Settings toggle for par 3 miss direction** — some students may not want to record miss direction on par 3s; consider a StudentSettings toggle to hide the selector
- [ ] Invite link expiry / single-use enforcement
- [ ] Round editing after send (currently locked once sent to coach)
- [ ] Mobile PWA / add-to-home-screen manifest
- [ ] Multi-course support beyond Wee Course and Big Course
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
