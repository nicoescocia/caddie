
// Required Vercel environment variables:
// REACT_APP_SUPABASE_URL      — Supabase project URL
// REACT_APP_SUPABASE_SERVICE_KEY — Supabase service role key (bypasses RLS)
// RESEND_API_KEY              — Resend API key for sending emails
// CRON_SECRET                 — Secret token to authenticate cron requests (set in Vercel env vars)

const SUPABASE_URL      = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_KEY;
const RESEND_API_KEY    = process.env.RESEND_API_KEY;
const CRON_SECRET       = process.env.CRON_SECRET;




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
        `&select=id,student_id,course_id,total_score,total_par,holes_played,handicap,created_at,courses(name)` +
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

        // Evaluate each round this week against net par thresholds independently
        for (const r of thisWeek) {
          const netScore    = r.total_score - (r.handicap ?? 0);
          const coursePar   = r.total_par ?? (r.holes_played === 9 ? 32 : 68);
          const netVsPar    = netScore - coursePar;
          const netVsParStr = (netVsPar >= 0 ? "+" : "") + netVsPar;
          const courseName  = r.courses?.name || "Golf Course";
          const threshold   = r.holes_played === 18 ? 9 : 5;
          const line        = `${name} - Net ${netScore} (${netVsParStr}) (${courseName}, ${r.holes_played} holes)`;
          if (netScore <= coursePar)             playedWell.push({ roundLines: [line] });
          if (netScore >= coursePar + threshold) struggled.push({ roundLines: [line] });
        }
      }

      // Skip coach if all lists are empty
      if (playedWell.length === 0 && struggled.length === 0 && goneQuiet.length === 0) continue;

      // Build plain-text fallback
      let text = `Hi ${coach.first_name},\n\nHere is your weekly student update from Caddie.\n`;
      if (playedWell.length > 0) {
        text += `\nPlayed well this week\n`;
        for (const s of playedWell) for (const line of s.roundLines) text += `${line}\n`;
        text += `Worth sending a message of encouragement!\n`;
      }
      if (struggled.length > 0) {
        text += `\nStruggled this week\n`;
        for (const s of struggled) for (const line of s.roundLines) text += `${line}\n`;
        text += `A lesson might help these students get back on track.\n`;
      }
      if (goneQuiet.length > 0) {
        text += `\nNo rounds in 3 weeks\n`;
        for (const s of goneQuiet) text += `${s.name}${s.daysSince != null ? ` - ${s.daysSince} days since last round` : ""}\n`;
        text += `Time to check in.\n`;
      }
      text += `\nCaddie`;

      // Build HTML email
      function htmlSection(emoji, label, borderColor, lines, note) {
        const rowsHtml = lines.map(line =>
          `<div style="font-size:13px;color:#333;padding:7px 0;border-bottom:1px solid #F0EDE6;">${line}</div>`
        ).join("");
        return `
          <div style="margin-bottom:24px;">
            <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#1C1C1C;padding-left:10px;border-left:3px solid ${borderColor};margin-bottom:10px;">${emoji} ${label}</div>
            ${rowsHtml}
            <div style="font-size:13px;color:#666;font-style:italic;margin-top:8px;">${note}</div>
          </div>`;
      }

      let sectionsHtml = "";
      if (playedWell.length > 0) {
        const lines = playedWell.flatMap(s => s.roundLines);
        sectionsHtml += htmlSection("🟢", "Played well this week", "#1A6B4A", lines, "Worth sending a message of encouragement!");
      }
      if (struggled.length > 0) {
        const lines = struggled.flatMap(s => s.roundLines);
        sectionsHtml += htmlSection("🔴", "Struggled this week", "#C94040", lines, "A lesson might help these students get back on track.");
      }
      if (goneQuiet.length > 0) {
        const lines = goneQuiet.map(s => `${s.name}${s.daysSince != null ? ` - ${s.daysSince} days since last round` : ""}`);
        sectionsHtml += htmlSection("💤", "No rounds in 3 weeks", "#999999", lines, "Time to check in.");
      }

      const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#F4F1EB;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="background:white;border-radius:12px;padding:32px;">
          <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0F3D2E;margin-bottom:6px;">Caddie</div>
          <div style="font-size:13px;color:#999;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #F0EDE6;">Weekly student update</div>
          <div style="font-size:15px;color:#1C1C1C;margin-bottom:12px;">Hi ${coach.first_name},</div>
          <div style="font-size:14px;color:#555;margin-bottom:20px;">Here's a weekly roundup of how your students are performing.</div>
          ${sectionsHtml}
          <div style="text-align:center;margin-top:28px;padding-top:20px;border-top:1px solid #F0EDE6;">
            <span style="font-size:12px;color:#1A6B4A;font-family:Georgia,serif;font-weight:700;">Caddie</span>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

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
          html,
          text,
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
