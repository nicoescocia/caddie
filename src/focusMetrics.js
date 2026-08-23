// Focus-area follow-up loop — shared metric definitions, snapshot persistence,
// and lesson-anchored comparison. Focus areas used to be recomputed on each round
// view and never stored, so nothing could tell whether a flagged weakness improved.
// This module defines the eligible metrics, writes a snapshot per eligible metric
// when a round is sent to coach, and compares a round against the appropriate
// prior window (since the last lesson, or the last 5 rounds).
import { supabase } from "./supabaseClient";

// Penalty strokes on a hole. Mirrors the counting used in shotsVsBenchmark: an
// array of entries (one per stroke), a legacy numeric count, or a single named
// penalty. pickup_reason penalty types also count as strokes.
const PENALTY_TYPES = new Set(["Lost ball (tee)", "Lost ball (fairway)", "OOB", "Hazard", "Unplayable"]);
function penaltyStrokes(h) {
  const p = h.penalty;
  let n = 0;
  if (Array.isArray(p)) n += p.length;
  else if (p != null && p !== "None" && p !== "") {
    const num = parseInt(p, 10);
    n += isNaN(num) ? 1 : num;
  }
  if (Array.isArray(h.pickup_reason)) n += h.pickup_reason.filter(x => PENALTY_TYPES.has(x)).length;
  return n;
}

const pct = v => `${Math.round(v)}%`;

// Each metric: key, display label, compute(holes) -> { value, sample } | null,
// betterWhen (the direction that counts as improvement), minSample, and a display
// formatter. compute returns null when the round is below the minimum sample size
// so nothing downstream ever compares against a value that isn't there.
export const FOCUS_METRICS = [
  {
    key: "fairway_miss_right",
    label: "Right miss off tee",
    betterWhen: "lower",
    minSample: 4,
    minChange: 5,
    format: pct,
    compute(holes) {
      const att = holes.filter(h => !h.dna && h.par >= 4 && ["yes", "left", "right", "miss"].includes(h.fairway));
      if (att.length < 4) return null;
      const right = att.filter(h => h.fairway === "right").length;
      return { value: right / att.length * 100, sample: att.length };
    },
  },
  {
    key: "fairway_miss_left",
    label: "Left miss off tee",
    betterWhen: "lower",
    minSample: 4,
    minChange: 5,
    format: pct,
    compute(holes) {
      const att = holes.filter(h => !h.dna && h.par >= 4 && ["yes", "left", "right", "miss"].includes(h.fairway));
      if (att.length < 4) return null;
      const left = att.filter(h => h.fairway === "left").length;
      return { value: left / att.length * 100, sample: att.length };
    },
  },
  {
    key: "three_putt_rate",
    label: "Three-putt rate",
    betterWhen: "lower",
    minSample: 9,
    minChange: 5,
    format: pct,
    compute(holes) {
      const putted = holes.filter(h => !h.dna && !h.picked_up && h.putts != null);
      if (putted.length < 9) return null;
      const three = putted.filter(h => h.putts >= 3).length;
      return { value: three / putted.length * 100, sample: putted.length };
    },
  },
  {
    key: "gir_rate",
    label: "Greens in regulation",
    betterWhen: "higher",
    minSample: 9,
    minChange: 5,
    format: pct,
    compute(holes) {
      const att = holes.filter(h => !h.dna);
      if (att.length < 9) return null;
      const gir = att.filter(h => h.gir).length;
      return { value: gir / att.length * 100, sample: att.length };
    },
  },
  {
    key: "penalty_rate",
    label: "Penalty strokes / 18",
    betterWhen: "lower",
    minSample: 9,
    minChange: 0.5,
    format: v => v.toFixed(1),
    compute(holes) {
      const played = holes.filter(h => !h.dna);
      if (played.length < 9) return null;
      const strokes = holes.reduce((s, h) => s + penaltyStrokes(h), 0);
      return { value: strokes * 18 / played.length, sample: played.length };
    },
  },
  {
    key: "up_and_down_rate",
    label: "Up-and-down conversion",
    betterWhen: "higher",
    minSample: 5,
    minChange: 5,
    format: pct,
    compute(holes) {
      const missed = holes.filter(h => !h.dna && !h.picked_up && !h.gir);
      if (missed.length < 5) return null;
      const saved = missed.filter(h => h.score != null && h.par != null && h.score <= h.par).length;
      return { value: saved / missed.length * 100, sample: missed.length };
    },
  },
  {
    key: "par3_gir_rate",
    label: "Par 3 greens hit",
    betterWhen: "higher",
    minSample: 3,
    minChange: 5,
    format: pct,
    compute(holes) {
      const par3 = holes.filter(h => !h.dna && h.par === 3);
      if (par3.length < 3) return null;
      const gir = par3.filter(h => h.gir).length;
      return { value: gir / par3.length * 100, sample: par3.length };
    },
  },
  {
    key: "shots_inside_50_multi",
    label: "Multi-shot short game",
    betterWhen: "lower",
    minSample: 5,
    minChange: 5,
    format: pct,
    compute(holes) {
      // Only eligible when the round actually recorded shots-inside-50 data.
      // Quick-log rounds never do, so this metric stays ineligible for them.
      const hasData = holes.some(h => h.shots_inside_50 != null);
      const missed = holes.filter(h => !h.dna && !h.picked_up && !h.gir);
      if (!hasData || missed.length < 5) return null;
      const multi = missed.filter(h => (h.shots_inside_50 || 1) > 1).length;
      return { value: multi / missed.length * 100, sample: missed.length };
    },
  },
];

