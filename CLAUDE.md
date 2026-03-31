# Caddie — Project Reference

## What Caddie Is

Caddie is a mobile-first golf coaching app for Greenock Golf Club. Students log rounds hole-by-hole on their phones and send them to their coach. The coach sees a dashboard with scorecards, stats, AI-generated putting/short game analysis, and trend charts. There is no public signup — students join via coach-generated invite links.

Two roles exist: `student` and `coach`. Role is stored in `profiles.role` and gates the entire UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 (Create React App), all CSS in JS template literals, no component library |
| Backend/DB | Supabase (Postgres + Auth + RLS) |
| AI analysis | Anthropic Claude API via `/api/ai.js` serverless function |
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

### Table Structure

**`profiles`**
| column | type | notes |
|---|---|---|
| id | uuid | FK → `auth.users.id` |
| first_name | text | |
| last_name | text | |
| role | text | `'student'` or `'coach'` |

**`rounds`**
| column | type | notes |
|---|---|---|
| id | uuid | |
| student_id | uuid | FK → `profiles.id` |
| course_id | uuid | FK → `courses.id` |
| holes_played | int | 9 or 18 |
| total_score | int | null until round is complete |
| total_putts | int | |
| handicap | int | player's handicap at time of round |
| sent_to_coach | bool | triggers visibility on coach dashboard |
| sent_at | timestamptz | |
| wind | text | |
| conditions | text | |
| temperature | text | |
| student_note | text | |
| coach_note | text | |
| created_at | timestamptz | |

**`round_holes`**
| column | type | notes |
|---|---|---|
| id | uuid | |
| round_id | uuid | FK → `rounds.id` |
| hole_number | int | |
| par | int | |
| score | int | |
| putts | int | |
| putt1 | text | first putt distance, e.g. `"12"`, `"20+"` |
| putt2 | text | second putt distance |
| gir | bool | greens in regulation |
| fairway | text | `'left'`, `'right'`, `'yes'`, `'miss'` |
| approach | text | distance band, e.g. `"100–125"` |
| shots_inside_50 | int | |
| penalty | text | `'None'` or description |
| dna | bool | did not attempt (incomplete hole) |
| picked_up | bool | |

**`courses`**
| column | type | notes |
|---|---|---|
| id | uuid | |
| name | text | |

**`coach_students`**
| column | type | notes |
|---|---|---|
| coach_id | uuid | FK → `profiles.id` |
| student_id | uuid | FK → `profiles.id` |

**`invites`**
| column | type | notes |
|---|---|---|
| id | uuid | |
| code | text | random alphanumeric, used in invite URL |
| coach_id | uuid | FK → `profiles.id` |
| invite_type | text | `'student'` (default) or `'coach'` |
| used_by | uuid | FK → `profiles.id`, set on redemption |

