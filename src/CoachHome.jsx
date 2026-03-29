import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  :root {
    --green-dark:#0F3D2E; --green:#1A6B4A; --green-mid:#2A8A60; --green-light:#3DAA78;
    --grass:#52C97A; --bg:#F4F1EB; --gold:#C9A84C; --red:#C94040; --orange:#D4763A;
    --sky:#4A90D9; --text:#1C1C1C; --text-mid:#555; --text-dim:#999; --border:#E2DDD4;
    --shadow:0 2px 16px rgba(0,0,0,0.08); --shadow-lg:0 8px 32px rgba(0,0,0,0.12);
  }
  body { font-family:'Outfit',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }

  .mode-bar { background:var(--green-dark); padding:0 20px; display:flex; align-items:center; justify-content:space-between; height:54px; position:sticky; top:0; z-index:100; }
  .mode-logo { font-family:'Playfair Display',serif; font-size:20px; color:var(--gold); }
  .mode-bar-right { display:flex; align-items:center; gap:10px; }
  .signout-btn { background:none; border:1px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.6); border-radius:8px; padding:5px 12px; font-family:'Outfit',sans-serif; font-size:12px; cursor:pointer; transition:all .2s; }
  .signout-btn:hover { border-color:rgba(255,255,255,0.5); color:white; }
  .back-bar-btn { background:none; border:none; color:rgba(255,255,255,0.7); font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; cursor:pointer; padding:0; display:flex; align-items:center; gap:6px; transition:color .15s; }
  .back-bar-btn:hover { color:white; }

  .wrap { max-width:680px; margin:0 auto; padding:24px 16px 64px; }

  /* ── COACH HOME ── */
  .home-hero { background:var(--green-dark); border-radius:20px; padding:22px 24px; margin-bottom:24px; position:relative; overflow:hidden; }
  .home-hero::after { content:''; position:absolute; right:-40px; top:-40px; width:180px; height:180px; border-radius:50%; background:rgba(255,255,255,0.03); pointer-events:none; }
  .home-hero-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:rgba(255,255,255,0.4); margin-bottom:6px; }
  .home-hero-name { font-family:'Playfair Display',serif; font-size:26px; color:white; margin-bottom:4px; }
  .home-hero-sub { font-size:13px; color:rgba(255,255,255,0.45); }

  .section-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:var(--text-dim); margin-bottom:12px; }

  /* Student cards */
  /* ── TRENDS ── */
  .trends-wrap { margin-bottom:16px; }
  .trends-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-bottom:10px; display:flex; align-items:center; gap:8px; }
  .trends-tabs { display:flex; gap:6px; margin-bottom:12px; }
  .trend-tab { background:white; border:1.5px solid var(--border); border-radius:8px; padding:5px 12px; font-family:'Outfit',sans-serif; font-size:12px; font-weight:600; color:var(--text-dim); cursor:pointer; transition:all .15s; }
  .trend-tab.active { background:var(--green-dark); border-color:var(--green-dark); color:white; }
  .trend-chart { background:white; border:1px solid var(--border); border-radius:14px; padding:14px 16px; margin-bottom:10px; }
  .trend-chart-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-bottom:10px; }
  .trend-legend { display:flex; gap:14px; margin-top:8px; }
  .trend-legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--text-dim); }
  .trend-legend-dot { width:8px; height:8px; border-radius:50%; }
  .trend-summary { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:10px; }
  .trend-stat { background:white; border:1px solid var(--border); border-radius:12px; padding:10px 12px; }
  .trend-stat-val { font-family:'Playfair Display',serif; font-size:22px; color:var(--text); line-height:1; }
  .trend-stat-lbl { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-top:3px; }
  .trend-stat-sub { font-size:10px; color:var(--text-dim); margin-top:2px; }
  .trend-direction { font-size:10px; font-weight:700; margin-top:2px; }
  .trend-direction.improving { color:var(--green-mid); }
  .trend-direction.worsening { color:var(--red); }
  .trend-direction.stable { color:var(--text-dim); }

  /* ── INVITE ── */
  .invite-section { background:white; border:1.5px solid var(--border); border-radius:16px; padding:18px 20px; margin-bottom:16px; }
  .invite-title { font-size:14px; font-weight:700; color:var(--text); margin-bottom:4px; }
  .invite-sub { font-size:12px; color:var(--text-dim); margin-bottom:14px; line-height:1.5; }
  .invite-link-row { display:flex; gap:8px; align-items:center; }
  .invite-link-box { flex:1; background:var(--bg); border:1.5px solid var(--border); border-radius:10px; padding:10px 12px; font-family:'Outfit',sans-serif; font-size:12px; color:var(--text-mid); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .invite-copy-btn { background:var(--green-dark); border:none; border-radius:10px; padding:10px 16px; font-family:'Outfit',sans-serif; font-size:13px; font-weight:700; color:white; cursor:pointer; white-space:nowrap; transition:all .2s; flex-shrink:0; }
  .invite-copy-btn:hover { background:var(--green); }
  .invite-copy-btn.copied { background:var(--green-mid); }
  .invite-gen-btn { width:100%; background:white; border:1.5px dashed var(--border); border-radius:12px; padding:14px; font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; color:var(--text-dim); cursor:pointer; transition:all .2s; }
  .invite-gen-btn:hover { border-color:var(--green-light); color:var(--green); }

  .student-card { background:white; border:1.5px solid var(--border); border-radius:18px; padding:18px 20px; margin-bottom:12px; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:16px; }
  .student-card:hover { border-color:var(--green-light); transform:translateY(-1px); box-shadow:var(--shadow); }
  .student-avatar { width:48px; height:48px; border-radius:50%; background:var(--green-dark); display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif; font-size:18px; color:var(--gold); flex-shrink:0; }
  .student-info { flex:1; min-width:0; }
  .student-name { font-size:16px; font-weight:700; color:var(--text); margin-bottom:4px; }
  .student-meta { font-size:12px; color:var(--text-dim); }
  .student-stats { display:flex; gap:16px; flex-shrink:0; text-align:right; }
  .s-stat { }
  .s-stat-val { font-family:'Playfair Display',serif; font-size:22px; color:var(--text); line-height:1; }
  .s-stat-lbl { font-size:10px; color:var(--text-dim); margin-top:2px; }
  .new-badge { background:var(--red); color:white; font-size:10px; font-weight:700; padding:2px 7px; border-radius:10px; margin-left:8px; animation:pulse 1.5s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.55} }

  .empty-state { text-align:center; padding:60px 24px; background:white; border-radius:20px; border:2px dashed var(--border); }
  .es-icon { font-size:44px; margin-bottom:14px; }
  .es-title { font-family:'Playfair Display',serif; font-size:20px; margin-bottom:8px; }
  .es-sub { font-size:13px; color:var(--text-mid); line-height:1.7; }

  /* ── ROUND HISTORY ── */
  .student-hero { background:var(--green-dark); border-radius:20px; padding:20px 22px; margin-bottom:20px; display:flex; align-items:center; gap:16px; position:relative; overflow:hidden; }
  .student-hero::after { content:''; position:absolute; right:-40px; top:-40px; width:160px; height:160px; border-radius:50%; background:rgba(255,255,255,0.03); pointer-events:none; }
  .sh-avatar { width:52px; height:52px; border-radius:50%; background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif; font-size:20px; color:var(--gold); flex-shrink:0; }
  .sh-info { flex:1; }
  .sh-name { font-family:'Playfair Display',serif; font-size:22px; color:white; margin-bottom:3px; }
  .sh-sub { font-size:12px; color:rgba(255,255,255,0.45); }
  .sh-stats { display:flex; gap:12px; flex-shrink:0; }
  .sh-stat { background:rgba(255,255,255,0.08); border-radius:10px; padding:10px 12px; text-align:center; }
  .sh-stat-val { font-family:'Playfair Display',serif; font-size:20px; color:var(--gold); line-height:1; }
  .sh-stat-lbl { font-size:10px; color:rgba(255,255,255,0.4); margin-top:3px; }

  /* Round cards */
  .round-card { background:white; border:1.5px solid var(--border); border-radius:16px; padding:16px 18px; margin-bottom:10px; cursor:pointer; transition:all .2s; }
  .round-card:hover { border-color:var(--green-light); transform:translateY(-1px); box-shadow:var(--shadow); }
  .round-card-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .round-card-date { font-size:13px; color:var(--text-dim); }
  .round-card-course { font-size:12px; color:var(--text-dim); margin-top:2px; }
  .round-score-block { text-align:right; }
  .round-score-num { font-family:'Playfair Display',serif; font-size:36px; color:var(--text); line-height:1; }
  .round-score-par { font-size:12px; margin-top:2px; }
  .round-score-par.under { color:var(--gold); font-weight:700; }
  .round-score-par.over { color:var(--orange); font-weight:700; }
  .round-score-par.level { color:var(--green-mid); font-weight:700; }
  .round-stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  .round-stat-chip { background:var(--bg); border-radius:10px; padding:8px 10px; text-align:center; }
  .rsc-val { font-size:16px; font-weight:700; color:var(--text); line-height:1; }
  .rsc-val.ok { color:var(--green-mid); }
  .rsc-val.warn { color:var(--orange); }
  .rsc-val.bad { color:var(--red); }
  .rsc-lbl { font-size:10px; color:var(--text-dim); margin-top:3px; text-transform:uppercase; letter-spacing:.05em; font-weight:600; }

  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:80px; }
  .spinner { width:26px; height:26px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }

  @media(max-width:520px) {
    .student-stats { display:none; }
    .sh-stats { display:none; }
    .round-stats-row { grid-template-columns:repeat(3,1fr); }
  }