const METRIC_BY_KEY = Object.fromEntries(FOCUS_METRICS.map(m => [m.key, m]));

function fmtLessonDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Compute one snapshot per eligible metric for a sent round and insert them.
// Fire-and-forget: every failure is logged and swallowed so a snapshot problem
// can never block the send-to-coach flow.
export async function writeFocusSnapshots(studentId, roundId) {
  try {
    const { data: holes, error } = await supabase.from("round_holes").select("*").eq("round_id", roundId);
    if (error) { console.error("[focus] holes fetch failed for snapshots:", error); return; }
    if (!holes || holes.length === 0) return;
    const rows = [];
    for (const m of FOCUS_METRICS) {
      const r = m.compute(holes);
      if (r && Number.isFinite(r.value)) {
        rows.push({
          student_id: studentId,
          round_id: roundId,
          metric: m.key,
          value: Math.round(r.value * 100) / 100,
          sample_size: r.sample,
        });
      }
    }
    if (rows.length === 0) return;
    const { error: insErr } = await supabase.from("focus_snapshots").insert(rows);
    if (insErr) console.error("[focus] snapshot insert failed:", insErr);
  } catch (e) {
    console.error("[focus] snapshot write failed:", e);
  }
}

// Pure comparison core. Given the round, its holes, all of the student's
// snapshots, and their lessons, return one comparison per metric that has a
// current value and at least 2 prior snapshots in the relevant window.
// voice: "second" (student-facing, "your") or "third" (coach-facing — the student
// is not the reader, so drop "your"; the student's name is already in context).
export function computeFocusComparisons({ round, currentHoles, snapshots, lessons, voice = "second" }) {
  if (!round || !currentHoles) return [];

  // Current-round value for each eligible metric.
  const currentVals = {};
  for (const m of FOCUS_METRICS) {
    const r = m.compute(currentHoles);
    if (r && Number.isFinite(r.value)) currentVals[m.key] = r.value;
  }

  const boundaryTs = new Date(round.sent_at || round.created_at).getTime();
  const roundDay = (round.sent_at || round.created_at || "").slice(0, 10);

  // Comparison boundary: the student's most recent completed lesson before the round.
  const lesson = (lessons || [])
    .filter(l => l.status === "completed" && l.lesson_date && l.lesson_date < roundDay)
    .sort((a, b) => (a.lesson_date < b.lesson_date ? 1 : -1))[0] || null;
  const lessonTs = lesson ? new Date(lesson.lesson_date + "T00:00:00").getTime() : null;

  // Prior snapshots for this student — never the current round, always before it,
  // and (when a lesson anchors the window) not before that lesson. Newest first.
  const priorSnaps = (snapshots || [])
    .filter(s => s.round_id !== round.id)
    .filter(s => new Date(s.created_at).getTime() < boundaryTs)
    .filter(s => lessonTs == null || new Date(s.created_at).getTime() >= lessonTs)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const byMetric = {};
  for (const s of priorSnaps) (byMetric[s.metric] = byMetric[s.metric] || []).push(s);

  const windowLabel = lesson
    ? (voice === "third" ? `since lesson on ${fmtLessonDate(lesson.lesson_date)}` : `since your lesson on ${fmtLessonDate(lesson.lesson_date)}`)
    : (voice === "third" ? "vs last 5 rounds" : "vs your last 5 rounds");

  const out = [];
  for (const m of FOCUS_METRICS) {
    if (!(m.key in currentVals)) continue;
    let list = byMetric[m.key] || [];
    // No lesson boundary: fall back to the previous 5 rounds with this metric.
    if (!lesson) list = list.slice(0, 5);
    // Never show a trend off a single prior data point.
    if (list.length < 2) continue;
    const priorAvg = list.reduce((s, x) => s + Number(x.value), 0) / list.length;
    const current = currentVals[m.key];
    const rawChange = current - priorAvg;
    // Suppress no-change rows: below a per-metric threshold the movement isn't
    // meaningful and shouldn't render as a trend at all (e.g. 0% to 0%).
    if (Math.abs(rawChange) < m.minChange) continue;
    const improved = m.betterWhen === "lower" ? rawChange < 0 : rawChange > 0;
    out.push({
      key: m.key,
      label: m.label,
      betterWhen: m.betterWhen,
      current,
      priorAvg,
      change: Math.abs(rawChange),
      rawChange,
      improved,
      windowLabel,
      priorRounds: list.length,
      currentLabel: m.format(current),
      priorLabel: m.format(priorAvg),
      movement: `${m.format(priorAvg)} to ${m.format(current)}`,
    });
  }
  return out;
}

