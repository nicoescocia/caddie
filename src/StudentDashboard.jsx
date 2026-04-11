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

  .dash-wrap { max-width:480px; margin:0 auto; padding:24px 16px 80px; }

  .dash-hero { background:var(--green-dark); border-radius:20px; padding:24px; margin-bottom:24px; position:relative; overflow:hidden; }
  .dash-hero::after { content:''; position:absolute; right:-40px; top:-40px; width:180px; height:180px; border-radius:50%; background:rgba(255,255,255,0.03); pointer-events:none; }
  .dash-hero-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:rgba(255,255,255,0.4); margin-bottom:6px; }
  .dash-hero-name { font-family:'Playfair Display',serif; font-size:26px; color:white; margin-bottom:16px; }
  .dash-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  .dash-stat { background:rgba(255,255,255,0.07); border-radius:12px; padding:12px; }
  .dash-stat-val { font-family:'Playfair Display',serif; font-size:24px; color:var(--gold); line-height:1; }
  .dash-stat-lbl { font-size:11px; color:rgba(255,255,255,0.4); margin-top:4px; }

  .new-round-btn { width:100%; background:var(--green); border:none; border-radius:14px; padding:16px; font-family:'Outfit',sans-serif; font-size:16px; font-weight:700; color:white; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:24px; }
  .new-round-btn:hover { background:var(--green-mid); transform:translateY(-1px); box-shadow:0 6px 20px rgba(26,107,74,0.3); }

  .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:var(--text-dim); margin-bottom:12px; }

  .round-card { background:white; border:1.5px solid var(--border); border-radius:16px; padding:16px 18px; margin-bottom:10px; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .round-card:hover { border-color:var(--green-light); transform:translateY(-1px); box-shadow:var(--shadow); }
  .round-card-left { flex:1; }
  .round-card-course { font-size:14px; font-weight:700; color:var(--text); margin-bottom:3px; }
  .round-card-date { font-size:12px; color:var(--text-dim); }
  .round-card-badges { display:flex; gap:6px; margin-top:8px; }
  .badge-sent { background:#E8F4EE; color:var(--green); font-size:10px; font-weight:700; padding:3px 8px; border-radius:6px; }
  .badge-unsent { background:#FFF8E6; color:#8A6A00; font-size:10px; font-weight:700; padding:3px 8px; border-radius:6px; }
  .badge-historical { background:#EEF0FF; color:#4A5FBD; font-size:10px; font-weight:700; padding:3px 8px; border-radius:6px; }
  .round-card-score { text-align:right; flex-shrink:0; }
  .round-score-big { font-family:'Playfair Display',serif; font-size:36px; color:var(--text); line-height:1; }
  .round-score-par { font-size:12px; color:var(--text-dim); margin-top:2px; }
  .round-score-par.under { color:var(--gold); }
  .round-score-par.over { color:var(--orange); }

  .empty-rounds { text-align:center; padding:48px 24px; background:white; border-radius:16px; border:2px dashed var(--border); }
  .empty-icon { font-size:40px; margin-bottom:12px; }
  .empty-title { font-family:'Playfair Display',serif; font-size:18px; margin-bottom:6px; }
  .empty-sub { font-size:13px; color:var(--text-mid); line-height:1.6; }

  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:60px; }
  .big-spinner { width:28px; height:28px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .delete-btn { background:none; border:none; color:var(--text-dim); font-size:16px; cursor:pointer; padding:4px 6px; border-radius:6px; transition:all .15s; flex-shrink:0; }
  .delete-btn:hover { background:#FEF0F0; color:var(--red); }

  .coach-note-block { margin-top:10px; padding:10px 12px; background:#EAF5EF; border:1px solid #A8D8BC; border-radius:10px; }
  .coach-note-from { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--green); margin-bottom:4px; }
  .coach-note-text { font-size:13px; color:var(--text-mid); line-height:1.55; font-style:italic; }

  .trends-wrap { margin-bottom:16px; }
  .trends-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-bottom:10px; display:flex; align-items:center; gap:8px; }
  .trends-tabs { display:flex; gap:6px; margin-bottom:12px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; padding-bottom:2px; flex-wrap:nowrap; }
  .trends-tabs::-webkit-scrollbar { display:none; }
  .trend-tab { background:white; border:1.5px solid var(--border); border-radius:8px; padding:5px 12px; font-family:'Outfit',sans-serif; font-size:12px; font-weight:600; color:var(--text-dim); cursor:pointer; transition:all .15s; }
  .trend-tab.active { background:var(--green-dark); border-color:var(--green-dark); color:white; }
  .trend-chart { background:white; border:1px solid var(--border); border-radius:14px; padding:14px 16px; margin-bottom:10px; }
  .trend-chart-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-bottom:10px; }
  .trend-legend { display:flex; gap:14px; margin-top:8px; }
  .trend-legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--text-dim); }
  .trend-legend-dot { width:8px; height:8px; border-radius:50%; }

  .trend-charts-pair { display:grid; grid-template-columns:1fr 1fr; gap:8px; }

  .hist-btn { width:100%; background:none; border:1.5px solid var(--border); border-radius:14px; padding:13px; font-family:'Outfit',sans-serif; font-size:14px; font-weight:600; color:var(--text-mid); cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:24px; }
  .hist-btn:hover { border-color:var(--green-light); color:var(--green); background:white; }

  .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
  .modal-sheet { background:white; border-radius:20px 20px 0 0; padding:24px 20px 40px; width:100%; max-width:480px; max-height:90vh; overflow-y:auto; }
  .modal-title { font-family:'Playfair Display',serif; font-size:20px; color:var(--text); margin-bottom:20px; }
  .modal-field { margin-bottom:16px; }
  .modal-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-bottom:6px; display:block; }
  .modal-input { width:100%; padding:11px 14px; border:1.5px solid var(--border); border-radius:10px; font-family:'Outfit',sans-serif; font-size:15px; color:var(--text); background:white; outline:none; transition:border-color .15s; }
  .modal-input:focus { border-color:var(--green); }
  .modal-actions { display:flex; gap:10px; margin-top:16px; }
  .modal-submit { flex:1; background:var(--green); border:none; border-radius:12px; padding:14px; font-family:'Outfit',sans-serif; font-size:15px; font-weight:700; color:white; cursor:pointer; }
  .modal-submit:disabled { opacity:.5; cursor:not-allowed; }
  .modal-cancel { background:none; border:1.5px solid var(--border); border-radius:12px; padding:14px 20px; font-family:'Outfit',sans-serif; font-size:15px; font-weight:600; color:var(--text-mid); cursor:pointer; }

  .coach-unlink-btn { background:none; border:none; padding:0; font-family:'Outfit',sans-serif; font-size:12px; color:var(--text-dim); cursor:pointer; text-decoration:underline; text-decoration-style:dotted; text-underline-offset:2px; flex-shrink:0; }
  .coach-unlink-btn:hover { color:var(--red); }
  .coach-add-btn { width:100%; background:none; border:1.5px dashed var(--border); border-radius:14px; padding:12px; font-family:'Outfit',sans-serif; font-size:14px; font-weight:600; color:var(--green); cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:14px; }
  .coach-add-btn:hover { border-color:var(--green-light); background:white; }

  .hist-section { padding-top:14px; border-top:1.5px solid var(--border); margin-bottom:6px; }
  .hist-col-headers { display:flex; gap:6px; padding-bottom:5px; border-bottom:1.5px solid var(--border); }
  .hist-ch { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--text-dim); text-align:center; }
  .hist-row { display:flex; gap:6px; align-items:center; padding:5px 0; border-bottom:1px solid var(--border); }
  .hist-row:last-of-type { border-bottom:none; }
  .hist-lbl { width:28px; flex-shrink:0; line-height:1.2; }
  .hist-lbl-n { font-size:12px; font-weight:700; color:var(--text); }
  .hist-lbl-p { font-size:10px; color:var(--text-dim); }
  .hist-stepper { display:flex; flex-shrink:0; }
  .hist-sb { width:24px; height:30px; border:1.5px solid var(--border); background:white; color:var(--green); font-size:18px; font-weight:300; cursor:pointer; display:flex; align-items:center; justify-content:center; font-family:'Outfit',sans-serif; flex-shrink:0; }
  .hist-sb.dec { border-radius:6px 0 0 6px; }
  .hist-sb.inc { border-radius:0 6px 6px 0; }
  .hist-sv { width:30px; height:30px; border-top:1.5px solid var(--border); border-bottom:1.5px solid var(--border); background:white; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; }
  .hist-group { display:flex; gap:3px; }
  .hist-t { height:28px; border:1.5px solid var(--border); border-radius:6px; background:white; font-family:'Outfit',sans-serif; font-size:11px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; flex:1; min-width:0; padding:0 2px; color:var(--text-mid); transition:all .1s; }
  .hist-total { display:flex; justify-content:space-between; padding:10px 2px 2px; font-size:13px; color:var(--text-mid); }
