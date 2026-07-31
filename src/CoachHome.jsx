import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import StudentProgress from "./StudentProgress";
import renderMarkdown from "./renderMarkdown";

const HANDICAP_BENCHMARKS = {
  0:  { proximity_u25: 8,  proximity_25_50: 14, proximity_50_75: 18, proximity_75_100: 24, proximity_100_125: 28, proximity_125_150: 35, proximity_150plus: 44, scrambling: 54, gir: 57, fairways: 57, putts_per_round: 31 },
  5:  { proximity_u25: 10, proximity_25_50: 17, proximity_50_75: 21, proximity_75_100: 28, proximity_100_125: 33, proximity_125_150: 40, proximity_150plus: 63, scrambling: 47, gir: 46, fairways: 51, putts_per_round: 33 },
  10: { proximity_u25: 12, proximity_25_50: 20, proximity_50_75: 24, proximity_75_100: 32, proximity_100_125: 40, proximity_125_150: 50, proximity_150plus: 72, scrambling: 39, gir: 37, fairways: 49, putts_per_round: 34 },
  15: { proximity_u25: 14, proximity_25_50: 24, proximity_50_75: 28, proximity_75_100: 38, proximity_100_125: 50, proximity_125_150: 65, proximity_150plus: 92, scrambling: 34, gir: 26, fairways: 48, putts_per_round: 35 },
  20: { proximity_u25: 16, proximity_25_50: 28, proximity_50_75: 32, proximity_75_100: 44, proximity_100_125: 56, proximity_125_150: 75, proximity_150plus: 109, scrambling: 31, gir: 22, fairways: 43, putts_per_round: 36 },
  25: { proximity_u25: 18, proximity_25_50: 32, proximity_50_75: 36, proximity_75_100: 50, proximity_100_125: 62, proximity_125_150: 85, proximity_150plus: 116, scrambling: 25, gir: 19, fairways: 43, putts_per_round: 37 },
  30: { proximity_u25: 20, proximity_25_50: 36, proximity_50_75: 40, proximity_75_100: 56, proximity_100_125: 70, proximity_125_150: 95, proximity_150plus: 125, scrambling: 20, gir: 15, fairways: 40, putts_per_round: 38 },
};

