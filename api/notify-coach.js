// Before deploying, add RESEND_API_KEY to Vercel environment variables
// Get your API key from https://resend.com — free tier allows 3,000 emails/month
// Also add the domain in Resend dashboard when ready to use a custom from address

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { coachId, studentName, courseName, score, holesPlayed, vsParLabel, roundId } = req.body;

    if (!coachId) return res.status(200).json({ ok: true });

    // Fetch coach email from Supabase admin API
    let coachEmail = null;
    let coachFirstName = "Coach";
    try {
      const [userRes, profileRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/auth/v1/admin/users/${coachId}`, {
          headers: {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        }),
        fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${coachId}&select=first_name`, {
          headers: {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        }),
      ]);
      if (userRes.ok) {
        const userData = await userRes.json();
        coachEmail = userData.email || null;
      }
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData?.[0]?.first_name) coachFirstName = profileData[0].first_name;
      }
    } catch {
      // Silent failure — do not block student's send
      return res.status(200).json({ ok: true });
    }

    if (!coachEmail) return res.status(200).json({ ok: true });
    if (!RESEND_API_KEY) return res.status(200).json({ ok: true });

    const appUrl = "https://caddie-rust.vercel.app";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#F4F1EB;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <!-- Header -->
          <tr>
            <td style="background:#0F3D2E;border-radius:16px 16px 0 0;padding:24px 28px;">
              <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,0.4);">Caddie</p>
              <p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#C9A84C;">New round from ${studentName}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:white;padding:28px;border-radius:0 0 16px 16px;">
              <p style="margin:0 0 20px;font-size:15px;color:#555;">Hi ${coachFirstName},</p>
              <p style="margin:0 0 24px;font-size:15px;color:#1C1C1C;line-height:1.6;">
                <strong>${studentName}</strong> has sent you a round from <strong>${courseName || "Golf Course"}</strong>.
              </p>
              <!-- Score card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="text-align:center;padding:0 12px 0 0;">
                          <p style="margin:0;font-size:36px;font-weight:700;color:#1C1C1C;line-height:1;">${score}</p>
                          <p style="margin:4px 0 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#999;">Score</p>
                        </td>
                        <td style="text-align:center;padding:0 12px;border-left:1px solid #E2DDD4;">
                          <p style="margin:0;font-size:36px;font-weight:700;color:${vsParLabel.startsWith("+") ? "#D4763A" : vsParLabel === "E" ? "#2A8A60" : "#C9A84C"};line-height:1;">${vsParLabel}</p>
                          <p style="margin:4px 0 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#999;">vs Par</p>
                        </td>
                        <td style="text-align:center;padding:0 0 0 12px;border-left:1px solid #E2DDD4;">
                          <p style="margin:0;font-size:36px;font-weight:700;color:#1C1C1C;line-height:1;">${holesPlayed}</p>
                          <p style="margin:4px 0 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#999;">Holes</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" style="display:inline-block;background:#0F3D2E;color:white;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;">
                      View round →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:12px;color:#999;text-align:center;">
                You're receiving this because you're linked as a coach in Caddie.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Caddie <onboarding@resend.dev>",
        to: [coachEmail],
        subject: `${studentName} has sent you a round`,
        html,
      }),
    });

    if (!emailRes.ok) {
      console.error("Resend error:", await emailRes.text());
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("notify-coach error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