`;

// Hole-by-hole pars for historical round entry
const HIST_COURSE_HOLES = {
  "89e2ad4e-8d5a-4244-8568-b2c8a448a77f": [4,4,3,4,3,4,4,3,3],
  "b1a2c3d4-e5f6-7890-abcd-ef1234567890": [4,4,3,4,5,4,3,4,4,3,4,4,3,4,4,3,4,4],
};
function initHistHoles(courseId) {
  return (HIST_COURSE_HOLES[courseId] || []).map(par => ({ score: par, fairway: null, putts: 2, penalty: 0 }));
}

// Course pars — used to calculate vs-par stats per round
const COURSE_PAR = {
  "89e2ad4e-8d5a-4244-8568-b2c8a448a77f": 32, // Wee Course (9 holes)
  "b1a2c3d4-e5f6-7890-abcd-ef1234567890": 68, // Big Course (18 holes)
};
function getCoursePar(round) {
  if (round.total_par) return round.total_par;
  if (round.course_id && COURSE_PAR[round.course_id]) return COURSE_PAR[round.course_id];
  return round.holes_played === 18 ? 68 : 32;
}

function prorateHandicap(round, holeStatsMap) {
  if (!round.handicap) return round.handicap;
  const holes = holeStatsMap[round.id];
  if (!holes || !holes.length) return round.handicap;
  let shots = 0;
  for (const h of holes) {
    const si = h.stroke_index || 0;
    if (!si) continue;
    if (round.handicap >= si) shots++;
    if (round.handicap >= si + (round.holes_played || 18)) shots++;
    if (round.handicap >= si + (round.holes_played || 18) * 2) shots++;
  }
  return shots;
}

// ── TREND HELPERS ──
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
        {sparkline(all9,  lineColor || "#1A6B4A", hasBoth)}
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

function StudentRoundTrends({ rounds, activeTab }) {
  const [tab, setTab] = useState("score");
  const scored = rounds.filter(r => r.total_score);
  // rounds are newest-first; take the 10 most recent of each type, then reverse for chart display (oldest→newest)
  const r9  = scored.filter(r => r.holes_played === 9).slice(0, 10).reverse();
  const r18 = scored.filter(r => r.holes_played === 18).slice(0, 10).reverse();
  const r10 = scored.slice(0, 10).reverse();
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
  const e10 = enrich(r10);

  // Handicap progression — all completed rounds with whs_index, up to 10 most recent
  const whsRounds = e10.filter(r => r.whs_index != null);

  const fmtPar = v => v > 0 ? "+"+v : v === 0 ? "E" : String(v);

  return (
    <div className="trends-wrap">
      <div className="trends-tabs">
        {["score","gir","putts","fairways","stableford","handicap"].map(t => (
          <button key={t} className={"trend-tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>
            {t === "score" ? "Score" : t === "gir" ? "GIR" : t === "putts" ? "Putts" : t === "fairways" ? "Fairways" : t === "stableford" ? "Stableford" : "Handicap"}
          </button>
        ))}
      </div>

      {tab === "score" && (
        <div className="trend-charts-pair">
          <TrendLine data9={e9} data18={e18} metric="vsPar"    label="Gross vs Par" formatY={fmtPar} />
          <TrendLine data9={e9} data18={e18} metric="netVsPar" label="Net vs Par"   formatY={fmtPar} />
        </div>
      )}
      {tab === "gir"        && <TrendLine data9={e10} data18={[]} metric="girPct"            label="GIR %"              yTicks={[0,25,50,75,100]} formatY={v => v+"%"}        height={80} />}
      {tab === "putts"      && <TrendLine data9={e10} data18={[]} metric="puttsPerHole"       label="Avg Putts / Hole"   yTicks={[1.5,2.0,2.5,3.0]} formatY={v => v.toFixed(1)} height={80} />}
      {tab === "fairways"   && <TrendLine data9={e10} data18={[]} metric="fwPct"              label="Fairways %"         yTicks={[0,25,50,75,100]} formatY={v => v+"%"}        height={80} />}
      {tab === "stableford" && <TrendLine data9={e10} data18={[]} metric="stablefordPerHole"  label="Stableford pts / hole" formatY={v => v.toFixed(1)} height={80} lineColor="#C9A84C" />}
      {tab === "handicap" && (
        whsRounds.length < 2
          ? <div style={{background:"white",border:"1px solid var(--border)",borderRadius:14,padding:"24px 16px",textAlign:"center",fontSize:13,color:"var(--text-dim)"}}>Log more rounds to see your handicap trend</div>
          : <TrendLine data9={whsRounds} data18={[]} metric="whs_index" label="WHS Index" formatY={v => v.toFixed(1)} height={80} lineColor="#4A90D9" />
      )}
    </div>
  );
}

function parseFt(v) {
  if (!v) return null;
  if (v === "<3") return 1.5;
  if (v === "30+") return 32;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function parsePutt2(v) {
  if (!v) return null;
  if (v === "<1") return 0.5;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function StudentAnalytics({ rounds, analyticsHolesMap, isPremium }) {
  const [analyticsCount, setAnalyticsCount] = useState(5);
  const [analyticsTab, setAnalyticsTab] = useState("approach");

  // Filter rounds by active 9/18 tab; fall back to all if fewer than 5
  const completed = rounds.filter(r => r.total_score);
  const baseRounds = completed;

  const countOptions = [5, 10, 20, 50].filter(n => completed.length >= n);

  useEffect(() => {
    if (countOptions.length > 0 && !countOptions.includes(analyticsCount)) {
      const best = countOptions.includes(10) ? 10 : countOptions[countOptions.length - 1];
      setAnalyticsCount(best);
    }
  }, [rounds.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isPremium) {
    return (
      <div style={{
        background:"white", border:"1.5px solid var(--gold)", borderRadius:14,
        padding:"20px 18px", marginBottom:16, textAlign:"center",
      }}>
        <div style={{fontSize:16,fontWeight:700,color:"var(--text)",marginBottom:6}}>📊 Putting Analytics</div>
        <div style={{fontSize:13,color:"var(--text-mid)",marginBottom:14,lineHeight:1.6}}>
          Upgrade to Premium to unlock putting analytics
        </div>
        <div style={{fontSize:12,color:"var(--gold)",fontWeight:700}}>Premium only</div>
      </div>
    );
  }

  const N = countOptions.includes(analyticsCount) ? analyticsCount : (countOptions[countOptions.length - 1] || baseRounds.length);

  const currentRounds = baseRounds.slice(0, N);
  const prevRounds    = baseRounds.slice(N, N * 2);

  const currentRoundIds = new Set(currentRounds.map(r => r.id));
  const prevRoundIds    = new Set(prevRounds.map(r => r.id));

  function getActiveHoles(roundIdSet) {
    const holes = [];
    for (const rid of roundIdSet) {
      for (const h of (analyticsHolesMap[rid] || [])) {
        if (!h.dna && !h.picked_up) holes.push(h);
      }
    }
    return holes;
  }

  const currentHoles = getActiveHoles(currentRoundIds);
  const prevHoles    = getActiveHoles(prevRoundIds);

  // Table 1 data
  const approachBands = [
    { key: "Under 50", label: "Under 50" },
    { key: "50-75",    label: "50–75" },
    { key: "75-100",   label: "75–100" },
    { key: "100-125",  label: "100–125" },
    { key: "125-150",  label: "125–150" },
    { key: "150+",     label: "150+" },
  ];
  const approachRows = approachBands.map(({ key, label }) => {
    const cur  = currentHoles.filter(h => h.approach === key && parseFt(h.putt1) !== null);
    const prev = prevHoles.filter(h => h.approach === key && parseFt(h.putt1) !== null);
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

  // Table 2 data
  const putt1Groups = ["<3","3","4","6","9","12","15","20","25","30+"];
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
    <div className="trends-wrap">
      <div className="trends-title">Analytics</div>

      {/* Count selector */}
      {countOptions.length > 0 && (
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
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
        </div>
      )}

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
                  <th style={{textAlign:"left",paddingBottom:6,fontWeight:600}}>Approach</th>
                  <th style={{textAlign:"center",paddingBottom:6,fontWeight:600}}>Holes</th>
                  <th style={{textAlign:"right",paddingBottom:6,fontWeight:600}}>Avg 1st putt</th>
                  <th style={{textAlign:"right",paddingBottom:6,fontWeight:600}}>vs prev<br/><span style={{fontWeight:400,fontSize:10,color:"var(--text-dim)"}}>({N} rounds)</span></th>
                </tr>
              </thead>
              <tbody>
                {approachRows.map(row => (
                  <tr key={row.label} style={{borderTop:"1px solid var(--border)"}}>
                    <td style={{padding:"7px 0",fontSize:12,color:"var(--text-mid)"}}>{row.label} yds</td>
                    <td style={{textAlign:"center",fontSize:12,color:"var(--text-dim)"}}>×{row.count}</td>
                    <td style={{textAlign:"right",fontWeight:700,color:"var(--text)"}}>{row.avg.toFixed(1)} ft</td>
                    <td style={{textAlign:"right",fontWeight:700,fontSize:14,color: row.indicator === "↓" ? "var(--green-mid)" : row.indicator === "↑" ? "var(--red)" : "var(--text-dim)"}}>
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
                  <th style={{textAlign:"right",paddingBottom:6,fontWeight:600}}>vs prev<br/><span style={{fontWeight:400,fontSize:10,color:"var(--text-dim)"}}>({N} rounds)</span></th>
                </tr>
              </thead>
              <tbody>
                {putt2Rows.map(row => (
                  <tr key={row.p1v} style={{borderTop:"1px solid var(--border)"}}>
                    <td style={{padding:"7px 0",fontSize:12,color:"var(--text-mid)"}}>{row.p1v} ft</td>
                    <td style={{textAlign:"center",fontSize:12,color:"var(--text-dim)"}}>×{row.count}</td>
                    <td style={{textAlign:"right",fontWeight:700,color:"var(--text)"}}>{row.avg.toFixed(1)} ft</td>
                    <td style={{textAlign:"right",fontWeight:700,fontSize:14,color: row.indicator === "↓" ? "var(--green-mid)" : row.indicator === "↑" ? "var(--red)" : "var(--text-dim)"}}>
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

export default function StudentDashboard({ user, onNewRound, onEditRound, onBackToAdmin, onProfile, onSettings }) {
  const [rounds, setRounds]   = useState([]);
  const [profile, setProfile] = useState(null);
  const [coaches, setCoaches]             = useState([]);
  const [coachesExpanded, setCoachesExpanded] = useState(false);
  const [showAddCoachModal, setShowAddCoachModal] = useState(false);
  const [addCoachCode, setAddCoachCode]   = useState("");
  const [addCoachError, setAddCoachError] = useState("");
  const [addCoachSaving, setAddCoachSaving] = useState(false);
  const [unlinkCoachId, setUnlinkCoachId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hcpEditing, setHcpEditing] = useState(false);
  const [hcpInput, setHcpInput]     = useState("");
  const [showHistModal, setShowHistModal] = useState(false);
  const [histForm, setHistForm] = useState({ course_id: "89e2ad4e-8d5a-4244-8568-b2c8a448a77f", date: "", note: "", course_handicap: "", whs_index: "" });
  const [histHoles, setHistHoles] = useState(() => initHistHoles("89e2ad4e-8d5a-4244-8568-b2c8a448a77f"));
  const [histSaving, setHistSaving] = useState(false);
  const [histEditId, setHistEditId] = useState(null);
  const [histEditLoading, setHistEditLoading] = useState(false);
  const [roundHoleStats, setRoundHoleStats]   = useState({});
  const [roundHolesData, setRoundHolesData]   = useState({});
  const [analyticsHolesMap, setAnalyticsHolesMap] = useState({});
  const [statTab, setStatTab]                 = useState(null);
  const [mainView, setMainView]               = useState("trends");

  function updateHistHole(i, fields) {
    setHistHoles(prev => prev.map((h, idx) => idx === i ? { ...h, ...fields } : h));
  }
  function closeHistModal() {
    const def = "89e2ad4e-8d5a-4244-8568-b2c8a448a77f";
    setShowHistModal(false);
    setHistEditId(null);
    setHistForm({ course_id: def, date: "", note: "", course_handicap: "", whs_index: "" });
    setHistHoles(initHistHoles(def));
  }
  async function openHistModal(round) {
    if (round) {
      setHistEditId(round.id);
      setHistForm({ course_id: round.course_id, date: round.created_at.split("T")[0], note: round.student_note || "", course_handicap: round.handicap != null ? String(round.handicap) : "", whs_index: round.whs_index != null ? String(round.whs_index) : "" });
      setHistHoles(initHistHoles(round.course_id));
      setHistEditLoading(true);
      setShowHistModal(true);
      // Use bulk-fetched hole data — no per-round query needed
      const stored = roundHolesData[round.id];
      if (stored && stored.length > 0) {
        setHistHoles(stored.map(h => ({
          score:   h.score,
          fairway: h.fairway,
          putts:   h.putts,
          penalty: h.penalty === "None" ? 0 : parseInt(h.penalty, 10) || 0,
        })));
      }
      setHistEditLoading(false);
    } else {
      const def = "89e2ad4e-8d5a-4244-8568-b2c8a448a77f";
      setHistEditId(null);
      setHistForm({ course_id: def, date: "", note: "", course_handicap: "", whs_index: "" });
      setHistHoles(initHistHoles(def));
      setShowHistModal(true);
    }
  }

  useEffect(() => {
    async function load() {
      const [{ data: prof }, { data: rds }, { data: coachLinks }] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, official_handicap, is_premium").eq("id", user.id).single(),
        supabase.from("rounds").select("id, student_id, course_id, holes_played, total_score, total_par, total_putts, handicap, whs_index, sent_to_coach, sent_at, wind, conditions, temperature, student_note, coach_note, historical, created_at, courses(name)").eq("student_id", user.id).order("created_at", { ascending: false }),
        supabase.from("coach_students").select("coach_id").eq("student_id", user.id),
      ]);
      setProfile(prof);
      setRounds(rds || []);
      // Fetch per-hole stats for GIR, fairway, and Stableford charts
      const roundIds = (rds || []).map(r => r.id);
      if (roundIds.length > 0) {
        const { data: holeRows } = await supabase
          .from("round_holes")
          .select("round_id, hole_number, gir, dna, fairway, par, score, putts, penalty, picked_up, stroke_index, putt1, putt2, approach")
          .in("round_id", roundIds)
          .order("hole_number", { ascending: true });
        const roundsById = Object.fromEntries((rds || []).map(r => [r.id, r]));
        // Build SI map from course_holes — round_holes.stroke_index may be null for older rounds
        const uniqueCourseIds = [...new Set((rds || []).map(r => r.course_id).filter(Boolean))];
        const siMap = {};
        if (uniqueCourseIds.length > 0) {
          const { data: chRows } = await supabase
            .from("course_holes")
            .select("course_id, hole_number, stroke_index")
            .in("course_id", uniqueCourseIds);
          for (const ch of (chRows || [])) {
            if (!siMap[ch.course_id]) siMap[ch.course_id] = {};
            if (ch.stroke_index) siMap[ch.course_id][ch.hole_number] = ch.stroke_index;
          }
        }
        const statsMap = {};
        const holesByRound = {};
        for (const h of (holeRows || [])) {
          if (!statsMap[h.round_id]) {
            statsMap[h.round_id] = { gir_count: 0, attempted_holes: 0, fw_hit: 0, fw_holes: 0, stableford_total: 0, stableford_holes: 0, total_putts: 0, putt_holes: 0 };
          }
          if (!holesByRound[h.round_id]) holesByRound[h.round_id] = [];
          holesByRound[h.round_id].push(h);
          if (!h.dna) {
            statsMap[h.round_id].attempted_holes++;
            if (!h.picked_up && h.putts != null) {
              statsMap[h.round_id].total_putts += h.putts;
              statsMap[h.round_id].putt_holes++;
            }
            if (h.gir) statsMap[h.round_id].gir_count++;
            if (h.par >= 4) {
              statsMap[h.round_id].fw_holes++;
              if (h.fairway === "yes") statsMap[h.round_id].fw_hit++;
            }
            // Stableford — use stored SI first, fall back to course_holes
            const round = roundsById[h.round_id];
            if (round) {
              const si = h.stroke_index || siMap[round.course_id]?.[h.hole_number] || 0;
              if (h.picked_up && round.handicap != null) {
                statsMap[h.round_id].stableford_holes++;
                // 0 pts, hole counted
              } else if (round.handicap != null && h.score !== null && si > 0) {
                statsMap[h.round_id].stableford_holes++;
                const hcp = round.handicap;
                const hp  = round.holes_played || 9;
                let shots = 0;
                if (hcp >= si)          shots = 1;
                if (hcp >= si + hp)     shots = 2;
                if (hcp >= si + hp * 2) shots = 3;
                statsMap[h.round_id].stableford_total += Math.max(0, 2 + h.par - (h.score - shots));
              }
              // si === 0 (unknown): hole not counted toward stableford_holes → round excluded from chart
            }
          }
        }
        const analyticsMap = {};
        for (const h of (holeRows || [])) {
          if (!analyticsMap[h.round_id]) analyticsMap[h.round_id] = [];
          analyticsMap[h.round_id].push(h);
        }
        setRoundHoleStats(statsMap);
        setRoundHolesData(holesByRound);
        setAnalyticsHolesMap(analyticsMap);
      }
      // Fetch all linked coach profiles
      const linkedCoaches = coachLinks || [];
      if (linkedCoaches.length > 0) {
        const coachIdList = linkedCoaches.map(l => l.coach_id);
        const { data: coachProfs } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", coachIdList);
        if (coachProfs) setCoaches(coachProfs);
      }
      setLoading(false);
    }
    load();
  }, [user.id]);

  async function addCoach(e) {
    e.preventDefault();
    const code = addCoachCode.trim().toUpperCase();
    if (!code) return;
    setAddCoachSaving(true);
    setAddCoachError("");
    const { data: invite } = await supabase
      .from("invites")
      .select("id, coach_id")
      .eq("code", code)
      .is("used_by", null)
      .maybeSingle();
    if (!invite) {
      setAddCoachError("Invalid or already-used invite code. Ask your coach for a new one.");
      setAddCoachSaving(false);
      return;
    }
    if (coaches.some(c => c.id === invite.coach_id)) {
      setAddCoachError("You're already linked to this coach.");
      setAddCoachSaving(false);
      return;
    }
    const { error: linkError } = await supabase
      .from("coach_students")
      .insert([{ coach_id: invite.coach_id, student_id: user.id }]);
    if (linkError) {
      setAddCoachError("Failed to link coach. Please try again.");
      setAddCoachSaving(false);
      return;
    }
    await supabase.from("invites").update({ used_by: user.id }).eq("id", invite.id);
    const { data: coachProf } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("id", invite.coach_id)
      .single();
    if (coachProf) setCoaches(prev => [...prev, coachProf]);
    setAddCoachCode("");
    setShowAddCoachModal(false);
    setAddCoachSaving(false);
  }

  async function unlinkCoach(coachId) {
    await supabase
      .from("coach_students")
      .delete()
      .eq("coach_id", coachId)
      .eq("student_id", user.id);
    setCoaches(prev => prev.filter(c => c.id !== coachId));
    setUnlinkCoachId(null);
  }

  async function saveHandicap() {
    const val = parseFloat(hcpInput);
    if (isNaN(val) || val < 0 || val > 54) return;
    const { error } = await supabase
      .from("profiles")
      .update({ official_handicap: val })
      .eq("id", user.id);
    if (!error) {
      setProfile(prev => ({ ...prev, official_handicap: val }));
    }
    setHcpEditing(false);
  }

  async function sendHistToCoach(e, roundId) {
    e.stopPropagation();
    const now = new Date().toISOString();
    const { error } = await supabase.from("rounds").update({ sent_to_coach: true, sent_at: now }).eq("id", roundId);
    if (!error) {
      setRounds(prev => prev.map(r => r.id === roundId ? { ...r, sent_to_coach: true, sent_at: now } : r));
    }
  }

  async function deleteRound(e, roundId) {
    e.stopPropagation(); // don't trigger the edit tap
    if (!window.confirm("Delete this round? This can't be undone.")) return;
    const { error: e1 } = await supabase.from("round_holes").delete().eq("round_id", roundId);
    const { error: e2 } = await supabase.from("rounds").delete().eq("id", roundId);
    if (e1 || e2) {
      console.error("Delete failed:", e1?.message, e2?.message);
      alert("Delete failed — " + (e2?.message || e1?.message));
      return;
    }
    setRounds(prev => prev.filter(r => r.id !== roundId));
  }

  async function saveHistoricalRound() {
    if (!histForm.date) return;
    setHistSaving(true);
    const pars = HIST_COURSE_HOLES[histForm.course_id] || [];
    const total_score = histHoles.reduce((s, h) => s + h.score, 0);
    const total_putts = histHoles.reduce((s, h) => s + h.putts, 0);
    const holeRows = histHoles.map((h, i) => ({
      hole_number: i + 1,
      par:         pars[i],
      score:       h.score,
      putts:       h.putts,
      fairway:     pars[i] >= 4 ? (h.fairway || null) : null,
      penalty:     h.penalty === 0 ? "None" : String(h.penalty),
      gir:         h.putts === 0 ? true : (h.score - h.putts) <= (pars[i] - 2),
      dna:         false,
      picked_up:   false,
    }));
    const histHandicap = histForm.course_handicap !== "" ? parseFloat(histForm.course_handicap) : null;
    const histWhsIndex = histForm.whs_index !== "" ? parseFloat(histForm.whs_index) : null;
    if (histEditId) {
      const { error: updateError } = await supabase.from("rounds").update({
        total_score,
        total_putts,
        student_note: histForm.note || null,
        handicap: histHandicap,
        whs_index: histWhsIndex,
      }).eq("id", histEditId);
      if (!updateError) {
        await supabase.from("round_holes").delete().eq("round_id", histEditId);
        await supabase.from("round_holes").insert(holeRows.map(h => ({ ...h, round_id: histEditId })));
        setRounds(prev => prev.map(r => r.id === histEditId
          ? { ...r, total_score, total_putts, student_note: histForm.note || null, handicap: histHandicap, whs_index: histWhsIndex }
          : r
        ));
      }
    } else {
      const { data: roundData, error: roundError } = await supabase.from("rounds").insert([{
        student_id:    user.id,
        course_id:     histForm.course_id,
        holes_played:  pars.length,
        total_score,
        total_putts,
        student_note:  histForm.note || null,
        historical:    true,
        sent_to_coach: false,
        created_at:    new Date(histForm.date).toISOString(),
        handicap:      histHandicap,
        whs_index:     histWhsIndex,
      }]).select("id, student_id, course_id, holes_played, total_score, total_putts, handicap, whs_index, sent_to_coach, sent_at, wind, conditions, temperature, student_note, coach_note, historical, created_at, courses(name)").single();
      if (!roundError && roundData) {
        await supabase.from("round_holes").insert(holeRows.map(h => ({ ...h, round_id: roundData.id })));
        setRounds(prev => [roundData, ...prev].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }
    }
    setHistSaving(false);
    closeHistModal();
  }

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="mode-bar"><div className="mode-logo">⛳ Caddie</div></div>

      <div className="loading-wrap"><div className="big-spinner" /></div>
    </>
  );

  const completedRounds = rounds.filter(r => r.total_score);
  const rounds9  = completedRounds.filter(r => r.holes_played === 9);
  const rounds18 = completedRounds.filter(r => r.holes_played === 18);
  const activeStatTab = statTab ?? (rounds9.length > rounds18.length ? 9 : 18);
  const activeRounds  = activeStatTab === 9 ? rounds9 : rounds18;
  const avgDiff = activeRounds.length
    ? Math.round(activeRounds.reduce((s, r) => s + ((r.total_score || 0) - getCoursePar(r)), 0) / activeRounds.length)
    : null;
  const bestDiff = activeRounds.length
    ? Math.min(...activeRounds.map(r => (r.total_score || 0) - getCoursePar(r)))
    : null;
  const enrichedForTrends = completedRounds.map(r => ({
    ...r,
    gir_count:        roundHoleStats[r.id]?.gir_count        ?? null,
    attempted_holes:  roundHoleStats[r.id]?.attempted_holes  ?? null,
    fw_hit:           roundHoleStats[r.id]?.fw_hit            ?? null,
    fw_holes:         roundHoleStats[r.id]?.fw_holes          ?? null,
    stableford_total: roundHoleStats[r.id]?.stableford_total  ?? null,
    stableford_holes: roundHoleStats[r.id]?.stableford_holes  ?? null,
    prorated_hcp:     prorateHandicap(r, roundHolesData),
  }));

  return (
    <>
      <style>{css}</style>
      <div className="mode-bar">
        <div className="mode-logo">⛳ Caddie</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {onBackToAdmin && (
            <button className="signout-btn" onClick={onBackToAdmin} style={{color:"rgba(255,255,255,0.8)"}}>
              Admin
            </button>
          )}
          {onSettings && (
            <button className="signout-btn" onClick={onSettings} style={{color:"rgba(255,255,255,0.8)"}}>
              Settings
            </button>
          )}
          {onProfile && (
            <button className="signout-btn" onClick={onProfile} style={{color:"rgba(255,255,255,0.8)"}}>
              Profile
            </button>
          )}
        </div>
      </div>

      <div className="dash-wrap">
        <div className="dash-hero">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <div className="dash-hero-label" style={{margin:0}}>Welcome back</div>
            {profile?.is_premium
              ? <span style={{background:"var(--gold)",color:"var(--green-dark)",fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:7,textTransform:"uppercase",letterSpacing:".06em"}}>Premium</span>
              : <span style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:7,textTransform:"uppercase",letterSpacing:".06em"}}>Free</span>
            }
          </div>
          <div className="dash-hero-name" style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span>{profile?.first_name} {profile?.last_name}</span>
            {(() => {
              const officialHcp = profile?.official_handicap ?? rounds.find(r => r.handicap != null)?.handicap ?? null;
              if (hcpEditing) return (
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <input
                    type="number" min="0" max="54" step="0.1" value={hcpInput}
                    onChange={e => setHcpInput(e.target.value)}
                    onKeyDown={e => { if (e.key==="Enter") saveHandicap(); if (e.key==="Escape") setHcpEditing(false); }}
                    autoFocus
                    style={{width:60,padding:"3px 6px",borderRadius:6,border:"1px solid rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.12)",color:"white",fontFamily:"'Outfit',sans-serif",fontSize:14,textAlign:"center"}}
                  />
                  <button onClick={saveHandicap} style={{background:"var(--gold)",border:"none",borderRadius:6,padding:"3px 10px",fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:700,color:"var(--green-dark)",cursor:"pointer"}}>Save</button>
                  <button onClick={() => setHcpEditing(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.5)",fontSize:16,cursor:"pointer",padding:"0 4px"}}>✕</button>
                </div>
              );
              return (
                <span
                  onClick={() => { setHcpInput(officialHcp != null ? String(officialHcp) : ""); setHcpEditing(true); }}
                  style={{fontSize:14,color:"rgba(255,255,255,0.6)",cursor:"pointer",display:"flex",alignItems:"center",gap:4,userSelect:"none"}}
                  title="Edit WHS index"
                >
                  {officialHcp != null ? `Hcp ${Number(officialHcp).toFixed(1)}` : "Set hcp"}
                  <span style={{fontSize:11,opacity:.7}}>✏️</span>
                </span>
              );
            })()}
          </div>
          {completedRounds.length > 0 && (rounds9.length > 0 || rounds18.length > 0) && (
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              {[18, 9].map(n => {
                const hasRounds = n === 9 ? rounds9.length > 0 : rounds18.length > 0;
                return (
                  <button
                    key={n}
                    onClick={() => hasRounds && setStatTab(n)}
                    style={{
                      padding:"3px 11px", borderRadius:20, fontSize:11, fontWeight:700,
                      fontFamily:"'Outfit',sans-serif", transition:"all .15s",
                      cursor: hasRounds ? "pointer" : "default",
                      border:"1.5px solid " + (activeStatTab === n ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.18)"),
                      background: activeStatTab === n ? "rgba(255,255,255,0.14)" : "none",
                      color: activeStatTab === n ? "white" : (hasRounds ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.2)"),
                    }}
                  >
                    {n} holes
                  </button>
                );
              })}
            </div>
          )}
          <div className="dash-stats">
            <div className="dash-stat">
              <div className="dash-stat-val">{rounds.length}</div>
              <div className="dash-stat-lbl">Rounds logged</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-val">{activeRounds.length > 0 ? (avgDiff != null ? (avgDiff > 0 ? "+" + avgDiff : avgDiff === 0 ? "E" : String(avgDiff)) : "—") : "—"}</div>
              <div className="dash-stat-lbl">Avg vs par</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-val">{activeRounds.length > 0 ? (bestDiff != null ? (bestDiff > 0 ? "+" + bestDiff : bestDiff === 0 ? "E" : String(bestDiff)) : "—") : "—"}</div>
              <div className="dash-stat-lbl">Best vs par</div>
            </div>
          </div>
        </div>

        {enrichedForTrends.filter(r => r.total_score).length >= 2 && (
          <div className="trends-tabs" style={{marginBottom:12}}>
            <button className={"trend-tab" + (mainView === "trends" ? " active" : "")} onClick={() => setMainView("trends")}>
              Trends
            </button>
            <button className={"trend-tab" + (mainView === "analytics" ? " active" : "")} onClick={() => setMainView("analytics")}>
              Analytics
            </button>
          </div>
        )}
        {mainView === "trends" && (
          <StudentRoundTrends rounds={enrichedForTrends} activeTab={activeStatTab} />
        )}
        {mainView === "analytics" && (
          <StudentAnalytics
            rounds={enrichedForTrends}
            analyticsHolesMap={analyticsHolesMap}
            isPremium={!!profile?.is_premium}
            activeStatTab={activeStatTab}
          />
        )}

        {/* Coach section */}
        <div style={{marginBottom:14}}>
          {coaches.length > 0 && (
            <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".09em",color:"var(--text-dim)",marginBottom:10}}>
              {coaches.length > 1 ? "Your Coaches" : "Your Coach"}
            </div>
          )}
          {coaches.length === 0 ? (
            <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:14,padding:"14px 16px",marginBottom:10}}>
              <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:10}}>No coach linked yet — enter your coach's invite code to get started.</div>
              <button className="coach-add-btn" style={{marginBottom:0}} onClick={() => { setAddCoachCode(""); setAddCoachError(""); setShowAddCoachModal(true); }}>
                + Add a coach
              </button>
            </div>
          ) : (
            <>
              {[coaches[0], ...(coachesExpanded ? coaches.slice(1) : [])].map(c => (
                <div key={c.id} style={{background:"white",border:"1px solid var(--border)",borderRadius:14,padding:"14px 16px",marginBottom:6,display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:"var(--green-dark)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontSize:16,color:"var(--gold)",flexShrink:0}}>
                    {c.first_name?.[0]}{c.last_name?.[0]}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>{c.first_name} {c.last_name}</div>
                    <div style={{fontSize:11,color:"var(--green)",fontWeight:600,marginTop:2}}>✓ Linked</div>
                  </div>
                  <button className="coach-unlink-btn" onClick={() => setUnlinkCoachId(c.id)}>Unlink</button>
                </div>
              ))}
              {!coachesExpanded && coaches.length > 1 && (
                <button
                  onClick={() => setCoachesExpanded(true)}
                  style={{background:"none",border:"none",padding:"2px 0 8px",fontFamily:"'Outfit',sans-serif",fontSize:13,color:"var(--green)",fontWeight:600,cursor:"pointer",display:"block"}}
                >
                  + {coaches.length - 1} more
                </button>
              )}
            </>
          )}
          {profile?.is_premium && coaches.length > 0 && coaches.length < 3 && (
            <button
              onClick={() => { setAddCoachCode(""); setAddCoachError(""); setShowAddCoachModal(true); }}
              style={{background:"none",border:"none",padding:"4px 0",fontFamily:"'Outfit',sans-serif",fontSize:12,color:"var(--text-dim)",cursor:"pointer",display:"block"}}
            >
              + Add another coach
            </button>
          )}
          {!profile?.is_premium && coaches.length >= 1 && (
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",background:"white",border:"1.5px solid var(--border)",borderRadius:10,marginTop:6}}>
              <span style={{fontSize:14,color:"var(--gold)"}}>🔒</span>
              <span style={{fontSize:12,color:"var(--text-dim)"}}>Premium — link up to 3 coaches</span>
            </div>
          )}
        </div>

        <button className="new-round-btn" onClick={onNewRound}>
          ⛳ Start new round
        </button>

        {rounds.length > 0 && (
          <>
            <div className="section-title">Past rounds</div>
            {rounds.map(r => {
              const diff = (r.total_score || 0) - getCoursePar(r);
              const date = new Date(r.created_at).toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short" });
              return (
                <div className="round-card" key={r.id}
                  style={{flexDirection:"column",alignItems:"stretch",gap:0}}>
                  <div
                    style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,cursor:(r.historical && r.sent_to_coach)?"default":"pointer"}}
                    onClick={r.historical ? (r.sent_to_coach ? undefined : () => openHistModal(r)) : () => onEditRound(r)}
                  >
                    <div className="round-card-left">
                      <div className="round-card-course">{r.courses?.name || "Golf Course"}</div>
                      <div className="round-card-date">{date} · {r.holes_played} holes</div>
                      <div className="round-card-badges">
                        {r.historical && <span className="badge-historical">Historical</span>}
                        {r.sent_to_coach
                          ? <span className="badge-sent">✓ Sent to coach</span>
                          : !r.historical && <span className="badge-unsent">Not sent yet</span>}
                      </div>
                    </div>
                    <div className="round-card-score">
                      <div className="round-score-big">{r.total_score || "—"}</div>
                      <div className={`round-score-par ${diff < 0 ? "under" : diff > 0 ? "over" : ""}`}>
                        {r.total_score ? (diff === 0 ? "Level par" : (diff > 0 ? "+" : "") + diff + " vs par") : "In progress"}
                      </div>
                      {r.total_score && (
                        <div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>
                          {r.handicap != null
                            ? (() => {
                                const proratedHcp = prorateHandicap(r, roundHolesData);
                                const netScore = r.total_score - proratedHcp;
                                return `Course Hcp ${Number(r.handicap).toFixed(1)} · Net ${netScore}`;
                              })()
                            : "Net –"
                          }
                        </div>
                      )}
                    </div>
                    <button className="delete-btn" onClick={e => deleteRound(e, r.id)} title="Delete round">🗑</button>
                  </div>
                  {(() => {
                    const hs = roundHoleStats[r.id];
                    if (!hs) return null;
                    const chips = [];
                    if (hs.attempted_holes > 0) {
                      chips.push(`${hs.gir_count}/${hs.attempted_holes} GIR`);
                    }
                    if (hs.fw_holes > 0) {
                      chips.push(`${hs.fw_hit}/${hs.fw_holes} Fairways`);
                    }
                    if (hs.putt_holes > 0) {
                      chips.push(`${(hs.total_putts / hs.putt_holes).toFixed(1)} putts/hole`);
                    }
                    if (!chips.length) return null;
                    return (
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",paddingTop:10}}>
                        {chips.map(c => (
                          <span key={c} style={{background:"#EEE9DF",borderRadius:8,padding:"3px 9px",fontSize:11,fontWeight:600,color:"var(--text-mid)"}}>
                            {c}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                  {r.historical && !r.sent_to_coach && coaches.length > 0 && (
                    <div style={{paddingTop:10}}>
                      <button
                        onClick={e => sendHistToCoach(e, r.id)}
                        style={{
                          width:"100%", background:"var(--gold)", border:"none", borderRadius:10,
                          padding:"10px 14px", fontFamily:"'Outfit',sans-serif", fontSize:13,
                          fontWeight:700, color:"var(--green-dark)", cursor:"pointer",
                        }}
                      >
                        Send to coach →
                      </button>
                    </div>
                  )}
                  {r.coach_note && (
                    <div className="coach-note-block">
                      <div className="coach-note-from">📝 Coach note:</div>
                      <div className="coach-note-text">{r.coach_note}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {rounds.filter(r => r.historical).length < 5 && (
          <button className="hist-btn" onClick={() => openHistModal(null)}>
            📅 Add a historical round
          </button>
        )}

        {rounds.length === 0 && (
          <div className="empty-rounds">
            <div className="empty-icon">🏌️</div>
            <div className="empty-title">No rounds yet</div>
            <div className="empty-sub">Tap "Start new round" above to log your first round at Greenock.</div>
          </div>
        )}
      </div>

      {showAddCoachModal && (
        <div className="modal-backdrop" onClick={() => setShowAddCoachModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add a coach</div>
            <form onSubmit={addCoach}>
              <div className="modal-field">
                <label className="modal-label">Invite code</label>
                <input
                  className="modal-input"
                  placeholder="Enter invite code from your coach"
                  value={addCoachCode}
                  onChange={e => setAddCoachCode(e.target.value.toUpperCase())}
                  autoFocus
                />
              </div>
              {addCoachError && (
                <div style={{fontSize:13,color:"var(--red)",marginBottom:12,padding:"8px 12px",background:"#FEF2F2",borderRadius:8}}>
                  {addCoachError}
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="modal-cancel" onClick={() => setShowAddCoachModal(false)}>Cancel</button>
                <button type="submit" className="modal-submit" disabled={!addCoachCode.trim() || addCoachSaving}>
                  {addCoachSaving ? "Linking…" : "Link coach"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {unlinkCoachId && (
        <div className="modal-backdrop" onClick={() => setUnlinkCoachId(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Remove coach?</div>
            <p style={{fontSize:14,color:"var(--text-mid)",marginBottom:24,lineHeight:1.6}}>
              {(() => { const c = coaches.find(x => x.id === unlinkCoachId); return `Remove ${c?.first_name} ${c?.last_name} as your coach? They will no longer receive your rounds.`; })()}
            </p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setUnlinkCoachId(null)}>Cancel</button>
              <button className="modal-submit" style={{background:"var(--red)"}} onClick={() => unlinkCoach(unlinkCoachId)}>
                Remove coach
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistModal && (
        <div className="modal-backdrop" onClick={closeHistModal}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{histEditId ? "Edit Historical Round" : "Add Historical Round"}</div>

            {/* ── Section 1: Round details ── */}
            {histEditId ? (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                <div>
                  <div className="modal-label">Course</div>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--text)",paddingTop:4}}>
                    {histForm.course_id === "89e2ad4e-8d5a-4244-8568-b2c8a448a77f" ? "Wee Course" : "Big Course"}
                  </div>
                </div>
                <div>
                  <div className="modal-label">Date played</div>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--text)",paddingTop:4}}>
                    {histForm.date ? new Date(histForm.date + "T12:00:00").toLocaleDateString("en-GB", {weekday:"short",day:"numeric",month:"short",year:"numeric"}) : ""}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="modal-field">
                  <label className="modal-label">Course</label>
                  <select className="modal-input" value={histForm.course_id}
                    onChange={e => { const cid = e.target.value; setHistForm(f=>({...f,course_id:cid})); setHistHoles(initHistHoles(cid)); }}>
                    <option value="89e2ad4e-8d5a-4244-8568-b2c8a448a77f">Wee Course — 9 holes</option>
                    <option value="b1a2c3d4-e5f6-7890-abcd-ef1234567890">Big Course — 18 holes</option>
                  </select>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                  <div>
                    <label className="modal-label">Date played</label>
                    <input className="modal-input" type="date"
                      max={new Date().toISOString().split("T")[0]}
                      value={histForm.date}
                      onChange={e => setHistForm(f=>({...f,date:e.target.value}))} />
                  </div>
                  <div>
                    <label className="modal-label">Note <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label>
                    <input className="modal-input" type="text" placeholder="e.g. played well"
                      value={histForm.note}
                      onChange={e => setHistForm(f=>({...f,note:e.target.value}))} />
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                  <div>
                    <label className="modal-label">Course handicap <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label>
                    <input className="modal-input" type="number" min="0" max="54" step="1" placeholder="e.g. 18"
                      value={histForm.course_handicap}
                      onChange={e => setHistForm(f=>({...f,course_handicap:e.target.value}))} />
                  </div>
                  <div>
                    <label className="modal-label">WHS index <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label>
                    <input className="modal-input" type="number" min="0" max="54" step="0.1" placeholder="e.g. 14.2"
                      value={histForm.whs_index}
                      onChange={e => setHistForm(f=>({...f,whs_index:e.target.value}))} />
                  </div>
                </div>
              </>
            )}
            {histEditId && (
              <>
                <div className="modal-field">
                  <label className="modal-label">Note <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label>
                  <input className="modal-input" type="text" placeholder="e.g. played well"
                    value={histForm.note}
                    onChange={e => setHistForm(f=>({...f,note:e.target.value}))} />
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                  <div>
                    <label className="modal-label">Course handicap <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label>
                    <input className="modal-input" type="number" min="0" max="54" step="1" placeholder="e.g. 18"
                      value={histForm.course_handicap}
                      onChange={e => setHistForm(f=>({...f,course_handicap:e.target.value}))} />
                  </div>
                  <div>
                    <label className="modal-label">WHS index <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label>
                    <input className="modal-input" type="number" min="0" max="54" step="0.1" placeholder="e.g. 14.2"
                      value={histForm.whs_index}
                      onChange={e => setHistForm(f=>({...f,whs_index:e.target.value}))} />
                  </div>
                </div>
              </>
            )}

            {/* ── Section 2: Hole by hole ── */}
            <div className="hist-section">
              <div className="modal-label" style={{marginBottom:8}}>Hole by hole</div>

              {histEditLoading ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"32px 0"}}>
                  <div className="big-spinner" />
                </div>
              ) : (<>

              {/* Column headers */}
              <div className="hist-col-headers">
                <div style={{width:28,flexShrink:0}} />
                <div className="hist-ch" style={{width:78,flexShrink:0}}>Score</div>
                <div className="hist-ch" style={{width:78,flexShrink:0}}>Drive</div>
                <div className="hist-ch" style={{flex:1}}>🏌️ Putts</div>
                <div className="hist-ch" style={{width:66,flexShrink:0}}>⚠️ Pen</div>
              </div>

              {histHoles.map((h, i) => {
                const par = HIST_COURSE_HOLES[histForm.course_id][i];
                const diff = h.score - par;
                const scoreColor = diff < 0 ? "var(--gold)" : diff > 0 ? "var(--orange)" : "var(--green-mid)";
                return (
                  <div key={i} className="hist-row">
                    {/* Hole label */}
                    <div className="hist-lbl">
                      <div className="hist-lbl-n">{i+1}</div>
                      <div className="hist-lbl-p">P{par}</div>
                    </div>

                    {/* Score stepper */}
                    <div className="hist-stepper">
                      <button className="hist-sb dec" onClick={() => updateHistHole(i,{score:Math.max(1,h.score-1)})}>−</button>
                      <div className="hist-sv" style={{color:scoreColor}}>{h.score}</div>
                      <button className="hist-sb inc" onClick={() => updateHistHole(i,{score:h.score+1})}>+</button>
                    </div>

                    {/* Tee direction — hidden on par 3 */}
                    <div className="hist-group" style={{width:78,flexShrink:0,visibility:par===3?"hidden":"visible"}}>
                      {[["←","left","var(--sky)","#EEF0FE"],["↑","yes","var(--green)","#E8F4EE"],["→","right","var(--orange)","#FEF3E8"]].map(([lbl,val,ac,abg]) => (
                        <button key={val} className="hist-t"
                          onClick={() => updateHistHole(i,{fairway:h.fairway===val?null:val})}
                          style={{borderColor:h.fairway===val?ac:"var(--border)",background:h.fairway===val?abg:"white",color:h.fairway===val?ac:"var(--text-mid)"}}>
                          {lbl}
                        </button>
                      ))}
                    </div>

                    {/* Putts */}
                    <div className="hist-group" style={{flex:1}}>
                      {[[0,"0"],[1,"1"],[2,"2"],[3,"3+"]].map(([val,lbl]) => (
                        <button key={val} className="hist-t"
                          onClick={() => updateHistHole(i,{putts:val})}
                          style={{borderColor:h.putts===val?"var(--green-dark)":"var(--border)",background:h.putts===val?"var(--green-dark)":"white",color:h.putts===val?"white":"var(--text-mid)"}}>
                          {lbl}
                        </button>
                      ))}
                    </div>

                    {/* Penalty */}
                    <div className="hist-group" style={{width:66,flexShrink:0}}>
                      {[0,1,2].map(p => {
                        const sel = h.penalty === p;
                        const bc  = sel ? (p === 0 ? "var(--text-dim)" : p === 1 ? "var(--orange)" : "var(--red)") : "var(--border)";
                        const bg  = sel ? (p === 0 ? "#F0F0F0"         : p === 1 ? "#FEF3E8"       : "#FEF0F0")    : "white";
                        const col = sel ? (p === 0 ? "var(--text-mid)"  : p === 1 ? "var(--orange)"  : "var(--red)")  : "var(--text-dim)";
                        return (
                          <button key={p} className="hist-t"
                            onClick={() => updateHistHole(i,{penalty:p})}
                            style={{borderColor:bc,background:bg,color:col}}>
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Running total */}
              {(() => {
                const total = histHoles.reduce((s,h)=>s+h.score,0);
                const totalPutts = histHoles.reduce((s,h)=>s+h.putts,0);
                const coursePar = HIST_COURSE_HOLES[histForm.course_id].reduce((s,p)=>s+p,0);
                const diff = total - coursePar;
                return (
                  <div className="hist-total">
                    <span style={{fontWeight:700,color:"var(--text)"}}>
                      Total: {total}{" "}
                      <span style={{fontWeight:400,color:diff>0?"var(--orange)":diff<0?"var(--gold)":"var(--green-mid)"}}>
                        ({diff>0?"+":""}{diff})
                      </span>
                    </span>
                    <span>{totalPutts} putts</span>
                  </div>
                );
              })()}
              </>)}
            </div>

            <div className="modal-actions">
              <button className="modal-cancel" onClick={closeHistModal}>Cancel</button>
              <button className="modal-submit" disabled={histSaving || histEditLoading || !histForm.date} onClick={saveHistoricalRound}>
                {histSaving ? "Saving…" : histEditId ? "Update round" : "Save round"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
