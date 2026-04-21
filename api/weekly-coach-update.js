// Required Vercel environment variables:
// REACT_APP_SUPABASE_URL      — Supabase project URL
// REACT_APP_SUPABASE_SERVICE_KEY — Supabase service role key (bypasses RLS)
// RESEND_API_KEY              — Resend API key for sending emails
// CRON_SECRET                 — Secret token to authenticate cron requests (set in Vercel env vars)

const SUPABASE_URL      = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_KEY;
const RESEND_API_KEY    = process.env.RESEND_API_KEY;
const CRON_SECRET       = process.env.CRON_SECRET;

const COURSE_PAR = {
  "89e2ad4e-8d5a-4244-8568-b2c8a448a77f": 32, // Wee Course (9 holes)
  "b1a2c3d4-e5f6-7890-abcd-ef1234567890": 68, // Greenock Golf Club — Big Course (18 holes)
};

function getCoursePar(round) {
  if (round.total_par) return round.total_par;
  return COURSE_PAR[round.course_id] ?? (round.holes_played === 18 ? 68 : 32);
}

function vsParPerHole(round) {
  if (!round.total_score) return null;
  return (round.total_score - getCoursePar(round)) / (round.holes_played || 9);
}

async function sbFetch(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function handler(req, res) {
  // Auth check — must be called with Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers["authorization"] || "";
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 1. Fetch all coaches
    const coaches = await sbFetch("/profiles?role=eq.coach&select=id,first_name");
    if (!coaches || coaches.length === 0) {
      return res.status(200).json({ ok: true, sent: 0 });
    }

    const now             = new Date();
    const sevenDaysAgo    = new Date(now - 7  * 24 * 60 * 60 * 1000).toISOString();
    const twentyOneDaysAgo = new Date(now - 21 * 24 * 60 * 60 * 1000).toISOString();
    let sent = 0;

    for (const coach of coaches) {
      // Fetch coach email via service role admin API
      let coachEmail = null;
      try {
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${coach.id}`, {
          headers: {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          coachEmail = userData.email || null;
        }
      } catch { /* silent — skip this coach */ }
      if (!coachEmail || !RESEND_API_KEY) continue;

      // Fetch student links
      const links = await sbFetch(`/coach_students?coach_id=eq.${coach.id}&select=student_id`);
      if (!links || links.length === 0) continue;

      const studentIds = links.map(l => l.student_id);

      // Fetch student profiles
      const students = await sbFetch(`/profiles?id=in.(${studentIds.join(",")})&select=id,first_name,last_name`);
      if (!students || students.length === 0) continue;

      // Fetch all sent rounds for these students, newest first
      const rounds = await sbFetch(
        `/rounds?student_id=in.(${studentIds.join(",")})&sent_to_coach=eq.true` +
        `&select=id,student_id,course_id,total_score,total_par,holes_played,created_at` +
        `&order=created_at.desc`
      );
      if (!rounds) continue;

      const playedWell = [];
      const struggled  = [];
      const goneQuiet  = [];

      for (const student of students) {
        const sRounds = rounds.filter(r => r.student_id === student.id);
        const scored  = sRounds.filter(r => r.total_score);

        // gone_quiet: no sent rounds in last 21 days
        const lastRoundDate = sRounds[0]?.created_at || null;
        const isGoneQuiet   = !lastRoundDate || lastRoundDate < twentyOneDaysAgo;
        const name          = `${student.first_name} ${student.last_name}`;

        if (isGoneQuiet) {
          const daysSince = lastRoundDate
            ? Math.floor((now - new Date(lastRoundDate)) / (1000 * 60 * 60 * 24))
            : null;
          goneQuiet.push({ name, daysSince });
          continue;
        }

        // this_week_rounds
        const thisWeek = scored.filter(r => r.created_at >= sevenDaysAgo);
        if (thisWeek.length === 0) continue;

        // recent_avg: avg vs_par_per_hole across last 5 scored rounds
        const last5     = scored.slice(0, 5);
        const vpphs     = last5.map(r => vsParPerHole(r)).filter(v => v != null);
        const recentAvg = vpphs.length ? vpphs.reduce((a, b) => a + b, 0) / vpphs.length : null;

        // best_by_course: lowest vs_par_per_hole ever per course_id
        const bestByCourse = {};
        for (const r of scored) {
          const v = vsParPerHole(r);
          if (v == null) continue;
          if (bestByCourse[r.course_id] == null || v < bestByCourse[r.course_id]) {
            bestByCourse[r.course_id] = v;
          }
        }

        // Evaluate each round this week
        let hasPlayedWell = false;
        let hasStruggled  = false;
        const weekDetails = [];

        for (const r of thisWeek) {
          const v = vsParPerHole(r);
          if (v == null) continue;
          const wellByAvg    = recentAvg != null && v <= recentAvg - 0.2;
          const wellByCourse = bestByCourse[r.course_id] != null && v <= bestByCourse[r.course_id];
          if (wellByAvg || wellByCourse) hasPlayedWell = true;
          if (recentAvg != null && v > recentAvg + 0.2) hasStruggled = true;
          weekDetails.push({ v, holes_played: r.holes_played });
        }

        // Use best round this week for the display label
        const best = weekDetails.sort((a, b) => a.v - b.v)[0];
        const roundLabel = best
          ? `${best.v >= 0 ? "+" : ""}${best.v.toFixed(1)} vs par (${best.holes_played} holes)`
          : "";

        // Priority: played_well > struggled (gone_quiet already handled above)
        if (hasPlayedWell) {
          playedWell.push({ name, roundLabel });
        } else if (hasStruggled) {
          struggled.push({ name, roundLabel });
        }
      }

      // Skip coach if all lists are empty
      if (playedWell.length === 0 && struggled.length === 0 && goneQuiet.length === 0) continue;

      // Build plain-text email body
      let body = `Hi ${coach.first_name},\n\nHere's your weekly student update from Caddie.\n`;

      if (playedWell.length > 0) {
        body += `\n🟢 Played well this week\n`;
        for (const s of playedWell) body += `${s.name} — ${s.roundLabel}\n`;
        body += `These students had a good week — worth sending a message of encouragement!\n`;
      }

      if (struggled.length > 0) {
        body += `\n🔴 Struggled this week\n`;
        for (const s of struggled) body += `${s.name} — ${s.roundLabel}\n`;
        body += `These students had a tough week — maybe a lesson is in order?\n`;
      }

      if (goneQuiet.length > 0) {
        body += `\n💤 Haven't logged a round in 3+ weeks\n`;
        for (const s of goneQuiet) {
          body += `${s.name}${s.daysSince != null ? ` — ${s.daysSince} days since last round` : ""}\n`;
        }
        body += `Time to check in with these students.\n`;
      }

      body += `\nCaddie`;

      // Send via Resend
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Caddie <onboarding@resend.dev>",
          to: [coachEmail],
          subject: "Your weekly Caddie update",
          text: body,
        }),
      });

      if (emailRes.ok) {
        sent++;
      } else {
        console.error("Resend error for coach", coach.id, await emailRes.text());
      }
    }

    return res.status(200).json({ ok: true, sent });
  } catch (err) {
    console.error("weekly-coach-update error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
