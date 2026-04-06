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
  .hd.done    { background:var(--green-light); border-color:var(--green-light); color:white; }
  .hd.current { background:var(--green-dark); border-color:var(--green-dark); color:var(--gold); }
  .hd.eagle   { background:var(--gold); border-color:var(--gold); color:var(--green-dark); }
  .hd.birdie  { background:var(--green-mid); border-color:var(--green-mid); color:white; }
  .hd.par     { background:#888; border-color:#888; color:white; }
  .hd.bogey   { background:var(--sky); border-color:var(--sky); color:white; }
  .hd.double  { background:var(--red); border-color:var(--red); color:white; }
  .hd.worse   { background:#8B1A1A; border-color:#8B1A1A; color:white; }
  .hd.pu      { background:#CCC; border-color:#CCC; color:white; }
  .hd.dna     { background:#DDD; border-color:#DDD; color:#999; }

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
  /* ── SG REASON ── */
  .sg-reason-grid { display:flex; flex-wrap:wrap; gap:6px; }
  .sg-chip { background:white; border:1.5px solid var(--border); border-radius:20px; padding:6px 12px; font-family:'Outfit',sans-serif; font-size:12px; font-weight:600; color:var(--text-mid); cursor:pointer; transition:all .15s; }
  .sg-chip:hover { border-color:var(--green-light); }
  .sg-chip.sel { background:#7B4FBF; border-color:#7B4FBF; color:white; }

  /* ── SUMMARY SCREEN ── */
  .sum-wrap { max-width:420px; margin:0 auto; padding:16px 16px 80px; }
  .sum-title { font-family:'Playfair Display',serif; font-size:22px; color:var(--text); margin-bottom:6px; }
  .sum-sub { font-size:13px; color:var(--text-dim); margin-bottom:24px; line-height:1.6; }
  .sum-sec { margin-bottom:20px; }
  .sum-sec-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-dim); margin-bottom:8px; }
  .sum-chips { display:flex; gap:8px; flex-wrap:wrap; }
  .sum-chip {
    background:white; border:1.5px solid var(--border); border-radius:20px;
    padding:8px 16px; font-family:'Outfit',sans-serif; font-size:13px; font-weight:600;
    color:var(--text-mid); cursor:pointer; transition:all .15s;
  }
  .sum-chip:hover { border-color:var(--green-light); }
  .sum-chip.sel { background:var(--green-dark); border-color:var(--green-dark); color:white; }
  .sum-note { width:100%; background:var(--bg); border:1.5px solid var(--border); border-radius:11px; padding:12px 14px; font-family:'Outfit',sans-serif; font-size:14px; color:var(--text); resize:none; outline:none; line-height:1.6; }
  .sum-note:focus { border-color:var(--green-light); background:white; }

  /* ── STUDENT STATS ── */
  .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
  .stat-card { background:white; border:1px solid var(--border); border-radius:14px; padding:14px 16px; }
  .stat-card-val { font-family:'Playfair Display',serif; font-size:32px; line-height:1; color:var(--text); }
  .stat-card-val.ok   { color:var(--green-mid); }
  .stat-card-val.warn { color:var(--orange); }
  .stat-card-val.bad  { color:var(--red); }
  .stat-card-lbl { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-top:5px; }
  .stat-card-sub { font-size:11px; color:var(--text-dim); margin-top:2px; }
  .edit-holes-btn { width:100%; background:white; border:1.5px solid var(--border); border-radius:12px; padding:12px 16px; font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; color:var(--text-mid); cursor:pointer; text-align:left; display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; transition:all .15s; }
  .edit-holes-btn:hover { border-color:var(--green-light); color:var(--green); }

  /* ── PICKED UP / DNA ── */
  .puck-row { display:flex; gap:8px; margin-bottom:14px; justify-content:flex-end; }
  .puck-btn {
    background:none; border:1px solid var(--border); border-radius:8px;
    padding:5px 11px; cursor:pointer; font-family:'Outfit',sans-serif;
    font-size:11px; font-weight:600; color:var(--text-dim); transition:all .15s;
  }
  .puck-btn:hover { border-color:var(--text-mid); color:var(--text-mid); }
  .puck-btn.sel-pu  { background:#FEF3E8; border-color:var(--orange); color:var(--orange); }
  .puck-btn.sel-dna { background:#F0F0F0; border-color:#999; color:#555; }

  /* ── FINISH EARLY ── */
  .finish-early-btn {
    background:none; border:1.5px solid var(--border); border-radius:10px;
    padding:10px 16px; font-family:'Outfit',sans-serif; font-size:13px;
    font-weight:600; color:var(--text-dim); cursor:pointer; transition:all .15s;
    white-space:nowrap;
  }
  .finish-early-btn:hover { border-color:var(--green-light); color:var(--green); }

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
  .ov-hole-card.not-logged { opacity:0.6; }
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

  /* ── TIERED OVERVIEW ── */
  .ov-card { background:white; border:1.5px solid var(--border); border-radius:16px; padding:18px; margin-bottom:14px; }
  .ov-card-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:var(--text-dim); margin-bottom:14px; }
  .ov-sc-table { width:100%; border-collapse:collapse; }
  .ov-sc-table th { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); padding:5px 4px; text-align:center; border-bottom:1.5px solid var(--border); }
  .ov-sc-table td { padding:8px 4px; text-align:center; border-top:1px solid var(--border); font-size:13px; }
  .ov-sc-table tr:hover td { background:var(--bg); cursor:pointer; }
  .ov-sn-eagle { color:var(--gold); font-weight:700; }
  .ov-sn-birdie { color:var(--green-mid); font-weight:700; }
  .ov-sn-par { color:var(--text-mid); }
  .ov-sn-bogey { color:var(--orange); font-weight:700; }
  .ov-sn-double { color:var(--red); font-weight:700; }
  .ov-sn-worse { color:#8B1A1A; font-weight:700; }
  .ov-appr-table { width:100%; border-collapse:collapse; }
  .ov-appr-table th { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); padding:5px 4px; text-align:center; border-bottom:1.5px solid var(--border); }
  .ov-appr-table td { padding:8px 4px; text-align:center; border-top:1px solid var(--border); font-size:13px; }
  .ov-premium-gate { background:linear-gradient(135deg,#FFF8E6,#FFF3D4); border:2px solid var(--gold); border-radius:16px; padding:22px 20px; margin-bottom:14px; text-align:center; }
  .ov-ai-box { background:#F8F5EC; border:1.5px solid #E8D080; border-radius:14px; padding:16px; }
  .ov-ai-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:#9A7A20; margin-bottom:8px; }
  .ov-ai-text { font-size:13px; color:var(--text); line-height:1.75; white-space:pre-wrap; }
  .ov-ai-loading { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-dim); }
  .ov-ai-spinner { width:16px; height:16px; border:2px solid var(--border); border-top-color:var(--gold); border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }

  /* ── COURSE PICKER ── */
  .cp-course-row { display:flex; align-items:center; width:100%; background:white; border:1.5px solid var(--border); border-radius:14px; padding:0; margin-bottom:10px; overflow:hidden; transition:border-color .15s; }
  .cp-course-row:hover { border-color:var(--green-light); }
  .cp-course-row.highlighted { border-color:var(--gold); background:#FFFDF5; }
  .cp-course-tap { flex:1; padding:16px 18px; text-align:left; background:none; border:none; cursor:pointer; font-family:'Outfit',sans-serif; }
  .cp-course-name { font-weight:700; font-size:15px; color:var(--text); margin-bottom:3px; }
  .cp-course-meta { font-size:12px; color:var(--text-dim); }
  .cp-course-new-badge { display:inline-block; background:var(--green-mid); color:white; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; padding:2px 6px; border-radius:4px; margin-left:7px; vertical-align:middle; }
  .cp-course-home-badge { display:inline-block; background:var(--gold); color:var(--green-dark); font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; padding:2px 6px; border-radius:4px; margin-left:7px; vertical-align:middle; }
  .cp-icon-btn { background:none; border:none; cursor:pointer; padding:10px 12px; font-size:16px; color:var(--text-dim); transition:color .15s; flex-shrink:0; }
  .cp-icon-btn:hover { color:var(--text); }
  .cp-add-btn { width:100%; background:none; border:1.5px dashed var(--border); border-radius:14px; padding:15px; font-family:'Outfit',sans-serif; font-size:14px; font-weight:600; color:var(--text-dim); cursor:pointer; transition:all .15s; text-align:center; }
  .cp-add-btn:hover { border-color:var(--green-light); color:var(--green); }

  /* ── FLAG MODAL ── */
  .flag-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:300; display:flex; align-items:flex-end; justify-content:center; }
  .flag-sheet { background:white; border-radius:20px 20px 0 0; padding:24px 20px 40px; width:100%; max-width:480px; }
  .flag-sheet-title { font-family:'Playfair Display',serif; font-size:20px; color:var(--text); margin-bottom:4px; }
  .flag-sheet-sub { font-size:13px; color:var(--text-dim); margin-bottom:16px; line-height:1.5; }
  .flag-textarea { width:100%; background:var(--bg); border:1.5px solid var(--border); border-radius:11px; padding:12px 14px; font-family:'Outfit',sans-serif; font-size:14px; color:var(--text); resize:none; outline:none; line-height:1.6; margin-bottom:12px; }
  .flag-textarea:focus { border-color:var(--green); background:white; }
  .flag-submit-btn { width:100%; background:var(--green); border:none; border-radius:12px; padding:14px; font-family:'Outfit',sans-serif; font-size:15px; font-weight:700; color:white; cursor:pointer; margin-bottom:8px; transition:background .2s; }
  .flag-submit-btn:hover:not(:disabled) { background:var(--green-mid); }
  .flag-submit-btn:disabled { opacity:0.6; cursor:not-allowed; }
  .flag-cancel-btn { width:100%; background:none; border:1.5px solid var(--border); border-radius:12px; padding:12px; font-family:'Outfit',sans-serif; font-size:14px; font-weight:600; color:var(--text-mid); cursor:pointer; }
`;

// ── Known courses (loaded from DB at runtime) ──
const KNOWN_COURSES = [
  { id: "89e2ad4e-8d5a-4244-8568-b2c8a448a77f", name: "Greenock — Wee Course", holes: 9 },
  { id: "b1a2c3d4-e5f6-7890-abcd-ef1234567890", name: "Greenock — Big Course", holes: 18 },
];

// Fallback hole pars when course_holes table has no data for a course
const HOLE_PARS = {
  "89e2ad4e-8d5a-4244-8568-b2c8a448a77f": [4,4,3,4,3,4,4,3,3],
  "b1a2c3d4-e5f6-7890-abcd-ef1234567890": [4,4,3,4,5,4,3,4,4,3,4,4,3,4,4,3,4,4],
};

const APPROACH_BANDS = [
  { v:"Under 50", u:"yds" }, { v:"50-75", u:"yds" }, { v:"75-100", u:"yds" },
  { v:"100-125", u:"yds" }, { v:"125-150", u:"yds" }, { v:"150+", u:"yds" },
];
const PUTT_DIST  = [{v:"<3",u:"ft"},{v:"3",u:"ft"},{v:"4",u:"ft"},{v:"6",u:"ft"},{v:"9",u:"ft"},{v:"12",u:"ft"},{v:"15",u:"ft"},{v:"20",u:"ft"},{v:"25",u:"ft"},{v:"30+",u:"ft"}];
const PUTT2_DIST = [{v:"<1",u:"ft"},{v:"1",u:"ft"},{v:"2",u:"ft"},{v:"3",u:"ft"},{v:"4",u:"ft"},{v:"5",u:"ft"},{v:"6",u:"ft"},{v:"7+",u:"ft"}];
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
  return { score: par, putts: null, fairway: null, approach: null, shotsInside50: null, sgReason: null, putt1: null, putt2: null, putt3: null, penalty: "None", pickedUp: false, dna: false };
}
function holeFromRow(row) {
  return {
    score: row.score, putts: row.putts, fairway: row.fairway,
    approach: row.approach, shotsInside50: row.shots_inside_50,
    putt1: row.putt1, putt2: row.putt2, putt3: row.putt3 || null,
    penalty: row.penalty || "None", sgReason: row.sg_reason || null,
    pickedUp: row.picked_up || false, dna: row.dna || false,
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
function parseFt(v) {
  if (!v) return null;
  if (v === "<3") return 2.5;
  if (v === "<1") return 0.5;
  if (v.endsWith("+")) return parseFloat(v) + 2;
  return parseFloat(v);
}
const AI_SYSTEM_PROMPT = `You are an expert golf coach analyst. Before analysing any round data, apply the following interpretation rules:

APPROACH DISTANCES
- "Under 50 yards" means the approach was played from inside 50 yards. On a par 4 this typically means the player has already used 2+ shots, making GIR very unlikely. Do NOT explain this mechanic to the player — use it silently to interpret the data correctly.
- If a high proportion of approaches are from under 50 yards, this means the player is frequently missing greens from distance. The correct advice is twofold: (1) work on short game to improve scrambling from those positions, and (2) work on longer approach shots to hit more greens in regulation and reduce how often they end up inside 50 yards in a scrambling position. Never tell the player that GIR is "impossible" or "by definition" not achievable from under 50 yards — just give the actionable advice.
- Approach distances of 50-75, 75-100 yards etc. represent progressively longer shots. Lower GIR % from longer distances is expected and should be contextualised accordingly.
- There is an expected relationship between approach distance and first putt distance — closer approaches should result in shorter first putts. If a player hits approaches from under 75 yards but averages long first putts from those holes, their proximity to the pin needs work. Flag this pattern when it appears.

GIR (GREENS IN REGULATION)
- GIR is only possible when the player reaches the green in par minus 2 shots or fewer.
- For high handicap players, low GIR % is normal and expected. Do not treat 0% GIR as a crisis — frame it as an opportunity.
- Focus on whether GIR % is improving over time rather than the absolute value.

FAIRWAYS
- Fairway stats only apply to par 4s and par 5s. Par 3s have no fairway to hit.
- If there is a clear pattern of misses in a particular direction (predominantly left or predominantly right), flag this as something worth investigating with a coach. A consistent directional pattern suggests a swing issue rather than random variation. Do not dismiss directional miss patterns simply because course layout is unknown — the pattern itself is meaningful.
- For high handicap players, fairway % below 50% is common and should not be the primary focus unless significantly worse than their baseline.

PUTTING
- Average putts per hole must be contextualised against GIR. A player who rarely hits greens will face more long first putts, making a higher putt average expected.
- 3-putt rate is a more meaningful indicator of putting weakness than total putts.
- Average first putt distance is critical context — a player averaging 30+ foot first putts will naturally have more 3-putts than one averaging 10 foot first putts.
- A first putt under 10 feet resulting in a 3-putt is a significant issue. A first putt over 20 feet resulting in a 3-putt is much less concerning.
- Always analyse first putt distance in relation to approach distance. If approaches are from short range but first putts are long, proximity to the pin is the issue. If approaches are from long range but first putts are short, the player is handling genuine pressure well.

SCRAMBLING
- Scrambling measures whether the player saves par or better after missing a GIR, getting up and down from under 50 yards in 2 shots or fewer.
- Scrambling % below 30% is common for high handicap players — frame it as opportunity rather than failure.
- Good scrambling can significantly offset a poor GIR rate — acknowledge this when both stats appear in the same round.

STABLEFORD
- Stableford rewards consistency — double bogeys and worse are heavily penalised.
- For a high handicap player, a good Stableford score means avoiding blow-up holes more than making pars.
- Points per hole is a better trend indicator than total points when comparing 9 and 18 hole rounds.

HANDICAP CONTEXT
- Always interpret stats relative to the player's handicap. A 28 handicap player hitting 2/9 fairways and 0/9 GIR is performing within normal range.
- Focus on relative improvement and specific actionable areas rather than benchmarks designed for scratch players.
- Avoid comparisons to tour averages unless directly relevant.

TONE
- Always encouraging and constructive. Lead with a positive observation before identifying areas for improvement.
- Be specific — reference actual numbers from the round rather than making generic statements.
- Prioritise the 1-2 most impactful areas for improvement rather than listing every weakness.
- End with a forward-looking statement about what improvement in that area would look like.`;

async function callAI(prompt) {
  const r = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const d = await r.json();
  return d.content?.map(c => c.text || "").join("") || "Analysis unavailable.";
}

// ── TOP BAR ──
function TopBar({ onSignOut, rightBtn, onHome }) {
  return (
    <div className="mode-bar">
      <div className="mode-logo" style={{cursor: onHome ? "pointer" : "default"}} onClick={onHome}>Caddie</div>
      <div className="mode-bar-right">
        {rightBtn}
        <button className="bar-btn ghost" onClick={onSignOut}>Sign out</button>
      </div>
    </div>
  );
}

// ── OVERVIEW SCREEN ──
function OverviewScreen({ holeData, savedHoles, holes, courseName, handicap, onHandicapUpdate, onEditHole, onOpenSummary, onSignOut, sent, saving, onBackToDashboard, wind, conditions, temperature, isPremium }) {
  const [showHoles, setShowHoles] = useState(false);
  const [aiText, setAiText]       = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [hcpEditing, setHcpEditing] = useState(false);
  const [hcpInput, setHcpInput]     = useState("");

  const loggedHoles  = holes.filter(h => savedHoles.has(h.n));
  const attempted    = loggedHoles.filter(h => !holeData[holes.indexOf(h)].dna);
  const totalScore   = attempted.reduce((s, h) => s + (holeData[holes.indexOf(h)].score || 0), 0);
  const attemptedPar = attempted.reduce((s, h) => s + h.par, 0);
  const allLogged    = savedHoles.size === holes.length;
  const girCount     = attempted.filter(h => calcGIR(holeData[holes.indexOf(h)].score, holeData[holes.indexOf(h)].putts, h.par)).length;
  const fwHoles      = attempted.filter(h => h.par >= 4);
  const fwHit        = fwHoles.filter(h => holeData[holes.indexOf(h)].fairway === "yes").length;
  const totalPutts   = attempted.reduce((s, h) => s + (holeData[holes.indexOf(h)].putts || 0), 0);
  const avgPutts     = attempted.length ? (totalPutts / attempted.length).toFixed(1) : null;
  const tpCount      = attempted.filter(h => holeData[holes.indexOf(h)].putts >= 3).length;
  const penalties    = loggedHoles.filter(h => { const p = holeData[holes.indexOf(h)].penalty; return p && p !== "None"; }).length;
  const missedGIR    = attempted.filter(h => !calcGIR(holeData[holes.indexOf(h)].score, holeData[holes.indexOf(h)].putts, h.par) && !holeData[holes.indexOf(h)].pickedUp);
  const upAndDown    = missedGIR.filter(h => holeData[holes.indexOf(h)].putts <= 1 && holeData[holes.indexOf(h)].score !== null).length;
  const scramblePct  = missedGIR.length ? Math.round(upAndDown / missedGIR.length * 100) : null;
  const diff         = totalScore - attemptedPar;

  // Stableford (all tiers)
  const hcpVal      = parseInt(handicap, 10) || 0;
  const holesPlayed = attempted.length;
  let stablefordTotal = 0;
  for (const h of attempted) {
    const hd = holeData[holes.indexOf(h)];
    if (!hd.pickedUp && hd.score !== null && h.idx > 0) {
      let shots = 0;
      if (hcpVal >= h.idx)                shots = 1;
      if (hcpVal >= h.idx + holesPlayed)  shots = 2;
      if (hcpVal >= h.idx + holesPlayed * 2) shots = 3;
      stablefordTotal += Math.max(0, 2 + h.par - (hd.score - shots));
    }
    // pickedUp = 0 pts, already excluded by condition above
  }
  const stablefordPerHole = attempted.length ? (stablefordTotal / attempted.length).toFixed(1) : null;

  // Premium computed stats
  const girHoles      = attempted.filter(h => calcGIR(holeData[holes.indexOf(h)].score, holeData[holes.indexOf(h)].putts, h.par));
  const nonGirHoles   = attempted.filter(h => !calcGIR(holeData[holes.indexOf(h)].score, holeData[holes.indexOf(h)].putts, h.par) && !holeData[holes.indexOf(h)].pickedUp);
  const puttsPerGIR    = girHoles.length ? (girHoles.reduce((s, h) => s + (holeData[holes.indexOf(h)].putts || 0), 0) / girHoles.length).toFixed(2) : null;
  const puttsPerNonGIR = nonGirHoles.length ? (nonGirHoles.reduce((s, h) => s + (holeData[holes.indexOf(h)].putts || 0), 0) / nonGirHoles.length).toFixed(2) : null;
  const putt1Vals      = attempted.map(h => parseFt(holeData[holes.indexOf(h)].putt1)).filter(v => v !== null);
  const avgPutt1       = putt1Vals.length ? (putt1Vals.reduce((a, b) => a + b, 0) / putt1Vals.length).toFixed(1) : null;
  const tpPct          = attempted.length ? Math.round(tpCount / attempted.length * 100) : 0;

  const BAND_KEYS   = ["Under 50","50-75","75-100","100-125","125-150","150+"];
  const BAND_LABELS = {"Under 50":"Under 50","50-75":"50–75","75-100":"75–100","100-125":"100–125","125-150":"125–150","150+":"150+"};
  const bandData = BAND_KEYS.map(key => {
    const bh = attempted.filter(h => holeData[holes.indexOf(h)].approach === key);
    if (!bh.length) return null;
    const bGIR = bh.filter(h => calcGIR(holeData[holes.indexOf(h)].score, holeData[holes.indexOf(h)].putts, h.par));
    const bP1  = bh.map(h => parseFt(holeData[holes.indexOf(h)].putt1)).filter(v => v !== null);
    return {
      label:    BAND_LABELS[key],
      count:    bh.length,
      girPct:   Math.round(bGIR.length / bh.length * 100),
      avgPutts: (bh.reduce((s, h) => s + (holeData[holes.indexOf(h)].putts || 0), 0) / bh.length).toFixed(2),
      avgPutt1: bP1.length ? (bP1.reduce((a, b) => a + b, 0) / bP1.length).toFixed(1) : "—",
    };
  }).filter(Boolean);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isPremium || attempted.length < 3 || aiText !== null || aiLoading) return;
    setAiLoading(true);
    const girPct = attempted.length ? Math.round(girCount / attempted.length * 100) : 0;
    const fwPct  = fwHoles.length ? Math.round(fwHit / fwHoles.length * 100) : null;
    let prompt = `You are a golf coach reviewing a student's round. Write directly to the student in second person ("you", "your"). Be encouraging, specific, and constructive. 3–4 sentences, no preamble.\n\n`;
    prompt += `Course: ${courseName}\nScore: ${totalScore} (${diff >= 0 ? "+" : ""}${diff} vs par)\n`;
    prompt += `GIR: ${girCount}/${attempted.length} (${girPct}%)\n`;
    if (fwHoles.length) prompt += `Fairways: ${fwHit}/${fwHoles.length}${fwPct !== null ? ` (${fwPct}%)` : ""}\n`;
    prompt += `Total putts: ${totalPutts} (avg ${avgPutts}/hole)\n`;
    prompt += `3-putts: ${tpCount} (${tpPct}%)\n`;
    if (scramblePct !== null) prompt += `Scrambling: ${scramblePct}% (${upAndDown}/${missedGIR.length} up & down)\n`;
    prompt += `Penalties: ${penalties}\n`;
    if (avgPutt1) prompt += `Avg first putt: ${avgPutt1} ft\n`;
    if (puttsPerGIR) prompt += `Putts per GIR hole: ${puttsPerGIR}\n`;
    if (puttsPerNonGIR) prompt += `Putts per missed-GIR hole: ${puttsPerNonGIR}\n`;
    if (bandData.length) {
      prompt += `\nApproach breakdown:\n`;
      bandData.forEach(b => { prompt += `  ${b.label} yds: ${b.count} hole${b.count !== 1 ? "s" : ""}, ${b.girPct}% GIR, avg ${b.avgPutts} putts\n`; });
    }
    callAI(prompt)
      .then(t => { setAiText(t); setAiLoading(false); })
      .catch(() => { setAiText("Analysis unavailable."); setAiLoading(false); });
  }, [isPremium]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <style>{css}</style>
      <TopBar onSignOut={onSignOut} onHome={onBackToDashboard} rightBtn={
        <button className="bar-btn" onClick={onBackToDashboard}>← My rounds</button>
      } />
      <div className="ov-wrap">

        {/* Score header */}
        <div className="ov-summary-card">
          <div className="ov-summary-title">{courseName}</div>
          <div className="ov-summary-stats">
            <div className="ov-stat">
              <div className="ov-stat-val">{attempted.length > 0 ? totalScore : "—"}</div>
              <div className="ov-stat-lbl">{attempted.length > 0 ? `${diff > 0 ? "+" : ""}${diff} vs par` : "no holes yet"}</div>
            </div>
            {handicap !== "" && attempted.length > 0 && (
              <div className="ov-stat">
                <div className="ov-stat-val">{totalScore - parseInt(handicap, 10)}</div>
                <div className="ov-stat-lbl">net score</div>
              </div>
            )}
          </div>
          {/* Editable course handicap */}
          <div style={{marginTop:10,borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:10}}>
            {hcpEditing ? (
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input
                  type="number" min="0" max="54" value={hcpInput}
                  onChange={e => setHcpInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { onHandicapUpdate(hcpInput); setHcpEditing(false); }
                    if (e.key === "Escape") setHcpEditing(false);
                  }}
                  autoFocus
                  style={{width:60,padding:"4px 8px",borderRadius:7,border:"1px solid rgba(255,255,255,0.35)",background:"rgba(255,255,255,0.12)",color:"white",fontFamily:"'Outfit',sans-serif",fontSize:14,textAlign:"center",outline:"none"}}
                />
                <button
                  onClick={() => { onHandicapUpdate(hcpInput); setHcpEditing(false); }}
                  style={{background:"var(--gold)",border:"none",borderRadius:7,padding:"4px 12px",fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:700,color:"var(--green-dark)",cursor:"pointer"}}
                >Save</button>
                <button
                  onClick={() => setHcpEditing(false)}
                  style={{background:"none",border:"none",color:"rgba(255,255,255,0.45)",fontSize:16,cursor:"pointer",padding:"0 4px",lineHeight:1}}
                >✕</button>
              </div>
            ) : (
              <div
                onClick={() => { setHcpInput(handicap !== "" ? handicap : ""); setHcpEditing(true); }}
                style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,color:"rgba(255,255,255,0.5)",cursor:"pointer",userSelect:"none"}}
              >
                {handicap !== "" ? `Course hcp: ${parseInt(handicap, 10)}` : "Not set"}
                <span style={{fontSize:10,opacity:.7}}>✏️</span>
              </div>
            )}
          </div>
        </div>

        {/* Headline stats */}
        {attempted.length > 0 && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className={"stat-card-val " + (girCount/attempted.length > 0.55 ? "ok" : girCount/attempted.length > 0.33 ? "warn" : "bad")}>{girCount}/{attempted.length}</div>
              <div className="stat-card-lbl">GIR</div>
            </div>
            <div className="stat-card">
              <div className={"stat-card-val " + (fwHoles.length > 0 ? (fwHit/fwHoles.length > 0.6 ? "ok" : fwHit/fwHoles.length > 0.4 ? "warn" : "bad") : "")}>{fwHoles.length > 0 ? `${fwHit}/${fwHoles.length}` : "—"}</div>
              <div className="stat-card-lbl">Fairways</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-val">{totalPutts}</div>
              <div className="stat-card-lbl">Total putts</div>
              <div className="stat-card-sub">avg {avgPutts}/hole</div>
            </div>
            <div className="stat-card">
              <div className={"stat-card-val " + (tpCount === 0 ? "ok" : tpCount <= 1 ? "warn" : "bad")}>{tpCount}</div>
              <div className="stat-card-lbl">3-putts</div>
            </div>
            <div className="stat-card">
              <div className={"stat-card-val " + (scramblePct != null ? (scramblePct >= 50 ? "ok" : scramblePct >= 30 ? "warn" : "bad") : "")}>{scramblePct != null ? scramblePct + "%" : "—"}</div>
              <div className="stat-card-lbl">Scrambling</div>
              <div className="stat-card-sub">{upAndDown}/{missedGIR.length} up & down</div>
            </div>
            <div className="stat-card">
              <div className={"stat-card-val " + (penalties === 0 ? "ok" : penalties <= 1 ? "warn" : "bad")}>{penalties}</div>
              <div className="stat-card-lbl">Penalties</div>
            </div>
            {handicap !== "" ? (
              <>
                <div className="stat-card">
                  <div className="stat-card-val" style={{color:"var(--gold)"}}>{stablefordTotal}</div>
                  <div className="stat-card-lbl">Stableford</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-val" style={{color:"var(--gold)"}}>{stablefordPerHole ?? "—"}</div>
                  <div className="stat-card-lbl">Per hole</div>
                  {stablefordPerHole && <div className="stat-card-sub">pts/hole</div>}
                </div>
              </>
            ) : (
              <>
                <div className="stat-card">
                  <div className="stat-card-val" style={{color:"var(--text-dim)"}}>—</div>
                  <div className="stat-card-lbl">Stableford</div>
                  <div className="stat-card-sub">set hcp below</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-val" style={{color:"var(--text-dim)"}}>—</div>
                  <div className="stat-card-lbl">Per hole</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Scorecard */}
        {attempted.length > 0 && (
          <div className="ov-card">
            <div className="ov-card-title">Scorecard</div>
            <table className="ov-sc-table">
              <thead>
                <tr><th>Hole</th><th>Par</th><th>Score</th><th>Putts</th><th>GIR</th><th>FW</th></tr>
              </thead>
              <tbody>
                {holes.map((hole, i) => {
                  const hd = holeData[i];
                  if (!savedHoles.has(hole.n)) return null;
                  const gir = calcGIR(hd.score, hd.putts, hole.par);
                  const sLbl = hd.dna || hd.pickedUp ? "" : scoreLabel(hd.score, hole.par);
                  return (
                    <tr key={hole.n} onClick={() => onEditHole(i)}>
                      <td style={{fontWeight:700}}>{hole.n}</td>
                      <td style={{color:"var(--text-dim)"}}>{hole.par}</td>
                      <td>
                        {hd.dna ? <span style={{color:"#999",fontSize:11}}>DNA</span>
                          : hd.pickedUp ? <span style={{color:"var(--orange)",fontSize:11}}>PU</span>
                          : <span className={"ov-sn-" + sLbl}>{hd.score}</span>}
                      </td>
                      <td>{hd.dna || hd.pickedUp ? "—" : hd.putts}</td>
                      <td>
                        {hd.dna || hd.pickedUp ? "—"
                          : gir ? <span style={{color:"var(--green-mid)",fontWeight:700}}>✓</span>
                          : <span style={{color:"var(--text-dim)"}}>✗</span>}
                      </td>
                      <td style={{fontSize:11}}>
                        {hole.par < 4 ? "—"
                          : hd.fairway === "yes" ? <span style={{color:"var(--green-mid)"}}>Hit</span>
                          : hd.fairway === "left" ? <span style={{color:"var(--sky)"}}>L</span>
                          : hd.fairway === "right" ? <span style={{color:"var(--orange)"}}>R</span>
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* View / edit holes */}
        <button className="edit-holes-btn" onClick={() => setShowHoles(s => !s)}>
          <span>🏌️ {showHoles ? "Hide holes" : "View / edit holes"}</span>
          <span style={{fontSize:16}}>{showHoles ? "▲" : "▼"}</span>
        </button>

        {showHoles && <div style={{marginBottom:0}}>
          <div className="ov-section-label" style={{marginTop:4,marginBottom:10}}>Tap any hole to log or edit</div>
          {holes.map((hole, i) => {
            const hd = holeData[i];
            const logged = savedHoles.has(hole.n);
            const gir = calcGIR(hd.score, hd.putts, hole.par);
            const holeDiff = diffLabel(hd.score, hole.par);
            const sLabel = scoreLabel(hd.score, hole.par);
            const is3putt = hd.putts >= 3;
            return (
              <div
                key={hole.n}
                className={"ov-hole-card" + (!logged ? " not-logged" : "")}
                style={{cursor:"pointer"}}
                onClick={() => onEditHole(i)}
              >
                <div className={"ov-hole-num" + (is3putt && logged ? " tp" : !logged ? " unlogged" : "")}>{hole.n}</div>
                <div className="ov-hole-details">
                  <div className="ov-hole-top">
                    <span className="ov-hole-name">Hole {hole.n}</span>
                    <span className="ov-hole-par-badge">Par {hole.par} · {hole.yds}y</span>
                  </div>
                  {logged ? (
                    <div className="ov-hole-chips">
                      {hd.dna
                        ? <span className="chip" style={{background:"#F0F0F0",color:"#555"}}>Did not play</span>
                        : hd.pickedUp
                          ? <span className="chip" style={{background:"#FEF3E8",color:"var(--orange)"}}>Picked up</span>
                          : <>
                              {gir ? <span className="chip gir-yes">GIR</span> : <span className="chip gir-no">Missed GIR</span>}
                              {hole.par >= 4 && hd.fairway === "yes" && <span className="chip fw-yes">FW hit</span>}
                              {hole.par >= 4 && hd.fairway === "left" && <span className="chip fw-miss">Miss left</span>}
                              {hole.par >= 4 && hd.fairway === "right" && <span className="chip fw-miss-r">Miss right</span>}
                              {is3putt
                                ? <span className="chip tp">3-putt</span>
                                : <span className="chip putts">{hd.putts === 0 ? "Chip-in" : hd.putts + " putt" + (hd.putts !== 1 ? "s" : "")}</span>}
                              {hd.penalty && hd.penalty !== "None" && <span className="chip pen">{hd.penalty}</span>}
                            </>
                      }
                    </div>
                  ) : (
                    <div style={{fontSize:11,color:"var(--text-dim)"}}>Not logged yet</div>
                  )}
                </div>
                {logged ? (
                  <div style={{textAlign:"right"}}>
                    {hd.dna || hd.pickedUp
                      ? <div className="ov-score-num" style={{fontSize:18,color:"#999"}}>—</div>
                      : <>
                          <div className={"ov-score-num " + sLabel}>{hd.score}</div>
                          <div className={"ov-score-diff " + holeDiff.cls}>{holeDiff.text}</div>
                        </>
                    }
                  </div>
                ) : (
                  <div className="ov-score-num par" style={{color:"var(--border)"}}>-</div>
                )}
              </div>
            );
          })}
        </div>}

        {/* Premium: approach & putting breakdown */}
        {isPremium && attempted.length > 0 && bandData.length > 0 && (
          <div className="ov-card">
            <div className="ov-card-title">Approach & putting breakdown</div>
            <table className="ov-appr-table">
              <thead>
                <tr>
                  <th style={{textAlign:"left"}}>Distance</th>
                  <th>Holes</th>
                  <th>GIR%</th>
                  <th>Avg putts</th>
                  <th>Avg 1st</th>
                </tr>
              </thead>
              <tbody>
                {bandData.map(b => (
                  <tr key={b.label}>
                    <td style={{textAlign:"left",fontWeight:600,fontSize:12}}>{b.label}</td>
                    <td>{b.count}</td>
                    <td>{b.girPct}%</td>
                    <td>{b.avgPutts}</td>
                    <td>{b.avgPutt1 !== "—" ? b.avgPutt1 + " ft" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Premium: short game & putting + AI */}
        {isPremium && attempted.length > 0 && (
          <div className="ov-card">
            <div className="ov-card-title">Short game & putting</div>
            <div className="stats-grid" style={{marginBottom:0}}>
              <div className="stat-card">
                <div className="stat-card-val">{puttsPerGIR ?? "—"}</div>
                <div className="stat-card-lbl">Putts / GIR</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-val">{puttsPerNonGIR ?? "—"}</div>
                <div className="stat-card-lbl">Putts / non-GIR</div>
              </div>
              <div className="stat-card">
                <div className={"stat-card-val " + (scramblePct != null ? (scramblePct >= 50 ? "ok" : scramblePct >= 30 ? "warn" : "bad") : "")}>{scramblePct != null ? scramblePct + "%" : "—"}</div>
                <div className="stat-card-lbl">Up & down %</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-val">{avgPutt1 ? avgPutt1 + " ft" : "—"}</div>
                <div className="stat-card-lbl">Avg 1st putt</div>
              </div>
              <div className="stat-card">
                <div className={"stat-card-val " + (tpPct === 0 ? "ok" : tpPct <= 10 ? "warn" : "bad")}>{tpPct}%</div>
                <div className="stat-card-lbl">3-putt %</div>
              </div>
            </div>
            <div className="ov-ai-box" style={{marginTop:14}}>
              <div className="ov-ai-label">AI Analysis</div>
              {aiLoading
                ? <div className="ov-ai-loading"><div className="ov-ai-spinner" /><span>Analysing your round…</span></div>
                : <div className="ov-ai-text">{aiText || (attempted.length < 3 ? "Log at least 3 holes for AI analysis." : "—")}</div>
              }
            </div>
          </div>
        )}

        {/* Free tier: premium gate */}
        {!isPremium && (
          <div className="ov-premium-gate">
            <div style={{fontSize:24,marginBottom:10}}>📊</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:"var(--text)",marginBottom:6}}>Detailed analysis</div>
            <div style={{fontSize:13,color:"var(--text-mid)",lineHeight:1.6,marginBottom:16}}>
              Approach breakdowns, putting stats, and AI-powered round analysis are available on Premium.
            </div>
            <div style={{
              display:"inline-block",background:"var(--gold)",color:"var(--green-dark)",
              fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:700,
              padding:"9px 20px",borderRadius:10,letterSpacing:".02em",
            }}>Upgrade to Premium</div>
          </div>
        )}

        {!allLogged && savedHoles.size > 0 && (
          <button className="ov-finish-btn" style={{background:"white",color:"var(--green)",border:"1.5px solid var(--green)"}} onClick={() => onEditHole(savedHoles.size)}>
            Continue from Hole {savedHoles.size + 1}
          </button>
        )}
        {savedHoles.size === 0 && (
          <button className="ov-finish-btn" onClick={() => onEditHole(0)}>
            Start logging
          </button>
        )}

        <button
          onClick={onOpenSummary}
          style={{
            width:"100%", background:"white", border:"1.5px solid var(--border)",
            borderRadius:13, padding:"12px 16px", marginBottom:10,
            fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600,
            color:"var(--text-mid)", cursor:"pointer", textAlign:"left",
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}
        >
          <span>🌤 Conditions & notes</span>
          <span style={{fontSize:12,color:"var(--text-dim)"}}>
            {[wind, conditions, temperature].filter(Boolean).join(" · ") || "Not set"}
          </span>
        </button>

        {savedHoles.size > 0 && (
          <button
            className="ov-finish-btn"
            style={allLogged ? {} : {background:"white",color:"var(--green)",border:"1.5px solid var(--green)"}}
            onClick={onOpenSummary}
            disabled={saving}
          >
            {saving ? "Sending..." : sent ? "Resend to coach" : allLogged ? "Send to coach" : `Finish & send (${savedHoles.size} holes)`}
          </button>
        )}

        <button className="back-to-dash-btn" style={{marginTop:10,width:"100%"}} onClick={onBackToDashboard}>
          Back to my rounds
        </button>

      </div>
    </>
  );
}

export default function StudentLogging({ user, onSignOut, onBackToDashboard, existingRound, onAddCourse, onEditCourse, pendingCourseId, onClearPendingCourse }) {
  const isEditMode = !!existingRound;

  const [cur, setCur]               = useState(0);
  const [holes, setHoles]           = useState([]);
  const [holeData, setHoleData]     = useState([]);
  const [courseId, setCourseId]     = useState(null);
  const [handicap, setHandicap]       = useState("");
  const [courseName, setCourseName] = useState("");
  const [roundId, setRoundId]       = useState(null);
  const [puttMode, setPuttMode]   = useState("standard");
  const [isPremium, setIsPremium] = useState(false);
  // view: "course_picker" | "overview" | "logging" | "summary" | "sent" | "complete"
  const [view, setView]             = useState(isEditMode ? "overview" : "course_picker");
  const [saving, setSaving]         = useState(false);
  const [wind, setWind]               = useState(null);
  const [conditions, setConditions]   = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [studentNote, setStudentNote] = useState("");
  const [sent, setSent]             = useState(false);
  const [savedHoles, setSavedHoles] = useState(new Set());
  const [loading, setLoading]       = useState(isEditMode);

  const [officialHandicap, setOfficialHandicap] = useState(null);

  // Multi-course state
  const [courses, setCourses]             = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(!isEditMode);
  const [highlightedCourseId, setHighlightedCourseId] = useState(null);
  const [homeCourseIds, setHomeCourseIds] = useState(new Set());
  const [courseStats, setCourseStats]     = useState({}); // courseId -> {totalPar, totalYardage, hasYardage}
  const [flagging, setFlagging]           = useState(null); // null or {id, name}
  const [flagNote, setFlagNote]           = useState("");
  const [flagSaving, setFlagSaving]       = useState(false);

  // Load holes for a chosen course
  async function loadCourse(courseIdArg) {
    const { data } = await supabase
      .from("course_holes")
      .select("*")
      .eq("course_id", courseIdArg)
      .order("hole_number", { ascending: true });
    let mapped;
    if (data && data.length > 0) {
      mapped = data.map(h => ({ n: h.hole_number, par: h.par, yds: h.yardage || 0, idx: h.stroke_index || 0 }));
    } else {
      const pars = HOLE_PARS[courseIdArg] || [];
      mapped = pars.map((par, i) => ({ n: i + 1, par, yds: 0, idx: i + 1 }));
    }
    setHoles(mapped);
    setHoleData(mapped.map(h => emptyHole(h.par)));
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
      const { data: courseRow } = await supabase.from("courses").select("name").eq("id", cId).single();
      const cName = courseRow?.name || KNOWN_COURSES.find(c => c.id === cId)?.name || "Golf Course";
      setCourseId(cId);
      setCourseName(cName);
      const { data: holeRows } = await supabase
        .from("course_holes").select("*")
        .eq("course_id", cId)
        .order("hole_number", { ascending: true });
      let mapped = (holeRows || []).map(h => ({ n: h.hole_number, par: h.par, yds: h.yardage || h.yards || 0, idx: h.stroke_index || 0 }));
      if (mapped.length === 0) {
        const pars = HOLE_PARS[cId] || [];
        mapped = pars.map((par, i) => ({ n: i + 1, par, yds: 0, idx: i + 1 }));
      }
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
      setHandicap(existingRound.handicap ?? "");
      setWind(existingRound.wind || null);
      setConditions(existingRound.conditions || null);
      setTemperature(existingRound.temperature || null);
      setStudentNote(existingRound.student_note || "");
      setLoading(false);
    }
    loadExisting();
  }, [existingRound]);

  // Fetch student settings (non-blocking — defaults to standard if not yet loaded)
  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from("profiles")
        .select("settings, is_premium, official_handicap")
        .eq("id", user.id)
        .single();
      setIsPremium(!!data?.is_premium);
      setPuttMode(data?.settings?.putt_tracking || "standard");
      if (data?.official_handicap != null) setOfficialHandicap(data.official_handicap);
    }
    fetchSettings();
  }, [user.id]);

  // Load course list from DB (only for new rounds)
  useEffect(() => {
    if (isEditMode) return;
    async function loadCourses() {
      const [{ data: coursesData }, { data: profileData }] = await Promise.all([
        supabase.from("courses").select("id, name, hole_count, created_by").order("name", { ascending: true }),
        supabase.from("profiles").select("home_courses").eq("id", user.id).single(),
      ]);
      const allCourses = coursesData || [];
      const userHomeCourses = profileData?.home_courses || [];

      // Fetch par + yardage totals for all courses in one query
      const stats = {};
      if (allCourses.length > 0) {
        const { data: holesData } = await supabase
          .from("course_holes")
          .select("course_id, par, yardage")
          .in("course_id", allCourses.map(c => c.id));
        if (holesData) {
          for (const h of holesData) {
            if (!stats[h.course_id]) stats[h.course_id] = { totalPar: 0, totalYardage: 0, hasYardage: false };
            stats[h.course_id].totalPar += h.par || 0;
            if (h.yardage) { stats[h.course_id].totalYardage += h.yardage; stats[h.course_id].hasYardage = true; }
          }
        }
      }

      // Determine home course IDs (match by name, case-insensitive)
      const homeIdSet = new Set();
      const homeOrder = {};
      allCourses.forEach(c => {
        const idx = userHomeCourses.findIndex(n => n && n.toLowerCase().trim() === c.name.toLowerCase().trim());
        if (idx !== -1) { homeIdSet.add(c.id); homeOrder[c.id] = idx; }
      });

      // Sort: home courses first (in profile order), then remainder alphabetically
      const sorted = [...allCourses].sort((a, b) => {
        const aH = homeIdSet.has(a.id), bH = homeIdSet.has(b.id);
        if (aH && bH) return homeOrder[a.id] - homeOrder[b.id];
        if (aH) return -1;
        if (bH) return 1;
        return a.name.localeCompare(b.name);
      });

      setCourses(sorted);
      setCourseStats(stats);
      setHomeCourseIds(homeIdSet);
      setCoursesLoading(false);
      // Highlight newly added course if pendingCourseId was passed in
      if (pendingCourseId) {
        setHighlightedCourseId(pendingCourseId);
        if (onClearPendingCourse) onClearPendingCourse();
      }
    }
    loadCourses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Course picker screen — must be before all other guards ──
  if (view === "course_picker") {
    async function handleFlag() {
      if (!flagging || !flagNote.trim()) return;
      setFlagSaving(true);
      await supabase.from("course_flags").insert({
        course_id: flagging.id,
        flagged_by: user.id,
        note: flagNote.trim(),
        resolved: false,
      });
      setFlagSaving(false);
      setFlagging(null);
      setFlagNote("");
    }

    const courseList = courses.length > 0
      ? courses
      : KNOWN_COURSES.map(c => ({ id: c.id, name: c.name, hole_count: c.holes, created_by: null }));

    return (
      <>
        <style>{css}</style>
        <TopBar onSignOut={onSignOut} rightBtn={
          <button className="bar-btn" onClick={onBackToDashboard}>← My rounds</button>
        } />
        <div className="log-wrap" style={{paddingTop:32}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:6}}>
            Where are you playing?
          </div>
          <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:24}}>
            Select a course to start logging your round.
          </div>

          {coursesLoading ? (
            <div style={{display:"flex",justifyContent:"center",padding:"32px 0"}}>
              <div className="big-spinner" />
            </div>
          ) : (
            <>
              {courseList.map(course => (
                <div
                  key={course.id}
                  className={"cp-course-row" + (highlightedCourseId === course.id ? " highlighted" : "")}
                >
                  <button
                    className="cp-course-tap"
                    onClick={() => handleCourseSelect({ id: course.id, name: course.name, holes: course.hole_count })}
                  >
                    <div className="cp-course-name">
                      {course.name}
                      {homeCourseIds.has(course.id) && (
                        <span className="cp-course-home-badge">Home</span>
                      )}
                      {highlightedCourseId === course.id && !homeCourseIds.has(course.id) && (
                        <span className="cp-course-new-badge">New</span>
                      )}
                    </div>
                    <div className="cp-course-meta">
                      {course.hole_count} holes
                      {courseStats[course.id] && ` · Par ${courseStats[course.id].totalPar}`}
                      {courseStats[course.id]?.hasYardage && ` · ${courseStats[course.id].totalYardage.toLocaleString()} yds`}
                    </div>
                  </button>
                  <button
                    className="cp-icon-btn"
                    title="Flag an issue with this course"
                    onClick={() => { setFlagging({ id: course.id, name: course.name }); setFlagNote(""); }}
                  >🚩</button>
                  {course.created_by === user.id && onEditCourse && (
                    <button
                      className="cp-icon-btn"
                      title="Edit this course"
                      onClick={() => onEditCourse(course.id)}
                    >✏️</button>
                  )}
                </div>
              ))}
              {onAddCourse && (
                <button className="cp-add-btn" onClick={onAddCourse}>
                  + Add new course
                </button>
              )}
            </>
          )}

          <div style={{marginTop:20}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:"var(--text-dim)",marginBottom:7}}>
              Course handicap <span style={{fontWeight:400}}>(optional)</span>
            </div>
            <input
              type="number"
              min="0"
              max="54"
              placeholder="e.g. 28"
              value={handicap}
              onChange={e => setHandicap(e.target.value)}
              style={{
                width:"100%", background:"var(--bg)", border:"1.5px solid var(--border)",
                borderRadius:11, padding:"12px 14px", fontFamily:"'Outfit',sans-serif",
                fontSize:15, color:"var(--text)", outline:"none",
              }}
            />
          </div>
          <button className="back-to-dash-btn" style={{marginTop:8}} onClick={onBackToDashboard}>
            Back to my rounds
          </button>
        </div>

        {/* Flag modal */}
        {flagging && (
          <div className="flag-backdrop" onClick={() => setFlagging(null)}>
            <div className="flag-sheet" onClick={e => e.stopPropagation()}>
              <div className="flag-sheet-title">Flag {flagging.name}</div>
              <div className="flag-sheet-sub">
                Describe the issue — e.g. wrong par, incorrect stroke index, or outdated yardage. An admin will review it.
              </div>
              <textarea
                className="flag-textarea"
                rows={4}
                placeholder="Describe the issue…"
                value={flagNote}
                onChange={e => setFlagNote(e.target.value)}
                autoFocus
              />
              <button
                className="flag-submit-btn"
                disabled={flagSaving || !flagNote.trim()}
                onClick={handleFlag}
              >
                {flagSaving ? "Sending…" : "Submit flag"}
              </button>
              <button className="flag-cancel-btn" onClick={() => setFlagging(null)}>Cancel</button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Summary screen ──
  if (view === "summary") {
    const netScore = handicap !== "" && holeData.reduce((s,h) => s+(h.score||0),0)
      ? holeData.reduce((s,h) => s+(h.score||0),0) - parseInt(handicap)
      : null;
    const totalScore = holeData.reduce((s,h) => s+(h.score||0),0);
    const totalPar   = holes.reduce((s,h) => s+h.par,0);
    const diff       = totalScore - totalPar;
    return (
      <>
        <style>{css}</style>
        <TopBar onSignOut={onSignOut} onHome={onBackToDashboard} rightBtn={
          <button className="bar-btn" onClick={() => setView("overview")}>← Overview</button>
        } />
        <div className="sum-wrap">
          <div className="sum-title">Round summary</div>
          <div className="sum-sub">
            {courseName} · {totalScore} ({diff >= 0 ? "+" : ""}{diff} vs par)
            {netScore != null ? ` · Net ${netScore}` : ""}
          </div>

          <div className="sum-sec">
            <div className="sum-sec-label">Wind</div>
            <div className="sum-chips">
              {["Calm","Breezy","Windy","Very windy"].map(w => (
                <button key={w} className={"sum-chip" + (wind === w ? " sel" : "")} onClick={() => setWind(w === wind ? null : w)}>{w}</button>
              ))}
            </div>
          </div>

          <div className="sum-sec">
            <div className="sum-sec-label">Conditions</div>
            <div className="sum-chips">
              {["Dry","Soft","Wet"].map(c => (
                <button key={c} className={"sum-chip" + (conditions === c ? " sel" : "")} onClick={() => setConditions(c === conditions ? null : c)}>{c}</button>
              ))}
            </div>
          </div>

          <div className="sum-sec">
            <div className="sum-sec-label">Temperature</div>
            <div className="sum-chips">
              {["Cold","Mild","Warm"].map(t => (
                <button key={t} className={"sum-chip" + (temperature === t ? " sel" : "")} onClick={() => setTemperature(t === temperature ? null : t)}>{t}</button>
              ))}
            </div>
          </div>

          <div className="sum-sec">
            <div className="sum-sec-label">Notes <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></div>
            <textarea
              className="sum-note"
              rows={4}
              placeholder="How did the round feel? Anything specific to mention to your coach..."
              value={studentNote}
              onChange={e => setStudentNote(e.target.value)}
            />
          </div>

          <button className="next-btn" onClick={async () => {
            if (roundId) {
              setSaving(true);
              await supabase.from("rounds").update({
                wind, conditions, temperature,
                student_note: studentNote || null,
                handicap: handicap !== "" ? parseInt(handicap) : null,
              }).eq("id", roundId);
              setSaving(false);
            }
            await sendToCoach();
          }} disabled={saving}>
            {saving ? <div className="spinner" /> : <>{sent ? "Resend to coach" : "Send to coach"} <span>→</span></>}
          </button>
          <button className="back-to-dash-btn" style={{marginTop:10,width:"100%"}} onClick={() => setView("overview")}>
            Skip — back to overview
          </button>
        </div>
      </>
    );
  }

  // ── Sent confirmation screen ──
  if (view === "sent") {
    const totalScore = holeData.reduce((s, hd) => s + (hd.score || 0), 0);
    const attemptedH = holes.filter((h,i) => !holeData[i]?.dna);
    const aPar = attemptedH.reduce((s,h) => s + h.par, 0);
    const diff = totalScore - aPar;
    return (
      <>
        <style>{css}</style>
        <TopBar onSignOut={onSignOut} onHome={onBackToDashboard} rightBtn={null} />
        <div className="log-wrap" style={{paddingTop:48,textAlign:"center"}}>
          <div style={{fontSize:56,marginBottom:16}}>⛳</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:8}}>
            Round sent!
          </div>
          <div style={{fontSize:15,color:"var(--text-mid)",marginBottom:4}}>
            {totalScore} ({diff >= 0 ? "+" : ""}{diff} vs par)
          </div>
          {handicap !== "" && (
            <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:24}}>
              Net {totalScore - parseInt(handicap)} · Hcp {handicap}
            </div>
          )}
          {!handicap && <div style={{marginBottom:24}} />}
          <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:32,lineHeight:1.6}}>
            Your coach will be able to review your round<br />before your next lesson.
          </div>
          <button className="next-btn" onClick={onBackToDashboard}>
            Back to my rounds →
          </button>
        </div>
      </>
    );
  }

  // Guard against holes not yet loaded
  if (!holes.length || !holeData.length) {
    return (
      <>
        <style>{css}</style>
        <TopBar onSignOut={onSignOut} rightBtn={
          <button className="bar-btn" onClick={onBackToDashboard}>← My rounds</button>
        } />
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
    if (d.pickedUp || d.dna) return true;
    if (d.score === null || d.putts === null) return false;
    if (h.par >= 4 && !d.fairway) return false;
    const par3GIR = h.par === 3 && gir === true;
    if (d.putts !== 0 && !par3GIR && !d.approach) return false;
    if (d.putts > 0 && !d.putt1) return false;
    if (puttMode === "full") {
      if (d.putts >= 2 && !d.putt2) return false;
      if (d.putts >= 3 && !d.putt3) return false;
    } else if (puttMode === "standard") {
      if (d.putts >= 3 && !d.putt2) return false;
    }
    // first_only: never require putt2 or putt3
    return true;
  }

  async function upsertHole(rid, idx) {
    const hole = holeData[idx];
    const hi   = holes[idx];
    const payload = {
      round_id: rid, hole_number: hi.n, par: hi.par, stroke_index: hi.idx || null,
      score: hole.dna ? null : hole.pickedUp ? null : hole.score,
      putts: hole.dna ? null : hole.pickedUp ? null : hole.putts,
      gir: hole.dna || hole.pickedUp ? false : calcGIR(hole.score, hole.putts, hi.par),
      fairway: hole.dna || hole.pickedUp ? null : hole.fairway,
      approach: hole.dna || hole.pickedUp ? null : hole.approach,
      shots_inside_50: hole.dna || hole.pickedUp ? null : hole.shotsInside50,
      putt1: hole.dna || hole.pickedUp ? null : hole.putt1,
      putt2: hole.dna || hole.pickedUp ? null : hole.putt2,
      putt3: hole.dna || hole.pickedUp ? null : hole.putt3 || null,
      penalty: hole.dna || hole.pickedUp ? "None" : hole.penalty || "None",
      sg_reason: hole.dna || hole.pickedUp ? null : hole.sgReason || null,
      picked_up: hole.pickedUp || false,
      dna: hole.dna || false,
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
      // Use entered handicap; if none, default based on course length
      const is9Hole = holes.length <= 9;
      const hcpToUse = handicap !== "" ? parseInt(handicap, 10)
        : (officialHandicap != null
            ? (is9Hole ? Math.ceil(officialHandicap / 2) : Math.ceil(officialHandicap))
            : null);
      if (handicap === "" && hcpToUse != null) setHandicap(String(hcpToUse));
      const { data: row, error } = await supabase
        .from("rounds").insert([{ student_id: user.id, course_id: courseId, holes_played: holes.length, handicap: hcpToUse, whs_index: officialHandicap != null ? officialHandicap : null }])
        .select().single();
      if (error) { console.error(error.message); setSaving(false); return; }
      rid = row.id;
      setRoundId(rid);
    }
    await upsertHole(rid, cur);
    setSaving(false);

    // After saving: advance to next hole in both new and edit mode
    if (cur < holes.length - 1) {
      setCur(c => c + 1);
      window.scrollTo(0, 0);
    } else {
      // Last hole — update totals and go to overview
      const totalScore = holeData.reduce((s, hd) => s + (hd.score || 0), 0);
      const totalPutts = holeData.reduce((s, hd) => s + (hd.putts || 0), 0);
      await supabase.from("rounds").update({ total_score: totalScore, total_putts: totalPutts }).eq("id", rid);
      setView("overview");
    }
  }

  function editHole(idx) {
    setCur(idx);
    setView("logging");
    window.scrollTo(0, 0);
  }

  async function handleHandicapUpdate(val) {
    const parsed = parseInt(val, 10);
    const newHcp = isNaN(parsed) ? "" : String(parsed);
    setHandicap(newHcp);
    if (roundId && newHcp !== "") {
      await supabase.from("rounds").update({ handicap: parsed }).eq("id", roundId);
    }
  }

  function goBackInLogging() {
    if (cur > 0) {
      setCur(c => c - 1);
      window.scrollTo(0, 0);
    } else {
      setView("overview");
    }
  }

  async function sendToCoach() {
    if (!roundId) return;
    setSaving(true);
    const totalScore = holeData.reduce((s, hd) => s + (hd.score || 0), 0);
    const totalPutts = holeData.reduce((s, hd) => s + (hd.putts || 0), 0);
    await supabase.from("rounds").update({
      sent_to_coach: true,
      sent_at: new Date().toISOString(),
      total_score: totalScore,
      total_putts: totalPutts,
      handicap: handicap !== "" ? parseInt(handicap) : null,
      wind, conditions, temperature,
      student_note: studentNote || null,
    }).eq("id", roundId);
    setSaving(false);
    setSent(true);
    setView("sent");
  }

  function scoreClass() {
    const diff = d.score - h.par;
    return "step-val " + (diff < 0 ? "under" : diff === 0 ? "par" : "over");
  }

  // ── Loading state ──
  if (loading) {
    return (
      <>
        <style>{css}</style>
        <TopBar onSignOut={onSignOut} rightBtn={
          <button className="bar-btn" onClick={onBackToDashboard}>← My rounds</button>
        } />
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
        onEditHole={editHole}
        handicap={handicap}
        onHandicapUpdate={handleHandicapUpdate}
        onOpenSummary={() => { setView("summary"); window.scrollTo(0,0); }}
        onSignOut={onSignOut}
        sent={sent}
        saving={saving}
        onBackToDashboard={onBackToDashboard}
        wind={wind}
        conditions={conditions}
        temperature={temperature}
        isPremium={isPremium}
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
            {handicap !== "" && (
              <div style={{fontSize:14,color:"rgba(255,255,255,0.5)",marginTop:4}}>
                Net {totalScore - parseInt(handicap)} · Hcp {handicap}
              </div>
            )}
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
  const nextLabel = cur === holes.length - 1 ? (isEditMode ? "Save & finish" : "Complete round") : (isEditMode ? "Save & next" : "Next hole");

  return (
    <>
      <style>{css}</style>
      <TopBar onSignOut={onSignOut} rightBtn={
        <div style={{display:"flex",gap:6}}>
          {savedHoles.size > 0 && (
            <button className="finish-early-btn" onClick={() => { setView("summary"); window.scrollTo(0,0); }}>Finish early</button>
          )}
          <button className="bar-btn" onClick={() => setView("overview")}>View round</button>
        </div>
      } />

      <div className="log-wrap">
        <div className="hole-dots">
          {holes.map((hole, i) => {
            const isLogged = savedHoles.has(hole.n) && i !== cur;
            let cls = "hd";
            if (isLogged) {
              const hd = holeData[i];
              if (hd.dna) cls += " dna";
              else if (hd.pickedUp) cls += " pu";
              else {
                const diff = (hd.score || 0) - hole.par;
                if (diff <= -2) cls += " eagle";
                else if (diff === -1) cls += " birdie";
                else if (diff === 0) cls += " par";
                else if (diff === 1) cls += " bogey";
                else if (diff === 2) cls += " double";
                else cls += " worse";
              }
            }
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

          </div>
        </div>



        <div className="puck-row">
          <button
            className={"puck-btn " + (d.pickedUp ? "sel-pu" : "")}
            onClick={() => update({ pickedUp: !d.pickedUp, dna: false })}
          >
            🏳️ Picked up
          </button>
          <button
            className={"puck-btn " + (d.dna ? "sel-dna" : "")}
            onClick={() => update({ dna: !d.dna, pickedUp: false })}
          >
            ⏭️ Did not play
          </button>
        </div>

        {!d.pickedUp && !d.dna && <div className="score-putts-row">
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
                  onClick={() => update({
                    putts: p.n,
                    putt1: p.n < 1 ? null : d.putt1,
                    putt2: puttMode === "full" ? (p.n < 2 ? null : d.putt2) : puttMode === "first_only" ? null : (p.n < 3 ? null : d.putt2),
                    putt3: puttMode === "full" && p.n >= 3 ? d.putt3 : null,
                  })}
                >
                  <span className="pv">{p.n === 3 ? "3+" : p.n}</span>
                  <span className="pu">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>}

        {!d.pickedUp && !d.dna && <div className="divider" />}

        {!d.pickedUp && !d.dna && showFW && (
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

        {!d.pickedUp && !d.dna && showAppr && (
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

        {!d.pickedUp && !d.dna && showSI50 && (
          <div className="sec">
            <div className="sec-label">Shots inside 50 yds <span className="badge auto">not including putts</span></div>
            <div className="stepper" style={{maxWidth:180}}>
              <button className="step-btn" onClick={() => update({ shotsInside50: Math.max(1, (d.shotsInside50||1) - 1), sgReason: (d.shotsInside50||1) <= 2 ? null : d.sgReason })} disabled={(d.shotsInside50||1) <= 1}>-</button>
              <div className="step-val par">{d.shotsInside50 || 1}</div>
              <button className="step-btn" onClick={() => update({ shotsInside50: (d.shotsInside50||1) + 1 })}>+</button>
            </div>
          </div>
        )}
        {!d.pickedUp && !d.dna && (d.shotsInside50 || 0) >= 2 && (
          <div className="sec">
            <div className="sec-label">Why the extra shots? <span className="badge conditional">optional</span></div>
            <div className="sg-reason-grid">
              {["Bunker","Heavy rough","Chunked","Thinned/topped","Poor aim","Distance control","Other"].map(r => (
                <button
                  key={r}
                  className={"sg-chip" + (d.sgReason === r ? " sel" : "")}
                  onClick={() => update({ sgReason: d.sgReason === r ? null : r })}
                >{r}</button>
              ))}
            </div>
          </div>
        )}

        {!d.pickedUp && !d.dna && d.putts > 0 && (
          <div className="sec">
            <div className="sec-label">First putt distance</div>
            <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
              {PUTT_DIST.map(p => (
                <button key={p.v} className={"tap-btn " + (d.putt1 === p.v ? "sel" : "")} style={{minWidth:52,flexShrink:0}} onClick={() => update({ putt1: p.v })}><span className="tv">{p.v}</span><span className="tu">{p.u}</span></button>
              ))}
            </div>
          </div>
        )}

        {!d.pickedUp && !d.dna && puttMode !== "first_only" && (puttMode === "full" ? d.putts >= 2 : show3putt) && (
          <div className="sec">
            <div className="sec-label">
              Second putt distance
              {puttMode === "standard" && <span className="badge conditional">3-putt</span>}
            </div>
            <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
              {PUTT2_DIST.map(p => (
                <button key={p.v} className={"tap-btn " + (d.putt2 === p.v ? "sel" : "")} style={{minWidth:52,flexShrink:0}} onClick={() => update({ putt2: p.v })}><span className="tv">{p.v}</span><span className="tu">{p.u}</span></button>
              ))}
            </div>
          </div>
        )}

        {!d.pickedUp && !d.dna && puttMode === "full" && show3putt && (
          <div className="sec">
            <div className="sec-label">Third putt distance <span className="badge conditional">3-putt</span></div>
            <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
              {PUTT2_DIST.map(p => (
                <button key={p.v} className={"tap-btn " + (d.putt3 === p.v ? "sel" : "")} style={{minWidth:52,flexShrink:0}} onClick={() => update({ putt3: p.v })}><span className="tv">{p.v}</span><span className="tu">{p.u}</span></button>
              ))}
            </div>
          </div>
        )}

        {!d.pickedUp && !d.dna && <div className="sec">
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
        </div>}

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