`;

const COURSE_PAR = {
  "89e2ad4e-8d5a-4244-8568-b2c8a448a77f": 32,
  "b1a2c3d4-e5f6-7890-abcd-ef1234567890": 68,
};
function getCoursePar(round) {
  if (round?.course_id && COURSE_PAR[round.course_id]) return COURSE_PAR[round.course_id];
  return round?.holes_played === 18 ? 68 : 32;
}

function initials(first, last) {
  return ((first || "?")[0] + (last || "")[0]).toUpperCase();
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function fmtDateShort(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function parDiff(score, round) {
  const par = getCoursePar(round);
  const d = score - par;
  if (d === 0) return { text: "E", cls: "level" };
  if (d < 0) return { text: d.toString(), cls: "under" };
  return { text: "+" + d, cls: "over" };
}

// ── STUDENT LIST (coach home) ──
function StudentList({ coachProfile, user, students, studentStats, onSelectStudent, onSignOut }) {
  const [inviteLink, setInviteLink] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateInvite() {
    const coachId = user?.id || coachProfile?.id;
    if (!coachId) return;
    setInviteLoading(true);
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const { error } = await supabase.from("invites").insert([{ code, coach_id: coachId }]);
    if (!error) {
      setInviteLink(`${window.location.origin}?invite=${code}`);
    } else {
      console.error("Invite insert error:", error.message);
    }
    setInviteLoading(false);
  }

  function copyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  const totalStudents = students.length;
  const totalRounds   = Object.values(studentStats).reduce((s, st) => s + (st.totalRounds || 0), 0);

  return (
    <>
      <style>{css}</style>
      <div className="mode-bar">
        <div className="mode-logo">⛳ Caddie</div>
        <div className="mode-bar-right">
          <button className="signout-btn" onClick={onSignOut}>Sign out</button>
        </div>
      </div>
      <div className="wrap">
        <div className="home-hero">
          <div className="home-hero-label">Coach dashboard</div>
          <div className="home-hero-name">{coachProfile?.first_name} {coachProfile?.last_name}</div>
          <div className="home-hero-sub">{totalStudents} student{totalStudents !== 1 ? "s" : ""} · {totalRounds} round{totalRounds !== 1 ? "s" : ""} logged</div>
        </div>

        {/* Invite section */}
        <div className="invite-section">
          <div className="invite-title">🔗 Invite a student</div>
          <div className="invite-sub">Generate a unique link to share with your student. When they sign up using your link, they'll be automatically connected to your account.</div>
          {inviteLink ? (
            <div className="invite-link-row">
              <div className="invite-link-box">{inviteLink}</div>
              <button className={"invite-copy-btn" + (copied ? " copied" : "")} onClick={copyLink}>
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          ) : (
            <button className="invite-gen-btn" onClick={generateInvite} disabled={inviteLoading}>
              {inviteLoading ? "Generating…" : "+ Generate invite link"}
            </button>
          )}
        </div>

        {students.length === 0 ? (
          <div className="empty-state">
            <div className="es-icon">📭</div>
            <div className="es-title">No students linked yet</div>
            <div className="es-sub">Generate an invite link above and share it with your students.</div>
          </div>
        ) : (
          <>
            <div className="section-label">Your students</div>
            {students.map(s => {
              const stats = studentStats[s.id] || {};
              const hasNew = stats.newRounds > 0;
              const thisMonth = stats.thisMonth || 0;
              const avg = stats.avgScore;
              const last = stats.lastRoundDate;
              return (
                <div className="student-card" key={s.id} onClick={() => onSelectStudent(s)}>
                  <div className="student-avatar">{initials(s.first_name, s.last_name)}</div>
                  <div className="student-info">
                    <div className="student-name">
                      {s.first_name} {s.last_name}
                      {hasNew && <span className="new-badge">{stats.newRounds} new</span>}
                    </div>
                    <div className="student-meta">
                      {last ? `Last round: ${fmtDateShort(last)}` : "No rounds yet"}
                    </div>
                  </div>
                  <div className="student-stats">
                    <div className="s-stat">
                      <div className="s-stat-val">{avg ?? "—"}</div>
                      <div className="s-stat-lbl">Avg score</div>
                    </div>
                    <div className="s-stat">
                      <div className="s-stat-val">{thisMonth}</div>
                      <div className="s-stat-lbl">This month</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}

// ── ROUND HISTORY ──
// ── TREND CHART (SVG) ──
function TrendLine({ data9, data18, metric, label, formatVal, height = 80 }) {
  const all9  = data9.filter(r => r[metric] != null);
  const all18 = data18.filter(r => r[metric] != null);
  if (!all9.length && !all18.length) return null;

  function sparkline(pts, color, dashed = false) {
    if (pts.length < 2) return null;
    const vals = pts.map(p => p[metric]);
    const min  = Math.min(...vals);
    const max  = Math.max(...vals);
    const range = max - min || 1;
    const w = 280, h = height;
    const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
    const ys = vals.map(v => h - ((v - min) / range) * (h - 10) - 5);
    const d  = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");
    return (
      <>
        <path d={d} fill="none" stroke={color} strokeWidth={2}
          strokeDasharray={dashed ? "5,3" : "none"} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((_, i) => (
          <circle key={i} cx={xs[i]} cy={ys[i]} r={3} fill={color} />
        ))}
      </>
    );
  }

  return (
    <div className="trend-chart">
      <div className="trend-chart-title">{label}</div>
      <svg width="100%" viewBox={`0 0 280 ${height}`} style={{overflow:"visible"}}>
        {sparkline(all9,  "#1A6B4A", true)}
        {sparkline(all18, "#C9A84C")}
      </svg>
      {all9.length > 0 && all18.length > 0 && (
        <div className="trend-legend">
          <div className="trend-legend-item">
            <div className="trend-legend-dot" style={{background:"#1A6B4A"}} />
            9 holes
          </div>
          <div className="trend-legend-item">
            <div className="trend-legend-dot" style={{background:"#C9A84C"}} />
            18 holes
          </div>
        </div>
      )}
    </div>
  );
}

function trendDirection(vals) {
  if (vals.length < 3) return null;
  const recent = vals.slice(-3).reduce((a,b) => a+b) / 3;
  const older  = vals.slice(0, -3).reduce((a,b) => a+b) / vals.slice(0,-3).length;
  const delta  = recent - older;
  return Math.abs(delta) < 0.5 ? "stable" : delta < 0 ? "improving" : "worsening";
}

function trendLabel(dir, lowerIsBetter = true) {
  if (!dir) return null;
  if (dir === "stable") return { text: "Stable", cls: "stable" };
  const improving = lowerIsBetter ? dir === "improving" : dir === "worsening";
  return improving
    ? { text: "↑ Improving", cls: "improving" }
    : { text: "↓ Worsening", cls: "worsening" };
}

function RoundTrends({ rounds }) {
  const [tab, setTab] = useState("score");
  const scored = rounds.filter(r => r.total_score && r.sent_to_coach);
  // rounds are newest-first; take the 10 most recent of each type, then reverse for chart display (oldest→newest)
  const r9  = scored.filter(r => (r.holes_played || 9) <= 9).slice(0, 10).reverse();
  const r18 = scored.filter(r => (r.holes_played || 9) > 9).slice(0, 10).reverse();
  if (scored.length < 2) return null;

  // Enrich with computed metrics
  function enrich(rs) {
    return rs.map(r => ({
      ...r,
      vsPar:   r.total_score - getCoursePar(r),
      girPct:  r.attempted_holes ? Math.round(r.gir_count / r.attempted_holes * 100) : null,
      tpCount: r.three_putt_count,
    }));
  }
  const e9  = enrich(r9);
  const e18 = enrich(r18);

  const allScored = [...e9, ...e18];
  const scoreDiffs = allScored.map(r => r.vsPar);
  const dir = trendDirection(scoreDiffs);
  const tl  = trendLabel(dir, true);
  const avgVsPar = scoreDiffs.length ? Math.round(scoreDiffs.reduce((a,b)=>a+b)/scoreDiffs.length) : null;
  const bestVsPar = scoreDiffs.length ? Math.min(...scoreDiffs) : null;

  return (
    <div className="trends-wrap">
      <div className="trends-title">
        Trends — last {Math.min(scored.length, 10)} rounds
        {tl && <span className={"trend-direction " + tl.cls}>{tl.text}</span>}
      </div>

      <div className="trend-summary">
        <div className="trend-stat">
          <div className="trend-stat-val">{avgVsPar != null ? (avgVsPar > 0 ? "+"+avgVsPar : avgVsPar === 0 ? "E" : avgVsPar) : "—"}</div>
          <div className="trend-stat-lbl">Avg vs par</div>
        </div>
        <div className="trend-stat">
          <div className="trend-stat-val">{bestVsPar != null ? (bestVsPar > 0 ? "+"+bestVsPar : bestVsPar === 0 ? "E" : bestVsPar) : "—"}</div>
          <div className="trend-stat-lbl">Best</div>
        </div>
        <div className="trend-stat">
          <div className="trend-stat-val">{scored.length}</div>
          <div className="trend-stat-lbl">Rounds</div>
        </div>
      </div>

      <div className="trends-tabs">
        {["score","gir","putts"].map(t => (
          <button key={t} className={"trend-tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>
            {t === "score" ? "Score" : t === "gir" ? "GIR %" : "3-Putts"}
          </button>
        ))}
      </div>

      {tab === "score" && <TrendLine data9={e9} data18={e18} metric="vsPar" label="Score vs par" formatVal={v => v > 0 ? "+"+v : v === 0 ? "E" : String(v)} />}
      {tab === "gir"   && <TrendLine data9={e9} data18={e18} metric="girPct" label="GIR %" formatVal={v => v+"%"} height={70} />}
      {tab === "putts" && <TrendLine data9={e9} data18={e18} metric="tpCount" label="3-putts per round" formatVal={v => String(v)} height={70} />}
    </div>
  );
}

function RoundHistory({ student, rounds, onSelectRound, onBack, onSignOut, onHome }) {
  const sentRounds = rounds.filter(r => r.sent_to_coach);
  const scored     = sentRounds.filter(r => r.total_score);
  const diffs      = scored.map(r => r.total_score - getCoursePar(r));
  const avgDiff    = diffs.length ? Math.round(diffs.reduce((a, b) => a + b) / diffs.length) : null;
  const bestDiff   = diffs.length ? Math.min(...diffs) : null;
  function fmtDiff(d) { return d == null ? "—" : d === 0 ? "E" : d > 0 ? "+" + d : String(d); }

  return (
    <>
      <style>{css}</style>
      <div className="mode-bar">
        <div className="mode-logo" style={{cursor:"pointer"}} onClick={onHome}>⛳ Caddie</div>
        <div className="mode-bar-right">
          <button className="back-bar-btn" onClick={onBack}>← All students</button>
          <button className="signout-btn" onClick={onSignOut}>Sign out</button>
        </div>
      </div>
      <div className="wrap">
        <div className="student-hero">
          <div className="sh-avatar">{initials(student.first_name, student.last_name)}</div>
          <div className="sh-info">
            <div className="sh-name">{student.first_name} {student.last_name}</div>
            <div className="sh-sub">{sentRounds.length} round{sentRounds.length !== 1 ? "s" : ""} sent to coach</div>
          </div>
          <div className="sh-stats">
            <div className="sh-stat">
              <div className="sh-stat-val">{fmtDiff(avgDiff)}</div>
              <div className="sh-stat-lbl">Avg</div>
            </div>
            <div className="sh-stat">
              <div className="sh-stat-val">{fmtDiff(bestDiff)}</div>
              <div className="sh-stat-lbl">Best</div>
            </div>
          </div>
        </div>

        {sentRounds.length === 0 ? (
          <div className="empty-state">
            <div className="es-icon">📭</div>
            <div className="es-title">No rounds sent yet</div>
            <div className="es-sub">
              Ask {student.first_name} to open the app, log a round, and tap<br />
              <strong>"Send to coach"</strong> — it will appear here instantly.
            </div>
          </div>
        ) : (
          <>
            <RoundTrends rounds={sentRounds} />
            <div className="section-label">Round history</div>
            {sentRounds.map(r => {
              const diff = parDiff(r.total_score, r);
              return (
                <div className="round-card" key={r.id} onClick={() => onSelectRound(r)}>
                  <div className="round-card-top">
                    <div>
                      <div className="round-card-date">{fmtDate(r.created_at)}</div>
                      <div className="round-card-course">{r.courses?.name || "Golf Course"} · {r.attempted_holes != null && r.attempted_holes !== r.holes_played ? `${r.attempted_holes}/${r.holes_played} holes` : `${r.holes_played} holes`}</div>
                    </div>
                    <div className="round-score-block">
                      <div className="round-score-num">{r.total_score ?? "—"}</div>
                      {r.total_score && <div className={"round-score-par " + diff.cls}>{diff.text}</div>}
                      {r.total_score && r.handicap != null && (
                        <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>Net {r.total_score - r.handicap}</div>
                      )}
                    </div>
                  </div>
                  <div className="round-stats-row">
                    <div className="round-stat-chip">
                      <div className={"rsc-val " + (r.gir_count/(r.attempted_holes ?? r.holes_played) >= 0.55 ? "ok" : r.gir_count/(r.attempted_holes ?? r.holes_played) >= 0.33 ? "warn" : "bad")}>{r.gir_count != null ? `${r.gir_count}/${r.attempted_holes ?? r.holes_played}` : "—"}</div>
                      <div className="rsc-lbl">GIR</div>
                    </div>
                    <div className="round-stat-chip">
                      <div className={"rsc-val " + (r.fw_holes > 0 ? (r.fw_hit/r.fw_holes >= 0.6 ? "ok" : r.fw_hit/r.fw_holes >= 0.4 ? "warn" : "bad") : "")}>{r.fw_hit != null && r.fw_holes != null ? `${r.fw_hit}/${r.fw_holes}` : "—"}</div>
                      <div className="rsc-lbl">Fairways</div>
                    </div>
                    <div className="round-stat-chip">
                      <div className={"rsc-val " + (r.three_putt_count === 0 ? "ok" : r.three_putt_count <= 1 ? "warn" : "bad")}>{r.three_putt_count != null ? r.three_putt_count : "—"}</div>
                      <div className="rsc-lbl">3-putts</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}

// ── ROOT COMPONENT ──
export default function CoachHome({ user, onSelectRound, onSignOut, initialScreen, initialStudent }) {
  const [screen, setScreen]           = useState(initialScreen || "students");
  const [coachProfile, setCoachProfile] = useState(null);
  const [students, setStudents]       = useState([]);
  const [studentStats, setStudentStats] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(initialStudent || null);
  const [studentRounds, setStudentRounds] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingRounds, setLoadingRounds] = useState(initialScreen === "history");

  useEffect(() => {
    async function load() {
      // Load coach profile
      const { data: profile } = await supabase
        .from("profiles").select("first_name, last_name").eq("id", user.id).single();
      setCoachProfile(profile);

      // Load linked students
      const { data: links } = await supabase
        .from("coach_students").select("student_id").eq("coach_id", user.id);
      if (!links || links.length === 0) { setLoading(false); return; }

      const ids = links.map(l => l.student_id);
      const { data: profiles } = await supabase
        .from("profiles").select("id, first_name, last_name").in("id", ids);
      setStudents(profiles || []);

      // Load rounds for all students to compute stats
      const { data: allRounds } = await supabase
        .from("rounds")
        .select("id, student_id, total_score, handicap, sent_to_coach, created_at")
        .in("student_id", ids)
        .eq("sent_to_coach", true)
        .order("created_at", { ascending: false });

      // Compute per-student stats
      const stats = {};
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      (profiles || []).forEach(p => {
        const pRounds = (allRounds || []).filter(r => r.student_id === p.id);
        const scores  = pRounds.filter(r => r.total_score).map(r => r.total_score);
        stats[p.id] = {
          totalRounds:  pRounds.length,
          avgScore:     scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : null,
          lastRoundDate: pRounds[0]?.created_at || null,
          thisMonth:    pRounds.filter(r => r.created_at >= monthStart).length,
          newRounds:    pRounds.filter(r => {
            const d = new Date(r.created_at);
            const daysSince = (now - d) / (1000 * 60 * 60 * 24);
            return daysSince <= 2;
          }).length,
        };
      });
      setStudentStats(stats);
      setLoading(false);

      // If returning from round detail, reload the history for the selected student
      if (initialScreen === "history" && initialStudent) {
        const { data: rounds } = await supabase
          .from("rounds").select("*, courses(name)")
          .eq("student_id", initialStudent.id)
          .eq("sent_to_coach", true)
          .order("created_at", { ascending: false });
        const enriched = await Promise.all((rounds || []).map(async r => {
          const { data: holes } = await supabase
            .from("round_holes").select("gir, fairway, putts, par, dna, picked_up").eq("round_id", r.id);
          if (!holes || holes.length === 0) return r;
          const attempted = holes.filter(h => !h.dna);
          const fwHoles   = attempted.filter(h => h.par >= 4);
          return {
            ...r,
            attempted_holes:  attempted.length,
            gir_count:        attempted.filter(h => h.gir).length,
            fw_hit:           attempted.filter(h => h.par >= 4 && h.fairway === "yes").length,
            fw_holes:         fwHoles.length,
            three_putt_count: attempted.filter(h => h.putts >= 3).length,
          };
        }));
        setStudentRounds(enriched);
        setLoadingRounds(false);
      }
    }
    load();
  }, [user.id, initialScreen, initialStudent]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelectStudent(student) {
    setSelectedStudent(student);
    setLoadingRounds(true);
    setScreen("history");
    const { data } = await supabase
      .from("rounds")
      .select("*, courses(name)")
      .eq("student_id", student.id)
      .eq("sent_to_coach", true)
      .order("created_at", { ascending: false });

    const rounds = data || [];

    // Always compute stats fresh from round_holes
    const enriched = await Promise.all(rounds.map(async r => {
      const { data: holes } = await supabase
        .from("round_holes").select("gir, fairway, putts, par, dna, picked_up")
        .eq("round_id", r.id);
      if (!holes || holes.length === 0) return r;
      const attempted = holes.filter(h => !h.dna);
      const fwHoles   = attempted.filter(h => h.par >= 4);
      return {
        ...r,
        attempted_holes:  attempted.length,
        gir_count:        attempted.filter(h => h.gir).length,
        fw_hit:           fwHoles.filter(h => h.fairway === "yes").length,
        fw_holes:         fwHoles.length,
        three_putt_count: attempted.filter(h => h.putts >= 3).length,
      };
    }));

    setStudentRounds(enriched);
    setLoadingRounds(false);
  }

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="mode-bar"><div className="mode-logo">⛳ Caddie</div></div>
        <div className="loading-wrap"><div className="spinner" /></div>
      </>
    );
  }

  if (screen === "history" && selectedStudent) {
    if (loadingRounds) {
      return (
        <>
          <style>{css}</style>
          <div className="mode-bar">
            <div className="mode-logo">⛳ Caddie</div>
            <div className="mode-bar-right">
              <button className="back-bar-btn" onClick={() => setScreen("students")}>← All students</button>
              <button className="signout-btn" onClick={onSignOut}>Sign out</button>
            </div>
          </div>
          <div className="loading-wrap"><div className="spinner" /></div>
        </>
      );
    }
    return (
      <RoundHistory
        student={selectedStudent}
        onHome={() => setScreen("students")}
        rounds={studentRounds}
        onSelectRound={r => onSelectRound(r, selectedStudent)}
        onBack={() => setScreen("students")}
        onSignOut={onSignOut}
      />
    );
  }

  return (
    <StudentList
      coachProfile={coachProfile}
      user={user}
      students={students}
      studentStats={studentStats}
      onSelectStudent={handleSelectStudent}
      onSignOut={onSignOut}
    />
  );
}