### Computed fields (not stored — derived client-side from `round_holes`)
`gir_count`, `three_putt_count`, `attempted_holes`, `fw_hit`, `fw_holes` are all computed in CoachHome.jsx when enriching rounds for display. Do not add these as DB columns.

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
| Nico McNelis | *(Nico's real account)* | — | student | `2dfb89f4-3c40-4c70-a025-7d486d0acda1` |
| Coach Demo | *(coach's real account)* | — | coach | `2390d6cf-b83f-43e3-9810-e3bd225c876e` |
| Jamie Stewart | `jamie@caddie-test.com` | `CaddieTest123!` | student | `f430b9c8-d31e-4c92-8d8b-f6664189107e` |
| Craig Burns | `craig@caddie-test.com` | `CaddieTest123!` | student | `5644a0c9-8f10-4da2-a13f-56422c8993f3` |

Jamie has 12 rounds trending **improving** (+14 → +8 vs par, handicap 14 → 8).
Craig has 12 rounds trending **worsening** (+8 → +14 vs par, handicap 8 → 14).
Both are linked to Coach Demo via `coach_students`.

---

## Scripts

`scripts/seed-test-data.js` — creates Jamie and Craig from scratch (deletes and recreates if they already exist). Reads from `.env`.

`scripts/setup-demo.js` — updates Jamie/Craig auth credentials to the test emails/password, deletes non-essential users, sets Coach Demo name. Run this after a fresh seed.

Both scripts use the service role key and must be run with Node from the project root:
```bash
node scripts/seed-test-data.js
node scripts/setup-demo.js
```

---

## Deployment

**GitHub repo:** `https://github.com/nicoescocia/caddie`

Deployed on Vercel. The `/api/ai.js` serverless function proxies requests to the Anthropic API using `ANTHROPIC_API_KEY` set in Vercel environment variables.

The React app env vars (`REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`) are also set in Vercel — not in the local `.env` file (which only holds the service role key for scripts).

---

## ESLint / Build Gotchas

- **`no-unused-vars`** is enforced as a warning by `react-scripts`. Destructured variables that are only used in removed code (e.g. `const { data, error: someErr }` where `someErr` was only used in a now-deleted `console.log`) will trigger a warning that blocks clean builds. Always remove unused destructured vars.

- **Hooks before early returns**: `useState` must be called before any conditional `return null`. `StudentRoundTrends` and `RoundTrends` both call `useState("score")` at the top and check `scored.length < 2` after — this is correct. Do not reorder.

- **`trendDirection` empty-reduce crash**: `vals.slice(0, -3)` is empty when `vals.length === 3`. Always guard with `if (!olderVals.length) return null` and pass `0` as initial value to `.reduce()`. This was a white-screen bug triggered by deleting rounds down to exactly 3.

- **`slice(-10)` vs `slice(0, 10).reverse()`**: Rounds come from Supabase ordered newest-first (`ascending: false`). Using `.slice(-10)` takes the 10 *oldest* rounds. Use `.slice(0, 10).reverse()` to get the 10 most recent in chronological order for chart display.

- **`attempted_holes`, `gir_count`, `three_putt_count` are not DB columns** — they are computed from `round_holes` in the client. Do not try to insert them into `rounds`.

- **`profiles.id` requires a real `auth.users` entry** — you cannot insert a profile with a generated UUID unless the corresponding `auth.users` row exists. Use `supabase.auth.admin.createUser()` first, then upsert the profile.

- **`invites.used_by` FK** blocks profile deletion. Null it out before deleting a profile: `UPDATE invites SET used_by = NULL WHERE used_by = '<id>'`.

---

## Source File Map

| File | Purpose |
|---|---|
| `src/App.js` | Root — auth state, role routing, screen state machine |
| `src/CaddieAuth.jsx` | Login / signup / invite redemption |
| `src/StudentDashboard.jsx` | Student home: stats, trend charts, round list |
| `src/StudentLogging.jsx` | Hole-by-hole round entry + overview + send-to-coach |
| `src/CoachHome.jsx` | Coach home: student list, round history, trend charts |
| `src/CoachDashboard.jsx` | Coach round detail: scorecard, stats, AI analysis, notes |
| `src/supabaseClient.js` | Supabase client initialisation |
| `api/ai.js` | Vercel serverless function — proxies to Anthropic API |
| `scripts/seed-test-data.js` | Seeds Jamie & Craig with 12 rounds each |
| `scripts/setup-demo.js` | Sets demo credentials, purges test users |

---

## Priority Task List

- [x] Coach ability to add written feedback on a round — textarea in CoachDashboard saves to `rounds.coach_note`
- [x] Student-facing view of coach notes — displayed on round cards in StudentDashboard when `coach_note` is set
- [ ] Push notifications / email alerts when a student sends a round to their coach
- [ ] Handicap tracking over time (chart of handicap progression on student dashboard)
- [ ] Multi-course support — currently only Wee Course and Big Course are hardcoded
- [ ] Invite link expiry / single-use enforcement
- [ ] Round editing after send (currently locked once sent to coach)
- [ ] Mobile PWA / add-to-home-screen manifest
- [ ] Admin dashboard: `REACT_APP_SUPABASE_SERVICE_KEY` must be set as a Vercel env var (it's not in `.env` like other script keys) — without it the admin client falls back to the anon key and RLS filters results
