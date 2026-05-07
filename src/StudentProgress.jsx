import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";

const COURSE_PAR = {
  "89e2ad4e-8d5a-4244-8568-b2c8a448a77f": 32,
  "b1a2c3d4-e5f6-7890-abcd-ef1234567890": 68,
};
function getCoursePar(round) {
  if (round.total_par) return round.total_par;
  if (round.course_id && COURSE_PAR[round.course_id]) return COURSE_PAR[round.course_id];
  return round.holes_played === 18 ? 68 : 32;
}

const CACHE_TYPES = {
  first5last5: "progress_first5",
  lastmonth:   "progress_lastmonth",
  lastyear:    "progress_lastyear",
};

const MTH = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function calcStats(rounds, enrichedMap) {
  if (!rounds.length) return null;
  const scored = rounds.filter(r => r.total_score != null);
  const avgVsPar = scored.length
    ? scored.reduce((s, r) => s + (r.total_score - getCoursePar(r)) / (r.holes_played || 9), 0) / scored.length
    : null;
  const putted = rounds.filter(r => r.total_putts != null && r.total_putts > 0);
  const avgPutts = putted.length
    ? putted.reduce((s, r) => s + r.total_putts, 0) / putted.length
    : null;
  const totalAttempted = rounds.reduce((s, r) => s + (enrichedMap[r.id]?.attempted_holes || 0), 0);
  const totalGIR       = rounds.reduce((s, r) => s + (enrichedMap[r.id]?.gir_count || 0), 0);
  const girPct         = totalAttempted > 0 ? (totalGIR / totalAttempted) * 100 : null;
  const totalFwHoles   = rounds.reduce((s, r) => s + (enrichedMap[r.id]?.fw_holes || 0), 0);
  const totalFwHit     = rounds.reduce((s, r) => s + (enrichedMap[r.id]?.fw_hit || 0), 0);
  const fwPct          = totalFwHoles > 0 ? (totalFwHit / totalFwHoles) * 100 : null;
  return { avgVsPar, avgPutts, girPct, fwPct, n: rounds.length };
}

function fmtVsPar(v) {
  if (v == null) return "—";
  const f = v.toFixed(1);
  return v > 0 ? "+" + f : f;
}

function fmtN(v, dp = 1) {
  if (v == null) return "—";
  return v.toFixed(dp);
}

function delta(bef, aft, lowerBetter) {
  if (bef == null || aft == null) return null;
  const d = aft - bef;
  const improved = lowerBetter ? d < 0 : d > 0;
  return { d, improved };
}

function Arrow({ bef, aft, lowerBetter }) {
  const res = delta(bef, aft, lowerBetter);
  if (!res) return <span style={{ color: "#aaa", fontSize: 18 }}>—</span>;
  const abs = Math.abs(res.d);
  if (abs < 0.05) return <span style={{ color: "#aaa", fontSize: 16 }}>→</span>;
  return (
    <span style={{ fontSize: 16, fontWeight: 700, color: res.improved ? "#1A6B4A" : "#C94040" }}>
      {res.improved ? "▲" : "▼"}
    </span>
  );
}

