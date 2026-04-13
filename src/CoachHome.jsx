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
  .trends-tabs { display:flex; gap:6px; margin-bottom:12px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; padding-bottom:2px; flex-wrap:nowrap; }
  .trend-tabs::-webkit-scrollbar { display:none; }
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
  .trend-charts-pair { display:grid; grid-template-columns:1fr 1fr; gap:8px; }

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

  /* AI pattern box */
  .ai-box { background:linear-gradient(135deg,#F9F6EE,#EFF6EF); border:1px solid #D4E8D4; border-radius:11px; padding:13px 15px; margin-bottom:16px; }
  .ai-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--green); margin-bottom:7px; display:flex; align-items:center; gap:6px; }
  .ai-text { font-size:13px; color:var(--text-mid); line-height:1.7; white-space:pre-line; }
  .ai-loading { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-dim); }
  .ai-spinner { width:14px; height:14px; border:2px solid #DDD; border-top-color:var(--green); border-radius:50%; animation:spin .7s linear infinite; }

  @media(max-width:520px) {
    .student-stats { display:none; }
    .sh-stats { display:none; }
    .round-stats-row { grid-template-columns:repeat(3,1fr); }
  }
`;

function getCoursePar(round) {
  if (round.total_par) return round.total_par;
  if (round.holes_played === 18) return 68;
  if (round.holes_played === 9) return 32;
  return round.holes_played ? Math.round(round.holes_played * 68 / 18) : 68;
}

function prorateHandicap(round, holeStatsMap) {
  if (!round.handicap) return round.handicap;
  const holes = holeStatsMap ? (holeStatsMap[round.id] || []) : [];
  if (!holes.length) return round.handicap;
  let shots = 0;
  const courseLen = round.holes_played || 18;
  for (const h of holes) {
    const si = h.stroke_index || 0;
    if (!si) continue;
    if (round.handicap >= si) shots++;
    if (round.handicap >= si + courseLen) shots++;
    if (round.handicap >= si + courseLen * 2) shots++;
  }
  return shots;
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
function StudentList({ coachProfile, user, students, studentStats, onSelectStudent, onSignOut, onProfile }) {
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
          {onProfile && (
            <button className="signout-btn" onClick={onProfile} style={{color:"rgba(255,255,255,0.8)"}}>
              My Profile
            </button>
          )}
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
              const last = stats.lastRoundDate;
              const { avgNetVsPar9, avgNetVsPar18 } = stats;
              function fmtNetVsPar(v) {
                if (v == null) return null;
                const s = v.toFixed(1);
                return v > 0 ? "+" + s : s;
              }
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
                      {s.official_handicap != null && <span style={{marginLeft:6}}>· Hcp {Number(s.official_handicap).toFixed(1)}</span>}
                    </div>
                  </div>
                  <div className="student-stats">
                    {avgNetVsPar18 != null && (
                      <div className="s-stat">
                        <div className="s-stat-val" style={{fontSize:17}}>{fmtNetVsPar(avgNetVsPar18)}</div>
                        <div className="s-stat-lbl">Net par (18h)</div>
                      </div>
                    )}
                    {avgNetVsPar9 != null && (
                      <div className="s-stat">
                        <div className="s-stat-val" style={{fontSize:17}}>{fmtNetVsPar(avgNetVsPar9)}</div>
                        <div className="s-stat-lbl">Net par (9h)</div>
                      </div>
                    )}
                    {avgNetVsPar18 == null && avgNetVsPar9 == null && (
                      <div className="s-stat">
                        <div className="s-stat-val">—</div>
                        <div className="s-stat-lbl">Net vs par</div>
                      </div>
                    )}
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
// When data18 is empty, data9 is rendered as a single solid line (combined / no split).
function TrendLine({ data9, data18, metric, label, yTicks, formatY, height = 90, lineColor }) {
  const all9  = data9.filter(r => r[metric] != null);
  const all18 = data18.filter(r => r[metric] != null);
  if (!all9.length && !all18.length) return null;
  const hasBoth = all9.length > 0 && all18.length > 0;

  const allVals = [...all9, ...all18].map(p => p[metric]);
  const dataMin = Math.min(...allVals);
  const dataMax = Math.max(...allVals);

  function computeTicks(lo, hi) {
    const range = hi - lo || 1;
    const stepsSeq = [0.1, 0.2, 0.25, 0.5, 1, 2, 3, 5, 10, 15, 20, 25];
    const step = stepsSeq.find(s => s >= range / 5) || 25;
    const start = Math.floor(lo / step) * step;
    const end   = Math.ceil(hi / step) * step;
    const ticks = [];
    for (let t = start; t <= end + step * 0.01; t = Math.round((t + step) * 1e6) / 1e6) ticks.push(t);
    return ticks;
  }

  const ticks  = yTicks || computeTicks(dataMin, dataMax);
  const domMin = Math.min(...ticks);
  const domMax = Math.max(...ticks);
  const domRange = domMax - domMin || 1;
  const LEFT = 32, W = 248, PAD_T = 8, PAD_B = 8;
  const chartH = height - PAD_T - PAD_B;

  function toY(v) { return PAD_T + chartH - ((v - domMin) / domRange) * chartH; }
  function toX(i, n) { return n <= 1 ? LEFT + W / 2 : LEFT + (i / (n - 1)) * W; }

  function sparkline(pts, color, dashed = false) {
    if (pts.length < 2) return null;
    const xs = pts.map((_, i) => toX(i, pts.length));
    const ys = pts.map(p => toY(p[metric]));
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
      <svg width="100%" viewBox={`0 0 ${LEFT + W} ${height}`} style={{overflow:"visible"}}>
        {ticks.map(t => {
          const y   = toY(t);
          const lbl = formatY ? formatY(t) : t % 1 === 0 ? String(t) : t.toFixed(1);
          return (
            <g key={t}>
              <line x1={LEFT} y1={y} x2={LEFT + W} y2={y} stroke="#E2DDD4" strokeWidth={0.8} />
              <text x={LEFT - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#999">{lbl}</text>
            </g>
          );
        })}
        {sparkline(all9,  hasBoth ? "#1A6B4A" : (lineColor || "#1A6B4A"), hasBoth)}
        {sparkline(all18, "#C9A84C")}
      </svg>
      {hasBoth && (
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
  const recent    = vals.slice(-3).reduce((a,b) => a+b, 0) / 3;
  const olderVals = vals.slice(0, -3);
  if (!olderVals.length) return null;
  const older = olderVals.reduce((a,b) => a+b, 0) / olderVals.length;
  const delta = recent - older;
  return Math.abs(delta) < 0.1 ? "stable" : delta < 0 ? "improving" : "worsening";
}

function trendLabel(dir, lowerIsBetter = true) {
  if (!dir) return null;
  if (dir === "stable") return { text: "Stable", cls: "stable" };
  const improving = lowerIsBetter ? dir === "improving" : dir === "worsening";
  return improving
    ? { text: "↑ Improving", cls: "improving" }
    : { text: "↓ Worsening", cls: "worsening" };
}

function RoundTrends({ rounds, activeTab, setActiveTab }) {
  const [tab, setTab] = useState("score");
  const scored = rounds.filter(r => r.total_score && r.sent_to_coach);
  // newest-first; take 10 most recent of each type, reverse for chart (oldest→newest)
  const r9  = scored.filter(r => r.holes_played === 9).slice(0, 10).reverse();
  const r18 = scored.filter(r => r.holes_played === 18).slice(0, 10).reverse();
  if (scored.length < 2) return null;

  function enrich(rs) {
    return rs.map(r => ({
      ...r,
      vsPar:             r.total_score - getCoursePar(r),
      netVsPar:          r.handicap != null ? (r.total_score - (r.prorated_hcp ?? r.handicap)) - getCoursePar(r) : null,
      girPct:            r.attempted_holes ? Math.round(r.gir_count / r.attempted_holes * 100) : null,
      puttsPerHole:      r.total_putts != null && r.holes_played
                           ? Math.round((r.total_putts / r.holes_played) * 10) / 10
                           : null,
      fwPct:             r.fw_holes ? Math.round(r.fw_hit / r.fw_holes * 100) : null,
      stablefordPerHole: r.stableford_holes
                           ? Math.round((r.stableford_total / r.stableford_holes) * 10) / 10
                           : null,
    }));
  }
  const e9  = enrich(r9);
  const e18 = enrich(r18);
  // last 10 combined, oldest→newest for single-line charts
  const e10 = enrich(scored.slice(0, 10).reverse());
  // handicap: all rounds with whs_index, up to 10 most recent, reversed
  const whsRounds = scored.filter(r => r.whs_index != null).slice(0, 10).reverse();

  // Summary stats respect activeTab
  const activeEnriched   = activeTab === 9 ? e9 : e18;
  const activeRoundsCount = activeTab === 9 ? r9.length : r18.length;
  const rawVsPars  = activeEnriched.map(r => r.vsPar);
  const scoreDiffs = activeEnriched.map(r => r.vsPar / (r.holes_played || 9));
  const dir = trendDirection(scoreDiffs);
  const tl  = trendLabel(dir, true);
  const avgVsPar  = rawVsPars.length ? Math.round(rawVsPars.reduce((a, b) => a + b, 0) / rawVsPars.length) : null;
  const bestVsPar = rawVsPars.length ? Math.min(...rawVsPars) : null;
  const fmtPar = v => v > 0 ? "+" + v : v === 0 ? "E" : String(v);

  return (
    <div className="trends-wrap">
      <div className="trends-title">
        Trends — last {Math.min(activeRoundsCount, 10)} rounds
        {tl && <span className={"trend-direction " + tl.cls}>{tl.text}</span>}
      </div>

      {/* 9/18 toggle */}
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {[18, 9].map(n => (
          <button key={n} className={"trend-tab" + (activeTab === n ? " active" : "")} onClick={() => setActiveTab(n)}>
            {n} holes
          </button>
        ))}
      </div>

      <div className="trend-summary">
        <div className="trend-stat">
          <div className="trend-stat-val">{avgVsPar != null ? fmtPar(avgVsPar) : "—"}</div>
          <div className="trend-stat-lbl">Avg vs par</div>
        </div>
        <div className="trend-stat">
          <div className="trend-stat-val">{bestVsPar != null ? fmtPar(bestVsPar) : "—"}</div>
          <div className="trend-stat-lbl">Best</div>
        </div>
        <div className="trend-stat">
          <div className="trend-stat-val">{activeRoundsCount}</div>
          <div className="trend-stat-lbl">Rounds</div>
        </div>
      </div>

      <div className="trends-tabs">
        {[
          { key: "score",      label: "Score"      },
          { key: "gir",        label: "GIR"        },
          { key: "putts",      label: "Putts"      },
          { key: "fairways",   label: "Fairways"   },
          { key: "stableford", label: "Stableford" },
          { key: "handicap",   label: "Handicap"   },
        ].map(t => (
          <button key={t.key} className={"trend-tab" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)} style={{whiteSpace:"nowrap"}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "score" && (
        <div className="trend-charts-pair">
          <TrendLine data9={e9} data18={e18} metric="vsPar"    label="Gross vs Par" formatY={fmtPar} />
          <TrendLine data9={e9} data18={e18} metric="netVsPar" label="Net vs Par"   formatY={fmtPar} />
        </div>
      )}
      {tab === "gir"        && <TrendLine data9={e10} data18={[]} metric="girPct"            label="GIR %"                 yTicks={[0,25,50,75,100]} formatY={v => v+"%"}         height={80} />}
      {tab === "putts"      && <TrendLine data9={e10} data18={[]} metric="puttsPerHole"       label="Avg Putts / Hole"      yTicks={[1.5,2.0,2.5,3.0]} formatY={v => v.toFixed(1)} height={80} />}
      {tab === "fairways"   && <TrendLine data9={e10} data18={[]} metric="fwPct"              label="Fairways %"            yTicks={[0,25,50,75,100]} formatY={v => v+"%"}         height={80} />}
      {tab === "stableford" && <TrendLine data9={e10} data18={[]} metric="stablefordPerHole"  label="Stableford pts / hole" formatY={v => v.toFixed(1)} height={80} lineColor="#C9A84C" />}
      {tab === "handicap" && (
        whsRounds.length < 2
          ? <div style={{background:"white",border:"1px solid var(--border)",borderRadius:14,padding:"24px 16px",textAlign:"center",fontSize:13,color:"var(--text-dim)"}}>Log more rounds to see handicap trend</div>
          : <TrendLine data9={whsRounds} data18={[]} metric="whs_index" label="WHS Index" formatY={v => v.toFixed(1)} height={80} lineColor="#4A90D9" />
      )}
    </div>
  );
}

async function enrichRounds(rounds) {
  if (!rounds || rounds.length === 0) return rounds;
  const roundIds = rounds.map(r => r.id);
  const uniqueCourseIds = [...new Set(rounds.map(r => r.course_id).filter(Boolean))];

  const [holesRes, chRes] = await Promise.all([
    supabase.from("round_holes")
      .select("round_id, hole_number, gir, dna, fairway, par, score, putts, picked_up, stroke_index, approach, shots_inside_50")
      .in("round_id", roundIds),
    uniqueCourseIds.length > 0
      ? supabase.from("course_holes").select("course_id, hole_number, stroke_index").in("course_id", uniqueCourseIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Build siMap[courseId][holeNumber] = strokeIndex
  const siMap = {};
  for (const ch of (chRes.data || [])) {
    if (!siMap[ch.course_id]) siMap[ch.course_id] = {};
    if (ch.stroke_index) siMap[ch.course_id][ch.hole_number] = ch.stroke_index;
  }

  const roundsById = Object.fromEntries(rounds.map(r => [r.id, r]));
  const statsMap = {};
  for (const rid of roundIds) {
    statsMap[rid] = { gir_count: 0, attempted_holes: 0, fw_hit: 0, fw_holes: 0, miss_left: 0, miss_right: 0, three_putt_count: 0, total_putts: 0, stableford_total: 0, stableford_holes: 0, scrambling_made: 0, scrambling_opps: 0 };
  }

  for (const h of (holesRes.data || [])) {
    const sm = statsMap[h.round_id];
    if (!sm) continue;
    if (!h.dna) {
      sm.attempted_holes++;
      sm.total_putts += (h.putts || 0);
      if (h.gir) sm.gir_count++;
      if (h.putts >= 3) sm.three_putt_count++;
      if (h.par >= 4) {
        sm.fw_holes++;
        if (h.fairway === "yes")   sm.fw_hit++;
        if (h.fairway === "left")  sm.miss_left++;
        if (h.fairway === "right") sm.miss_right++;
      }
      // Scrambling (up-and-down from under 50 on missed GIR)
      if (!h.gir && !h.picked_up && h.approach === "Under 50") {
        sm.scrambling_opps++;
        if (h.shots_inside_50 === 1 && h.putts === 1) sm.scrambling_made++;
      }
      // Stableford — use stored SI first, fall back to course_holes siMap
      const round = roundsById[h.round_id];
      if (round) {
        const si = h.stroke_index || siMap[round.course_id]?.[h.hole_number] || 0;
        if (h.picked_up && round.handicap != null) {
          sm.stableford_holes++; // 0 pts, hole counted
        } else if (round.handicap != null && h.score !== null && si > 0) {
          sm.stableford_holes++;
          const hcp = round.handicap;
          const hp  = round.holes_played || 9;
          let shots = 0;
          if (hcp >= si)          shots = 1;
          if (hcp >= si + hp)     shots = 2;
          if (hcp >= si + hp * 2) shots = 3;
          sm.stableford_total += Math.max(0, 2 + h.par - (h.score - shots));
        }
      }
    }
  }

  const holesByRound = {};
  for (const h of (holesRes.data || [])) {
    if (!holesByRound[h.round_id]) holesByRound[h.round_id] = [];
    holesByRound[h.round_id].push(h);
  }
  return rounds.map(r => ({ ...r, ...statsMap[r.id], prorated_hcp: prorateHandicap(r, holesByRound) }));
}

async function callAI(prompt) {
  const r = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const d = await r.json();
  return d.content?.map(c => c.text || "").join("") || "Analysis unavailable.";
}

function parseFt(v) {
  if (!v) return 0;
  if (v === "30+" || v === "20+") return parseInt(v) + 2;
  if (v === "7+") return 8;
  return parseInt(v) || 0;
}

function parsePutt2(v) {
  if (!v) return null;
  if (v === "<1") return 0.5;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function AnalyticsTab({ sentRounds }) {
  const [analyticsHoles, setAnalyticsHoles] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsCount, setAnalyticsCount] = useState(5);
  const [analyticsTab, setAnalyticsTab] = useState("approach");

  useEffect(() => {
    if (analyticsHoles !== null || analyticsLoading || sentRounds.length === 0) return;
    setAnalyticsLoading(true);
    supabase
      .from("round_holes")
      .select("round_id, hole_number, approach, putt1, putt2, dna, picked_up")
      .in("round_id", sentRounds.map(r => r.id))
      .then(({ data }) => {
        setAnalyticsHoles(data || []);
        setAnalyticsLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (analyticsLoading || analyticsHoles === null) {
    return <div className="loading-wrap"><div className="spinner" /></div>;
  }

  const countOptions = [5, 10, 20, 50].filter(n => sentRounds.length >= n);
  if (!countOptions.includes(analyticsCount)) {
    // snap to largest available
  }
  const N = analyticsCount;
  const currentRoundIds = new Set(sentRounds.slice(0, N).map(r => r.id));
  const prevRoundIds    = new Set(sentRounds.slice(N, N * 2).map(r => r.id));

  const activeHoles = analyticsHoles.filter(h => !h.dna && !h.picked_up);
  const currentHoles = activeHoles.filter(h => currentRoundIds.has(h.round_id));
  const prevHoles    = activeHoles.filter(h => prevRoundIds.has(h.round_id));

  // Table 1 — Avg 1st putt by approach band
  const approachBands = [
    { key: "Under 50", label: "Under 50" },
    { key: "50–75",    label: "50–75" },
    { key: "75–100",   label: "75–100" },
    { key: "100–125",  label: "100–125" },
    { key: "125–150",  label: "125–150" },
    { key: "150+",     label: "150+" },
  ];

  const approachRows = approachBands.map(({ key, label }) => {
    const cur  = currentHoles.filter(h => h.approach === key && h.putt1);
    const prev = prevHoles.filter(h => h.approach === key && h.putt1);
    if (!cur.length) return null;
    const avgCur  = cur.reduce((s, h) => s + parseFt(h.putt1), 0) / cur.length;
    const avgPrev = prev.length >= 3 ? prev.reduce((s, h) => s + parseFt(h.putt1), 0) / prev.length : null;
    let indicator = null;
    if (avgPrev !== null && cur.length >= 3) {
      if (avgCur < avgPrev - 0.5)      indicator = "↓";
      else if (avgCur > avgPrev + 0.5) indicator = "↑";
    }
    return { label, count: cur.length, avg: avgCur, indicator };
  }).filter(Boolean);

  // Table 2 — Avg 2nd putt by 1st putt value
  const putt1Groups = ["<3", "3", "4", "6", "9", "12", "15", "20", "25", "30+"];

  const putt2Rows = putt1Groups.map(p1v => {
    const cur  = currentHoles.filter(h => h.putt1 === p1v && parsePutt2(h.putt2) !== null);
    const prev = prevHoles.filter(h => h.putt1 === p1v && parsePutt2(h.putt2) !== null);
    if (!cur.length) return null;
    const avgCur  = cur.reduce((s, h) => s + parsePutt2(h.putt2), 0) / cur.length;
    const avgPrev = prev.length >= 3 ? prev.reduce((s, h) => s + parsePutt2(h.putt2), 0) / prev.length : null;
    let indicator = null;
    if (avgPrev !== null && cur.length >= 3) {
      if (avgCur < avgPrev - 0.3)      indicator = "↓";
      else if (avgCur > avgPrev + 0.3) indicator = "↑";
    }
    return { p1v, count: cur.length, avg: avgCur, indicator };
  }).filter(Boolean);

  const tblHead = { fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"var(--text-dim)", marginBottom:10 };
  const tblWrap = { background:"white", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:12 };

  return (
    <div>
      {/* Count selector */}
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {countOptions.map(n => (
          <button
            key={n}
            onClick={() => setAnalyticsCount(n)}
            style={{
              padding:"5px 14px", borderRadius:20, border:"1.5px solid",
              borderColor: analyticsCount === n ? "var(--green-dark)" : "var(--border)",
              background: analyticsCount === n ? "var(--green-dark)" : "white",
              color: analyticsCount === n ? "white" : "var(--text-dim)",
              fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer",
            }}
          >
            Last {n}
          </button>
        ))}
      </div>

      {/* Sub-tab row */}
      <div className="trends-tabs" style={{marginBottom:14}}>
        <button className={"trend-tab" + (analyticsTab === "approach" ? " active" : "")} onClick={() => setAnalyticsTab("approach")} style={{whiteSpace:"nowrap"}}>
          1st Putt by Approach
        </button>
        <button className={"trend-tab" + (analyticsTab === "putt2" ? " active" : "")} onClick={() => setAnalyticsTab("putt2")} style={{whiteSpace:"nowrap"}}>
          2nd Putt by 1st Putt
        </button>
      </div>

      {/* Table 1 */}
      {analyticsTab === "approach" && (
        <div style={tblWrap}>
          <div style={tblHead}>Avg 1st putt distance by approach</div>
          {approachRows.length === 0 ? (
            <div style={{fontSize:13,color:"var(--text-dim)"}}>No approach data recorded</div>
          ) : (
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{color:"var(--text-dim)",fontSize:11}}>
                  <th style={{textAlign:"left",paddingBottom:6,fontWeight:600}}>Band</th>
                  <th style={{textAlign:"center",paddingBottom:6,fontWeight:600}}>Holes</th>
                  <th style={{textAlign:"right",paddingBottom:6,fontWeight:600}}>Avg 1st putt</th>
                  <th style={{textAlign:"right",paddingBottom:6,fontWeight:600}}>vs prev</th>
                </tr>
              </thead>
              <tbody>
                {approachRows.map(row => (
                  <tr key={row.label} style={{borderTop:"1px solid var(--border)"}}>
                    <td style={{padding:"7px 0",fontSize:12,color:"var(--text-mid)"}}>{row.label} yds</td>
                    <td style={{textAlign:"center",fontSize:12,color:"var(--text-dim)"}}>×{row.count}</td>
                    <td style={{textAlign:"right",fontWeight:700,color:"var(--text)"}}>{row.avg.toFixed(1)} ft</td>
                    <td style={{textAlign:"right",fontWeight:700,color: row.indicator === "↓" ? "var(--green-mid)" : row.indicator === "↑" ? "var(--red)" : "var(--text-dim)", fontSize:14}}>
                      {row.indicator || "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Table 2 */}
      {analyticsTab === "putt2" && (
        <div style={tblWrap}>
          <div style={tblHead}>Avg 2nd putt distance by 1st putt</div>
          {putt2Rows.length === 0 ? (
            <div style={{fontSize:13,color:"var(--text-dim)"}}>No second putt distance data recorded</div>
          ) : (
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{color:"var(--text-dim)",fontSize:11}}>
                  <th style={{textAlign:"left",paddingBottom:6,fontWeight:600}}>1st putt</th>
                  <th style={{textAlign:"center",paddingBottom:6,fontWeight:600}}>Holes</th>
                  <th style={{textAlign:"right",paddingBottom:6,fontWeight:600}}>Avg 2nd putt</th>
                  <th style={{textAlign:"right",paddingBottom:6,fontWeight:600}}>vs prev</th>
                </tr>
              </thead>
              <tbody>
                {putt2Rows.map(row => (
                  <tr key={row.p1v} style={{borderTop:"1px solid var(--border)"}}>
                    <td style={{padding:"7px 0",fontSize:12,color:"var(--text-mid)"}}>{row.p1v} ft</td>
                    <td style={{textAlign:"center",fontSize:12,color:"var(--text-dim)"}}>×{row.count}</td>
                    <td style={{textAlign:"right",fontWeight:700,color:"var(--text)"}}>{row.avg.toFixed(1)} ft</td>
                    <td style={{textAlign:"right",fontWeight:700,color: row.indicator === "↓" ? "var(--green-mid)" : row.indicator === "↑" ? "var(--red)" : "var(--text-dim)", fontSize:14}}>
                      {row.indicator || "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function RoundHistory({ student, rounds, coachId, onSelectRound, onBack, onSignOut, onHome }) {
  const sentRounds = rounds.filter(r => r.sent_to_coach);
  const scored     = sentRounds.filter(r => r.total_score);
  const rounds9Count  = scored.filter(r => r.holes_played === 9).length;
  const rounds18Count = scored.filter(r => r.holes_played === 18).length;
  const [activeStatTab, setActiveStatTab] = useState(() => rounds9Count > rounds18Count ? 9 : 18);
  const [aiPatterns, setAiPatterns] = useState(null);
  const [mainView, setMainView] = useState("trends");

  const diffs   = scored.map(r => r.total_score - getCoursePar(r));
  const avgDiff = diffs.length ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) : null;
  const bestDiff = diffs.length ? Math.min(...diffs) : null;
  function fmtDiff(d) { return d == null ? "—" : d === 0 ? "E" : d > 0 ? "+" + d : String(d); }

  const aiRoundsCount = Math.min(scored.length, 5);

  useEffect(() => {
    if (scored.length < 3) return;
    const last5 = scored.slice(0, 5).reverse(); // last 5 regardless of length, oldest → newest
    setAiPatterns(null);
    const roundSummaries = last5.map((r, i) => {
      const hp           = r.holes_played || 9;
      const vsPar        = r.total_score - getCoursePar(r);
      const vsParPerHole = (vsPar / hp).toFixed(2);
      const girPct       = r.attempted_holes ? Math.round(r.gir_count / r.attempted_holes * 100) : null;
      const fwPct        = r.fw_holes ? Math.round(r.fw_hit / r.fw_holes * 100) : null;
      const puttsPerHole = r.total_putts != null ? (r.total_putts / hp).toFixed(2) : null;
      const stableford   = r.stableford_holes ? (r.stableford_total / r.stableford_holes).toFixed(2) : null;
      const scrPct       = r.scrambling_opps > 0 ? Math.round(r.scrambling_made / r.scrambling_opps * 100) : null;
      const fmtDate      = new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const courseName   = r.courses?.name || "Golf Course";
      return `Round ${i + 1} (${fmtDate}, ${courseName}, ${hp} holes):` +
        ` vs par/hole ${vsParPerHole >= 0 ? "+" : ""}${vsParPerHole}` +
        (stableford   != null ? `, stableford/hole ${stableford}` : "") +
        (girPct       != null ? `, GIR ${girPct}%` : "") +
        (fwPct        != null ? `, fairways ${fwPct}% (${r.miss_left ?? 0}L ${r.miss_right ?? 0}R miss)` : "") +
        (puttsPerHole != null ? `, putts/hole ${puttsPerHole}` : "") +
        (scrPct       != null ? `, scrambling ${scrPct}%` : "") +
        (r.handicap   != null ? `, course hcp ${r.handicap}` : "") +
        (r.whs_index  != null ? `, WHS index ${r.whs_index}` : "");
    });

    const SYSTEM_PROMPT = `You are an expert golf coach analysing a student's recent rounds to identify performance patterns. All stats have been normalised per hole so rounds of different lengths (9 or 18 holes) are directly comparable.

When identifying patterns, follow these rules:

COMPARING ROUNDS OF DIFFERENT LENGTHS
- All stats provided are already per-hole or percentage-based, so 9 and 18 hole rounds can be compared directly
- Do not treat round length as a significant variable — focus on the normalised stats
- Stableford points per hole is the most reliable scoring metric across round lengths

HANDICAP CONTEXT
- If WHS index is available across rounds, factor in handicap changes when interpreting Stableford trends
- If Stableford per hole is stable but WHS index is decreasing, this means the student is genuinely improving — they are scoring the same points against a tougher standard
- If Stableford per hole is improving and WHS index is also decreasing, this is strong improvement
- Always contextualise scoring stats against the student's handicap at the time of each round

WHAT TO LOOK FOR
- Trends in scoring, GIR %, fairways %, and putting across the rounds provided
- Consistency or inconsistency in specific areas
- Whether short game (scrambling, putts per hole on non-GIR holes) is compensating for or compounding ball striking issues
- Directional patterns in fairway misses if data shows a consistent left or right tendency
- Relationships between stats e.g. better fairways leading to better GIR, or worse GIR leading to more putts

OUTPUT FORMAT
- Identify exactly 3 patterns, numbered 1 to 3, ordered by significance
- Each pattern should be 2-3 sentences: what the pattern is, what the data shows, and what it means for the student's development
- Use third person ("the student", "they", "their")
- Be specific — reference actual numbers from the data
- Be constructive — frame patterns as development opportunities, not criticisms
- Do not mention round length or the normalisation process in the output`;

    const last5Ids = last5.map(r => r.id).sort();

    const APPROACH_BANDS = [
      { key: "Under 50", label: "under 50" },
      { key: "50\u201375",    label: "50\u201375" },
      { key: "75\u2013100",   label: "75\u2013100" },
      { key: "100\u2013125",  label: "100\u2013125" },
      { key: "125\u2013150",  label: "125\u2013150" },
      { key: "150+",     label: "150+" },
    ];

    async function run() {
      const { data: cached } = await supabase
        .from("ai_cache")
        .select("content, round_ids")
        .eq("coach_id", coachId)
        .eq("student_id", student.id)
        .eq("cache_type", "patterns")
        .maybeSingle();
      if (cached) {
        const cachedIds = [...cached.round_ids].sort();
        if (cachedIds.length === last5Ids.length && cachedIds.every((id, i) => id === last5Ids[i])) {
          setAiPatterns(cached.content);
          return;
        }
      }

      // Fetch per-hole data for approach and putt enrichment
      const { data: allHoles } = await supabase
        .from("round_holes")
        .select("round_id, approach, putt1, dna, picked_up")
        .in("round_id", last5.map(r => r.id));

      const holesByRound = {};
      (allHoles || []).forEach(h => {
        if (!holesByRound[h.round_id]) holesByRound[h.round_id] = [];
        holesByRound[h.round_id].push(h);
      });

      const enhancedSummaries = last5.map((r, i) => {
        const holes = (holesByRound[r.id] || []).filter(h => !h.dna && !h.picked_up);
        const approachHoles = holes.filter(h => h.approach);
        const totalApproach = approachHoles.length;

        let approachLine = "";
        if (totalApproach > 0) {
          const parts = APPROACH_BANDS
            .map(b => {
              const count = approachHoles.filter(h => h.approach === b.key).length;
              return count > 0 ? `${Math.round(count / totalApproach * 100)}% ${b.label}` : null;
            })
            .filter(Boolean);
          if (parts.length > 0) approachLine = `\n  Approach: ${parts.join(", ")}`;
        }

        let puttLine = "";
        const puttParts = APPROACH_BANDS
          .map(b => {
            const bandHoles = approachHoles.filter(h => h.approach === b.key && h.putt1);
            if (bandHoles.length < 2) return null;
            const avg = Math.round(bandHoles.reduce((sum, h) => sum + parseFt(h.putt1), 0) / bandHoles.length);
            return `${b.label} = ${avg}ft`;
          })
          .filter(Boolean);
        if (puttParts.length > 0) puttLine = `\n  Avg 1st putt: ${puttParts.join(", ")}`;

        return roundSummaries[i] + approachLine + puttLine;
      });

      const enhancedPrompt = `${SYSTEM_PROMPT}\n\nAnalyse these ${last5.length} rounds from ${student.first_name} ${student.last_name}:\n\nRounds listed oldest to newest (Round 1 = oldest, Round ${last5.length} = most recent):\n${enhancedSummaries.join("\n")}`;

      try {
        const result = await callAI(enhancedPrompt);
        setAiPatterns(result);
        console.log("ai_cache upsert values:", { coach_id: coachId, student_id: student.id, cache_type: "patterns", round_ids: last5.map(r => r.id) });
        const { error: cacheError } = await supabase.from("ai_cache").upsert({
          coach_id: coachId,
          student_id: student.id,
          cache_type: "patterns",
          content: result,
          round_ids: last5.map(r => r.id),
        }, { onConflict: "coach_id,student_id,cache_type" });
        if (cacheError) console.error("ai_cache upsert failed:", cacheError);
      } catch {
        setAiPatterns("Pattern analysis unavailable.");
      }
    }
    run();
  }, [rounds]); // eslint-disable-line react-hooks/exhaustive-deps

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
            <div className="sh-name">
              {student.first_name} {student.last_name}
              {student.official_handicap != null && (
                <span style={{fontSize:14,fontWeight:400,color:"rgba(255,255,255,0.55)",marginLeft:8}}>
                  Hcp {Number(student.official_handicap).toFixed(1)}
                </span>
              )}
            </div>
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
            {/* Trends / Analytics toggle */}
            <div className="trends-tabs" style={{marginBottom:16}}>
              <button className={"trend-tab" + (mainView === "trends" ? " active" : "")} onClick={() => setMainView("trends")}>
                Trends
              </button>
              <button className={"trend-tab" + (mainView === "analytics" ? " active" : "")} onClick={() => setMainView("analytics")}>
                Analytics
              </button>
            </div>

            {mainView === "trends" && (
              <RoundTrends rounds={sentRounds} activeTab={activeStatTab} setActiveTab={setActiveStatTab} />
            )}

            {mainView === "analytics" && (
              <AnalyticsTab sentRounds={sentRounds} />
            )}

            {scored.length >= 3 && (
              <div className="ai-box">
                <div className="ai-label">✦ Multi-round pattern analysis — last {aiRoundsCount} rounds</div>
                {aiPatterns
                  ? <div className="ai-text">{aiPatterns}</div>
                  : <div className="ai-loading"><div className="ai-spinner" />Analysing patterns across rounds…</div>}
              </div>
            )}

            <div className="section-label">Round history</div>
            {sentRounds.map(r => {
              const diff = parDiff(r.total_score, r);
              return (
                <div className="round-card" key={r.id} onClick={() => onSelectRound(r)}>
                  <div className="round-card-top">
                    <div>
                      <div className="round-card-date" style={{fontWeight:700,color:"var(--text)",fontSize:14,display:"flex",alignItems:"center",gap:8}}>
                        {r.courses?.name || "Golf Course"}
                        {r.historical && <span style={{background:"#EEF0FF",color:"#4A5FBD",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6}}>Historical</span>}
                      </div>
                      <div className="round-card-course">{fmtDate(r.created_at)} · {r.attempted_holes != null && r.attempted_holes !== r.holes_played ? `${r.attempted_holes}/${r.holes_played} holes` : `${r.holes_played} holes`}</div>
                    </div>
                    <div className="round-score-block">
                      <div className="round-score-num">{r.total_score ?? "—"}</div>
                      {r.total_score && <div className={"round-score-par " + diff.cls}>{diff.text}</div>}
                      {r.handicap != null && (
                        <div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>
                          Course Hcp {Number(r.handicap).toFixed(1)}{r.total_score ? ` · Net ${r.total_score - (r.prorated_hcp ?? r.handicap)}` : ""}
                        </div>
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
export default function CoachHome({ user, onSelectRound, onSignOut, onProfile, initialScreen, initialStudent }) {
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
        .from("profiles").select("id, first_name, last_name, official_handicap").in("id", ids);
      setStudents(profiles || []);

      // Load rounds for all students to compute stats
      const { data: allRounds } = await supabase
        .from("rounds")
        .select("id, student_id, total_score, handicap, holes_played, total_par, course_id, sent_to_coach, created_at")
        .in("student_id", ids)
        .eq("sent_to_coach", true)
        .order("created_at", { ascending: false });

      // Compute per-student stats
      const stats = {};
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      (profiles || []).forEach(p => {
        const pRounds = (allRounds || []).filter(r => r.student_id === p.id);
        const scored  = pRounds.filter(r => r.total_score);

        // Current handicap = most recent round that has one
        const currentHcp = pRounds.find(r => r.handicap != null)?.handicap ?? null;

        // Avg net vs par, split by 9-hole and 18-hole
        const scored9  = scored.filter(r => (r.holes_played || 9) <= 9 && r.handicap != null);
        const scored18 = scored.filter(r => (r.holes_played || 9) > 9  && r.handicap != null);
        const avgNetVsPar9  = scored9.length
          ? scored9.reduce((s, r) => s + ((r.total_score - r.handicap) - getCoursePar(r)), 0) / scored9.length
          : null;
        const avgNetVsPar18 = scored18.length
          ? scored18.reduce((s, r) => s + ((r.total_score - r.handicap) - getCoursePar(r)), 0) / scored18.length
          : null;

        stats[p.id] = {
          totalRounds:    pRounds.length,
          currentHcp,
          avgNetVsPar9,
          avgNetVsPar18,
          lastRoundDate:  pRounds[0]?.created_at || null,
          thisMonth:      pRounds.filter(r => r.created_at >= monthStart).length,
          newRounds:      pRounds.filter(r => {
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
        const enriched = await enrichRounds(rounds || []);
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

    const enriched = await enrichRounds(data || []);
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
        coachId={user.id}
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
      onProfile={onProfile}
    />
  );
}