// Async convenience wrapper for callers that hold a single round (the coach round
// detail). Fetches the round's holes (unless provided), the student's snapshots,
// and their lessons, then delegates to computeFocusComparisons.
export async function getFocusComparison(studentId, round, holesOverride = null, voice = "second") {
  try {
    let currentHoles = holesOverride;
    if (!currentHoles) {
      const { data } = await supabase.from("round_holes").select("*").eq("round_id", round.id);
      currentHoles = data || [];
    }
    const [{ data: snaps }, { data: lessons }] = await Promise.all([
      supabase.from("focus_snapshots").select("metric, value, round_id, created_at").eq("student_id", studentId),
      supabase.from("lessons").select("lesson_date, status").eq("student_id", studentId),
    ]);
    return computeFocusComparisons({ round, currentHoles, snapshots: snaps || [], lessons: lessons || [], voice });
  } catch (e) {
    console.error("[focus] comparison failed:", e);
    return [];
  }
}

// Pick the headline comparison: the most improved metric if any improved,
// otherwise the largest decline. Returns null when there are no comparisons.
export function headlineComparison(comparisons) {
  if (!comparisons || comparisons.length === 0) return null;
  const sorted = [...comparisons].sort((a, b) => b.change - a.change);
  const improved = sorted.filter(c => c.improved);
  return improved[0] || sorted[0] || null;
}

export { METRIC_BY_KEY };
