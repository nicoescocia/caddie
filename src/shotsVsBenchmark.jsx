// "Shots vs Benchmark" — ranks where a student loses the most shots relative to
// the benchmark for their WHS handicap range. All values are computed directly
// from round data (no AI). Estimates only — not strokes gained.
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const HANDICAP_BENCHMARKS = {
  0:  { proximity_u25: 8,  scrambling: 54, gir: 57, fairways: 57, putts_per_round: 31, penaltiesPerRound: 0.3 },
  5:  { proximity_u25: 10, scrambling: 47, gir: 46, fairways: 51, putts_per_round: 33, penaltiesPerRound: 0.5 },
  10: { proximity_u25: 12, scrambling: 39, gir: 37, fairways: 49, putts_per_round: 34, penaltiesPerRound: 0.8 },
  15: { proximity_u25: 14, scrambling: 34, gir: 26, fairways: 48, putts_per_round: 35, penaltiesPerRound: 1.2 },
  20: { proximity_u25: 16, scrambling: 31, gir: 22, fairways: 43, putts_per_round: 36, penaltiesPerRound: 1.8 },
  25: { proximity_u25: 18, scrambling: 25, gir: 19, fairways: 43, putts_per_round: 37, penaltiesPerRound: 2.4 },
  30: { proximity_u25: 20, scrambling: 20, gir: 15, fairways: 40, putts_per_round: 38, penaltiesPerRound: 3.0 },
};

function getBenchmark(handicap) {
  const brackets = [0, 5, 10, 15, 20, 25, 30];
  const nearest = brackets.reduce((a, b) => Math.abs(b - handicap) < Math.abs(a - handicap) ? b : a);
  return HANDICAP_BENCHMARKS[nearest];
}

// First-putt distance band -> feet. Self-contained so the module isn't coupled
// to either dashboard's parseFt.
function parseFt(v) {
  if (!v) return null;
  if (v === "<3") return 2.5;
  if (v === "<1") return 0.5;
  if (typeof v === "string" && v.endsWith("+")) return parseFloat(v) + 2;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// Shot cost per penalty type. Lost ball / OOB are stroke-and-distance (2);
// hazard and unplayable are a single stroke (1).
const PENALTY_COSTS = {
  "Lost ball (tee)":     2,
  "Lost ball (fairway)": 2,
  "OOB":                 2,
  "Hazard":              1,
  "Unplayable":          1,
};
const PENALTY_TYPES = new Set(Object.keys(PENALTY_COSTS));

// Best-effort list of penalty type entries from a hole's penalty field. Legacy
// numeric storage carries no type, so it yields untyped placeholders.
function penaltyEntries(penalty) {
  if (Array.isArray(penalty)) return penalty;
  if (penalty == null || penalty === "None" || penalty === "") return [];
  const n = parseInt(penalty, 10);
  if (!isNaN(n)) return Array(n).fill(null); // legacy numeric — count only, no type
  return [penalty];                          // single named penalty
}

// Shot cost of one penalty entry; unknown/legacy defaults to 1.
function penaltyShots(entry) {
  return PENALTY_COSTS[entry] ?? 1;
}

const AREA_NAMES = {
  penalties:  "Penalties",
  putting:    "Putting",
  proximity:  "Proximity (under 25 yds)",
  gir:        "Greens in regulation",
  scrambling: "Scrambling",
  fairways:   "Fairways",
};

const avg = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);