function getBenchmark(handicap) {
  const brackets = [0, 5, 10, 15, 20, 25, 30];
  const nearest = brackets.reduce((a, b) => Math.abs(b - handicap) < Math.abs(a - handicap) ? b : a);
  return HANDICAP_BENCHMARKS[nearest];
}

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

  /* Lesson cards & form */
  .log-lesson-btn { background:none; border:1.5px dashed var(--gold); color:var(--gold); border-radius:12px; padding:10px 16px; font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; cursor:pointer; width:100%; margin-bottom:12px; transition:all .15s; }
  .log-lesson-btn:hover { background:rgba(201,168,76,0.08); }
  .lesson-card { background:#FEFBF3; border:1.5px solid var(--gold); border-left:4px solid var(--gold); border-radius:16px; padding:16px 18px; margin-bottom:10px; cursor:pointer; transition:all .2s; }
  .lesson-card:hover { transform:translateY(-1px); box-shadow:var(--shadow); }
  .lesson-card-header { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
  .lesson-card-title { font-size:14px; font-weight:700; color:var(--text); }
  .lesson-card-date { font-size:12px; color:var(--text-dim); margin-top:2px; }
  .lesson-preview { font-size:13px; color:var(--text-mid); line-height:1.5; margin-top:8px; }
  .lesson-indicators { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
  .lesson-indicator { font-size:11px; color:#8A6A10; background:rgba(201,168,76,0.15); border-radius:6px; padding:2px 8px; font-weight:600; }
  .lesson-full { margin-top:12px; border-top:1px solid rgba(201,168,76,0.3); padding-top:12px; }
  .lesson-section { margin-bottom:10px; }
  .lesson-section-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-bottom:4px; }
  .lesson-section-text { font-size:13px; color:var(--text-mid); line-height:1.6; white-space:pre-line; }
  .lesson-edit-btn { background:none; border:1px solid var(--border); border-radius:8px; padding:4px 12px; font-family:'Outfit',sans-serif; font-size:12px; color:var(--text-dim); cursor:pointer; flex-shrink:0; transition:all .15s; }
  .lesson-edit-btn:hover { border-color:var(--gold); color:var(--gold); }
  .lesson-context { background:var(--bg); border-radius:10px; padding:10px 12px; margin-top:10px; }
  .lesson-context-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-bottom:6px; }
  .lesson-context-row { font-size:12px; color:var(--text-mid); margin-bottom:3px; }
  .lesson-form { background:#FEFBF3; border:1.5px solid var(--gold); border-radius:16px; padding:16px 18px; margin-bottom:12px; }
  .lesson-form-title { font-size:14px; font-weight:700; color:var(--text); margin-bottom:14px; }
  .lesson-form-field { margin-bottom:12px; }
  .lesson-form-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-bottom:4px; display:block; }
  .lesson-form-input { width:100%; border:1.5px solid var(--border); border-radius:10px; padding:10px 12px; font-family:'Outfit',sans-serif; font-size:13px; color:var(--text); background:white; transition:border-color .15s; }
  .lesson-form-input:focus { outline:none; border-color:var(--gold); }
  .lesson-form-textarea { width:100%; border:1.5px solid var(--border); border-radius:10px; padding:10px 12px; font-family:'Outfit',sans-serif; font-size:13px; color:var(--text); background:white; resize:vertical; min-height:72px; transition:border-color .15s; }
  .lesson-form-textarea:focus { outline:none; border-color:var(--gold); }
  .lesson-form-actions { display:flex; gap:8px; }
  .lesson-save-btn { background:var(--green-dark); color:white; border:none; border-radius:10px; padding:10px 20px; font-family:'Outfit',sans-serif; font-size:13px; font-weight:700; cursor:pointer; }
  .lesson-save-btn:disabled { opacity:.6; }
  .lesson-cancel-btn { background:none; border:1.5px solid var(--border); color:var(--text-dim); border-radius:10px; padding:10px 16px; font-family:'Outfit',sans-serif; font-size:13px; cursor:pointer; }
  .lesson-card.completed { background:#F0F4F0; border-color:var(--green-mid); border-left-color:var(--green-mid); }
  .lesson-card.completed:hover { border-color:var(--green); }
  .lesson-ai-box { background:linear-gradient(135deg,#FEFBF3,#FFF8E8); border:1px solid rgba(201,168,76,0.35); border-radius:10px; padding:12px 14px; margin-top:10px; }
  .lesson-ai-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--gold); margin-bottom:6px; }
  .lesson-ai-text { font-size:13px; color:var(--text-mid); line-height:1.7; white-space:pre-line; }
  .lesson-action-row { display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
  .lesson-complete-btn { background:var(--green-dark); color:white; border:none; border-radius:8px; padding:7px 14px; font-family:'Outfit',sans-serif; font-size:12px; font-weight:700; cursor:pointer; }
  .lesson-delete-btn { background:none; border:1px solid rgba(201,64,64,0.3); color:var(--red); border-radius:8px; padding:7px 14px; font-family:'Outfit',sans-serif; font-size:12px; cursor:pointer; transition:border-color .15s; }
  .lesson-delete-btn:hover { border-color:var(--red); }
  .upcoming-lesson-mini { display:flex; align-items:center; justify-content:space-between; background:#FEFBF3; border-left:3px solid var(--gold); border-radius:10px; padding:10px 14px; margin-bottom:8px; gap:8px; }
  .upcoming-mini-left { display:flex; flex-direction:column; gap:1px; }
  .upcoming-mini-name { font-size:13px; font-weight:600; color:var(--text); }
  .upcoming-mini-date { font-size:12px; color:var(--text-dim); }
  .upcoming-mini-view { font-size:12px; font-weight:700; color:var(--gold); background:none; border:none; cursor:pointer; padding:0; font-family:'Outfit',sans-serif; white-space:nowrap; }
  .upcoming-mini-view:hover { text-decoration:underline; }
  .schedule-panel-btn { display:flex; align-items:center; gap:8px; background:white; border:1.5px solid var(--gold); color:var(--gold); border-radius:12px; padding:10px 16px; font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; cursor:pointer; margin-bottom:16px; transition:all .15s; width:100%; }
  .schedule-panel-btn:hover { background:rgba(201,168,76,0.08); }
  .schedule-panel { background:#FEFBF3; border:1.5px solid var(--gold); border-radius:16px; padding:16px 18px; margin-bottom:16px; }
  .schedule-panel-title { font-size:14px; font-weight:700; color:var(--text); margin-bottom:14px; }
  .schedule-select { width:100%; border:1.5px solid var(--border); border-radius:10px; padding:10px 12px; font-family:'Outfit',sans-serif; font-size:13px; color:var(--text); background:white; transition:border-color .15s; -webkit-appearance:none; appearance:none; }
  .schedule-select:focus { outline:none; border-color:var(--gold); }
  .schedule-saving-note { font-size:12px; color:var(--text-dim); margin-top:8px; }

  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:80px; }
  .spinner { width:26px; height:26px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }

  /* AI pattern box */
  .ai-box { background:linear-gradient(135deg,#F9F6EE,#EFF6EF); border:1px solid #D4E8D4; border-radius:11px; padding:13px 15px; margin-bottom:16px; }
  .ai-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--green); margin-bottom:7px; display:flex; align-items:center; gap:6px; }
  .ai-text { font-size:13px; color:var(--text-mid); line-height:1.7; white-space:pre-line; }
  .ai-loading { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-dim); }
  .ai-spinner { width:14px; height:14px; border:2px solid #DDD; border-top-color:var(--green); border-radius:50%; animation:spin .7s linear infinite; }

  /* ── COACH HOME (reordered) ── */
  .header-icon-btn { background:none; border:1px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.85); border-radius:8px; padding:5px 12px; font-family:'Outfit',sans-serif; font-size:12px; font-weight:600; cursor:pointer; transition:all .2s; }
  .header-icon-btn:hover { border-color:rgba(255,255,255,0.5); color:white; }

  /* Next lesson anchor card */
  .next-card { background:white; border:2px solid var(--green); border-radius:18px; padding:18px 20px; margin-bottom:20px; box-shadow:var(--shadow); }
  .next-card-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--green); margin-bottom:12px; }
  .next-card-top { display:flex; align-items:center; gap:14px; margin-bottom:12px; }
  .next-avatar { width:46px; height:46px; border-radius:50%; background:var(--green-dark); display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif; font-size:17px; color:var(--gold); flex-shrink:0; }
  .next-info { flex:1; min-width:0; }
  .next-name { font-size:17px; font-weight:700; color:var(--text); }
  .next-sub { font-size:12px; color:var(--text-dim); margin-top:2px; }
  .next-whs { text-align:right; flex-shrink:0; }
  .next-whs-val { font-family:'Playfair Display',serif; font-size:22px; color:var(--text); line-height:1; }
  .next-whs-lbl { font-size:10px; color:var(--text-dim); margin-top:2px; text-transform:uppercase; letter-spacing:.06em; }
  .next-rounds-since { display:inline-block; background:var(--bg); border-radius:8px; padding:4px 10px; font-size:12px; font-weight:600; color:var(--text-mid); margin-bottom:12px; }
  .brief-lines { display:flex; flex-direction:column; gap:8px; margin-bottom:14px; }
  .brief-line { display:flex; align-items:flex-start; gap:8px; font-size:13px; color:var(--text-mid); line-height:1.4; }
  .brief-dir { flex-shrink:0; font-size:13px; font-weight:800; width:14px; text-align:center; }
  .brief-dir.improving { color:var(--green-mid); }
  .brief-dir.watch { color:var(--gold); }
  .brief-dir.declining { color:var(--red); }
  .next-btns { display:flex; gap:8px; flex-wrap:wrap; }
  .next-btn { background:none; border:1.5px solid var(--border); border-radius:9px; padding:7px 14px; font-family:'Outfit',sans-serif; font-size:12px; font-weight:600; color:var(--text-mid); cursor:pointer; transition:all .15s; }
  .next-btn:hover, .next-btn.active { border-color:var(--green); color:var(--green); }
  .next-expand { margin-top:12px; padding-top:12px; border-top:1px solid var(--border); font-size:13px; color:var(--text-mid); line-height:1.7; white-space:pre-line; }
  .next-empty { text-align:center; padding:4px 0; }
  .next-empty-text { font-size:13px; color:var(--text-mid); margin-bottom:14px; line-height:1.6; }

  /* Needs attention */
  .na-card { border-radius:14px; padding:13px 16px; margin-bottom:10px; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
  .na-card.warning { background:#FCF3F0; border:1.5px solid rgba(201,64,64,0.35); }
  .na-card.accent { background:linear-gradient(135deg,#FEFBF3,#FFF8E8); border:1.5px solid rgba(201,168,76,0.45); }
  .na-body { flex:1; min-width:0; }
  .na-title { font-size:13px; font-weight:700; color:var(--text); margin-bottom:3px; }
  .na-sub { font-size:12px; color:var(--text-mid); line-height:1.5; }
  .na-dismiss { background:none; border:none; color:var(--text-dim); font-size:18px; line-height:1; cursor:pointer; padding:0 2px; flex-shrink:0; }
  .na-dismiss:hover { color:var(--text); }

  /* Compact student rows */
  .roster-search { width:100%; border:1.5px solid var(--border); border-radius:10px; padding:9px 12px; font-family:'Outfit',sans-serif; font-size:13px; color:var(--text); background:white; margin-bottom:10px; }
  .roster-search:focus { outline:none; border-color:var(--green-light); }
  .compact-row { background:white; border:1.5px solid var(--border); border-radius:12px; padding:11px 14px; margin-bottom:8px; cursor:pointer; transition:all .15s; display:flex; align-items:center; gap:12px; }
  .compact-row:hover { border-color:var(--green-light); box-shadow:var(--shadow); }
  .compact-avatar { width:38px; height:38px; border-radius:50%; background:var(--green-dark); display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif; font-size:14px; color:var(--gold); flex-shrink:0; }
  .compact-info { flex:1; min-width:0; }
  .compact-name { font-size:14px; font-weight:600; color:var(--text); }
  .compact-meta { font-size:11px; color:var(--text-dim); margin-top:2px; }
  .compact-meta .progress-link { color:var(--green); cursor:pointer; text-decoration:underline; text-decoration-style:dotted; text-underline-offset:2px; }
  .compact-whs { display:flex; align-items:center; gap:6px; flex-shrink:0; }
  .compact-whs-val { font-family:'Playfair Display',serif; font-size:18px; color:var(--text); line-height:1; text-align:right; }
  .compact-whs-lbl { font-size:9px; color:var(--text-dim); text-transform:uppercase; letter-spacing:.05em; text-align:right; margin-top:1px; }
  .compact-trend { font-size:11px; font-weight:700; }

  /* Expandable trajectories */
  .expand-row { display:flex; align-items:center; justify-content:space-between; background:white; border:1.5px solid var(--border); border-radius:12px; padding:13px 16px; cursor:pointer; margin-bottom:16px; transition:all .15s; }
  .expand-row:hover { border-color:var(--green-light); }
  .expand-row-title { font-size:13px; font-weight:600; color:var(--text); }
  .expand-row-chevron { font-size:13px; color:var(--text-dim); transition:transform .2s; }
  .expand-row-chevron.open { transform:rotate(180deg); }

  @media(max-width:520px) {
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
  // Partial rounds (holes played not a standard 9 or 18): prorate the full
  // course handicap across the holes actually played.
  if (round.holes_played && round.holes_played !== 9 && round.holes_played !== 18) {
    return Math.round(round.handicap * round.holes_played / 18);
  }
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

function fmtDateWeekday(iso) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function fmtTime(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

function parDiff(score, round) {
  const par = getCoursePar(round);
  const d = score - par;
  if (d === 0) return { text: "E", cls: "level" };
  if (d < 0) return { text: d.toString(), cls: "under" };
  return { text: "+" + d, cls: "over" };
}

// ── ROSTER CHART ──
const ROSTER_COLORS = ["#1A6B4A","#4A90D9","#C9A84C","#C94040","#7B5EA7","#D4763A","#52C97A","#888"];

// ISO-8601 week key (e.g. "2026-W12") for a "YYYY-MM-DD" date. Computed in UTC
// to avoid timezone drift; the week-year can differ from the calendar year at
// December/January boundaries.
function isoWeekKey(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  const dayNum = (d.getUTCDay() + 6) % 7;            // Mon=0 … Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3);          // move to this week's Thursday
  const isoYear = d.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((d - firstThursday) / (7 * 86400000));
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

function RosterChart({ students, coachId }) {
  const [loading,   setLoading]   = useState(true);
  const [chartData, setChartData] = useState([]);
  const [lessons,   setLessons]   = useState([]);

  useEffect(() => {
    if (!students || students.length === 0) { setLoading(false); return; }
    const studentIds = students.map(s => s.id);
    (async () => {
      const [roundsRes, lessonsRes] = await Promise.all([
        supabase
          .from("rounds")
          .select("student_id,whs_index,created_at")
          .in("student_id", studentIds)
          .not("whs_index", "is", null)
          .order("created_at", { ascending: true }),
        supabase
          .from("lessons")
          .select("student_id,lesson_date")
          .eq("coach_id", coachId)
          .not("lesson_date", "is", null)
          .order("lesson_date", { ascending: true }),
      ]);

      const rounds    = roundsRes.data  || [];
      const lessonRows = lessonsRes.data || [];

      // Bucket rounds per student (ascending by date), then aggregate to one
      // point per ISO week — the last (most recent) WHS index in that week,
      // positioned at that round's date.
      const roundsByStudent = {};
      for (const r of rounds) {
        if (!roundsByStudent[r.student_id]) roundsByStudent[r.student_id] = [];
        roundsByStudent[r.student_id].push(r);
      }

      const weeklyByStudent = {};
      for (const [sid, rs] of Object.entries(roundsByStudent)) {
        const weeks = {};
        for (const r of rs) { // rounds are ascending → last write per week wins
          const date = r.created_at.slice(0, 10);
          weeks[isoWeekKey(date)] = { date, hcp: r.whs_index };
        }
        weeklyByStudent[sid] = Object.values(weeks).sort((a, b) => (a.date < b.date ? -1 : 1));
      }

      const qualified = students.filter(s => (roundsByStudent[s.id] || []).length >= 3);
      const data = qualified.map((s, i) => ({
        student: s,
        color:  ROSTER_COLORS[i % ROSTER_COLORS.length],
        points: weeklyByStudent[s.id] || [],
      }));

      setChartData(data);
      setLessons(lessonRows);
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || chartData.length < 1) return null;

  // ── shared time domain across all students (keeps sparklines temporally aligned) ──
  const allDates = chartData.flatMap(d => d.points.map(p => p.date));
  const minDate = allDates.reduce((a, b) => a < b ? a : b);
  const maxDate = allDates.reduce((a, b) => a > b ? a : b);
  const minTs   = new Date(minDate + "T00:00:00").getTime();
  const maxTs   = new Date(maxDate + "T00:00:00").getTime();
  const tsRange = maxTs - minTs || 1;

  // ── sparkline geometry (viewBox units; each SVG scales to fill its column) ──
  const SPARK_W = 220, SPARK_H = 60;
  const PAD_X = 4, PAD_Y = 9;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // lesson-marker snap window
  const TWO_WEEKS_MS   = 14 * 24 * 60 * 60 * 1000; // gap threshold for dashed segments
  const LABEL_COL = 116;
  const rowGrid = { display: "grid", gridTemplateColumns: `${LABEL_COL}px 1fr`, alignItems: "center", gap: 12 };

  function toXSpark(dateStr) {
    const ts = new Date(dateStr + "T00:00:00").getTime();
    return PAD_X + ((ts - minTs) / tsRange) * (SPARK_W - PAD_X * 2);
  }

  // ── shared x-axis: one tick per calendar month, centred on the 15th ──
  const xLabels = [];
  const startDt = new Date(minDate + "T00:00:00");
  const endDt   = new Date(maxDate + "T00:00:00");
  let cur = new Date(startDt.getFullYear(), startDt.getMonth(), 1);
  while (cur.getFullYear() < endDt.getFullYear() || cur.getMonth() <= endDt.getMonth()) {
    const year  = cur.getFullYear();
    const month = String(cur.getMonth() + 1).padStart(2, "0");
    const mid   = `${year}-${month}-15`;
    xLabels.push({ x: toXSpark(mid), label: cur.toLocaleDateString("en-GB", { month: "short" }) });
    cur = new Date(year, cur.getMonth() + 1, 1);
  }

  // ── per-student lesson markers: snap each lesson to the nearest point within 30 days ──
  const lessonMarkersByStudent = {};
  for (const l of lessons) {
    if (!l.lesson_date) continue;
    const studentEntry = chartData.find(d => d.student.id === l.student_id);
    if (!studentEntry) continue;
    const lessonTs = new Date(l.lesson_date + "T00:00:00").getTime();
    let closest = null, closestDiff = Infinity;
    for (const p of studentEntry.points) {
      const diff = Math.abs(new Date(p.date + "T00:00:00").getTime() - lessonTs);
      if (diff < closestDiff) { closestDiff = diff; closest = p; }
    }
    if (!closest || closestDiff > THIRTY_DAYS_MS) continue;
    if (!lessonMarkersByStudent[l.student_id]) lessonMarkersByStudent[l.student_id] = new Set();
    lessonMarkersByStudent[l.student_id].add(closest.date);
  }

  return (
    <div style={{background:"white",border:"1.5px solid var(--border)",borderRadius:16,padding:"18px 20px",marginBottom:16}}>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"#999",marginBottom:14}}>
        Handicap trajectories
      </div>

      {chartData.map(({ student, color, points }) => {
        const lessonDates = lessonMarkersByStudent[student.id] || new Set();
        const current  = points[points.length - 1]?.hcp;
        const earliest = points[0]?.hcp;
        const change   = (current != null && earliest != null) ? current - earliest : null;

        // Personal y-scale fitted to this student's range, with 0.5 padding top & bottom.
        const hcps   = points.map(p => p.hcp);
        const yMin   = Math.min(...hcps) - 0.5;
        const yMax   = Math.max(...hcps) + 0.5;
        const yRange = (yMax - yMin) || 1;
        const innerH = SPARK_H - PAD_Y * 2;
        const toYSpark = h => PAD_Y + ((yMax - h) / yRange) * innerH;

        return (
          <div key={student.id} style={{ ...rowGrid, marginBottom: 12 }}>
            {/* Left: name, current WHS, trend since earliest point */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {student.first_name} {student.last_name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 3 }}>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: "var(--text)", lineHeight: 1 }}>
                  {current != null ? Number(current).toFixed(1) : "—"}
                </span>
                {change != null && Math.abs(change) >= 0.05 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: change < 0 ? "#2e7d32" : "#c62828" }}>
                    {change < 0 ? "▼" : "▲"} {Math.abs(change).toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            {/* Right: sparkline — own y-scale, shared x-domain, no gridlines */}
            <svg viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
              {points.slice(1).map((p, i) => {
                const prev = points[i];
                const gap = new Date(p.date + "T00:00:00").getTime() - new Date(prev.date + "T00:00:00").getTime();
                return (
                  <line key={"seg-" + i}
                    x1={toXSpark(prev.date)} y1={toYSpark(prev.hcp)}
                    x2={toXSpark(p.date)}    y2={toYSpark(p.hcp)}
                    stroke={color} strokeWidth={1.6} strokeLinecap="round"
                    strokeDasharray={gap > TWO_WEEKS_MS ? "3 3" : undefined} />
                );
              })}
              {points.map((p, i) => {
                const cx = toXSpark(p.date), cy = toYSpark(p.hcp);
                const isLast = i === points.length - 1;
                if (lessonDates.has(p.date)) {
                  return <circle key={i} cx={cx} cy={cy} r={isLast ? 3.4 : 2.8} fill="white" stroke={color} strokeWidth={1.4} />;
                }
                return <circle key={i} cx={cx} cy={cy} r={isLast ? 3.4 : 2} fill={color} />;
              })}
            </svg>
          </div>
        );
      })}

      {/* Shared x-axis — same date domain as every sparkline above */}
      <div style={{ ...rowGrid, marginTop: 2 }}>
        <div />
        <svg viewBox={`0 0 ${SPARK_W} 14`} width="100%" style={{ display: "block", overflow: "visible" }}>
          {xLabels.map((lbl, i) => (
            <text key={i} x={lbl.x} y={10} textAnchor="middle" fontSize="9" fill="#999">{lbl.label}</text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ── STUDENT LIST (coach home) ──
// Turn a markdown pre-lesson brief (## sections + bullets) into up to 3 scannable
// headline lines, each tagged with a direction indicator. The "Recent form" line
// takes its direction from the student's actual WHS trend when known.
function briefHeadlines(brief, recentDir) {
  if (!brief) return [];
  const sections = {};
  let cur = null;
  brief.split("\n").forEach(raw => {
    const h = raw.match(/^#{1,6}\s+(.*)/);
    if (h) { cur = h[1].trim().toLowerCase(); sections[cur] = sections[cur] || []; return; }
    const b = raw.replace(/^[-*•]\s+/, "").trim();
    if (cur && b) sections[cur].push(b);
  });
  const first = name => (sections[name] && sections[name][0]) || null;
  const out = [];
  const rf = first("recent form");
  if (rf) out.push({ text: rf, dir: recentDir || "watch" });
  const af = first("areas to focus on");
  if (af) out.push({ text: af, dir: "watch" });
  const wo = first("watch out for");
  if (wo) out.push({ text: wo, dir: "declining" });
  if (out.length < 3) {
    const sf = first("suggested session focus");
    if (sf) out.push({ text: sf, dir: "watch" });
  }
  if (out.length === 0) {
    brief.split("\n").map(l => l.replace(/^[-*•#]+\s*/, "").trim()).filter(Boolean)
      .slice(0, 3).forEach(t => out.push({ text: t, dir: "watch" }));
  }
  return out.slice(0, 3);
}

function StudentList({ coachProfile, user, students, studentStats, selectedStudent, setStudentLessons, onSelectStudent, onShowProgress, onSignOut, onProfile }) {
  const [inviteLink, setInviteLink] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    studentId: "", date: new Date().toISOString().slice(0, 10), time: "10:00", prepNotes: "",
  });
  const [briefPreview, setBriefPreview]   = useState(null);
  const [briefEdited,  setBriefEdited]    = useState(null);
  const [briefLoading, setBriefLoading]   = useState(false);
  const [scheduleContext, setScheduleContext] = useState(null);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [showChart, setShowChart]   = useState(false);
  const [dismissed, setDismissed]   = useState(new Set());
  const [search, setSearch]         = useState("");
  const [nextView, setNextView]     = useState(null); // null | "full" | "notes"
  const scheduleRef = useRef(null);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      // Mark any past upcoming lessons as completed before reading them back.
      await supabase.from("lessons")
        .update({ status: "completed" })
        .eq("coach_id", user.id)
        .eq("status", "upcoming")
        .lt("lesson_date", today);
      const { data } = await supabase
        .from("lessons")
        .select("*")
        .eq("coach_id", user.id)
        .order("lesson_date", { ascending: true });
      const all = data || [];
      setUpcomingLessons(all.filter(l => l.status === "upcoming" && l.lesson_date >= today));
      setCompletedLessons(
        all.filter(l => l.status === "completed").sort((a, b) => (a.lesson_date < b.lesson_date ? 1 : -1))
      );
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function updateSchedule(field, value) { setScheduleForm(prev => ({ ...prev, [field]: value })); }

  function closeSchedule() {
    setShowSchedule(false);
    setBriefPreview(null);
    setBriefEdited(null);
    setScheduleContext(null);
    setBriefLoading(false);
  }

  const aiBriefActive = COACH_TIERS[coachProfile?.coach_tier]?.aiFeatures === true && coachProfile?.ai_brief_enabled !== false;

  useEffect(() => {
    if (!scheduleForm.studentId) {
      setBriefPreview(null);
      setScheduleContext(null);
      return;
    }
    if (!aiBriefActive) {
      setBriefLoading(false);
      setBriefPreview(null);
      return;
    }
    let cancelled = false;
    setBriefLoading(true);
    setBriefPreview(null);
    (async () => {
      const student = students.find(s => s.id === scheduleForm.studentId);
      const studentName = student ? `${student.first_name} ${student.last_name}` : "Student";
      const { data: rawRounds } = await supabase
        .from("rounds").select("*, courses(name)")
        .eq("student_id", scheduleForm.studentId)
        .eq("sent_to_coach", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (cancelled) return;
      const enriched = await enrichRounds(rawRounds || []);
      if (cancelled) return;
      const ctx = enriched.map(r => {
        const hp = r.holes_played || 9;
        const par = getCoursePar(r);
        return {
          date:            new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
          course:          r.courses?.name || null,
          total_score:     r.total_score ?? null,
          holes_played:    hp,
          vs_par_per_hole: r.total_score ? +((r.total_score - par) / hp).toFixed(2) : null,
          gir_pct:         r.attempted_holes ? Math.round(r.gir_count / r.attempted_holes * 100) : null,
          fairway_pct:     r.fw_holes > 0 ? Math.round(r.fw_hit / r.fw_holes * 100) : null,
          avg_putts:       r.total_putts != null ? +(r.total_putts / hp).toFixed(2) : null,
          scrambling_pct:  r.scrambling_opps > 0 ? Math.round(r.scrambling_made / r.scrambling_opps * 100) : null,
          penalty_count:   null,
        };
      });
      if (!cancelled) setScheduleContext(ctx);
      try {
        const aiRes = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "pre_lesson_brief",
            studentName,
            rounds: ctx.map(rc => ({
              date:          rc.date,
              course:        rc.course,
              score:         rc.total_score,
              holesPlayed:   rc.holes_played,
              vsParPerHole:  rc.vs_par_per_hole,
              girPct:        rc.gir_pct,
              fairwayPct:    rc.fairway_pct,
              avgPutts:      rc.avg_putts,
              scramblingPct: rc.scrambling_pct,
              penaltyCount:  null,
              penaltyTypes:  null,
            })),
          }),
        });
        const aiData = await aiRes.json();
        const generated = aiData.content?.map(c => c.text || "").join("") || null;
        if (!cancelled) { setBriefPreview(generated); setBriefEdited(generated); }
      } catch {}
      if (!cancelled) setBriefLoading(false);
    })();
    return () => { cancelled = true; };
  }, [scheduleForm.studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveScheduledLesson() {
    if (!scheduleForm.studentId || !scheduleForm.date) return;
    setScheduleSaving(true);
    const student = students.find(s => s.id === scheduleForm.studentId);
    const studentName = student ? `${student.first_name} ${student.last_name}` : "Student";

    // 1. Insert lesson row
    const { data: newLesson, error } = await supabase.from("lessons").insert({
      coach_id:   user.id,
      student_id: scheduleForm.studentId,
      lesson_date: scheduleForm.date,
      lesson_time: scheduleForm.time || null,
      prep_notes:  scheduleForm.prepNotes || null,
      status:      "upcoming",
    }).select().single();
    if (error || !newLesson) { setScheduleSaving(false); return; }

    // 2. Save ai_brief + round_context (pre-generated before save; use edited version if coach changed it)
    await supabase.from("lessons").update({ ai_brief: briefEdited ?? briefPreview, round_context: scheduleContext }).eq("id", newLesson.id);

    // 3. Fire-and-forget notify (student notification — best effort)
    fetch("/api/notify-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachId: user.id, studentName, lessonDate: scheduleForm.date, lessonTime: scheduleForm.time }),
    }).catch(() => {});

    // 4. Refresh studentLessons if viewing this student's history
    if (selectedStudent?.id === scheduleForm.studentId) {
      const { data: refreshed } = await supabase.from("lessons").select("*")
        .eq("coach_id", user.id).eq("student_id", scheduleForm.studentId)
        .order("lesson_date", { ascending: false });
      setStudentLessons(refreshed || []);
    }

    // Refresh upcoming lessons list
    const { data: refreshedUpcoming } = await supabase
      .from("lessons")
      .select("*")
      .eq("coach_id", user.id)
      .eq("status", "upcoming")
      .gte("lesson_date", new Date().toISOString().split("T")[0])
      .order("lesson_date", { ascending: true });
    setUpcomingLessons(refreshedUpcoming || []);

    setShowSchedule(false);
    setScheduleForm({ studentId: "", date: new Date().toISOString().slice(0, 10), time: "10:00", prepNotes: "" });
    setBriefPreview(null);
    setBriefEdited(null);
    setScheduleContext(null);
    setScheduleSaving(false);
  }

  async function generateInvite() {
    const coachId = user?.id || coachProfile?.id;
    if (!coachId) return;
    const tier = coachProfile?.coach_tier || "free";
    const limit = COACH_TIERS[tier]?.studentLimit ?? 10;
    if (students.length >= limit) {
      alert(`Your ${COACH_TIERS[tier]?.label ?? tier} plan allows up to ${limit} students. Upgrade to add more.`);
      return;
    }
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

  const nowMs    = Date.now();
  const todayStr = new Date().toISOString().split("T")[0];

  // Every handicap figure on this screen is the student's WHS index (fall back to
  // their profile official handicap only when no round carries a WHS index).
  function studentWhs(s) {
    const st = studentStats[s.id] || {};
    if (st.currentWhs != null) return st.currentWhs;
    return s.official_handicap != null ? s.official_handicap : null;
  }
  const fmtWhs = v => (v == null ? "—" : Number(v).toFixed(1));

  function prevCompletedLesson(studentId) {
    return completedLessons
      .filter(l => l.student_id === studentId && l.lesson_date < todayStr)
      .sort((a, b) => (a.lesson_date < b.lesson_date ? 1 : -1))[0] || null;
  }

  // 1 — Next upcoming lesson (nearest future date), the visual anchor.
  const nextLesson  = upcomingLessons[0] || null;
  const nlStudent   = nextLesson ? students.find(s => s.id === nextLesson.student_id) : null;
  const nlPrev      = nextLesson ? prevCompletedLesson(nextLesson.student_id) : null;
  const nlSince     = nextLesson
    ? (studentStats[nextLesson.student_id]?.sentDates || [])
        .filter(d => !nlPrev || d.slice(0, 10) > nlPrev.lesson_date).length
    : 0;
  const nlTrend     = nextLesson ? studentStats[nextLesson.student_id]?.hcpTrend : null;
  const nlRecentDir = nlTrend == null ? "watch" : nlTrend < 0 ? "improving" : nlTrend > 0 ? "declining" : "watch";
  const nlHeadlines = nextLesson ? briefHeadlines(nextLesson.ai_brief, nlRecentDir) : [];

  // Rounds sent but not yet opened by the coach, across the whole roster.
  const totalUnreviewed = Object.values(studentStats).reduce((s, st) => s + (st.unopenedCount || 0), 0);

  // 2 — Needs attention (dismissible, capped at 3).
  const quietStudents = students.filter(s => {
    const last = studentStats[s.id]?.lastRoundDate;
    if (!last) return false;
    return (nowMs - new Date(last).getTime()) / 86400000 >= 21;
  });
  const attentionItems = [];
  if (quietStudents.length > 0) {
    const names = quietStudents.map(s => s.first_name);
    const extra = names.length - 2;
    const label = names.length === 1
      ? `${names[0]} has gone quiet`
      : names.length === 2
        ? `${names[0]} and ${names[1]} have gone quiet`
        : `${names[0]}, ${names[1]} and ${extra} other${extra !== 1 ? "s" : ""} have gone quiet`;
    attentionItems.push({ key: "quiet", tone: "warning", title: label, sub: "No rounds sent in the last 21+ days." });
  }
  if (totalUnreviewed > 0) {
    attentionItems.push({
      key: "unreviewed", tone: "accent",
      title: `${totalUnreviewed} round${totalUnreviewed !== 1 ? "s" : ""} to review`,
      sub: "Sent by students but not yet opened.",
    });
  }
  const visibleAttention = attentionItems.filter(a => !dismissed.has(a.key)).slice(0, 3);

  // 3 — Roster, searchable once large.
  const rosterFiltered = search.trim()
    ? students.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.trim().toLowerCase()))
    : students;

  return (
    <>
      <style>{css}</style>
      <div className="mode-bar">
        <div className="mode-logo">⛳ Caddie</div>
        <div className="mode-bar-right">
          <button className="header-icon-btn" onClick={() => setShowInvite(v => !v)}>🔗 Invite</button>
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

        {/* Invite panel — toggled from the header button */}
        {showInvite && (
          <div className="invite-section">
            <div className="invite-title">🔗 Invite a student</div>
            <div className="invite-sub">Generate a unique link to share. When a student signs up using it, they're automatically connected to your account.</div>
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
        )}

        {students.length === 0 ? (
          <div className="empty-state">
            <div className="es-icon">📭</div>
            <div className="es-title">No students linked yet</div>
            <div className="es-sub">Tap “🔗 Invite” in the header to generate a link and share it with your students.</div>
          </div>
        ) : (
          <>
            {/* 1 — NEXT LESSON (visual anchor) */}
            <div className="next-card">
              <div className="next-card-label">Next lesson</div>
              {nextLesson && nlStudent ? (
                <>
                  <div className="next-card-top">
                    <div className="next-avatar">{initials(nlStudent.first_name, nlStudent.last_name)}</div>
                    <div className="next-info">
                      <div className="next-name">{nlStudent.first_name} {nlStudent.last_name}</div>
                      <div className="next-sub">{fmtDateWeekday(nextLesson.lesson_date)}{fmtTime(nextLesson.lesson_time) ? ` · ${fmtTime(nextLesson.lesson_time)}` : ""}</div>
                    </div>
                    <div className="next-whs">
                      <div className="next-whs-val">{fmtWhs(studentWhs(nlStudent))}</div>
                      <div className="next-whs-lbl">WHS</div>
                    </div>
                  </div>
                  <div className="next-rounds-since">
                    {nlSince} round{nlSince !== 1 ? "s" : ""} sent {nlPrev ? "since last lesson" : "so far"}
                  </div>
                  {nlHeadlines.length > 0 ? (
                    <div className="brief-lines">
                      {nlHeadlines.map((h, i) => (
                        <div className="brief-line" key={i}>
                          <span className={"brief-dir " + h.dir}>{h.dir === "improving" ? "↗" : h.dir === "declining" ? "↘" : "→"}</span>
                          <span>{h.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="next-sub" style={{marginBottom:14}}>No pre-lesson brief for this lesson yet.</div>
                  )}
                  <div className="next-btns">
                    {nextLesson.ai_brief && (
                      <button className={"next-btn" + (nextView === "full" ? " active" : "")} onClick={() => setNextView(nextView === "full" ? null : "full")}>Full brief</button>
                    )}
                    <button className={"next-btn" + (nextView === "notes" ? " active" : "")} onClick={() => setNextView(nextView === "notes" ? null : "notes")}>Last session notes</button>
                    <button className="next-btn" onClick={() => onSelectStudent(nlStudent)}>Open student →</button>
                  </div>
                  {nextView === "full" && nextLesson.ai_brief && (
                    <div className="next-expand">{renderMarkdown(nextLesson.ai_brief)}</div>
                  )}
                  {nextView === "notes" && (
                    <div className="next-expand">{nlPrev?.notes ? nlPrev.notes : "No notes recorded from a previous session yet."}</div>
                  )}
                </>
              ) : (
                <div className="next-empty">
                  <div className="next-empty-text">
                    No upcoming lesson scheduled.
                    {totalUnreviewed > 0 ? ` You have ${totalUnreviewed} round${totalUnreviewed !== 1 ? "s" : ""} waiting to be reviewed.` : ""}
                  </div>
                  <button className="lesson-save-btn" onClick={() => { setShowSchedule(true); setTimeout(() => scheduleRef.current?.scrollIntoView({ behavior: "smooth" }), 50); }}>📅 Schedule a lesson</button>
                </div>
              )}
            </div>

            {/* 2 — NEEDS ATTENTION */}
            {visibleAttention.length > 0 && (
              <>
                <div className="section-label">Needs attention</div>
                {visibleAttention.map(a => (
                  <div className={"na-card " + a.tone} key={a.key}>
                    <div className="na-body">
                      <div className="na-title">{a.title}</div>
                      <div className="na-sub">{a.sub}</div>
                    </div>
                    <button className="na-dismiss" aria-label="Dismiss" onClick={() => setDismissed(prev => { const n = new Set(prev); n.add(a.key); return n; })}>×</button>
                  </div>
                ))}
              </>
            )}

            {/* 3 — YOUR STUDENTS (compact rows) */}
            <div className="section-label">Your students</div>
            {students.length > 15 && (
              <input className="roster-search" placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} />
            )}
            {rosterFiltered.map(s => {
              const st = studentStats[s.id] || {};
              const thisMonth = st.thisMonth || 0;
              const last = st.lastRoundDate;
              const recency = thisMonth > 0
                ? `${thisMonth} round${thisMonth !== 1 ? "s" : ""} this month`
                : last
                  ? `Quiet ${Math.floor((nowMs - new Date(last).getTime()) / 86400000)} days`
                  : "No rounds yet";
              const whs = studentWhs(s);
              const hcpTrend = st.hcpTrend;
              return (
                <div className="compact-row" key={s.id} onClick={() => onSelectStudent(s)}>
                  <div className="compact-avatar">{initials(s.first_name, s.last_name)}</div>
                  <div className="compact-info">
                    <div className="compact-name">
                      {s.first_name} {s.last_name}
                      {st.newRounds > 0 && <span className="new-badge">{st.newRounds} new</span>}
                    </div>
                    <div className="compact-meta">
                      {recency}
                      {onShowProgress && <> · <span className="progress-link" onClick={e => { e.stopPropagation(); onShowProgress(s); }}>Progress</span></>}
                    </div>
                  </div>
                  <div className="compact-whs">
                    <div>
                      <div className="compact-whs-val">{fmtWhs(whs)}</div>
                      <div className="compact-whs-lbl">WHS</div>
                    </div>
                    {hcpTrend != null && (
                      <span className="compact-trend" style={{color: hcpTrend < 0 ? "#2e7d32" : "#c62828"}}>
                        {hcpTrend < 0 ? "▼" : "▲"} {Math.abs(hcpTrend).toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {rosterFiltered.length === 0 && (
              <div className="compact-meta" style={{padding:"6px 2px 12px"}}>No students match “{search}”.</div>
            )}

            {/* 4 — HANDICAP TRAJECTORIES (collapsed by default) */}
            <div className="expand-row" style={{marginTop:16}} onClick={() => setShowChart(v => !v)}>
              <div className="expand-row-title">📈 Handicap trajectories</div>
              <div className={"expand-row-chevron" + (showChart ? " open" : "")}>▾</div>
            </div>
            {showChart && <RosterChart students={students} coachId={user?.id} />}

            {/* 5 — SCHEDULE A LESSON */}
            <div ref={scheduleRef} />
            {showSchedule ? (
              <div className="schedule-panel">
                <div className="schedule-panel-title">📅 Schedule lesson</div>
                <div className="lesson-form-field">
                  <label className="lesson-form-label">Student</label>
                  <select className="schedule-select" value={scheduleForm.studentId} onChange={e => updateSchedule("studentId", e.target.value)}>
                    <option value="">Select student…</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                    ))}
                  </select>
                </div>
                <div className="lesson-form-field" style={{display:"flex", gap:10}}>
                  <div style={{flex:1}}>
                    <label className="lesson-form-label">Date</label>
                    <input type="date" className="lesson-form-input" value={scheduleForm.date} onChange={e => updateSchedule("date", e.target.value)} />
                  </div>
                  <div style={{flex:1}}>
                    <label className="lesson-form-label">Time</label>
                    <input type="time" className="lesson-form-input" value={scheduleForm.time} onChange={e => updateSchedule("time", e.target.value)} />
                  </div>
                </div>
                {scheduleForm.studentId && !aiBriefActive && (
                  <div className="lesson-form-field">
                    <div className="lesson-ai-box" style={{background:"#FEFBF3"}}>
                      <div className="lesson-ai-label" style={{color:"var(--gold)"}}>✦ Pre-lesson AI analysis requires a paid plan</div>
                    </div>
                  </div>
                )}
                {scheduleForm.studentId && aiBriefActive && (
                  <div className="lesson-form-field">
                    <div className="lesson-ai-box">
                      <div className="lesson-ai-label">✦ Pre-lesson analysis</div>
                      {briefLoading
                        ? <div className="ai-loading"><div className="ai-spinner" />Generating brief…</div>
                        : briefEdited != null
                          ? <textarea
                              className="lesson-form-textarea"
                              style={{minHeight:180,fontSize:12,lineHeight:1.6,fontFamily:"'Outfit',sans-serif"}}
                              value={briefEdited}
                              onChange={e => setBriefEdited(e.target.value)}
                            />
                          : <div style={{fontSize:13,color:"var(--text-dim)"}}>No recent rounds available.</div>
                      }
                    </div>
                  </div>
                )}
                <div className="lesson-form-field">
                  <label className="lesson-form-label">Prep notes</label>
                  <textarea className="lesson-form-textarea" placeholder="What to focus on in this lesson..." value={scheduleForm.prepNotes} onChange={e => updateSchedule("prepNotes", e.target.value)} />
                </div>
                <div className="lesson-form-actions">
                  <button className="lesson-save-btn" onClick={saveScheduledLesson} disabled={scheduleSaving || (aiBriefActive && briefLoading) || !scheduleForm.studentId || !scheduleForm.date}>
                    {scheduleSaving ? "Saving…" : "Save lesson"}
                  </button>
                  <button className="lesson-cancel-btn" onClick={closeSchedule}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="schedule-panel-btn" onClick={() => setShowSchedule(true)}>📅 Schedule a lesson</button>
            )}
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
      model: "claude-sonnet-4-6",
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
    { key: "Under 25", label: "Under 25 yds" },
    { key: "25–50",    label: "25–50 yds" },
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

function RoundHistory({ student, rounds, lessons, setLessons, coachId, coachProfile, onSelectRound, onBack, onSignOut, onHome }) {
  const sentRounds = rounds.filter(r => r.sent_to_coach);
  const scored     = sentRounds.filter(r => r.total_score);
  const rounds9Count  = scored.filter(r => r.holes_played === 9).length;
  const rounds18Count = scored.filter(r => r.holes_played === 18).length;
  const [activeStatTab, setActiveStatTab] = useState(() => rounds9Count > rounds18Count ? 9 : 18);
  const [aiPatterns, setAiPatterns] = useState(null);
  const [mainView, setMainView] = useState("trends");
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [completingLesson, setCompletingLesson] = useState(null);
  const [completeForm, setCompleteForm] = useState({ session_notes: "", drills: "" });
  const [editingCompletedLesson, setEditingCompletedLesson] = useState(null);
  const [editForm, setEditForm] = useState({ notes: "", drills: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingUpcomingLesson, setEditingUpcomingLesson] = useState(null);
  const [upcomingEditForm, setUpcomingEditForm] = useState({ date: "", time: "", prepNotes: "" });
  const [savingUpcomingEdit, setSavingUpcomingEdit] = useState(false);

  async function saveComplete(lessonId) {
    await supabase.from("lessons").update({
      status: "completed",
      notes:  completeForm.session_notes || null,
      drills: completeForm.drills || null,
    }).eq("id", lessonId);
    const { data: refreshed } = await supabase.from("lessons").select("*")
      .eq("coach_id", coachId).eq("student_id", student.id)
      .order("lesson_date", { ascending: false });
    setLessons(refreshed || []);
    setCompletingLesson(null);
    setExpandedLesson(null);
  }

  async function deleteLesson(lessonId) {
    if (!window.confirm("Delete this lesson?")) return;
    await supabase.from("lessons").delete().eq("id", lessonId);
    setLessons(prev => prev.filter(x => x.id !== lessonId));
  }

  async function saveUpcomingEdit(lessonId) {
    setSavingUpcomingEdit(true);
    await supabase.from("lessons").update({
      lesson_date: upcomingEditForm.date,
      lesson_time: upcomingEditForm.time || null,
      prep_notes:  upcomingEditForm.prepNotes || null,
    }).eq("id", lessonId);
    const { data: refreshed } = await supabase.from("lessons").select("*")
      .eq("coach_id", coachId).eq("student_id", student.id)
      .order("lesson_date", { ascending: false });
    setLessons(refreshed || []);
    setEditingUpcomingLesson(null);
    setSavingUpcomingEdit(false);
  }

  async function saveEditedLesson(lessonId) {
    setSavingEdit(true);
    await supabase.from("lessons").update({
      notes:  editForm.notes || null,
      drills: editForm.drills || null,
    }).eq("id", lessonId);
    const { data: refreshed } = await supabase.from("lessons").select("*")
      .eq("coach_id", coachId).eq("student_id", student.id)
      .order("lesson_date", { ascending: false });
    setLessons(refreshed || []);
    setEditingCompletedLesson(null);
    setSavingEdit(false);
  }

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
      return `Round ${i + 1} (${fmtDate}, ${hp} holes):` +
        ` vs par/hole ${vsParPerHole >= 0 ? "+" : ""}${vsParPerHole}` +
        (stableford   != null ? `, stableford/hole ${stableford}` : "") +
        (girPct       != null ? `, GIR ${girPct}%` : "") +
        (fwPct        != null ? `, fairways ${fwPct}% (${r.miss_left ?? 0}L ${r.miss_right ?? 0}R miss)` : "") +
        (puttsPerHole != null ? `, putts/hole ${puttsPerHole}` : "") +
        (scrPct       != null ? `, scrambling ${scrPct}%` : "") +
        (r.whs_index  != null ? `, WHS index ${r.whs_index}` : "") +
        (r.student_note ? `, student note: "${r.student_note}"` : "") +
        (r.wind || r.conditions || r.temperature ? `, conditions: ${[r.wind, r.conditions, r.temperature].filter(Boolean).join(", ")}` : "");
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
      { key: "Under 25", label: "under 25" },
      { key: "25\u201350",    label: "25\u201350" },
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
        .select("round_id, hole_number, approach, putt1, dna, picked_up, penalty")
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

        const penTypeCounts = {};
        (holesByRound[r.id] || []).forEach(h => {
          const types = Array.isArray(h.penalty) ? h.penalty
            : (h.penalty && h.penalty !== "None" ? [h.penalty] : []);
          types.forEach(t => { penTypeCounts[t] = (penTypeCounts[t] || 0) + 1; });
        });
        const penEntries = Object.entries(penTypeCounts).filter(([, n]) => n > 0);
        const penaltyLine = penEntries.length > 0
          ? `\n  Penalties: ${penEntries.map(([k, n]) => `${k} ×${n}`).join(", ")}`
          : "";

        return roundSummaries[i] + approachLine + puttLine + penaltyLine;
      });

      const mostRecent = last5[last5.length - 1];
      const whsIndex = mostRecent.whs_index != null ? mostRecent.whs_index : student.official_handicap;
      let benchmarkLine = "";
      if (whsIndex != null) {
        const bm = getBenchmark(whsIndex);
        benchmarkLine = `\nPlayer benchmarks (${Math.round(whsIndex)} handicap): proximity under 25yds=${bm.proximity_u25}ft, 25-50yds=${bm.proximity_25_50}ft, 50-75yds=${bm.proximity_50_75}ft, 75-100yds=${bm.proximity_75_100}ft, 100-125yds=${bm.proximity_100_125}ft, 125-150yds=${bm.proximity_125_150}ft, 150+yds=${bm.proximity_150plus}ft, scrambling=${bm.scrambling}%, GIR=${bm.gir}%, fairways=${bm.fairways}%, putts/round=${bm.putts_per_round}\n`;
      }
      const enhancedPrompt = `${SYSTEM_PROMPT}\n\nAnalyse these ${last5.length} rounds from ${student.first_name} ${student.last_name}:${benchmarkLine}\nRounds listed oldest to newest (Round 1 = oldest, Round ${last5.length} = most recent):\n${enhancedSummaries.join("\n")}`;

      try {
        const result = await callAI(enhancedPrompt);
        setAiPatterns(result);
        supabase.from("ai_cache").upsert({
          coach_id: coachId,
          student_id: student.id,
          cache_type: "patterns",
          content: result,
          round_ids: last5.map(r => r.id),
        }, { onConflict: "coach_id,student_id,cache_type" });
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
                  ? <div className="ai-text">{renderMarkdown(aiPatterns)}</div>
                  : <div className="ai-loading"><div className="ai-spinner" />Analysing patterns across rounds…</div>}
              </div>
            )}

            <div className="section-label">Round &amp; lesson history</div>

            {/* Lessons are scheduled from the coach home screen via the Schedule lesson panel */}

            {[
              ...sentRounds.map(r => ({ type: "round", date: r.created_at, data: r })),
              ...(lessons || []).map(l => ({ type: "lesson", date: l.lesson_date + "T23:59:59", data: l })),
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).map(item => {
              if (item.type === "round") {
                const r    = item.data;
                const diff = parDiff(r.total_score, r);
                return (
                  <div className="round-card" key={"r-" + r.id} onClick={() => onSelectRound(r)}>
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
              }

              // Lesson card
              const l           = item.data;
              const isUpcoming  = l.status === "upcoming";
              const isExpanded  = expandedLesson === l.id;
              const isCompleting = completingLesson === l.id;
              const lessonDate  = new Date(l.lesson_date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

              if (isUpcoming) {
                const isEditingUpcoming = editingUpcomingLesson === l.id;
                const prepPreview = l.prep_notes ? (l.prep_notes.length > 100 ? l.prep_notes.slice(0, 100) + "…" : l.prep_notes) : null;
                return (
                  <div className="lesson-card" key={"l-" + l.id} onClick={() => !isEditingUpcoming && setExpandedLesson(isExpanded ? null : l.id)}>
                    <div className="lesson-card-header">
                      <div>
                        <div className="lesson-card-title">📅 Upcoming lesson</div>
                        <div className="lesson-card-date">{lessonDate}{l.lesson_time ? ` · ${l.lesson_time}` : ""}</div>
                      </div>
                      <div style={{display:"flex", gap:6}}>
                        {!isEditingUpcoming && (
                          <button className="lesson-edit-btn" onClick={e => { e.stopPropagation(); setEditingUpcomingLesson(l.id); setUpcomingEditForm({ date: l.lesson_date, time: l.lesson_time || "", prepNotes: l.prep_notes || "" }); setExpandedLesson(l.id); }}>Edit</button>
                        )}
                        <button className="lesson-delete-btn" onClick={e => { e.stopPropagation(); deleteLesson(l.id); }}>Delete</button>
                      </div>
                    </div>
                    {prepPreview && !isExpanded && <div className="lesson-preview">{prepPreview}</div>}
                    {isExpanded && !isEditingUpcoming && (
                      <div className="lesson-full">
                        {l.prep_notes && (
                          <div className="lesson-section">
                            <div className="lesson-section-label">Prep notes</div>
                            <div className="lesson-section-text">{l.prep_notes}</div>
                          </div>
                        )}
                        {(() => {
                          const hasTierAI = COACH_TIERS[coachProfile?.coach_tier]?.aiFeatures === true;
                          const briefEnabled = coachProfile?.ai_brief_enabled !== false;
                          if (!hasTierAI) return (
                            <div className="lesson-ai-box" style={{background:"#FEFBF3"}}>
                              <div className="lesson-ai-label" style={{color:"var(--gold)"}}>✦ Pre-lesson AI analysis requires a paid plan</div>
                            </div>
                          );
                          if (!briefEnabled) return null;
                          if (!l.ai_brief) return null;
                          return (
                            <div className="lesson-ai-box">
                              <div className="lesson-ai-label">✦ Pre-lesson analysis</div>
                              <div className="lesson-ai-text">{renderMarkdown(l.ai_brief)}</div>
                            </div>
                          );
                        })()}
                        {!isCompleting && (
                          <div className="lesson-action-row">
                            <button className="lesson-complete-btn" onClick={e => { e.stopPropagation(); setCompletingLesson(l.id); setCompleteForm({ session_notes: "", drills: "" }); }}>
                              Log session notes
                            </button>
                          </div>
                        )}
                        {isCompleting && (
                          <div onClick={e => e.stopPropagation()}>
                            <div className="lesson-form-field" style={{marginTop:12}}>
                              <label className="lesson-form-label">Session notes</label>
                              <textarea className="lesson-form-textarea" placeholder="What did you work on..." value={completeForm.session_notes} onChange={e => setCompleteForm(prev => ({ ...prev, session_notes: e.target.value }))} />
                            </div>
                            <div className="lesson-form-field">
                              <label className="lesson-form-label">Drills assigned</label>
                              <textarea className="lesson-form-textarea" placeholder="Drills assigned..." value={completeForm.drills} onChange={e => setCompleteForm(prev => ({ ...prev, drills: e.target.value }))} />
                            </div>
                            <div className="lesson-form-actions">
                              <button className="lesson-save-btn" onClick={e => { e.stopPropagation(); saveComplete(l.id); }}>Save</button>
                              <button className="lesson-cancel-btn" onClick={e => { e.stopPropagation(); setCompletingLesson(null); }}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {isEditingUpcoming && (
                      <div onClick={e => e.stopPropagation()}>
                        <div className="lesson-form-field" style={{marginTop:12}}>
                          <label className="lesson-form-label">Date</label>
                          <input type="date" className="lesson-form-input" value={upcomingEditForm.date} onChange={e => setUpcomingEditForm(prev => ({ ...prev, date: e.target.value }))} />
                        </div>
                        <div className="lesson-form-field">
                          <label className="lesson-form-label">Time</label>
                          <input type="time" className="lesson-form-input" value={upcomingEditForm.time} onChange={e => setUpcomingEditForm(prev => ({ ...prev, time: e.target.value }))} />
                        </div>
                        <div className="lesson-form-field">
                          <label className="lesson-form-label">Prep notes</label>
                          <textarea className="lesson-form-textarea" placeholder="What to focus on in this lesson..." value={upcomingEditForm.prepNotes} onChange={e => setUpcomingEditForm(prev => ({ ...prev, prepNotes: e.target.value }))} />
                        </div>
                        <div className="lesson-form-actions">
                          <button className="lesson-save-btn" onClick={e => { e.stopPropagation(); saveUpcomingEdit(l.id); }} disabled={savingUpcomingEdit || !upcomingEditForm.date}>{savingUpcomingEdit ? "Saving…" : "Save"}</button>
                          <button className="lesson-cancel-btn" onClick={e => { e.stopPropagation(); setEditingUpcomingLesson(null); }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Completed lesson
              const isEditingCompleted = editingCompletedLesson === l.id;
              const notesPreview = l.notes ? (l.notes.length > 100 ? l.notes.slice(0, 100) + "…" : l.notes) : null;
              return (
                <div className="lesson-card completed" key={"l-" + l.id} onClick={() => !isEditingCompleted && setExpandedLesson(isExpanded ? null : l.id)}>
                  <div className="lesson-card-header">
                    <div>
                      <div className="lesson-card-title">📋 Lesson</div>
                      <div className="lesson-card-date">{lessonDate}</div>
                    </div>
                    <div style={{display:"flex", gap:6}}>
                      {!isEditingCompleted && (
                        <button className="lesson-edit-btn" onClick={e => { e.stopPropagation(); setEditingCompletedLesson(l.id); setEditForm({ notes: l.notes || "", drills: l.drills || "" }); setExpandedLesson(l.id); }}>Edit</button>
                      )}
                      <button className="lesson-delete-btn" onClick={e => { e.stopPropagation(); deleteLesson(l.id); }}>Delete</button>
                    </div>
                  </div>
                  {notesPreview && !isExpanded && <div className="lesson-preview">{notesPreview}</div>}
                  {(l.drills || l.homework) && !isExpanded && (
                    <div className="lesson-indicators">
                      {l.drills   && <span className="lesson-indicator">📝 Drills</span>}
                      {l.homework && <span className="lesson-indicator">🏠 Homework</span>}
                    </div>
                  )}
                  {isExpanded && !isEditingCompleted && (
                    <div className="lesson-full">
                      {l.notes && (
                        <div className="lesson-section">
                          <div className="lesson-section-label">Notes</div>
                          <div className="lesson-section-text">{l.notes}</div>
                        </div>
                      )}
                      {l.drills && (
                        <div className="lesson-section">
                          <div className="lesson-section-label">📝 Drills</div>
                          <div className="lesson-section-text">{l.drills}</div>
                        </div>
                      )}
                      {l.homework && (
                        <div className="lesson-section">
                          <div className="lesson-section-label">🏠 Homework</div>
                          <div className="lesson-section-text">{l.homework}</div>
                        </div>
                      )}
                      {l.round_context && l.round_context.length > 0 && (
                        <div className="lesson-context">
                          <div className="lesson-context-title">Rounds at time of lesson</div>
                          {l.round_context.map((rc, i) => (
                            <div className="lesson-context-row" key={i}>
                              {rc.date}{rc.total_score ? ` · ${rc.total_score} (${rc.vs_par_per_hole >= 0 ? "+" : ""}${rc.vs_par_per_hole}/hole)` : ""}{rc.gir_pct != null ? ` · GIR ${rc.gir_pct}%` : ""}{rc.fairway_pct != null ? ` · FW ${rc.fairway_pct}%` : ""}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {isEditingCompleted && (
                    <div onClick={e => e.stopPropagation()}>
                      <div className="lesson-form-field" style={{marginTop:12}}>
                        <label className="lesson-form-label">Session notes</label>
                        <textarea className="lesson-form-textarea" placeholder="What did you work on..." value={editForm.notes} onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))} />
                      </div>
                      <div className="lesson-form-field">
                        <label className="lesson-form-label">Drills assigned</label>
                        <textarea className="lesson-form-textarea" placeholder="Drills assigned..." value={editForm.drills} onChange={e => setEditForm(prev => ({ ...prev, drills: e.target.value }))} />
                      </div>
                      <div className="lesson-form-actions">
                        <button className="lesson-save-btn" onClick={e => { e.stopPropagation(); saveEditedLesson(l.id); }} disabled={savingEdit}>{savingEdit ? "Saving…" : "Save"}</button>
                        <button className="lesson-cancel-btn" onClick={e => { e.stopPropagation(); setEditingCompletedLesson(null); }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}

const COACH_TIERS = {
  free:     { label: "Free",     price: "£0",       studentLimit: 10,       aiFeatures: false },
  starter:  { label: "Starter",  price: "£29/mo",   studentLimit: 25,       aiFeatures: true  },
  pro:      { label: "Pro",      price: "£49/mo",   studentLimit: 50,       aiFeatures: true  },
  club:     { label: "Club",     price: "£99/mo",   studentLimit: 100,      aiFeatures: true  },
  academy:  { label: "Academy",  price: "£199/mo",  studentLimit: Infinity, aiFeatures: true  },
};

// ── ROOT COMPONENT ──
export default function CoachHome({ user, onSelectRound, onSignOut, onProfile, initialScreen, initialStudent }) {
  const [screen, setScreen]           = useState(initialScreen || "students");
  const [coachProfile, setCoachProfile] = useState(null);
  const [students, setStudents]       = useState([]);
  const [studentStats, setStudentStats] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(initialStudent || null);
  const [studentRounds, setStudentRounds] = useState([]);
  const [studentLessons, setStudentLessons] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingRounds, setLoadingRounds] = useState(initialScreen === "history");
  const [progressStudent, setProgressStudent] = useState(null);

  useEffect(() => {
    async function load() {
      // Load coach profile
      const { data: profile } = await supabase
        .from("profiles").select("first_name, last_name, is_premium, ai_brief_enabled, coach_tier").eq("id", user.id).single();
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
        .select("id, student_id, total_score, handicap, whs_index, holes_played, total_par, course_id, sent_to_coach, ai_analysis, created_at")
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

        // Avg gross vs par per hole — last 30 days, or last 5 rounds if none in that window
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
        const sixtyDaysAgo  = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();
        const curPeriod  = scored.filter(r => r.created_at >= thirtyDaysAgo);
        const curRounds  = curPeriod.length > 0 ? curPeriod : scored.slice(0, 5);
        const prevRounds = scored.filter(r => r.created_at >= sixtyDaysAgo && r.created_at < thirtyDaysAgo);
        const avgVsParPerHole = curRounds.length
          ? curRounds.reduce((s, r) => s + (r.total_score - getCoursePar(r)) / (r.holes_played || 9), 0) / curRounds.length
          : null;
        const prevAvgVsParPerHole = prevRounds.length >= 2
          ? prevRounds.reduce((s, r) => s + (r.total_score - getCoursePar(r)) / (r.holes_played || 9), 0) / prevRounds.length
          : null;
        const trendDiff = (curPeriod.length >= 2 && prevRounds.length >= 2 && avgVsParPerHole != null && prevAvgVsParPerHole != null)
          ? avgVsParPerHole - prevAvgVsParPerHole
          : null;

        // WHS index trend — most recent round in last 30 days vs most recent in 30–60 days
        const curWhs  = pRounds.find(r => r.created_at >= thirtyDaysAgo && r.whs_index != null)?.whs_index ?? null;
        const prevWhs = pRounds.find(r => r.created_at >= sixtyDaysAgo && r.created_at < thirtyDaysAgo && r.whs_index != null)?.whs_index ?? null;
        const hcpTrend = (curWhs != null && prevWhs != null) ? curWhs - prevWhs : null;

        stats[p.id] = {
          totalRounds:    pRounds.length,
          currentHcp,
          // Current WHS index = most recent round with a WHS index (matches chart legend/tooltip).
          currentWhs:     pRounds.find(r => r.whs_index != null)?.whs_index ?? null,
          avgVsParPerHole,
          trendDiff,
          hcpTrend,
          lastRoundDate:  pRounds[0]?.created_at || null,
          thisMonth:      pRounds.filter(r => r.created_at >= monthStart).length,
          // Sent rounds not yet opened by the coach (ai_analysis is populated on first open).
          unopenedCount:  pRounds.filter(r => !r.ai_analysis).length,
          // created_at of every sent round (newest first) — used for "rounds since last lesson".
          sentDates:      pRounds.map(r => r.created_at),
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
        const [{ data: rounds }, { data: lessons }] = await Promise.all([
          supabase.from("rounds").select("*, courses(name)")
            .eq("student_id", initialStudent.id)
            .eq("sent_to_coach", true)
            .order("created_at", { ascending: false }),
          supabase.from("lessons").select("*")
            .eq("coach_id", user.id)
            .eq("student_id", initialStudent.id)
            .order("lesson_date", { ascending: false }),
        ]);
        const enriched = await enrichRounds(rounds || []);
        setStudentRounds(enriched);
        setStudentLessons(lessons || []);
        setLoadingRounds(false);
      }
    }
    load();
  }, [user.id, initialScreen, initialStudent]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelectStudent(student) {
    setSelectedStudent(student);
    setLoadingRounds(true);
    setScreen("history");
    const [{ data }, { data: lessons }] = await Promise.all([
      supabase.from("rounds").select("*, courses(name)")
        .eq("student_id", student.id)
        .eq("sent_to_coach", true)
        .order("created_at", { ascending: false }),
      supabase.from("lessons").select("*")
        .eq("coach_id", user.id)
        .eq("student_id", student.id)
        .order("lesson_date", { ascending: false }),
    ]);
    const enriched = await enrichRounds(data || []);
    setStudentRounds(enriched);
    setStudentLessons(lessons || []);
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

  if (progressStudent) {
    return (
      <StudentProgress
        user={user}
        studentProfile={progressStudent}
        onBack={() => setProgressStudent(null)}
        isCoachView={true}
      />
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
        coachProfile={coachProfile}
        onHome={() => setScreen("students")}
        rounds={studentRounds}
        lessons={studentLessons}
        setLessons={setStudentLessons}
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
      selectedStudent={selectedStudent}
      setStudentLessons={setStudentLessons}
      onSelectStudent={handleSelectStudent}
      onShowProgress={setProgressStudent}
      onSignOut={onSignOut}
      onProfile={onProfile}
    />
  );
}
