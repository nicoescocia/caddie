import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  :root {
    --green-dark:#0F3D2E; --green:#1A6B4A; --green-mid:#2A8A60; --green-light:#3DAA78;
    --grass:#52C97A; --bg:#F4F1EB; --gold:#C9A84C; --red:#C94040; --orange:#D4763A;
    --sky:#4A90D9; --text:#1C1C1C; --text-mid:#555; --text-dim:#999; --border:#E2DDD4;
  }
  body { font-family:'Outfit',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }
  .log-wrap { max-width:420px; margin:0 auto; padding:16px 16px 80px; }

  /* ── TOP BAR ── */
  .mode-bar { background:var(--green-dark); padding:0 20px; display:flex; align-items:center; justify-content:space-between; height:54px; position:sticky; top:0; z-index:100; }
  .mode-logo { font-family:'Playfair Display',serif; font-size:20px; color:var(--gold); }
  .mode-bar-right { display:flex; align-items:center; gap:8px; }
  .bar-btn { background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.8); border-radius:8px; padding:5px 12px; font-family:'Outfit',sans-serif; font-size:12px; cursor:pointer; transition:all .2s; }
  .bar-btn:hover { background:rgba(255,255,255,0.18); color:white; }
  .bar-btn.ghost { background:none; border-color:rgba(255,255,255,0.15); color:rgba(255,255,255,0.5); }
  .bar-btn.ghost:hover { border-color:rgba(255,255,255,0.4); color:rgba(255,255,255,0.8); }

  /* ── HOLE DOTS ── */
  .hole-dots { display:flex; gap:5px; flex-wrap:wrap; justify-content:center; margin-bottom:16px; }
  .hd { width:30px; height:30px; border-radius:50%; border:2px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:var(--text-dim); background:white; transition:all .2s; }
  .hd.done { background:var(--green-light); border-color:var(--green-light); color:white; }
  .hd.current { background:var(--green-dark); border-color:var(--green-dark); color:var(--gold); }
  .hd.tp { background:var(--red); border-color:var(--red); color:white; }

  /* ── HOLE CARD ── */
  .hole-card { background:var(--green-dark); border-radius:18px; padding:18px 20px 16px; margin-bottom:14px; position:relative; overflow:hidden; }
  .hole-card::after { content:''; position:absolute; right:-30px; top:-30px; width:140px; height:140px; border-radius:50%; background:rgba(255,255,255,0.03); pointer-events:none; }
  .hc-row { display:flex; align-items:flex-start; justify-content:space-between; }
  .hc-num { font-family:'Playfair Display',serif; font-size:64px; color:white; line-height:1; letter-spacing:-2px; }
  .hc-info { text-align:right; padding-top:6px; }
  .hc-par-label { font-size:11px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:.08em; }
  .hc-par-val { font-family:'Playfair Display',serif; font-size:32px; color:var(--gold); line-height:1.1; }
  .hc-yds { font-size:12px; color:rgba(255,255,255,0.3); margin-top:2px; }
  .hc-idx { font-size:11px; color:rgba(255,255,255,0.25); }
  .hc-gir-row { display:flex; align-items:center; justify-content:space-between; margin-top:12px; }
  .gir-badge { display:inline-flex; align-items:center; gap:5px; padding:5px 11px; border-radius:20px; font-size:12px; font-weight:600; transition:all .3s; }
  .gir-badge.yes { background:rgba(82,201,122,0.2); color:var(--grass); border:1px solid rgba(82,201,122,0.3); }
  .gir-badge.no { background:rgba(212,118,58,0.2); color:#F0A060; border:1px solid rgba(212,118,58,0.3); }
  .gir-badge.unknown { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.3); border:1px solid rgba(255,255,255,0.1); }
  .gir-auto { font-size:10px; color:rgba(255,255,255,0.25); }

  /* ── INPUTS ── */
  .tp-banner { background:#FEF0F0; border:1px solid #F5C6C6; border-radius:10px; padding:9px 12px; margin-bottom:10px; font-size:12px; color:var(--red); line-height:1.5; }
  .tp-banner strong { display:block; font-size:13px; margin-bottom:2px; }
  .score-putts-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
  .step-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:var(--text-dim); margin-bottom:7px; }
  .stepper { background:white; border:1.5px solid var(--border); border-radius:13px; display:flex; align-items:center; justify-content:space-between; overflow:hidden; }
  .step-btn { width:44px; height:52px; border:none; background:transparent; font-size:24px; font-weight:300; color:var(--green); cursor:pointer; transition:background .15s; display:flex; align-items:center; justify-content:center; font-family:'Outfit',sans-serif; }
  .step-btn:hover { background:var(--bg); }
  .step-btn:disabled { color:var(--border); cursor:not-allowed; }
  .step-val { font-size:28px; font-weight:700; color:var(--text); min-width:40px; text-align:center; }
  .step-val.over { color:var(--orange); } .step-val.par { color:var(--green-mid); } .step-val.under { color:var(--gold); }
  .putts-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
  .putt-btn { background:white; border:1.5px solid var(--border); border-radius:11px; padding:10px 4px; text-align:center; cursor:pointer; transition:all .15s; font-family:'Outfit',sans-serif; }
  .putt-btn .pv { font-size:20px; font-weight:700; color:var(--text); display:block; }
  .putt-btn .pu { font-size:10px; color:var(--text-dim); display:block; margin-top:1px; }
  .putt-btn:hover { border-color:var(--green-light); }
  .putt-btn.sel { background:var(--green-dark); border-color:var(--green-dark); }
  .putt-btn.sel .pv,.putt-btn.sel .pu { color:white; }
  .putt-btn.sel-tp { background:var(--red); border-color:var(--red); }
  .putt-btn.sel-tp .pv,.putt-btn.sel-tp .pu { color:white; }
  .divider { height:1px; background:var(--border); margin:12px 0; }
  .sec { margin-bottom:12px; }
  .sec-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:var(--text-dim); margin-bottom:7px; display:flex; align-items:center; gap:7px; }
  .badge { font-size:9px; font-weight:700; padding:2px 6px; border-radius:5px; text-transform:uppercase; letter-spacing:.04em; }
  .badge.auto { background:var(--green-light); color:white; }
  .badge.conditional { background:var(--orange); color:white; }
  .tap-grid { display:grid; gap:6px; }
  .tap-grid.c5 { grid-template-columns:repeat(5,1fr); }
  .tap-grid.c2 { grid-template-columns:repeat(2,1fr); }
  .tap-btn { background:white; border:1.5px solid var(--border); border-radius:11px; padding:10px 3px; text-align:center; cursor:pointer; transition:all .15s; font-family:'Outfit',sans-serif; }
  .tap-btn .tv { font-size:15px; font-weight:700; color:var(--text); display:block; line-height:1.1; }
  .tap-btn .tu { font-size:10px; color:var(--text-dim); display:block; margin-top:1px; }
  .tap-btn:hover { border-color:var(--green-light); transform:scale(1.03); }
  .tap-btn.sel { background:var(--green-dark); border-color:var(--green-dark); transform:scale(1.03); }
  .tap-btn.sel .tv,.tap-btn.sel .tu { color:white; }
  .fw-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
  .fw-btn { background:white; border:1.5px solid var(--border); border-radius:11px; padding:11px; text-align:center; cursor:pointer; transition:all .15s; font-family:'Outfit',sans-serif; font-size:14px; font-weight:600; color:var(--text-mid); }
  .fw-btn:hover { border-color:var(--green-light); }
  .fw-btn.sel-yes { background:#E8F4EE; border-color:var(--green-light); color:var(--green); }
  .fw-btn.sel-left { background:#EEF0FE; border-color:var(--sky); color:var(--sky); }
  .fw-btn.sel-right { background:#FEF3E8; border-color:var(--orange); color:var(--orange); }
  .sub-panel { margin-top:8px; padding:11px; background:#F9F7F3; border-radius:10px; }
  .sub-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-dim); margin-bottom:7px; }
  .appr-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
  .appr-btn { background:white; border:1.5px solid var(--border); border-radius:12px; padding:10px 4px; text-align:center; cursor:pointer; transition:all .15s; font-family:'Outfit',sans-serif; }
  .appr-btn .av { font-size:13px; font-weight:700; color:var(--text); display:block; line-height:1.2; }
  .appr-btn .au { font-size:10px; color:var(--text-dim); display:block; margin-top:1px; }
  .appr-btn:hover { border-color:var(--green-light); transform:scale(1.03); }
  .appr-btn.sel { background:var(--green-dark); border-color:var(--green-dark); transform:scale(1.03); }
  .appr-btn.sel .av,.appr-btn.sel .au { color:white; }
  .pen-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
  .pen-btn { background:white; border:1.5px solid var(--border); border-radius:11px; padding:9px 3px; text-align:center; cursor:pointer; transition:all .15s; font-family:'Outfit',sans-serif; }
  .pen-btn .pi { font-size:16px; display:block; }
  .pen-btn .pl { font-size:11px; color:var(--text-mid); font-weight:600; display:block; margin-top:2px; }
  .pen-btn.sel-none { background:#E8F4EE; border-color:var(--green-light); }
  .pen-btn.sel-pen { background:#FEF0E8; border-color:var(--orange); }

  /* ── BOTTOM BUTTONS ── */
  .bottom-btns { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:6px; }
  .back-btn { background:white; border:1.5px solid var(--border); border-radius:14px; padding:15px; font-family:'Outfit',sans-serif; font-size:15px; font-weight:700; color:var(--text-mid); cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:8px; }
  .back-btn:hover:not(:disabled) { border-color:var(--green-light); color:var(--green); }
  .back-btn:disabled { opacity:0.35; cursor:not-allowed; }
  .next-btn { background:var(--green); border:none; border-radius:14px; padding:15px; font-family:'Outfit',sans-serif; font-size:15px; font-weight:700; color:white; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:8px; }
  .next-btn:hover:not(:disabled) { background:var(--green-mid); transform:translateY(-1px); box-shadow:0 6px 20px rgba(26,107,74,0.3); }
  .next-btn:disabled { background:#C8C4BB; cursor:not-allowed; transform:none; }
  .spinner { width:18px; height:18px; border:2.5px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }

  /* ── COMPLETE CARD ── */
  .complete-card { background:var(--green-dark); border-radius:20px; padding:28px 22px; text-align:center; animation:fadeUp .4s ease; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .cc-icon { font-size:52px; margin-bottom:10px; }
  .cc-title-big { font-family:'Playfair Display',serif; font-size:26px; color:var(--gold); margin-bottom:6px; }
  .cc-score-big { font-family:'Playfair Display',serif; font-size:72px; color:white; line-height:1; }
  .cc-par-line { font-size:16px; color:rgba(255,255,255,0.5); margin-bottom:6px; }
  .cc-detail { font-size:13px; color:rgba(255,255,255,0.4); margin-bottom:22px; line-height:1.6; }
  .send-btn { width:100%; background:var(--gold); border:none; border-radius:14px; padding:16px; font-family:'Outfit',sans-serif; font-size:16px; font-weight:700; color:var(--green-dark); cursor:pointer; transition:all .2s; margin-bottom:10px; }
  .send-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(201,168,76,0.4); }
  .send-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
  .back-to-dash-btn { width:100%; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:14px; padding:14px; font-family:'Outfit',sans-serif; font-size:15px; font-weight:600; color:rgba(255,255,255,0.7); cursor:pointer; transition:all .2s; }
  .back-to-dash-btn:hover { background:rgba(255,255,255,0.15); color:white; }
  .sent-msg { background:rgba(255,255,255,0.1); border-radius:12px; padding:14px; font-size:14px; color:rgba(255,255,255,0.7); margin-bottom:10px; line-height:1.6; }

  /* ── OVERVIEW SCREEN ── */
  .ov-wrap { max-width:420px; margin:0 auto; padding:16px 16px 48px; }
  .ov-summary-card { background:var(--green-dark); border-radius:18px; padding:18px 20px; margin-bottom:16px; position:relative; overflow:hidden; }
  .ov-summary-card::after { content:''; position:absolute; right:-30px; top:-30px; width:140px; height:140px; border-radius:50%; background:rgba(255,255,255,0.03); pointer-events:none; }
  .ov-summary-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:rgba(255,255,255,0.4); margin-bottom:10px; }
  .ov-summary-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .ov-stat { background:rgba(255,255,255,0.07); border-radius:10px; padding:10px 8px; text-align:center; }
  .ov-stat-val { font-family:'Playfair Display',serif; font-size:28px; color:var(--gold); line-height:1; }
  .ov-stat-lbl { font-size:10px; color:rgba(255,255,255,0.4); margin-top:3px; }
  .ov-section-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:var(--text-dim); margin-bottom:10px; }
  .ov-hole-card { background:white; border:1.5px solid var(--border); border-radius:14px; padding:12px 14px; margin-bottom:8px; cursor:pointer; transition:all .18s; display:grid; grid-template-columns:36px 1fr auto; align-items:center; gap:12px; }
  .ov-hole-card:hover { border-color:var(--green-light); transform:translateY(-1px); box-shadow:0 2px 12px rgba(0,0,0,0.07); }
  .ov-hole-card.not-logged { opacity:0.45; cursor:default; }
  .ov-hole-num { width:36px; height:36px; border-radius:50%; background:var(--green-dark); color:var(--gold); font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .ov-hole-num.tp { background:var(--red); color:white; }
  .ov-hole-num.unlogged { background:var(--border); color:var(--text-dim); }
  .ov-hole-details { flex:1; min-width:0; }
  .ov-hole-top { display:flex; align-items:center; gap:8px; margin-bottom:3px; }
  .ov-hole-name { font-size:13px; font-weight:700; color:var(--text); }
  .ov-hole-par-badge { font-size:10px; color:var(--text-dim); background:var(--bg); border-radius:5px; padding:1px 5px; }
  .ov-hole-chips { display:flex; gap:5px; flex-wrap:wrap; }
  .chip { display:inline-block; font-size:10px; font-weight:700; padding:2px 7px; border-radius:5px; }
  .chip.gir-yes { background:#E8F4EE; color:var(--green); }
  .chip.gir-no { background:#FEF3E8; color:var(--orange); }
  .chip.fw-yes { background:#E8F4EE; color:var(--green); }
  .chip.fw-miss { background:#EEF0FE; color:var(--sky); }
  .chip.fw-miss-r { background:#FEF3E8; color:var(--orange); }
  .chip.putts { background:#F4F1EB; color:var(--text-mid); }
  .chip.tp { background:#FDECEA; color:var(--red); }
  .chip.pen { background:#FEF3E8; color:var(--orange); }
  .ov-hole-score { text-align:right; flex-shrink:0; }
  .ov-score-num { font-family:'Playfair Display',serif; font-size:28px; line-height:1; }
  .ov-score-num.eagle  { color:var(--gold); }
  .ov-score-num.birdie { color:var(--green-mid); }
  .ov-score-num.par    { color:var(--text-mid); }
  .ov-score-num.bogey  { color:var(--orange); }
  .ov-score-num.double { color:var(--red); }
  .ov-score-num.worse  { color:#8B1A1A; }
  .ov-score-diff { font-size:11px; color:var(--text-dim); margin-top:1px; }
  .ov-score-diff.under { color:var(--gold); }
  .ov-score-diff.over  { color:var(--orange); }
  .ov-edit-arrow { font-size:14px; color:var(--text-dim); flex-shrink:0; }
  .ov-finish-btn { width:100%; background:var(--green); border:none; border-radius:14px; padding:16px; font-family:'Outfit',sans-serif; font-size:16px; font-weight:700; color:white; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:16px; }
  .ov-finish-btn:hover { background:var(--green-mid); transform:translateY(-1px); box-shadow:0 6px 20px rgba(26,107,74,0.3); }
  .ov-finish-btn:disabled { background:#C8C4BB; cursor:not-allowed; transform:none; }
  .ov-loading { display:flex; align-items:center; justify-content:center; padding:60px; }
  .big-spinner { width:28px; height:28px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:spin .7s linear infinite; }
`;

// ── Known courses (loaded from DB at runtime) ──
const KNOWN_COURSES = [
  { id: "89e2ad4e-8d5a-4244-8568-b2c8a448a77f", name: "Greenock — Wee Course", holes: 9 },
  { id: "b1a2c3d4-e5f6-7890-abcd-ef1234567890", name: "Greenock — Big Course", holes: 18 },
];

const APPROACH_BANDS = [
  { v:"Under 50", u:"yds" }, { v:"50-75", u:"yds" }, { v:"75-100", u:"yds" },
  { v:"100-125", u:"yds" }, { v:"125-150", u:"yds" }, { v:"150+", u:"yds" },
];
const PUTT_DIST  = [{v:"3",u:"ft"},{v:"6",u:"ft"},{v:"12",u:"ft"},{v:"20",u:"ft"},{v:"30+",u:"ft"}];
const PUTT2_DIST = [{v:"3",u:"ft"},{v:"4",u:"ft"},{v:"5",u:"ft"},{v:"6",u:"ft"},{v:"7+",u:"ft"}];
// eslint-disable-next-line no-unused-vars
const PEN_OPTS   = [
  {icon:"checkmark",label:"None",type:"none"},
  {icon:"OOB",label:"OOB",type:"pen"},
  {icon:"Haz",label:"Hazard",type:"pen"},
  {icon:"Unp",label:"Unplayable",type:"pen"},
];

function calcGIR(score, putts, par) {
  if (score === null || putts === null) return null;
  if (putts === 0) return true;
  return (score - putts) <= (par - 2);
}
function emptyHole(par) {
  return { score: par, putts: null, fairway: null, approach: null, shotsInside50: null, putt1: null, putt2: null, penalty: "None" };
}
function holeFromRow(row) {
  return {
    score: row.score, putts: row.putts, fairway: row.fairway,
    approach: row.approach, shotsInside50: row.shots_inside_50,
    putt1: row.putt1, putt2: row.putt2, penalty: row.penalty || "None",
  };
}
function scoreLabel(score, par) {
  const d = score - par;
  if (d <= -2) return "eagle";
  if (d === -1) return "birdie";
  if (d === 0)  return "par";
  if (d === 1)  return "bogey";
  if (d === 2)  return "double";
  return "worse";
}
function diffLabel(score, par) {
  const d = score - par;
  if (d === 0) return { text: "Par", cls: "" };
  if (d < 0)  return { text: d.toString(), cls: "under" };
  return { text: "+" + d, cls: "over" };
}

// ── TOP BAR ──
function TopBar({ onSignOut, rightBtn }) {
  return (
    <div className="mode-bar">
      <div className="mode-logo">Caddie</div>
      <div className="mode-bar-right">
        {rightBtn}
        <button className="bar-btn ghost" onClick={onSignOut}>Sign out</button>
      </div>
    </div>
  );
}

// ── OVERVIEW SCREEN ──
function OverviewScreen({ holeData, savedHoles, holes, courseName, isEditMode, onEditHole, onFinish, onSignOut, sent, saving, onBackToDashboard }) {
  const loggedHoles = holes.filter(h => savedHoles.has(h.n));
  const totalScore  = loggedHoles.reduce((s, h, i) => s + (holeData[holes.indexOf(h)].score || 0), 0);
  const totalPar    = holes.reduce((s, h) => s + h.par, 0);
  const allLogged   = savedHoles.size === holes.length;
  const girCount    = holes.filter((h, i) => savedHoles.has(h.n) && calcGIR(holeData[i].score, holeData[i].putts, h.par)).length;
  const tpCount     = holes.filter((h, i) => savedHoles.has(h.n) && holeData[i].putts >= 3).length;

  return (
    <>
      <style>{css}</style>
      <TopBar onSignOut={onSignOut} rightBtn={null} />
      <div className="ov-wrap">

        <div className="ov-summary-card">
          <div className="ov-summary-title">{courseName}</div>
          <div className="ov-summary-stats">
            <div className="ov-stat">
              <div className="ov-stat-val">{allLogged ? totalScore : (totalScore || "-")}</div>
              <div className="ov-stat-lbl">{allLogged ? `${totalScore - totalPar > 0 ? "+" : ""}${totalScore - totalPar} vs par` : "total so far"}</div>
            </div>
            <div className="ov-stat">
              <div className="ov-stat-val">{girCount}/{loggedHoles.length}</div>
              <div className="ov-stat-lbl">GIR</div>
            </div>
            <div className="ov-stat">
              <div className="ov-stat-val">{tpCount}</div>
              <div className="ov-stat-lbl">3-putts</div>
            </div>
          </div>
        </div>

        <div className="ov-section-label">Tap any hole to edit</div>

        {holes.map((hole, i) => {
          const hd = holeData[i];
          const logged = savedHoles.has(hole.n);
          const gir = calcGIR(hd.score, hd.putts, hole.par);
          const diff = diffLabel(hd.score, hole.par);
          const sLabel = scoreLabel(hd.score, hole.par);
          const is3putt = hd.putts >= 3;

          return (
            <div
              key={hole.n}
              className={"ov-hole-card" + (!logged ? " not-logged" : "")}
              onClick={() => logged && onEditHole(i)}
            >
              <div className={"ov-hole-num" + (is3putt && logged ? " tp" : !logged ? " unlogged" : "")}>
                {hole.n}
              </div>

              <div className="ov-hole-details">
                <div className="ov-hole-top">
                  <span className="ov-hole-name">Hole {hole.n}</span>
                  <span className="ov-hole-par-badge">Par {hole.par} · {hole.yds}y</span>
                </div>
                {logged ? (
                  <div className="ov-hole-chips">
                    {gir
                      ? <span className="chip gir-yes">GIR</span>
                      : <span className="chip gir-no">Missed GIR</span>}
                    {hole.par >= 4 && hd.fairway === "yes" && <span className="chip fw-yes">FW hit</span>}
                    {hole.par >= 4 && hd.fairway === "left" && <span className="chip fw-miss">Miss left</span>}
                    {hole.par >= 4 && hd.fairway === "right" && <span className="chip fw-miss-r">Miss right</span>}
                    {is3putt
                      ? <span className="chip tp">3-putt</span>
                      : <span className="chip putts">{hd.putts === 0 ? "Chip-in" : hd.putts + " putt" + (hd.putts !== 1 ? "s" : "")}</span>}
                    {hd.penalty && hd.penalty !== "None" && <span className="chip pen">{hd.penalty}</span>}
                  </div>
                ) : (
                  <div style={{fontSize:11,color:"var(--text-dim)"}}>Not logged yet</div>
                )}
              </div>

              {logged ? (
                <>
                  <div style={{textAlign:"right"}}>
                    <div className={"ov-score-num " + sLabel}>{hd.score}</div>
                    <div className={"ov-score-diff " + diff.cls}>{diff.text}</div>
                  </div>
                </>
              ) : (
                <div className="ov-score-num par" style={{color:"var(--border)"}}>-</div>
              )}
            </div>
          );
        })}

        {allLogged && (
          <button className="ov-finish-btn" onClick={onFinish} disabled={sent}>
            {sent ? "Sent to coach" : (saving ? "Sending..." : isEditMode ? "Resend to coach" : "Send to coach")}
          </button>
        )}

        {!allLogged && (
          <button className="ov-finish-btn" onClick={() => onEditHole(savedHoles.size)}>
            Continue logging — Hole {savedHoles.size + 1}
          </button>
        )}

        <button className="back-to-dash-btn" style={{marginTop:10,width:"100%"}} onClick={onBackToDashboard}>
          Back to my rounds
        </button>

      </div>
    </>
  );
}

export default function StudentLogging({ user, onSignOut, onBackToDashboard, existingRound }) {
  const isEditMode = !!existingRound;

  const [cur, setCur]               = useState(0);
  const [holes, setHoles]           = useState([]);
  const [holeData, setHoleData]     = useState([]);
  const [courseId, setCourseId]     = useState(null);
  const [courseName, setCourseName] = useState("");
  const [roundId, setRoundId]       = useState(null);
  // view: "course_picker" | "overview" | "logging" | "complete"
  const [view, setView]             = useState(isEditMode ? "overview" : "course_picker");
  const [saving, setSaving]         = useState(false);
  const [sent, setSent]             = useState(false);
  const [savedHoles, setSavedHoles] = useState(new Set());
  const [loading, setLoading]       = useState(isEditMode);

  // Load holes for a chosen course
  async function loadCourse(courseIdArg) {
    console.log("loadCourse called with:", courseIdArg);
    const { data, error } = await supabase
      .from("course_holes")
      .select("*")
      .eq("course_id", courseIdArg)
      .order("hole_number", { ascending: true });
    console.log("course_holes result:", { data, error });
    if (data && data.length > 0) {
      const mapped = data.map(h => ({ n: h.hole_number, par: h.par, yds: h.yardage, idx: h.stroke_index }));
      console.log("mapped holes:", mapped);
      setHoles(mapped);
      setHoleData(mapped.map(h => emptyHole(h.par)));
    } else {
      console.log("No data returned or empty array");
    }
  }

  async function handleCourseSelect(course) {
    setCourseId(course.id);
    setCourseName(course.name);
    await loadCourse(course.id);
    setView("logging");
  }

  useEffect(() => {
    if (!existingRound) return;
    async function loadExisting() {
      // Load holes for this round's course
      const cId = existingRound.course_id || "89e2ad4e-8d5a-4244-8568-b2c8a448a77f";
      const cName = KNOWN_COURSES.find(c => c.id === cId)?.name || "Golf Course";
      setCourseId(cId);
      setCourseName(cName);
      const { data: holeRows } = await supabase
        .from("course_holes").select("*")
        .eq("course_id", cId)
        .order("hole_number", { ascending: true });
      const mapped = (holeRows || []).map(h => ({ n: h.hole_number, par: h.par, yds: h.yards, idx: h.stroke_index }));
      setHoles(mapped);

      const { data } = await supabase
        .from("round_holes").select("*")
        .eq("round_id", existingRound.id)
        .order("hole_number", { ascending: true });
      if (data && data.length > 0) {
        const filled = mapped.map(h => {
          const row = data.find(r => r.hole_number === h.n);
          return row ? holeFromRow(row) : emptyHole(h.par);
        });
        setHoleData(filled);
        setSavedHoles(new Set(data.map(r => r.hole_number)));
      } else {
        setHoleData(mapped.map(h => emptyHole(h.par)));
      }
      setRoundId(existingRound.id);
      setSent(existingRound.sent_to_coach || false);
      setLoading(false);
    }
    loadExisting();
  }, [existingRound]);

  // Guard against holes not yet loaded (only block logging/overview, not course picker)
  if (view !== "course_picker" && (!holes.length || !holeData.length)) {
    return (
      <>
        <style>{css}</style>
        <TopBar onSignOut={onSignOut} />
        <div className="ov-loading"><div className="big-spinner" /></div>
      </>
    );
  }

  const h   = holes[cur] || { n: cur+1, par: 4, yds: 0, idx: 0 };
  const d   = holeData[cur] || {};
  const gir = calcGIR(d.score, d.putts, h.par);

  function update(fields) {
    setHoleData(prev => { const next = [...prev]; next[cur] = { ...next[cur], ...fields }; return next; });
  }

  function isValid() {
    if (d.score === null || d.putts === null) return false;
    if (h.par >= 4 && !d.fairway) return false;
    const par3GIR = h.par === 3 && gir === true;
    if (d.putts !== 0 && !par3GIR && !d.approach) return false;
    if (d.putts > 0 && !d.putt1) return false;
    if (d.putts >= 3 && !d.putt2) return false;
    return true;
  }

  async function upsertHole(rid, idx) {
    const hole = holeData[idx];
    const hi   = holes[idx];
    const payload = {
      round_id: rid, hole_number: hi.n, par: hi.par,
      score: hole.score, putts: hole.putts,
      gir: calcGIR(hole.score, hole.putts, hi.par),
      fairway: hole.fairway, approach: hole.approach,
      shots_inside_50: hole.shotsInside50,
      putt1: hole.putt1, putt2: hole.putt2,
      penalty: hole.penalty || "None",
    };
    if (savedHoles.has(hi.n)) {
      await supabase.from("round_holes").update(payload).eq("round_id", rid).eq("hole_number", hi.n);
    } else {
      await supabase.from("round_holes").insert([payload]);
      setSavedHoles(prev => new Set([...prev, hi.n]));
    }
  }

  // Called when pressing "Save hole" or "Next hole"
  async function saveHole() {
    setSaving(true);
    let rid = roundId;
    if (!rid) {
      const { data: row, error } = await supabase
        .from("rounds").insert([{ student_id: user.id, course_id: courseId, holes_played: holes.length }])
        .select().single();
      if (error) { console.error(error.message); setSaving(false); return; }
      rid = row.id;
      setRoundId(rid);
    }
    await upsertHole(rid, cur);
    setSaving(false);

    if (isEditMode) {
      // In edit mode: always go back to overview after saving
      setView("overview");
    } else {
      // In new round mode: advance to next hole, or go to overview on last hole
      if (cur < holes.length - 1) {
        setCur(c => c + 1);
        window.scrollTo(0, 0);
      } else {
        // Last hole done — update totals and go to overview
        const totalScore = holeData.reduce((s, hd) => s + (hd.score || 0), 0);
        const totalPutts = holeData.reduce((s, hd) => s + (hd.putts || 0), 0);
        await supabase.from("rounds").update({ total_score: totalScore, total_putts: totalPutts }).eq("id", rid);
        setView("overview");
      }
    }
  }

  function editHole(idx) {
    setCur(idx);
    setView("logging");
    window.scrollTo(0, 0);
  }

  function goBackInLogging() {
    if (isEditMode) {
      // In edit mode, back always returns to overview
      setView("overview");
    } else if (cur > 0) {
      setCur(c => c - 1);
      window.scrollTo(0, 0);
    }
  }

  async function sendToCoach() {
    if (!roundId) return;
    setSaving(true);
    // Recalculate totals before sending
    const totalScore = holeData.reduce((s, hd) => s + (hd.score || 0), 0);
    const totalPutts = holeData.reduce((s, hd) => s + (hd.putts || 0), 0);
    await supabase.from("rounds").update({
      sent_to_coach: true,
      sent_at: new Date().toISOString(),
      total_score: totalScore,
      total_putts: totalPutts,
    }).eq("id", roundId);
    setSaving(false);
    setSent(true);
  }

  function scoreClass() {
    const diff = d.score - h.par;
    return "step-val " + (diff < 0 ? "under" : diff === 0 ? "par" : "over");
  }

  // ── Course picker screen ──
  if (view === "course_picker") {
    return (
      <>
        <style>{css}</style>
        <TopBar onSignOut={onSignOut} rightBtn={null} />
        <div className="log-wrap" style={{paddingTop:32}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:6}}>
            Where are you playing?
          </div>
          <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:24}}>
            Select a course to start logging your round.
          </div>
          {KNOWN_COURSES.map(course => (
            <button
              key={course.id}
              onClick={() => handleCourseSelect(course)}
              style={{
                width:"100%", background:"white", border:"1.5px solid var(--border)",
                borderRadius:14, padding:"16px 18px", marginBottom:10,
                textAlign:"left", cursor:"pointer", fontFamily:"'Outfit',sans-serif",
                transition:"all .15s",
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor="var(--green-light)"; e.currentTarget.style.transform="translateY(-1px)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; }}
            >
              <div style={{fontWeight:700,fontSize:15,color:"var(--text)",marginBottom:3}}>{course.name}</div>
              <div style={{fontSize:12,color:"var(--text-dim)"}}>{course.holes} holes</div>
            </button>
          ))}
          <button className="back-to-dash-btn" style={{marginTop:8}} onClick={onBackToDashboard}>
            Back to my rounds
          </button>
        </div>
      </>
    );
  }

  // ── Loading state ──
  if (loading) {
    return (
      <>
        <style>{css}</style>
        <TopBar onSignOut={onSignOut} />
        <div className="ov-loading"><div className="big-spinner" /></div>
      </>
    );
  }

  // ── Overview screen ──
  if (view === "overview") {
    return (
      <OverviewScreen
        holeData={holeData}
        savedHoles={savedHoles}
        holes={holes}
        courseName={courseName}
        isEditMode={isEditMode}
        onEditHole={editHole}
        onFinish={sendToCoach}
        onSignOut={onSignOut}
        sent={sent}
        saving={saving}
        onBackToDashboard={onBackToDashboard}
      />
    );
  }

  // ── Complete screen ──
  if (view === "complete") {
    const totalScore = holeData.reduce((s, hd) => s + (hd.score || 0), 0);
    const totalPar   = holes.reduce((s, h) => s + h.par, 0);
    const diff       = totalScore - totalPar;
    const girCount   = holeData.filter((hd, i) => calcGIR(hd.score, hd.putts, holes[i]?.par)).length;
    const tp         = holeData.filter(hd => hd.putts >= 3).length;
    return (
      <>
        <style>{css}</style>
        <TopBar onSignOut={onSignOut} rightBtn={
          <button className="bar-btn" onClick={() => setView("overview")}>View round</button>
        } />
        <div className="log-wrap">
          <div className="complete-card">
            <div className="cc-icon">golf</div>
            <div className="cc-title-big">Round complete</div>
            <div className="cc-score-big">{totalScore}</div>
            <div className="cc-par-line">{diff >= 0 ? "+" : ""}{diff} vs par</div>
            <div className="cc-detail">
              {courseName}  ·  {holes.length} holes  ·  {girCount} GIR  ·  {tp} three-putt{tp !== 1 ? "s" : ""}
            </div>
            {sent
              ? <div className="sent-msg">Round sent to your coach.</div>
              : <button className="send-btn" onClick={sendToCoach} disabled={saving}>
                  {saving ? "Saving..." : isEditMode ? "Resend to coach" : "Send to coach"}
                </button>
            }
            <button className="back-to-dash-btn" onClick={onBackToDashboard}>Back to my rounds</button>
          </div>
        </div>
      </>
    );
  }

  const par3GIR   = h.par === 3 && gir === true;
  const showAppr  = h.par >= 4 || (d.putts !== null && !par3GIR);
  const showSI50  = d.approach === "Under 50";
  const show3putt = d.putts >= 3;
  const showFW    = h.par >= 4;
  const showMiss  = d.fairway === "left" || d.fairway === "right";
  const backLabel = isEditMode ? "Back to overview" : cur === 0 ? "Back" : "Back"; // eslint-disable-line no-unused-vars
  const nextLabel = isEditMode
    ? "Save hole"
    : cur === holes.length - 1 ? "Complete round" : "Next hole";

  return (
    <>
      <style>{css}</style>
      <TopBar onSignOut={onSignOut} rightBtn={
        <button className="bar-btn" onClick={() => setView("overview")}>View round</button>
      } />

      <div className="log-wrap">
        <div className="hole-dots">
          {holes.map((hole, i) => {
            const isLogged = savedHoles.has(hole.n) && i !== cur;
            let cls = "hd";
            if (isLogged) cls += holeData[i].putts >= 3 ? " tp" : " done";
            else if (i === cur) cls += " current";
            return <div
              key={i}
              className={cls}
              style={isLogged ? {cursor:"pointer"} : {}}
              onClick={() => isLogged && editHole(i)}
            >{hole.n}</div>;
          })}
        </div>

        <div className="hole-card">
          <div className="hc-row">
            <div className="hc-num">{h.n}</div>
            <div className="hc-info">
              <div className="hc-par-label">Par</div>
              <div className="hc-par-val">{h.par}</div>
              <div className="hc-yds">{h.yds} yds</div>
              <div className="hc-idx">Index {h.idx}</div>
            </div>
          </div>
          <div className="hc-gir-row">
            {gir === null
              ? <div className="gir-badge unknown">GIR: enter score and putts</div>
              : gir
                ? <div className="gir-badge yes">Green in Regulation</div>
                : <div className="gir-badge no">Missed GIR</div>}
            <div className="gir-auto">auto-calculated</div>
          </div>
        </div>

        {show3putt && (
          <div className="tp-banner">
            <strong>3-putt detected</strong>
            One extra question helps your coach understand what happened
          </div>
        )}

        <div className="score-putts-row">
          <div>
            <div className="step-label">Score</div>
            <div className="stepper">
              <button className="step-btn" onClick={() => update({ score: Math.max(1, d.score - 1) })}>-</button>
              <div className={scoreClass()}>{d.score}</div>
              <button className="step-btn" onClick={() => update({ score: Math.min(12, d.score + 1) })}>+</button>
            </div>
          </div>
          <div>
            <div className="step-label">Putts</div>
            <div className="putts-grid">
              {[{n:0,label:"chip-in"},{n:1,label:"putt"},{n:2,label:"putts"},{n:3,label:"putts"}].map(p => (
                <button
                  key={p.n}
                  className={"putt-btn " + (d.putts === p.n ? (p.n >= 3 ? "sel-tp" : "sel") : "")}
                  onClick={() => update({ putts: p.n, putt2: p.n < 3 ? null : d.putt2 })}
                >
                  <span className="pv">{p.n === 3 ? "3+" : p.n}</span>
                  <span className="pu">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divider" />

        {showFW && (
          <div className="sec">
            <div className="sec-label">Fairway hit?</div>
            <div className="fw-grid">
              <button className={"fw-btn " + (d.fairway === "yes" ? "sel-yes" : "")} onClick={() => update({ fairway: "yes" })}>Hit fairway</button>
              <button className={"fw-btn " + (showMiss ? (d.fairway === "left" ? "sel-left" : "sel-right") : "")} onClick={() => update({ fairway: d.fairway === "yes" ? "left" : d.fairway || "left" })}>Missed</button>
            </div>
            {showMiss && (
              <div className="sub-panel">
                <div className="sub-label">Miss direction</div>
                <div className="tap-grid c2">
                  <button className={"tap-btn " + (d.fairway === "left" ? "sel" : "")} onClick={() => update({ fairway: "left" })}><span className="tv">Left</span><span className="tu">miss left</span></button>
                  <button className={"tap-btn " + (d.fairway === "right" ? "sel" : "")} onClick={() => update({ fairway: "right" })}><span className="tv">Right</span><span className="tu">miss right</span></button>
                </div>
              </div>
            )}
          </div>
        )}

        {showAppr && (
          <div className="sec">
            <div className="sec-label">Approach distance</div>
            <div className="appr-grid">
              {APPROACH_BANDS.map(b => (
                <button key={b.v} className={"appr-btn " + (d.approach === b.v ? "sel" : "")} onClick={() => update({ approach: b.v, shotsInside50: b.v === "Under 50" ? (d.shotsInside50 || 1) : null })}>
                  <span className="av">{b.v}</span><span className="au">{b.u}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showSI50 && (
          <div className="sec">
            <div className="sec-label">Shots inside 50 yds <span className="badge auto">includes approach</span></div>
            <div className="stepper" style={{maxWidth:180}}>
              <button className="step-btn" onClick={() => update({ shotsInside50: Math.max(1, (d.shotsInside50||1) - 1) })} disabled={(d.shotsInside50||1) <= 1}>-</button>
              <div className="step-val par">{d.shotsInside50 || 1}</div>
              <button className="step-btn" onClick={() => update({ shotsInside50: (d.shotsInside50||1) + 1 })}>+</button>
            </div>
          </div>
        )}

        {d.putts > 0 && (
          <div className="sec">
            <div className="sec-label">First putt distance</div>
            <div className="tap-grid c5">
              {PUTT_DIST.map(p => (
                <button key={p.v} className={"tap-btn " + (d.putt1 === p.v ? "sel" : "")} onClick={() => update({ putt1: p.v })}><span className="tv">{p.v}</span><span className="tu">{p.u}</span></button>
              ))}
            </div>
          </div>
        )}

        {show3putt && (
          <div className="sec">
            <div className="sec-label">Second putt distance <span className="badge conditional">3-putt</span></div>
            <div className="tap-grid c5">
              {PUTT2_DIST.map(p => (
                <button key={p.v} className={"tap-btn " + (d.putt2 === p.v ? "sel" : "")} onClick={() => update({ putt2: p.v })}><span className="tv">{p.v}</span><span className="tu">{p.u}</span></button>
              ))}
            </div>
          </div>
        )}

        <div className="sec">
          <div className="sec-label">Penalty strokes</div>
          <div className="pen-grid">
            {[
              {icon:"checkmark",label:"None",type:"none"},
              {icon:"OOB",label:"OOB",type:"pen"},
              {icon:"Haz",label:"Hazard",type:"pen"},
              {icon:"Unp",label:"Unplayable",type:"pen"},
            ].map(p => (
              <button key={p.label} className={"pen-btn " + ((d.penalty || "None") === p.label ? (p.type === "none" ? "sel-none" : "sel-pen") : "")} onClick={() => update({ penalty: p.label })}>
                <span className="pl">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bottom-btns">
          <button className="back-btn" disabled={!isEditMode && cur === 0} onClick={goBackInLogging}>
            {isEditMode ? "Cancel" : "Back"}
          </button>
          <button className="next-btn" disabled={!isValid() || saving} onClick={saveHole}>
            {saving ? <div className="spinner" /> : <>{nextLabel} <span>-&gt;</span></>}
          </button>
        </div>
      </div>
    </>
  );
}