// rounds: last-5 round rows ({ id, holes_played, total_putts }). holesByRound:
// { roundId: [holeRow] }. whsIndex: number. Returns { whs, areas[], top, note }.
export function computeShotsVsBenchmark({ rounds, holesByRound, whsIndex }) {
  if (!rounds || rounds.length === 0 || whsIndex == null) return null;
  const bm = getBenchmark(whsIndex);

  // Per-round weighted penalty shots + putting averages, prorated to 18 holes.
  const penShotsPer18 = [], puttsPer18 = [];
  // Pooled tallies for rate/distance metrics.
  let u25Dists = [], u25HolesPer18 = [];
  let girPcts = [];
  let scrSucc = 0, scrOpp = 0;
  let fwHit = 0, fwTotal = 0;

  for (const r of rounds) {
    const holes = holesByRound[r.id] || [];
    const hp = r.holes_played || 18;
    const mult = 18 / hp;

    // 1. Penalties — weighted by type
    let penShots = 0, u25Count = 0;
    for (const h of holes) {
      const pr = Array.isArray(h.pickup_reason) ? h.pickup_reason.filter(x => PENALTY_TYPES.has(x)) : [];
      for (const e of [...penaltyEntries(h.penalty), ...pr]) {
        penShots += penaltyShots(e);
      }
      if (h.approach === "Under 25") {
        u25Count++;
        const ft = parseFt(h.putt1);
        if (ft != null) u25Dists.push(ft);
      }
    }
    penShotsPer18.push(penShots * mult);
    u25HolesPer18.push(u25Count * mult);

    // 2. Putting
    const totalPutts = r.total_putts != null
      ? r.total_putts
      : holes.reduce((s, h) => s + (h.dna || h.picked_up || h.putts == null ? 0 : h.putts), 0);
    if (totalPutts != null && hp) puttsPer18.push(totalPutts * mult);

    // 4. GIR — per-round %
    const attempted = holes.filter(h => !h.dna);
    if (attempted.length) {
      girPcts.push(attempted.filter(h => h.gir).length / attempted.length * 100);
    }

    // 5. Scrambling — pooled
    const missedGir = attempted.filter(h => !h.gir);
    for (const h of missedGir) {
      scrOpp++;
      if (!h.picked_up && h.score != null && h.par != null && h.score <= h.par) scrSucc++;
    }

    // 6. Fairways — pooled, par 4/5 only
    for (const h of attempted) {
      if ((h.par || 0) >= 4) {
        fwTotal++;
        if (h.fairway === "yes") fwHit++;
      }
    }
  }

  const areas = [];

  // 1. Penalties — weighted penalty shots vs the handicap benchmark.
  const penShotsAvg = avg(penShotsPer18);
  if (penShotsAvg != null) {
    const lost = Math.max(0, penShotsAvg - bm.penaltiesPerRound);
    areas.push({
      key: "penalties", name: AREA_NAMES.penalties,
      actualLabel: `${penShotsAvg.toFixed(1)} shots`, benchmarkLabel: `${bm.penaltiesPerRound} shots`,
      shotsLost: lost,
      explanation: `Averaging ${penShotsAvg.toFixed(1)} weighted penalty shots per round vs benchmark of ${bm.penaltiesPerRound} for your handicap.`,
    });
  }

  // 2. Putting
  const puttAvg = avg(puttsPer18);
  if (puttAvg != null) {
    const lost = Math.max(0, puttAvg - bm.putts_per_round);
    areas.push({
      key: "putting", name: AREA_NAMES.putting,
      actualLabel: `${puttAvg.toFixed(0)} putts`, benchmarkLabel: `${bm.putts_per_round}`,
      shotsLost: lost,
      explanation: `Averaging ${puttAvg.toFixed(0)} putts per 18 vs benchmark of ${bm.putts_per_round} costs approximately ${lost.toFixed(1)} shots.`,
    });
  }

  // 3. Proximity under 25 yds
  const proxAvg = avg(u25Dists);
  const u25Per18 = avg(u25HolesPer18) || 0;
  if (proxAvg != null) {
    const distGap = Math.max(0, proxAvg - bm.proximity_u25);
    const lost = (distGap / 3) * 0.15 * u25Per18;
    areas.push({
      key: "proximity", name: AREA_NAMES.proximity,
      actualLabel: `${proxAvg.toFixed(1)}ft`, benchmarkLabel: `${bm.proximity_u25}ft`,
      shotsLost: lost,
      explanation: `Averaging ${proxAvg.toFixed(1)}ft from under 25 yards vs benchmark of ${bm.proximity_u25}ft costs approximately ${lost.toFixed(1)} shots.`,
    });
  }

  // 4. GIR
  const girAvg = avg(girPcts);
  if (girAvg != null) {
    const lost = Math.max(0, bm.gir - girAvg) * 0.18;
    areas.push({
      key: "gir", name: AREA_NAMES.gir,
      actualLabel: `${girAvg.toFixed(0)}%`, benchmarkLabel: `${bm.gir}%`,
      shotsLost: lost,
      explanation: `Hitting ${girAvg.toFixed(0)}% greens vs benchmark of ${bm.gir}% costs approximately ${lost.toFixed(1)} shots.`,
    });
  }

  // 5. Scrambling
  if (scrOpp > 0) {
    const scrPct = scrSucc / scrOpp * 100;
    const lost = Math.max(0, bm.scrambling - scrPct) * 0.1;
    areas.push({
      key: "scrambling", name: AREA_NAMES.scrambling,
      actualLabel: `${scrPct.toFixed(0)}%`, benchmarkLabel: `${bm.scrambling}%`,
      shotsLost: lost,
      explanation: `Scrambling ${scrPct.toFixed(0)}% vs benchmark of ${bm.scrambling}% costs approximately ${lost.toFixed(1)} shots.`,
    });
  }

  // 6. Fairways
  if (fwTotal > 0) {
    const fwPct = fwHit / fwTotal * 100;
    const lost = Math.max(0, bm.fairways - fwPct) * 0.05;
    areas.push({
      key: "fairways", name: AREA_NAMES.fairways,
      actualLabel: `${fwPct.toFixed(0)}%`, benchmarkLabel: `${bm.fairways}%`,
      shotsLost: lost,
      explanation: `Hitting ${fwPct.toFixed(0)}% fairways vs benchmark of ${bm.fairways}% costs approximately ${lost.toFixed(1)} shots.`,
    });
  }

  // At/above benchmark (0 shots lost) sink to the bottom, biggest gap on top.
  areas.sort((a, b) => b.shotsLost - a.shotsLost);
  const top = areas.length && areas[0].shotsLost > 0.05 ? areas[0] : null;
  return {
    whs: whsIndex,
    areas,
    top,
    note: "Estimates based on benchmark averages for your handicap range. Not strokes gained.",
  };
}