function StatCard({ label, beforeVal, afterVal, beforeLabel, afterLabel, lowerBetter, format }) {
  const res = delta(beforeVal, afterVal, lowerBetter);
  const improved = res ? res.improved : null;
  const abs = res ? Math.abs(res.d) : null;
  const noChange = abs != null && abs < 0.05;
  return (
    <div style={{
      background: "white",
      border: "1.5px solid #E2DDD4",
      borderRadius: 16,
      padding: "16px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#999" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3 }}>{beforeLabel}</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: "#555" }}>
            {format(beforeVal)}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Arrow bef={beforeVal} aft={afterVal} lowerBetter={lowerBetter} />
          {res && !noChange && (
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: improved ? "#1A6B4A" : "#C94040",
              background: improved ? "#E8F4EE" : "#FEE8E8",
              borderRadius: 6,
              padding: "2px 6px",
            }}>
              {improved === true
                ? (lowerBetter ? "-" : "+") + Math.abs(res.d).toFixed(1)
                : (lowerBetter ? "+" : "-") + Math.abs(res.d).toFixed(1)
              }
            </div>
          )}
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3 }}>{afterLabel}</div>
          <div style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 22,
            color: noChange ? "#555" : improved ? "#1A6B4A" : "#C94040",
            fontWeight: 700,
          }}>
            {format(afterVal)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function StudentProgress({ user, profile, studentProfile, onBack, isCoachView }) {
  const displayProfile = studentProfile || profile;
  const studentId      = displayProfile?.id || user?.id;
  const isPremium      = !isCoachView && !!profile?.is_premium;

  const [loading, setLoading]         = useState(true);
  const [rounds, setRounds]           = useState([]);
  const [enrichedMap, setEnrichedMap] = useState({});
  const [enriching, setEnriching]     = useState(false);
  const [mode, setMode]               = useState("first5last5");
  const [aiResult, setAiResult]       = useState(null);
  const [aiLoading, setAiLoading]     = useState(false);
  const [shareHint, setShareHint]     = useState(false);
  const shareCardRef                  = useRef(null);

  // Load all completed rounds ascending
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("rounds")
        .select("id, student_id, course_id, holes_played, total_score, total_par, total_putts, handicap, whs_index, created_at")
        .eq("student_id", studentId)
        .not("total_score", "is", null)
        .order("created_at", { ascending: true });
      setRounds(data || []);
      setLoading(false);
    }
    load();
  }, [studentId]);

  // Comparison periods
  const now          = new Date();
  const thisYear     = now.getFullYear();
  const thisMIdx     = now.getMonth();
  const lastMIdx     = thisMIdx === 0 ? 11 : thisMIdx - 1;
  const lastMYear    = thisMIdx === 0 ? thisYear - 1 : thisYear;

  const first5          = rounds.slice(0, 5);
  const last5           = rounds.slice(-5);
  const thisMonthRounds = rounds.filter(r => { const d = new Date(r.created_at); return d.getFullYear() === thisYear && d.getMonth() === thisMIdx; });
  const lastMonthRounds = rounds.filter(r => { const d = new Date(r.created_at); return d.getFullYear() === lastMYear && d.getMonth() === lastMIdx; });
  const thisYearRounds  = rounds.filter(r => new Date(r.created_at).getFullYear() === thisYear);
  const lastYearRounds  = rounds.filter(r => new Date(r.created_at).getFullYear() === thisYear - 1);

  const modeAvail = {
    first5last5: rounds.length >= 10,
    lastmonth:   lastMonthRounds.length >= 1 && thisMonthRounds.length >= 1,
    lastyear:    lastYearRounds.length >= 1 && thisYearRounds.length >= 1,
  };
  const modeWhyNot = {
    first5last5: rounds.length < 10 ? `${10 - rounds.length} more round${10 - rounds.length === 1 ? "" : "s"} needed` : null,
    lastmonth:   !modeAvail.lastmonth ? "Rounds needed in both months" : null,
    lastyear:    !modeAvail.lastyear  ? "Rounds needed in both years"  : null,
  };

  let periodA = [], periodB = [], modeLabel = "", periodALabel = "", periodBLabel = "";
  if (mode === "first5last5" && modeAvail.first5last5) {
    periodA = first5; periodB = last5;
    modeLabel = "First 5 vs Last 5 rounds"; periodALabel = "First 5"; periodBLabel = "Last 5";
  } else if (mode === "lastmonth" && modeAvail.lastmonth) {
    periodA = lastMonthRounds; periodB = thisMonthRounds;
    modeLabel = `${MTH[lastMIdx]} vs ${MTH[thisMIdx]}`; periodALabel = MTH[lastMIdx]; periodBLabel = MTH[thisMIdx];
  } else if (mode === "lastyear" && modeAvail.lastyear) {
    periodA = lastYearRounds; periodB = thisYearRounds;
    modeLabel = `${thisYear - 1} vs ${thisYear}`; periodALabel = String(thisYear - 1); periodBLabel = String(thisYear);
  }

  // Lazy enrichment when period changes
  const periodKey = [...periodA, ...periodB].map(r => r.id).join(",");
  useEffect(() => {
    if (!periodKey) return;
    const needed = [...periodA, ...periodB].filter(r => !enrichedMap[r.id]);
    if (!needed.length) return;
    setEnriching(true);
    const ids = needed.map(r => r.id);
    supabase.from("round_holes")
      .select("round_id, gir, dna, fairway, par, putts, picked_up")
      .in("round_id", ids)
      .then(({ data: holes }) => {
        const nm = {};
        for (const id of ids) {
          const hs = (holes || []).filter(h => h.round_id === id && !h.dna);
          nm[id] = {
            gir_count:       hs.filter(h => h.gir).length,
            attempted_holes: hs.length,
            fw_hit:          hs.filter(h => h.par >= 4 && h.fairway === "yes").length,
            fw_holes:        hs.filter(h => h.par >= 4).length,
          };
        }
        setEnrichedMap(prev => ({ ...prev, ...nm }));
        setEnriching(false);
      });
  }, [periodKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset AI when mode changes
  useEffect(() => { setAiResult(null); setAiLoading(false); }, [mode]);

  const statsA = calcStats(periodA, enrichedMap);
  const statsB = calcStats(periodB, enrichedMap);
  const periodFullyEnriched = periodA.every(r => enrichedMap[r.id]) && periodB.every(r => enrichedMap[r.id]);

  // WHS index then → now
  const whsThen = [...periodA].reverse().find(r => r.whs_index != null)?.whs_index ?? periodA[0]?.handicap ?? null;
  const whsNow  = [...periodB].reverse().find(r => r.whs_index != null)?.whs_index ?? periodB[periodB.length - 1]?.handicap ?? null;

  const generateAI = useCallback(async (sA, sB, sStudentId, sModeLabel, sPeriodALabel, sPeriodBLabel, sWhsThen, sWhsNow, sPeriodIds, sCacheKey) => {
    setAiLoading(true);
    try {
      const { data: cached } = await supabase
        .from("ai_cache")
        .select("content, round_ids")
        .eq("student_id", sStudentId)
        .eq("coach_id", sStudentId)
        .eq("cache_type", sCacheKey)
        .maybeSingle();
      if (cached) {
        const cIds = [...(cached.round_ids || [])].sort();
        const match = cIds.length === sPeriodIds.length && cIds.every((id, i) => id === sPeriodIds[i]);
        if (match) {
          try { setAiResult(JSON.parse(cached.content)); setAiLoading(false); return; } catch {}
        }
      }
    } catch {}

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "progress_report",
          modeLabel: sModeLabel,
          periodALabel: sPeriodALabel,
          periodBLabel: sPeriodBLabel,
          studentFirstName: displayProfile?.first_name || "Student",
          periodA: {
            roundCount: sA.n,
            avgVsPar:   sA.avgVsPar  != null ? +sA.avgVsPar.toFixed(2)  : null,
            avgPutts:   sA.avgPutts  != null ? +sA.avgPutts.toFixed(1)  : null,
            girPct:     sA.girPct    != null ? +sA.girPct.toFixed(0)    : null,
            fwPct:      sA.fwPct     != null ? +sA.fwPct.toFixed(0)     : null,
            whsIndex:   sWhsThen,
          },
          periodB: {
            roundCount: sB.n,
            avgVsPar:   sB.avgVsPar  != null ? +sB.avgVsPar.toFixed(2)  : null,
            avgPutts:   sB.avgPutts  != null ? +sB.avgPutts.toFixed(1)  : null,
            girPct:     sB.girPct    != null ? +sB.girPct.toFixed(0)    : null,
            fwPct:      sB.fwPct     != null ? +sB.fwPct.toFixed(0)     : null,
            whsIndex:   sWhsNow,
          },
        }),
      });
      const aiData = await res.json();
      const text = aiData.content?.map(c => c.text || "").join("") || "";
      let parsed = null;
      try { parsed = JSON.parse(text); } catch {
        const m = text.match(/\{[\s\S]*?\}/);
        if (m) try { parsed = JSON.parse(m[0]); } catch {}
      }
      const result = parsed || { headline: "Keep going — your stats are heading in the right direction.", narrative: null };
      setAiResult(result);
      try {
        await supabase.from("ai_cache").upsert({
          student_id: sStudentId,
          coach_id:   sStudentId,
          cache_type: sCacheKey,
          content:    JSON.stringify(result),
          round_ids:  sPeriodIds,
        }, { onConflict: "coach_id,student_id,cache_type" });
      } catch {}
    } catch {
      setAiResult({ headline: "Keep going — your stats are heading in the right direction.", narrative: null });
    }
    setAiLoading(false);
  }, [displayProfile?.first_name]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger AI once enrichment is done
  useEffect(() => {
    if (!isPremium || isCoachView || !periodFullyEnriched || !statsA || !statsB || aiResult !== null || aiLoading) return;
    const periodIds = [...periodA, ...periodB].map(r => r.id).sort();
    generateAI(statsA, statsB, studentId, modeLabel, periodALabel, periodBLabel, whsThen, whsNow, periodIds, CACHE_TYPES[mode]);
  }, [periodFullyEnriched, !!statsA, !!statsB, mode, aiResult, aiLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleShare() {
    if (!statsA || !statsB) return;
    const name = displayProfile ? `${displayProfile.first_name} ${displayProfile.last_name?.[0] || ""}.` : "Player";
    const lines = [
      `Caddie Progress Report — ${name}`,
      modeLabel,
      whsThen != null && whsNow != null ? `Handicap: ${whsThen} → ${whsNow}` : "",
      statsA.avgVsPar != null && statsB.avgVsPar != null ? `Score avg/hole: ${fmtVsPar(statsA.avgVsPar)} → ${fmtVsPar(statsB.avgVsPar)}` : "",
      statsA.avgPutts != null && statsB.avgPutts != null ? `Putts/round: ${fmtN(statsA.avgPutts)} → ${fmtN(statsB.avgPutts)}` : "",
      statsA.girPct != null && statsB.girPct != null ? `GIR: ${fmtN(statsA.girPct, 0)}% → ${fmtN(statsB.girPct, 0)}%` : "",
      statsA.fwPct != null && statsB.fwPct != null ? `Fairways: ${fmtN(statsA.fwPct, 0)}% → ${fmtN(statsB.fwPct, 0)}%` : "",
      "",
      "Tracked with Caddie ⛳",
    ].filter(Boolean).join("\n");

    if (navigator.share) {
      navigator.share({ title: "My Caddie Progress Report", text: lines }).catch(() => {});
    } else {
      shareCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setShareHint(true);
      setTimeout(() => setShareHint(false), 4000);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F4F1EB", fontFamily: "'Outfit',sans-serif" }}>
        <div style={{ background: "#0F3D2E", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: "#C9A84C" }}>⛳ Caddie</span>
          <button onClick={onBack} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "5px 12px", fontFamily: "'Outfit',sans-serif", fontSize: 12, cursor: "pointer" }}>← Back</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
          <div style={{ width: 28, height: 28, border: "3px solid #E2DDD4", borderTopColor: "#1A6B4A", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  const completedRounds = rounds;
  const firstName = displayProfile?.first_name || "Player";

  // Teaser: fewer than 10 rounds
  if (completedRounds.length < 10) {
    const needed = 10 - completedRounds.length;
    const pct = Math.round((completedRounds.length / 10) * 100);
    return (
      <div style={{ minHeight: "100vh", background: "#F4F1EB", fontFamily: "'Outfit',sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Outfit:wght@300;400;500;600;700&display=swap'); @keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ background: "#0F3D2E", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54, position: "sticky", top: 0, zIndex: 100 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: "#C9A84C" }}>⛳ Caddie</span>
          <button onClick={onBack} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "5px 12px", fontFamily: "'Outfit',sans-serif", fontSize: 12, cursor: "pointer" }}>← Back</button>
        </div>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px" }}>
          <div style={{ background: "white", borderRadius: 20, padding: "32px 24px", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: "#1C1C1C", marginBottom: 8 }}>Progress Report</div>
            <div style={{ fontSize: 15, color: "#555", lineHeight: 1.6, marginBottom: 24 }}>
              You need <strong>{needed} more round{needed === 1 ? "" : "s"}</strong> to unlock your Progress Report.
            </div>
            <div style={{ background: "#F4F1EB", borderRadius: 100, height: 10, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", width: pct + "%", background: "#1A6B4A", borderRadius: 100, transition: "width .4s" }} />
            </div>
            <div style={{ fontSize: 13, color: "#999" }}>{completedRounds.length} / 10 rounds logged</div>
          </div>
        </div>
      </div>
    );
  }

  const statsReady = periodFullyEnriched && statsA && statsB;
  const limitedDataNotice = mode === "lastmonth" && periodB.length < 3;

  // Date range label for hero
  const firstDate = periodA[0]?.created_at;
  const lastDate  = periodB[periodB.length - 1]?.created_at;
  const fmtHeroDate = iso => iso ? new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "";

  const modeOptions = [
    { key: "first5last5", label: "First 5 vs Last 5" },
    { key: "lastmonth",   label: `${MTH[lastMIdx]} vs ${MTH[thisMIdx]}` },
    { key: "lastyear",    label: `${thisYear - 1} vs ${thisYear}` },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F4F1EB", fontFamily: "'Outfit',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Outfit:wght@300;400;500;600;700&display=swap'); @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Nav bar */}
      <div style={{ background: "#0F3D2E", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54, position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: "#C9A84C" }}>⛳ Caddie</span>
        <button onClick={onBack} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "5px 12px", fontFamily: "'Outfit',sans-serif", fontSize: 12, cursor: "pointer" }}>← Back</button>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* Hero block */}
        <div style={{ background: "#0F3D2E", borderRadius: 20, padding: "24px 22px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
            {isCoachView ? `${firstName}'s Progress` : "My Progress"}
          </div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: "white", marginBottom: 4 }}>
            {firstName}{!isCoachView && displayProfile?.last_name ? " " + displayProfile.last_name : ""}
          </div>
          {firstDate && lastDate && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>
              {fmtHeroDate(firstDate)} — {fmtHeroDate(lastDate)}
            </div>
          )}
          {(whsThen != null || whsNow != null) && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 2 }}>Handicap</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, color: "rgba(255,255,255,0.6)", lineHeight: 1 }}>
                    {whsThen != null ? Number(whsThen).toFixed(1) : "—"}
                  </span>
                  <span style={{ fontSize: 20, color: "rgba(255,255,255,0.3)" }}>→</span>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, color: "#C9A84C", lineHeight: 1 }}>
                    {whsNow != null ? Number(whsNow).toFixed(1) : "—"}
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* AI headline */}
          {isPremium && !isCoachView && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              {aiLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#C9A84C", borderRadius: "50%", animation: "spin .7s linear infinite", flexShrink: 0 }} />
                  Generating insight…
                </div>
              ) : aiResult?.headline ? (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.55, fontStyle: "italic" }}>
                  "{aiResult.headline}"
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Mode selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {modeOptions.map(opt => {
            const avail = modeAvail[opt.key];
            const active = mode === opt.key;
            return (
              <div key={opt.key} style={{ position: "relative" }}>
                <button
                  onClick={() => avail && setMode(opt.key)}
                  title={modeWhyNot[opt.key] || ""}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    border: "1.5px solid " + (active ? "#1A6B4A" : "#E2DDD4"),
                    background: active ? "#1A6B4A" : avail ? "white" : "#f7f5f0",
                    color: active ? "white" : avail ? "#1C1C1C" : "#bbb",
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: avail ? "pointer" : "not-allowed",
                    opacity: avail ? 1 : 0.65,
                    transition: "all .15s",
                  }}
                >
                  {opt.label}
                  {!avail && <span style={{ marginLeft: 5, fontSize: 11 }}>ⓘ</span>}
                </button>
              </div>
            );
          })}
        </div>

        {/* Limited data notice */}
        {limitedDataNotice && (
          <div style={{ background: "#FFF8E6", border: "1px solid #E6CC80", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#8A6A00", marginBottom: 16 }}>
            This month has limited data — results may not be representative.
          </div>
        )}

        {/* No valid mode */}
        {!periodA.length || !periodB.length ? (
          <div style={{ background: "white", border: "1.5px dashed #E2DDD4", borderRadius: 16, padding: "32px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#999" }}>Select a comparison mode above to view your stats.</div>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            {(enriching && !statsReady) ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 10, color: "#999", fontSize: 13 }}>
                <div style={{ width: 18, height: 18, border: "2px solid #E2DDD4", borderTopColor: "#1A6B4A", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                Loading stats…
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                <StatCard
                  label="Score avg / hole"
                  beforeVal={statsA?.avgVsPar}
                  afterVal={statsB?.avgVsPar}
                  beforeLabel={periodALabel}
                  afterLabel={periodBLabel}
                  lowerBetter={true}
                  format={fmtVsPar}
                />
                <StatCard
                  label="Putts / round"
                  beforeVal={statsA?.avgPutts}
                  afterVal={statsB?.avgPutts}
                  beforeLabel={periodALabel}
                  afterLabel={periodBLabel}
                  lowerBetter={true}
                  format={v => fmtN(v, 1)}
                />
                <StatCard
                  label="GIR %"
                  beforeVal={statsA?.girPct}
                  afterVal={statsB?.girPct}
                  beforeLabel={periodALabel}
                  afterLabel={periodBLabel}
                  lowerBetter={false}
                  format={v => fmtN(v, 0) + "%"}
                />
                <StatCard
                  label="Fairways %"
                  beforeVal={statsA?.fwPct}
                  afterVal={statsB?.fwPct}
                  beforeLabel={periodALabel}
                  afterLabel={periodBLabel}
                  lowerBetter={false}
                  format={v => fmtN(v, 0) + "%"}
                />
              </div>
            )}

            {/* AI narrative */}
            {isPremium && !isCoachView && (
              <div style={{ background: "white", border: "1.5px solid #E2DDD4", borderRadius: 16, padding: "16px 18px", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#C9A84C", marginBottom: 10 }}>
                  ✦ AI Analysis
                </div>
                {aiLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#999", fontSize: 13 }}>
                    <div style={{ width: 16, height: 16, border: "2px solid #E2DDD4", borderTopColor: "#1A6B4A", borderRadius: "50%", animation: "spin .7s linear infinite", flexShrink: 0 }} />
                    Generating analysis…
                  </div>
                ) : aiResult?.narrative ? (
                  <div style={{ fontSize: 14, color: "#333", lineHeight: 1.65 }}>{aiResult.narrative}</div>
                ) : aiResult ? (
                  <div style={{ fontSize: 14, color: "#999" }}>Analysis unavailable.</div>
                ) : null}
              </div>
            )}

            {!isPremium && !isCoachView && (
              <div style={{ position: "relative", marginBottom: 20 }}>
                <div style={{ filter: "blur(4px)", pointerEvents: "none", background: "white", border: "1.5px solid #E2DDD4", borderRadius: 16, padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#C9A84C", marginBottom: 10 }}>✦ AI Analysis</div>
                  <div style={{ fontSize: 14, color: "#555", lineHeight: 1.65 }}>Your short game has shown real improvement, with fewer chips needed from inside 50 yards. The biggest remaining opportunity is converting more of your longer approach shots into GIR attempts. Keep building on this momentum.</div>
                </div>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 16, background: "rgba(244,241,235,0.5)" }}>
                  <div style={{ fontSize: 18, marginBottom: 8 }}>🔒</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1C", marginBottom: 4 }}>AI Analysis — Premium</div>
                  <div style={{ fontSize: 12, color: "#777" }}>Upgrade to unlock</div>
                </div>
              </div>
            )}

            {/* Shareable card — premium students only */}
            {isPremium && !isCoachView && (
              <>
                <div ref={shareCardRef} style={{
                  background: "white",
                  borderRadius: 20,
                  padding: "24px 22px",
                  marginBottom: 12,
                  border: "1.5px solid #E2DDD4",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, color: "#C9A84C", letterSpacing: ".04em" }}>⛳ Caddie Progress Report</div>
                    <div style={{ fontSize: 12, color: "#999" }}>{modeLabel}</div>
                  </div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: "#1C1C1C", marginBottom: 4 }}>
                    {firstName} {displayProfile?.last_name?.[0] || ""}.
                  </div>
                  {(whsThen != null || whsNow != null) && (
                    <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
                      Handicap: <strong>{whsThen != null ? Number(whsThen).toFixed(1) : "—"}</strong> → <strong style={{ color: "#1A6B4A" }}>{whsNow != null ? Number(whsNow).toFixed(1) : "—"}</strong>
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Score avg/hole", a: fmtVsPar(statsA?.avgVsPar), b: fmtVsPar(statsB?.avgVsPar), imp: statsA?.avgVsPar != null && statsB?.avgVsPar != null && statsB.avgVsPar < statsA.avgVsPar },
                      { label: "Putts/round",    a: fmtN(statsA?.avgPutts),     b: fmtN(statsB?.avgPutts),     imp: statsA?.avgPutts != null && statsB?.avgPutts != null && statsB.avgPutts < statsA.avgPutts },
                      { label: "GIR %",          a: fmtN(statsA?.girPct, 0)+"%",b: fmtN(statsB?.girPct, 0)+"%",imp: statsA?.girPct != null && statsB?.girPct != null && statsB.girPct > statsA.girPct },
                      { label: "Fairways %",     a: fmtN(statsA?.fwPct, 0)+"%", b: fmtN(statsB?.fwPct, 0)+"%", imp: statsA?.fwPct != null && statsB?.fwPct != null && statsB.fwPct > statsA.fwPct },
                    ].map(item => (
                      <div key={item.label} style={{ background: "#F4F1EB", borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>{item.label}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700 }}>
                          <span style={{ color: "#aaa" }}>{item.a}</span>
                          <span style={{ color: "#ccc", fontSize: 11 }}>→</span>
                          <span style={{ color: item.imp ? "#1A6B4A" : "#C94040" }}>{item.b}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleShare}
                  style={{ width: "100%", background: "#0F3D2E", border: "none", borderRadius: 14, padding: "14px", fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, color: "white", cursor: "pointer", marginBottom: 8 }}
                >
                  Share / Screenshot
                </button>
                {shareHint && (
                  <div style={{ textAlign: "center", fontSize: 12, color: "#777", marginBottom: 12 }}>
                    Scroll up to the card above, then take a screenshot to share.
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
