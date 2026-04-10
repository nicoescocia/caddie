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
  .signout-btn { background:none; border:1px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.6); border-radius:8px; padding:5px 12px; font-family:'Outfit',sans-serif; font-size:12px; cursor:pointer; transition:all .2s; }
  .signout-btn:hover { border-color:rgba(255,255,255,0.5); color:white; }
  .back-bar-btn { background:none; border:none; color:rgba(255,255,255,0.7); font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; cursor:pointer; padding:0; display:flex; align-items:center; gap:6px; transition:color .15s; }
  .back-bar-btn:hover { color:white; }
  .coach-wrap { max-width:980px; margin:0 auto; padding:22px 20px 48px; }

  /* Empty state */
  .empty-state { text-align:center; padding:80px 24px; background:white; border-radius:20px; border:2px dashed var(--border); }
  .es-icon { font-size:52px; margin-bottom:14px; }
  .es-title { font-family:'Playfair Display',serif; font-size:22px; margin-bottom:8px; }
  .es-sub { font-size:14px; color:var(--text-mid); line-height:1.7; }

  /* Student tabs */
  .student-tabs { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
  .student-tab { background:white; border:1.5px solid var(--border); border-radius:12px; padding:8px 16px; font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; color:var(--text-mid); cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:8px; }
  .student-tab:hover { border-color:var(--green-light); }
  .student-tab.active { background:var(--green-dark); border-color:var(--green-dark); color:white; }
  .new-dot { width:8px; height:8px; background:var(--red); border-radius:50%; animation:pulse 1.5s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

  /* Alert bar */
  .alert-bar { background:linear-gradient(135deg,var(--green-dark),var(--green)); border-radius:16px; padding:18px 22px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
  .ab-left { display:flex; align-items:center; gap:14px; }
  .ab-icon { font-size:26px; }
  .ab-name { font-size:16px; font-weight:700; color:white; margin-bottom:3px; }
  .ab-detail { font-size:13px; color:rgba(255,255,255,0.6); }
  .ab-right { text-align:right; }
  .ab-score { font-family:'Playfair Display',serif; font-size:48px; color:var(--gold); line-height:1; }
  .ab-par { font-size:13px; color:rgba(255,255,255,0.5); }

  /* Grids */
  .g4 { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:14px; }
  .g3 { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:14px; }
  .g2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
  @media(max-width:700px) { .g4{grid-template-columns:repeat(2,1fr);} .g2{grid-template-columns:1fr;} }

  /* Cards */
  .ccard { background:white; border-radius:14px; border:1px solid var(--border); padding:18px; box-shadow:var(--shadow); }
  .cc-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-bottom:13px; }
  .bstat { font-family:'Playfair Display',serif; font-size:44px; line-height:1; }
  .bstat.bad { color:var(--red); } .bstat.warn { color:var(--orange); } .bstat.ok { color:var(--green-mid); } .bstat.neu { color:var(--text); }
  .bstat-sub { font-size:12px; color:var(--text-dim); margin-top:4px; }

  /* Scorecard */
  .sc-row { display:grid; grid-template-columns:36px 1fr 44px 44px 44px 54px 70px; gap:4px; align-items:center; padding:6px 2px; border-bottom:1px solid var(--border); font-size:12px; }
  .sc-row.hdr { font-size:10px; font-weight:700; color:var(--text-dim); text-transform:uppercase; letter-spacing:.05em; padding-bottom:8px; }
  .sc-row:last-child { border-bottom:none; }
  .miss-tag { display:inline-block; font-size:10px; font-weight:700; padding:1px 5px; border-radius:4px; }
  .miss-tag.left { background:#EEF0FE; color:var(--sky); }
  .miss-tag.right { background:#FEF3E8; color:var(--orange); }

  /* Score notation */
  .score-notation { display:inline-flex; align-items:center; justify-content:center; font-size:15px; font-weight:800; width:32px; height:32px; position:relative; }
  .score-notation.eagle { color:var(--gold); border:2.5px solid var(--gold); border-radius:50%; outline:2.5px solid var(--gold); outline-offset:3px; }
  .score-notation.birdie { color:var(--green-mid); border:2.5px solid var(--green-mid); border-radius:50%; }
  .score-notation.par { color:var(--text-mid); }
  .score-notation.bogey { color:var(--orange); border:2.5px solid var(--orange); border-radius:3px; }
  .score-notation.double { color:var(--red); border:2.5px solid var(--red); border-radius:3px; outline:2.5px solid var(--red); outline-offset:3px; }
  .score-notation.worse { color:#8B1A1A; border:2.5px solid #8B1A1A; border-radius:3px; outline:2.5px solid #8B1A1A; outline-offset:3px; }

  /* Putt table */
  .pt { width:100%; border-collapse:collapse; font-size:13px; }
  .pt th { font-size:10px; font-weight:700; color:var(--text-dim); text-transform:uppercase; letter-spacing:.06em; padding:4px 8px; text-align:left; }
  .pt td { padding:7px 8px; border-top:1px solid var(--border); }
  .chip { display:inline-block; font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; }
  .chip.bad { background:#FDECEA; color:var(--red); }
  .chip.ok { background:#E8F4EE; color:var(--green-mid); }
  .chip.warn { background:#FEF3E8; color:var(--orange); }
  .chip.tp { background:#FDECEA; color:var(--red); }
  .chip.two { background:#E8F4EE; color:var(--green-mid); }
  .abar { height:5px; background:#EEE; border-radius:3px; margin-top:3px; }
  .abar-fill { height:100%; border-radius:3px; }
  .abar-fill.s { background:var(--green-light); }
  .abar-fill.l { background:var(--orange); }

  /* Miss bars */
  .miss-bar { display:flex; align-items:center; gap:8px; margin-top:4px; }
  .miss-label { font-size:12px; color:var(--text-dim); width:36px; }
  .miss-track { flex:1; height:8px; background:#EEE; border-radius:4px; overflow:hidden; }
  .miss-fill { height:100%; border-radius:4px; }
  .miss-fill.left { background:var(--sky); }
  .miss-fill.right { background:var(--orange); }
  .miss-count { font-size:12px; font-weight:700; width:20px; }

  /* Short game table */
  .sg-table { width:100%; border-collapse:collapse; font-size:13px; }
  .sg-table th { font-size:10px; font-weight:700; color:var(--text-dim); text-transform:uppercase; letter-spacing:.06em; padding:4px 8px; text-align:left; }
  .sg-table td { padding:7px 8px; border-top:1px solid var(--border); }

  /* Focus */
  .focus-list { display:flex; flex-direction:column; gap:9px; }
  .focus-item { display:flex; gap:11px; padding:11px; background:var(--bg); border-radius:10px; align-items:flex-start; }
  .fp { width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; color:white; flex-shrink:0; }
  .fp.p1 { background:var(--red); } .fp.p2 { background:var(--orange); } .fp.p3 { background:var(--gold); color:var(--green-dark); }
  .ft { font-size:13px; font-weight:700; margin-bottom:3px; }
  .fd { font-size:12px; color:var(--text-mid); line-height:1.5; }
  .fs { font-size:11px; font-weight:600; color:var(--green); margin-top:4px; }

  /* AI box */
  .ai-box { background:linear-gradient(135deg,#F9F6EE,#EFF6EF); border:1px solid #D4E8D4; border-radius:11px; padding:13px 15px; margin-top:12px; }
  .ai-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--green); margin-bottom:7px; display:flex; align-items:center; gap:6px; }
  .ai-text { font-size:13px; color:var(--text-mid); line-height:1.7; }
  .ai-loading { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-dim); }
  .ai-spinner { width:14px; height:14px; border:2px solid #DDD; border-top-color:var(--green); border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }

  /* Note box */
  .note-box { border:1.5px dashed var(--border); border-radius:10px; padding:11px 13px; margin-top:12px; }
  .note-lbl { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-dim); margin-bottom:6px; }
  .note-area { width:100%; background:transparent; border:none; outline:none; font-family:'Outfit',sans-serif; font-size:13px; color:var(--text); resize:none; line-height:1.6; }

  /* Loading */
  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:60px; }
  .big-spinner { width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:spin .7s linear infinite; }
`;

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

function approachPct(v) {
  const m = { "Under 50": 20, "50–75": 38, "75–100": 52, "100–125": 68, "125–150": 84, "150+": 100 };
  return m[v] || 50;
}

function scoreClass(score, par) {
  const diff = score - par;
  if (diff <= -2) return "eagle";
  if (diff === -1) return "birdie";
  if (diff === 0)  return "par";
  if (diff === 1)  return "bogey";
  if (diff === 2)  return "double";
  return "worse";
}

async function callAI(prompt) {
  const r = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const d = await r.json();
  return d.content?.map(c => c.text || "").join("") || "Analysis unavailable.";
}

export default function CoachDashboard({ user, student, round, onBack, onSignOut }) {
  const [holes, setHoles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [aiPutting, setAiPutting] = useState(null);
  const [aiSg, setAiSg]           = useState(null);
  const [coachNote, setCoachNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    if (!round) return;
    async function loadHoles() {
      setAiPutting(null); setAiSg(null);
      const { data } = await supabase
        .from("round_holes")
        .select("*")
        .eq("round_id", round.id)
        .order("hole_number", { ascending: true });
      setHoles(data || []);
      setCoachNote(round.coach_note || "");
      setNoteSaved(false);
      setLoading(false);
      if (data && data.length > 0) runAI(data);
    }
    loadHoles();
  }, [round]);

  async function runAI(holeRows) {
    const summary = holeRows.map(h =>
      `H${h.hole_number} Par${h.par}: score ${h.score}, ${h.putts} putts, GIR ${h.gir ? "yes" : "no"}` +
      (h.approach ? `, approach ${h.approach}` : "") +
      (h.shots_inside_50 ? `, shots inside 50yds: ${h.shots_inside_50}` : "") +
      (h.putt1 ? `, 1st putt ${h.putt1}` : "") +
      (h.putt2 ? `, 2nd putt ${h.putt2}` : "") +
      (h.fairway ? `, fairway ${h.fairway}` : "") +
      (h.penalty && h.penalty !== "None" ? `, penalty ${h.penalty}` : "")
    ).join("\n");

    const tp    = holeRows.filter(h => h.putts >= 3).length;
    const tpPct = Math.round(tp / holeRows.length * 100);
    const p1s   = holeRows.filter(h => h.putt1).map(h => parseFt(h.putt1));
    const avgP  = p1s.length ? Math.round(p1s.reduce((a, b) => a + b) / p1s.length) : 0;
    const missL = holeRows.filter(h => h.fairway === "left").length;
    const missR = holeRows.filter(h => h.fairway === "right").length;
    const aiMissedGIR    = holeRows.filter(h => !h.gir && !h.picked_up && !h.dna);
    const aiUnder50      = aiMissedGIR.filter(h => h.approach === "Under 50");
    const aiScrambMade   = aiUnder50.filter(h => h.shots_inside_50 === 1 && h.putts === 1).length;

    try {
      const [r1, r2] = await Promise.all([
        callAI(`You are an expert golf coach reviewing a student's round. Write in third person about the student — use 'the student', 'they', 'their'; never 'you' or 'your'. Give a precise 2-sentence insight on their PUTTING. State whether 3-putts are caused by approach distance or actual putting failure. Use exact numbers.\n\n${summary}\nAvg first putt: ${avgP}ft. 3-putt rate: ${tpPct}%.\n\nTwo sentences only, no preamble.`),
        callAI(`You are an expert golf coach reviewing a student's round. Write in third person about the student — use 'the student', 'they', 'their'; never 'you' or 'your'. Analyse their short game and fairway miss data. Up-and-down definition: missed GIR + approach under 50 yds + 1 chip (shots_inside_50=1) + 1 putt. Scrambling: ${aiScrambMade}/${aiUnder50.length} converted. Fairway miss: ${missL} left, ${missR} right. Give a 2-sentence insight.\n\n${summary}\n\nTwo sentences only, no preamble.`),
      ]);
      setAiPutting(r1);
      setAiSg(r2);
    } catch (e) {
      setAiPutting("Analysis unavailable.");
      setAiSg("Analysis unavailable.");
    }
  }

  async function saveNote() {
    await supabase.from("rounds").update({ coach_note: coachNote }).eq("id", round.id);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="mode-bar">
          <div className="mode-logo" style={{cursor:"pointer"}} onClick={onBack}>⛳ Caddie</div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button className="back-bar-btn" onClick={onBack}>← Back to rounds</button>
            <button className="signout-btn" onClick={onSignOut}>Sign out</button>
          </div>
        </div>
        <div className="loading-wrap"><div className="big-spinner" /></div>
      </>
    );
  }

  // ── Stats ──
  const totalScore = holes.reduce((s, h) => s + (h.score || 0), 0);
  const totalPar   = holes.reduce((s, h) => s + (h.par || 0), 0);
  const diff       = totalScore - totalPar;

  // DNA holes excluded from all stats; picked_up holes count for GIR (started but abandoned)
  const attempted  = holes.filter(h => !h.dna);
  const p1s    = holes.filter(h => h.putt1).map(h => parseFt(h.putt1));
  const avgP   = p1s.length ? Math.round(p1s.reduce((a, b) => a + b) / p1s.length) : 0;
  const tp     = holes.filter(h => h.putts >= 3).length;
  const tpPct  = attempted.length ? Math.round(tp / attempted.length * 100) : 0;
  const girCount   = attempted.filter(h => h.gir).length;
  const fwHoles    = attempted.filter(h => h.par >= 4);
  const fwHit      = fwHoles.filter(h => h.fairway === "yes").length;
  const missL      = fwHoles.filter(h => h.fairway === "left").length;
  const missR      = fwHoles.filter(h => h.fairway === "right").length;
  const maxMiss    = Math.max(missL, missR, 1);
  const missedGIR  = attempted.filter(h => !h.gir && !h.picked_up);
  const under50GIRMisses = missedGIR.filter(h => h.approach === "Under 50");
  const avgSI    = under50GIRMisses.length
    ? (under50GIRMisses.reduce((s, h) => s + (h.shots_inside_50 || 1), 0) / under50GIRMisses.length).toFixed(1)
    : null;

  // Focus areas
  const focusAreas = [];
  const longTPs = holes.filter(h => h.putts >= 3 && approachPct(h.approach) > 75).length;
  if (longTPs >= 2) focusAreas.push({
    p: "p1", t: "Proximity from 125–150 yds",
    d: `${longTPs} of ${tp} three-putts followed approaches from 125 yds+. Distance control issue, not putting.`,
    s: "Drill: flag targeting from 130–140 yds"
  });
  if (avgP > 18) focusAreas.push({
    p: focusAreas.length ? "p2" : "p1", t: "Lag putting pace control",
    d: `Averaging ${avgP}ft for first putt. Needs to be under 18ft to avoid three-putt territory.`,
    s: "Clock drill from 20ft — target ≤3ft leave"
  });
  const dominantMiss = missL > missR + 1 ? "left" : missR > missL + 1 ? "right" : null;
  if (dominantMiss) focusAreas.push({
    p: focusAreas.length < 1 ? "p1" : focusAreas.length < 2 ? "p2" : "p3",
    t: `Consistent ${dominantMiss} miss off tee`,
    d: `${dominantMiss === "left" ? missL : missR} of ${fwHoles.length} fairways missed ${dominantMiss}. Pattern suggests ${dominantMiss === "left" ? "closed face or out-to-in path" : "open face or in-to-out path"}.`,
    s: `Check ${dominantMiss === "left" ? "grip and alignment" : "takeaway and face angle"} at setup`
  });
  const scrambMade = under50GIRMisses.filter(h => h.shots_inside_50 === 1 && h.putts === 1).length;
  const multiChip  = under50GIRMisses.filter(h => (h.shots_inside_50 || 1) >= 2).length;
  if (under50GIRMisses.length > 0 && scrambMade / under50GIRMisses.length < 0.5) focusAreas.push({
    p: focusAreas.length < 1 ? "p1" : focusAreas.length < 2 ? "p2" : "p3",
    t: "Scrambling — up-and-down conversion",
    d: `Converted ${scrambMade} of ${under50GIRMisses.length} up-and-down chances (1 chip + 1 putt from inside 50 yds).${multiChip > 0 ? ` ${multiChip} holes required 2+ chips.` : ""}`,
    s: "Drill: chip to within 3ft from rough/fringe"
  });
  if (focusAreas.length === 0) focusAreas.push({
    p: "p1", t: "Solid round overall",
    d: "No major patterns detected. Continue building consistency.",
    s: "Maintain current practice routine"
  });

  const studentName = student ? `${student.first_name} ${student.last_name}` : "Student";
  const roundDate   = new Date(round.created_at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <style>{css}</style>

      <div className="mode-bar">
        <div className="mode-logo">⛳ Caddie</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="back-bar-btn" onClick={onBack}>← Back to rounds</button>
          <button className="signout-btn" onClick={onSignOut}>Sign out</button>
        </div>
      </div>

      <div className="coach-wrap">

        {/* Alert bar */}
        <div className="alert-bar">
          <div className="ab-left">
            <div className="ab-icon">⛳</div>
            <div>
              <div className="ab-name">
                Round received · {studentName}
                {student?.official_handicap != null && (
                  <span style={{fontSize:13,fontWeight:400,color:"rgba(255,255,255,0.55)",marginLeft:8}}>
                    Hcp {Number(student.official_handicap).toFixed(1)}
                  </span>
                )}
              </div>
              <div className="ab-detail">{round.courses?.name || "Golf Course"} · {holes.length} holes · {roundDate}</div>
            </div>
          </div>
          <div className="ab-right">
            <div className="ab-score">{totalScore}</div>
            <div className="ab-par">{diff >= 0 ? "+" : ""}{diff} vs par</div>
            {round.handicap != null && (
              <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",marginTop:2}}>
                Net {totalScore - round.handicap} · Course Hcp {Number(round.handicap).toFixed(1)}
              </div>
            )}
          </div>
        </div>

        {/* Weather / notes bar */}
        {(round.wind || round.conditions || round.temperature || round.student_note) && (
          <div style={{background:"white",border:"1px solid var(--border)",borderRadius:12,padding:"12px 16px",marginBottom:16,fontSize:13}}>
            {(round.wind || round.conditions || round.temperature) && (
              <div style={{color:"var(--text-mid)",marginBottom:round.student_note ? 6 : 0}}>
                🌤 {[round.wind, round.conditions, round.temperature].filter(Boolean).join(" · ")}
              </div>
            )}
            {round.student_note && (
              <div style={{color:"var(--text-mid)",fontStyle:"italic"}}>
                💬 &ldquo;{round.student_note}&rdquo;
              </div>
            )}
          </div>
        )}

        {/* Stat cards */}
        <div className="g4">
          <div className="ccard">
            <div className="cc-title">Avg first putt</div>
            <div className={`bstat ${avgP > 20 ? "bad" : avgP > 14 ? "warn" : "ok"}`}>{avgP ? avgP + "ft" : "—"}</div>
            <div className="bstat-sub">{p1s.length} greens · tour avg ~18ft</div>
          </div>
          <div className="ccard">
            <div className="cc-title">3-putt rate</div>
            <div className={`bstat ${tpPct > 20 ? "bad" : tpPct > 10 ? "warn" : "ok"}`}>{tpPct}%</div>
            <div className="bstat-sub">{tp} of {attempted.length} holes</div>
          </div>
          <div className="ccard">
            <div className="cc-title">GIR</div>
            <div className={`bstat ${girCount / attempted.length > 0.55 ? "ok" : girCount / attempted.length > 0.33 ? "warn" : "bad"}`}>{girCount}/{attempted.length}</div>
            <div className="bstat-sub">Auto-calculated</div>
          </div>
          <div className="ccard">
            <div className="cc-title">Fairways hit</div>
            <div className={`bstat ${fwHit / (fwHoles.length || 1) > 0.6 ? "ok" : fwHit / (fwHoles.length || 1) > 0.4 ? "warn" : "bad"}`}>{fwHit}/{fwHoles.length}</div>
            <div className="bstat-sub">{missL > 0 || missR > 0 ? `Miss: ${missL} left, ${missR} right` : "All fairways hit"}</div>
          </div>
        </div>

        <div className="g2">
          {/* Scorecard */}
          <div className="ccard">
            <div className="cc-title">Scorecard</div>
            <div className="sc-row hdr" style={{gridTemplateColumns:"36px 1fr 44px 44px 70px 70px"}}>
              <div>Hole</div><div>Score</div><div>Putts</div><div>GIR</div><div>Fairway</div><div>Penalty</div>
            </div>
            {holes.map(h => {
              const cls = scoreClass(h.score, h.par);
              const fwCell = h.par >= 4
                ? h.fairway === "yes"
                  ? <span style={{color:"var(--green-mid)",fontWeight:600}}>✅ Hit</span>
                  : h.fairway === "left"
                    ? <span className="miss-tag left">← Miss left</span>
                  : h.fairway === "right"
                    ? <span className="miss-tag right">Miss right →</span>
                  : <span style={{color:"#CCC"}}>—</span>
                : <span style={{color:"#CCC"}}>Par 3</span>;
              return (
                <div className="sc-row" key={h.hole_number} style={{gridTemplateColumns:"36px 1fr 44px 44px 70px 70px"}}>
                  <div style={{fontWeight:700}}>H{h.hole_number}</div>
                  <div><span className={`score-notation ${cls}`}>{h.dna ? "—" : h.pickedUp ? "PU" : h.score}</span></div>
                  <div style={{textAlign:"center",fontWeight:h.putts>=3?700:400,color:h.putts>=3?"var(--red)":"inherit"}}>{h.dna || h.pickedUp ? "—" : h.putts}{h.putts>=3&&!h.dna&&!h.pickedUp?" ⚠️":""}</div>
                  <div style={{textAlign:"center"}}>{h.dna ? "—" : h.gir ? "✅" : "❌"}</div>
                  <div style={{fontSize:11}}>{fwCell}</div>
                  <div style={{fontSize:12,color:h.penalty&&h.penalty!=="None"?"var(--orange)":"var(--text-dim)"}}>{h.penalty||"None"}</div>
                </div>
              );
            })}
          </div>

          {/* Focus areas */}
          <div className="ccard">
            <div className="cc-title">Session focus areas</div>
            <div className="focus-list">
              {focusAreas.slice(0, 3).map((a, i) => (
                <div className="focus-item" key={i}>
                  <div className={`fp ${a.p}`}>{a.p.replace("p", "")}</div>
                  <div>
                    <div className="ft">{a.t}</div>
                    <div className="fd">{a.d}</div>
                    <div className="fs">{a.s}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="note-box">
              <div className="note-lbl" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>📝 Coach notes</span>
                <button onClick={saveNote} style={{
                  background: noteSaved ? "var(--green-light)" : "var(--green)",
                  color:"white", border:"none", borderRadius:6, padding:"3px 10px",
                  fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif",
                  transition:"background .2s"
                }}>
                  {noteSaved ? "✓ Saved" : "Save"}
                </button>
              </div>
              <textarea
                className="note-area"
                rows="3"
                placeholder="Add your focus points for the next session…"
                value={coachNote}
                onChange={e => { setCoachNote(e.target.value); setNoteSaved(false); }}
              />
            </div>
          </div>
        </div>

        <div className="g2">
          {/* Approach & putting */}
          <div className="ccard">
            <div className="cc-title">Approach &amp; putting breakdown</div>
            <table className="pt">
              <thead><tr><th>Hole</th><th>Approach</th><th>1st putt</th><th>2nd putt</th><th>Result</th></tr></thead>
              <tbody>
                {holes.map(h => {
                  const p1 = parseFt(h.putt1);
                  const is3 = h.putts >= 3;
                  const ap  = approachPct(h.approach);
                  const approachDisplay = h.approach || (h.par === 3 && h.gir ? h.par + " yds ✱" : "—");
                  return (
                    <tr key={h.hole_number}>
                      <td><strong>H{h.hole_number}</strong></td>
                      <td>
                        <div style={{fontSize:12}}>{approachDisplay}</div>
                        {h.approach && <div className="abar"><div className={`abar-fill ${ap > 75 ? "l" : "s"}`} style={{width: ap + "%"}} /></div>}
                      </td>
                      <td>{h.putts === 0
                        ? <span className="chip ok">Chip-in!</span>
                        : h.putt1
                          ? <span className={`chip ${p1 > 20 ? "bad" : p1 > 12 ? "warn" : "ok"}`}>{h.putt1}</span>
                          : <span style={{color:"#CCC"}}>—</span>}
                      </td>
                      <td>{is3 && h.putt2
                        ? <span className={`chip ${parseFt(h.putt2) > 5 ? "bad" : "warn"}`}>{h.putt2}</span>
                        : <span style={{color:"#CCC"}}>—</span>}
                      </td>
                      <td><span className={`chip ${is3 ? "tp" : "two"}`}>{is3 ? "3-putt" : "2-putt"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Grouped avg 1st putt by approach band */}
            {(() => {
              const bands = ["Under 50","50–75","75–100","100–125","125–150","150+"];
              const grouped = bands.map(band => {
                const bandHoles = attempted.filter(h => h.approach === band && h.putt1);
                if (!bandHoles.length) return null;
                const avg = Math.round(bandHoles.reduce((s,h) => s + parseFt(h.putt1), 0) / bandHoles.length);
                return { band, avg, count: bandHoles.length };
              }).filter(Boolean);
              if (!grouped.length) return null;
              return (
                <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)"}}>
                  <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"var(--text-dim)",marginBottom:10}}>
                    Avg 1st putt distance by approach
                  </div>
                  {grouped.map(g => (
                    <div key={g.band} style={{display:"flex",alignItems:"center",gap:10,marginBottom:7}}>
                      <div style={{fontSize:12,color:"var(--text-mid)",width:80,flexShrink:0}}>{g.band} yds</div>
                      <div style={{flex:1,height:6,background:"#EEE",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",borderRadius:3,background:g.avg>20?"var(--red)":g.avg>14?"var(--orange)":"var(--green-light)",width:Math.min(100,Math.round(g.avg/35*100))+"%"}} />
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:"var(--text)",width:36,textAlign:"right"}}>{g.avg}ft</div>
                      <div style={{fontSize:11,color:"var(--text-dim)",width:28}}>×{g.count}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
            {(() => {
              const putt1Groups = ["<3","3","4","6","9","12","15","20","25","30+"];
              const p2Data = putt1Groups.map(p1v => {
                const matchHoles = holes.filter(h => h.putt1 === p1v && parsePutt2(h.putt2) !== null);
                if (!matchHoles.length) return null;
                const avgP2 = matchHoles.reduce((s, h) => s + parsePutt2(h.putt2), 0) / matchHoles.length;
                return { p1v, count: matchHoles.length, avgP2: Math.round(avgP2 * 10) / 10 };
              }).filter(Boolean);
              if (!p2Data.length) return (
                <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)",fontSize:13,color:"var(--text-dim)"}}>
                  No second putt distance data recorded
                </div>
              );
              return (
                <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)"}}>
                  <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"var(--text-dim)",marginBottom:10}}>
                    Avg 2nd putt distance by 1st putt
                  </div>
                  <table className="pt">
                    <thead><tr><th>1st putt</th><th>Holes</th><th>Avg 2nd putt</th></tr></thead>
                    <tbody>
                      {p2Data.map(g => (
                        <tr key={g.p1v}>
                          <td>{g.p1v} ft</td>
                          <td>{g.count}</td>
                          <td><span className={`chip ${g.avgP2 > 5 ? "bad" : g.avgP2 > 3 ? "warn" : "ok"}`}>{g.avgP2} ft</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
            <div className="ai-box">
              <div className="ai-label">✦ AI Coach Analysis</div>
              {aiPutting
                ? <div className="ai-text">{aiPutting}</div>
                : <div className="ai-loading"><div className="ai-spinner" />Analysing patterns…</div>}
            </div>
          </div>

          {/* Short game & fairway misses */}
          <div className="ccard">
            <div className="cc-title">Short game &amp; fairway misses</div>

            {/* Miss direction */}
            {(missL > 0 || missR > 0) ? (
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"var(--text-dim)",marginBottom:8}}>Fairway miss pattern</div>
                <div className="miss-bar">
                  <div className="miss-label" style={{color:"var(--sky)"}}>Left</div>
                  <div className="miss-track"><div className="miss-fill left" style={{width: Math.round(missL/maxMiss*100)+"%"}} /></div>
                  <div className="miss-count" style={{color:"var(--sky)"}}>{missL}</div>
                </div>
                <div className="miss-bar" style={{marginTop:6}}>
                  <div className="miss-label" style={{color:"var(--orange)"}}>Right</div>
                  <div className="miss-track"><div className="miss-fill right" style={{width: Math.round(missR/maxMiss*100)+"%"}} /></div>
                  <div className="miss-count" style={{color:"var(--orange)"}}>{missR}</div>
                </div>
                {missL > missR + 1 && <div style={{fontSize:12,color:"var(--sky)",marginTop:8,fontWeight:600}}>↙ Consistent left miss — check alignment or swing path</div>}
                {missR > missL + 1 && <div style={{fontSize:12,color:"var(--orange)",marginTop:8,fontWeight:600}}>↘ Consistent right miss — check grip or face at impact</div>}
              </div>
            ) : (
              <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:14}}>✅ All fairways hit</div>
            )}

            {/* Short game table */}
            {missedGIR.length > 0 ? (
              <>
                <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"var(--text-dim)",marginBottom:8}}>Shots inside 50 yds (missed GIR)</div>
                <table className="sg-table">
                  <thead><tr><th>Hole</th><th>Approach</th><th>Shots ≤50 yds</th><th>Reason</th><th>1st putt</th></tr></thead>
                  <tbody>
                    {missedGIR.map(h => {
                      const si = h.approach === "Under 50" ? (h.shots_inside_50 || 1) : null;
                      const col = si !== null && si >= 2 ? "var(--red)" : "var(--green-mid)";
                      return (
                        <tr key={h.hole_number}>
                          <td>H{h.hole_number}</td>
                          <td>{h.approach || "—"}</td>
                          <td>{si !== null ? <span style={{fontWeight:700,color:col,fontSize:15}}>{si}</span> : <span style={{color:"#CCC"}}>—</span>}</td>
                          <td style={{fontSize:11,color:"var(--text-mid)"}}>{h.sg_reason || "—"}</td>
                          <td>{h.putt1 ? h.putt1 : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {under50GIRMisses.length > 0 && (
                  <div style={{marginTop:10,fontSize:12,color:"var(--text-mid)",padding:"8px 10px",background:"var(--bg)",borderRadius:8}}>
                    Scrambling: <strong>{scrambMade}/{under50GIRMisses.length}</strong> up-and-down conversions (1 chip + 1 putt)
                    {avgSI && <span style={{marginLeft:8,color:"var(--text-dim)"}}>· avg {avgSI} shots inside 50</span>}
                  </div>
                )}
              </>
            ) : (
              <div style={{fontSize:13,color:"var(--text-dim)"}}>All greens hit in regulation — no short game data</div>
            )}

            <div className="ai-box">
              <div className="ai-label">✦ AI Coach Analysis</div>
              {aiSg
                ? <div className="ai-text">{aiSg}</div>
                : <div className="ai-loading"><div className="ai-spinner" />Analysing short game…</div>}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