// Trend of an area's shots lost vs the previous window. Improving = fewer shots
// lost now. Returns null when there is no previous-window value for the area.
function computeTrend(area, prevByKey) {
  if (!prevByKey || !(area.key in prevByKey)) return null;
  const change = area.shotsLost - prevByKey[area.key];
  const abs = Math.abs(change);
  if (abs < 0.3) return { dir: "stable", change: abs };
  return { dir: change < 0 ? "improving" : "worse", change: abs };
}

export function ShotsVsBenchmark({ rounds, whsIndex }) {
  const [holesByRound, setHolesByRound] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Current window = last 5 rounds; previous window = rounds 6–10. Fetch holes
  // for up to 10 rounds in one query, then split client-side. Newest-first
  // (defensive sort in case caller order varies).
  const sorted = (rounds || [])
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const last10   = sorted.slice(0, 10);
  const current5 = sorted.slice(0, 5);
  const prev5    = sorted.slice(5, 10);
  const idKey = last10.map(r => r.id).join(",");

  useEffect(() => {
    let cancelled = false;
    if (!last10.length || whsIndex == null) { setHolesByRound({}); return; }
    (async () => {
      const { data } = await supabase
        .from("round_holes")
        .select("round_id, approach, putt1, penalty, pickup_reason, gir, fairway, par, score, putts, dna, picked_up")
        .in("round_id", last10.map(r => r.id));
      if (cancelled) return;
      const map = {};
      for (const h of (data || [])) {
        if (!map[h.round_id]) map[h.round_id] = [];
        map[h.round_id].push(h);
      }
      setHolesByRound(map);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKey, whsIndex]);

  if (whsIndex == null || current5.length === 0 || holesByRound == null) return null;
  const result = computeShotsVsBenchmark({ rounds: current5, holesByRound, whsIndex });
  if (!result) return null;

  // Previous-window values drive the per-area trend indicators (omitted when
  // fewer than 6 rounds exist, i.e. no previous window).
  const prevResult = prev5.length ? computeShotsVsBenchmark({ rounds: prev5, holesByRound, whsIndex }) : null;
  const prevByKey = {};
  if (prevResult) prevResult.areas.forEach(a => { prevByKey[a.key] = a.shotsLost; });
  result.areas.forEach(a => { a.trend = computeTrend(a, prevResult ? prevByKey : null); });

  const maxLost = Math.max(...result.areas.map(a => a.shotsLost), 0.0001);
  const whsLabel = Number(whsIndex).toFixed(1);

  const cardStyle = { background: "white", border: "1.5px solid var(--border)", borderRadius: 14, padding: "16px 18px", marginBottom: 16 };
  const label = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-dim)", marginBottom: 2 };

  return (
    <div style={cardStyle}>
      <div style={label}>Shots vs Benchmark</div>
      <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 12 }}>
        vs benchmark for {whsLabel} WHS · last {result ? Math.min(rounds.length, 5) : 0} rounds
      </div>

      {/* Top priority card */}
      {result.top ? (
        <div style={{ background: "linear-gradient(135deg,#0F3D2E,#1A6B4A)", borderRadius: 12, padding: "14px 16px", color: "white" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 4 }}>
            Biggest priority: {result.top.name}
          </div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, marginBottom: 6 }}>
            ~{result.top.shotsLost.toFixed(1)} shots per round vs benchmark
          </div>
          {result.top.trend && (
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6,
              color: result.top.trend.dir === "improving" ? "#7EE0A6" : result.top.trend.dir === "worse" ? "#FF9B9B" : "rgba(255,255,255,0.6)" }}>
              {result.top.trend.dir === "improving" ? `↑ ${result.top.trend.change.toFixed(1)} shots vs previous 5`
                : result.top.trend.dir === "worse" ? `↓ ${result.top.trend.change.toFixed(1)} shots vs previous 5`
                : "— stable vs previous 5"}
            </div>
          )}
          <div style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.85)" }}>
            {result.top.explanation}
          </div>
        </div>
      ) : (
        <div style={{ background: "var(--bg)", borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "var(--text-mid)" }}>
          You're at or above benchmark across all measured areas. Keep it up.
        </div>
      )}

      {/* Expandable full breakdown */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ marginTop: 12, background: "none", border: "none", padding: 0, fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, color: "var(--green)", cursor: "pointer" }}
      >
        {expanded ? "Hide breakdown ▲" : "See full breakdown ▾"}
      </button>

      {expanded && (
        <div style={{ marginTop: 12 }}>
          {result.areas.map(a => (
            <div key={a.key} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{a.name}</span>
                <span style={{ display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: a.shotsLost > 0.05 ? "var(--red)" : "var(--green-mid)" }}>
                    {a.shotsLost > 0.05 ? `~${a.shotsLost.toFixed(1)} shots` : "At benchmark"}
                  </span>
                  {a.trend && (
                    <span style={{ fontSize: 11, fontWeight: 700,
                      color: a.trend.dir === "improving" ? "var(--green-mid)" : a.trend.dir === "worse" ? "var(--red)" : "var(--text-dim)" }}>
                      {a.trend.dir === "improving" ? `↑ ${a.trend.change.toFixed(1)} shots`
                        : a.trend.dir === "worse" ? `↓ ${a.trend.change.toFixed(1)} shots`
                        : "— stable"}
                    </span>
                  )}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 5 }}>
                Your {a.actualLabel} vs benchmark {a.benchmarkLabel}
              </div>
              <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.max(0, a.shotsLost / maxLost * 100)}%`, background: a.shotsLost > 0.05 ? "var(--red)" : "var(--green-mid)", borderRadius: 3, transition: "width .3s" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 12, lineHeight: 1.5 }}>{result.note}</div>
    </div>
  );
}
