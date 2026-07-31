// Shared goals feature — used by both CoachDashboard (editable) and
// StudentDashboard (read-only). Current values are computed client-side from the
// student's recent rounds; nothing here is payment-gated.
import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

export const GOAL_TYPES = {
  handicap:        { label: "Handicap",       lowerBetter: true,  decimals: 1, suffix: "" },
  putts_per_round: { label: "Putts per hole", lowerBetter: true,  decimals: 2, suffix: "" },
  gir_pct:         { label: "GIR %",          lowerBetter: false, decimals: 0, suffix: "%" },
  fairways_pct:    { label: "Fairways %",     lowerBetter: false, decimals: 0, suffix: "%" },
  three_putt_pct:  { label: "3-putt %",       lowerBetter: true,  decimals: 0, suffix: "%" },
};

export const GOAL_ORDER = ["handicap", "putts_per_round", "gir_pct", "fairways_pct", "three_putt_pct"];

const avg = a => a.reduce((s, x) => s + x, 0) / a.length;

export function fmtGoalValue(type, v) {
  if (v == null) return "—";
  const cfg = GOAL_TYPES[type] || {};
  return Number(v).toFixed(cfg.decimals ?? 1) + (cfg.suffix || "");
}

function fmtGoalDate(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Compute the student's current value for every goal type from recent rounds.
export async function computeGoalStats(studentId) {
  const result = { handicap: null, putts_per_round: null, gir_pct: null, fairways_pct: null, three_putt_pct: null };
  if (!studentId) return result;

  // Handicap = most recent round carrying a WHS index.
  const { data: whsRows } = await supabase
    .from("rounds").select("whs_index")
    .eq("student_id", studentId).eq("sent_to_coach", true)
    .not("whs_index", "is", null)
    .order("created_at", { ascending: false }).limit(1);
  if (whsRows && whsRows[0]) result.handicap = whsRows[0].whs_index;

  // Last 5 completed rounds drive the remaining stats.
  const { data: roundsData } = await supabase
    .from("rounds").select("id, total_putts, holes_played")
    .eq("student_id", studentId).eq("sent_to_coach", true)
    .not("total_score", "is", null)
    .order("created_at", { ascending: false }).limit(5);
  const last5 = roundsData || [];
  if (!last5.length) return result;

  const puttVals = last5.filter(r => r.total_putts != null && r.holes_played)
    .map(r => r.total_putts / r.holes_played);
  if (puttVals.length) result.putts_per_round = avg(puttVals);

  const ids = last5.map(r => r.id);
  const { data: rh } = await supabase
    .from("round_holes").select("round_id, gir, fairway, putts, par, dna, picked_up")
    .in("round_id", ids);
  const holes = rh || [];

  const girPcts = [], fwPcts = [];
  let tpCount = 0, tpTotal = 0;
  for (const rid of ids) {
    const rHoles = holes.filter(h => h.round_id === rid);
    const attempted = rHoles.filter(h => !h.dna);
    if (attempted.length) {
      girPcts.push(attempted.filter(h => h.gir).length / attempted.length * 100);
      const fwHoles = attempted.filter(h => h.par >= 4);
      if (fwHoles.length) fwPcts.push(fwHoles.filter(h => h.fairway === "yes").length / fwHoles.length * 100);
    }
    for (const h of rHoles) {
      if (h.dna || h.picked_up || h.putts == null) continue;
      tpTotal++;
      if (h.putts >= 3) tpCount++;
    }
  }
  if (girPcts.length) result.gir_pct = avg(girPcts);
  if (fwPcts.length)  result.fairways_pct = avg(fwPcts);
  if (tpTotal)        result.three_putt_pct = tpCount / tpTotal * 100;

  return result;
}

// Progress from baseline → target given the current value. Direction-agnostic:
// works whether the metric improves by going up (GIR) or down (handicap).
export function goalProgress(goal, current) {
  const cfg = GOAL_TYPES[goal.goal_type] || {};
  const { baseline_value: baseline, target_value: target } = goal;
  let pct = 0;
  if (current == null) {
    pct = 0;
  } else if (baseline == null || baseline === target) {
    pct = (cfg.lowerBetter ? current <= target : current >= target) ? 100 : 0;
  } else {
    pct = ((current - baseline) / (target - baseline)) * 100;
  }
  pct = Math.max(0, Math.min(100, pct));
  const achieved = current != null && (cfg.lowerBetter ? current <= target : current >= target);
  return { pct, achieved };
}

export function GoalDisplay({ goal, current }) {
  const cfg = GOAL_TYPES[goal.goal_type] || { label: goal.goal_type };
  const { pct, achieved } = goalProgress(goal, current);
  const done = achieved || goal.status === "achieved";
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{cfg.label}</span>
        {done
          ? <span style={{ fontSize: 10, fontWeight: 700, color: "white", background: "var(--green-mid)", borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap" }}>✓ Achieved</span>
          : goal.target_date ? <span style={{ fontSize: 11, color: "var(--text-dim)", whiteSpace: "nowrap" }}>by {fmtGoalDate(goal.target_date)}</span> : null}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-mid)", marginBottom: 8 }}>
        {fmtGoalValue(goal.goal_type, goal.baseline_value)} → <strong>{fmtGoalValue(goal.goal_type, goal.target_value)}</strong>
        <span style={{ color: "var(--text-dim)" }}> · now {fmtGoalValue(goal.goal_type, current)}</span>
      </div>
      <div style={{ height: 7, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: pct + "%", background: done ? "var(--green-mid)" : "var(--green)", borderRadius: 4, transition: "width .3s" }} />
      </div>
    </div>
  );
}

// Full goals section. Coach passes editable=true (and coachId); the student
// passes editable=false (coachId omitted) and only reads their own goals.
export function GoalsSection({ coachId, studentId, editable }) {
  const [goals, setGoals]     = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState({ goal_type: "handicap", target_value: "", target_date: "" });
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    if (!studentId) { setLoading(false); return; }
    const stat = await computeGoalStats(studentId);
    let q = supabase.from("goals").select("*")
      .eq("student_id", studentId)
      .in("status", ["active", "achieved"])
      .order("created_at", { ascending: false });
    if (coachId) q = q.eq("coach_id", coachId);
    const { data } = await q;
    let list = data || [];

    // Only the coach can persist status changes (RLS). Mark any goal whose
    // current value has reached target as achieved.
    if (editable) {
      const nowAchieved = list.filter(g => g.status === "active" && goalProgress(g, stat[g.goal_type]).achieved);
      if (nowAchieved.length) {
        await Promise.all(nowAchieved.map(g =>
          supabase.from("goals").update({ status: "achieved", achieved_at: new Date().toISOString() }).eq("id", g.id)
        ));
        const ids = new Set(nowAchieved.map(g => g.id));
        list = list.map(g => (ids.has(g.id) ? { ...g, status: "achieved" } : g));
      }
    }

    setStats(stat);
    setGoals(list);
    setLoading(false);
  }, [studentId, coachId, editable]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    const type = form.goal_type;
    const target = parseFloat(form.target_value);
    if (isNaN(target)) return;
    setSaving(true);
    const baseline = stats ? stats[type] : null;
    await supabase.from("goals").insert({
      coach_id:       coachId,
      student_id:     studentId,
      goal_type:      type,
      target_value:   target,
      target_date:    form.target_date || null,
      baseline_value: baseline != null ? Math.round(baseline * 100) / 100 : null,
      status:         "active",
    });
    setForm({ goal_type: "handicap", target_value: "", target_date: "" });
    setSaving(false);
    load();
  }

  async function remove(id) {
    await supabase.from("goals").delete().eq("id", id);
    setGoals(prev => prev.filter(g => g.id !== id));
  }

  if (loading) return null;
  // Students only see the section once a coach has actually set a goal.
  if (!editable && goals.length === 0) return null;

  const inputStyle = { border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "var(--text)", background: "white", width: "100%" };
  const currentForType = stats ? stats[form.goal_type] : null;

  return (
    <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 14, padding: "16px 18px", marginTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-dim)", marginBottom: 12 }}>
        🎯 {editable ? "Set a goal" : "My goals"}
      </div>

      {editable && (
        <div style={{ marginBottom: goals.length ? 16 : 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <select style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none" }} value={form.goal_type} onChange={e => setForm(f => ({ ...f, goal_type: e.target.value }))}>
              {GOAL_ORDER.map(k => <option key={k} value={k}>{GOAL_TYPES[k].label}</option>)}
            </select>
            <input style={inputStyle} type="number" step="any" inputMode="decimal" placeholder="Target value" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
            <input style={inputStyle} type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
            <button onClick={save} disabled={saving || form.target_value === ""} style={{ background: "var(--green)", color: "white", border: "none", borderRadius: 8, padding: "9px 18px", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: (saving || form.target_value === "") ? 0.6 : 1, whiteSpace: "nowrap" }}>
              {saving ? "Saving…" : "Save goal"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 8 }}>
            Current {GOAL_TYPES[form.goal_type].label}: {fmtGoalValue(form.goal_type, currentForType)} — saved as the baseline.
          </div>
        </div>
      )}

      {goals.length === 0
        ? <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{editable ? "No goals set yet." : "No goals set by your coach yet."}</div>
        : goals.map(g => (
            <div key={g.id} style={{ position: "relative" }}>
              <GoalDisplay goal={g} current={stats ? stats[g.goal_type] : null} />
              {editable && (
                <button onClick={() => remove(g.id)} aria-label="Remove goal" style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: "var(--text-dim)", fontSize: 15, lineHeight: 1, cursor: "pointer", padding: 2 }}>✕</button>
              )}
            </div>
          ))}
    </div>
  );
}
