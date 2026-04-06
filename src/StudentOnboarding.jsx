import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const HIST_COURSE_HOLES = {
  "89e2ad4e-8d5a-4244-8568-b2c8a448a77f": [4,4,3,4,3,4,4,3,3],
  "b1a2c3d4-e5f6-7890-abcd-ef1234567890": [4,4,3,4,5,4,3,4,4,3,4,4,3,4,4,3,4,4],
};
function initHistHoles(courseId) {
  return (HIST_COURSE_HOLES[courseId] || []).map(par => ({ score: par, fairway: null, putts: 2, penalty: 0 }));
}

const PUTT_OPTIONS = [
  { value: "first_only", label: "First putt only",   desc: "Record the distance of your first putt only.", premiumOnly: false },
  { value: "standard",   label: "Standard",           desc: "First putt distance always. On 3-putts, record second putt distance too.", premiumOnly: false },
  { value: "full",       label: "Full distances",     desc: "Record a distance for every single putt.", premiumOnly: true },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  :root {
    --green-dark:#0F3D2E; --green:#1A6B4A; --green-mid:#2A8A60; --green-light:#3DAA78;
    --grass:#52C97A; --bg:#F4F1EB; --gold:#C9A84C; --red:#C94040; --orange:#D4763A;
    --sky:#4A90D9; --text:#1C1C1C; --text-mid:#555; --text-dim:#999; --border:#E2DDD4;
    --shadow:0 2px 16px rgba(0,0,0,0.08);
  }
  body { font-family:'Outfit',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }

  .ob-page { min-height:100dvh; }
  .ob-header { background:white; position:sticky; top:0; z-index:100; border-bottom:1px solid var(--border); }
  .ob-header-inner { padding:14px 20px 11px; display:flex; align-items:center; justify-content:space-between; }
  .ob-logo { font-family:'Playfair Display',serif; font-size:20px; color:var(--green-dark); }
  .ob-step-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-dim); }
  .ob-progress-track { height:6px; background:var(--border); }
  .ob-progress-fill { height:6px; background:var(--green); transition:width .4s cubic-bezier(.4,0,.2,1); }

  .ob-wrap { max-width:480px; margin:0 auto; padding:0 20px; width:100%; }
  .ob-step { padding:32px 0; }
  .ob-step-content { }
  .ob-step-actions { margin-top:24px; }
  .ob-emoji { font-size:64px; display:block; text-align:center; margin-bottom:16px; line-height:1; }

  .ob-heading { font-family:'Playfair Display',serif; font-size:26px; color:var(--text); margin-bottom:12px; line-height:1.25; }
  .ob-body { font-size:14px; color:var(--text-mid); line-height:1.75; margin-bottom:28px; }

  .ob-primary { width:100%; background:var(--green); border:none; border-radius:14px; padding:16px; font-family:'Outfit',sans-serif; font-size:16px; font-weight:700; color:white; cursor:pointer; transition:all .2s; }
  .ob-primary:hover:not(:disabled) { background:var(--green-mid); transform:translateY(-1px); }
  .ob-primary:disabled { opacity:.55; cursor:not-allowed; transform:none; }
  .ob-secondary { width:100%; background:none; border:1.5px solid var(--border); border-radius:14px; padding:14px; font-family:'Outfit',sans-serif; font-size:15px; font-weight:600; color:var(--text-mid); cursor:pointer; transition:all .2s; margin-top:10px; }
  .ob-secondary:hover { border-color:var(--green-light); color:var(--green); background:white; }
  .ob-skip { display:block; width:100%; background:none; border:none; font-family:'Outfit',sans-serif; font-size:13px; color:var(--text-dim); cursor:pointer; padding:14px 0 0; text-align:center; }
  .ob-skip:hover { color:var(--text-mid); }

  .ob-field { margin-bottom:20px; }
  .ob-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-bottom:7px; display:block; }
  .ob-input { width:100%; padding:13px 16px; border:1.5px solid var(--border); border-radius:12px; font-family:'Outfit',sans-serif; font-size:16px; color:var(--text); background:white; outline:none; transition:border-color .15s; }
  .ob-input:focus { border-color:var(--green); }
  .ob-select { width:100%; padding:13px 40px 13px 16px; border:1.5px solid var(--border); border-radius:12px; font-family:'Outfit',sans-serif; font-size:15px; color:var(--text); background:white; outline:none; -webkit-appearance:none; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; transition:border-color .15s; }
  .ob-select:focus { border-color:var(--green); }
  .ob-toggle-link { background:none; border:none; padding:0; font-family:'Outfit',sans-serif; font-size:12px; font-weight:600; color:var(--text-dim); cursor:pointer; margin-top:7px; display:inline-block; text-decoration:underline; text-decoration-style:dotted; text-underline-offset:2px; }
  .ob-toggle-link:hover { color:var(--text-mid); }
  .ob-error { font-size:13px; color:var(--red); margin-top:10px; padding:10px 12px; background:#FEF2F2; border-radius:8px; }

  .ob-pref-section { margin-bottom:22px; }
  .ob-pref-section-lbl { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-dim); margin-bottom:10px; }
  .ob-pill-group { display:flex; flex-direction:column; gap:8px; }
  .ob-pill { border:1.5px solid var(--border); border-radius:12px; padding:12px 16px; cursor:pointer; transition:all .18s; background:white; display:flex; align-items:center; justify-content:space-between; }
  .ob-pill.active { background:var(--green-dark); border-color:var(--green-dark); }
  .ob-pill.locked { opacity:.55; cursor:not-allowed; }
  .ob-pill-left { flex:1; }
  .ob-pill-name { font-size:14px; font-weight:700; color:var(--text); display:flex; align-items:center; gap:8px; margin-bottom:3px; }
  .ob-pill.active .ob-pill-name { color:white; }
  .ob-pill-desc { font-size:12px; color:var(--text-dim); line-height:1.45; }
  .ob-pill.active .ob-pill-desc { color:rgba(255,255,255,0.6); }
  .ob-pill-check { width:20px; height:20px; border-radius:50%; background:var(--gold); display:flex; align-items:center; justify-content:center; font-size:12px; color:var(--green-dark); font-weight:700; flex-shrink:0; margin-left:10px; }
  .ob-premium-badge { background:var(--gold); color:var(--green-dark); font-size:10px; font-weight:700; padding:2px 7px; border-radius:5px; text-transform:uppercase; letter-spacing:.05em; }

  .ob-hist-count-box { background:white; border:1.5px solid var(--border); border-radius:12px; padding:14px 18px; margin-bottom:16px; display:flex; align-items:center; gap:14px; }
  .ob-hist-num { font-family:'Playfair Display',serif; font-size:32px; color:var(--text); line-height:1; }
  .ob-hist-sub { font-size:12px; color:var(--text-dim); margin-top:2px; }
  .ob-added { font-size:13px; color:var(--green-mid); font-weight:600; text-align:center; margin-top:10px; }

  .ob-modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
  .ob-modal-sheet { background:white; border-radius:20px 20px 0 0; padding:24px 20px 40px; width:100%; max-width:480px; max-height:92vh; overflow-y:auto; }
  .ob-modal-title { font-family:'Playfair Display',serif; font-size:20px; color:var(--text); margin-bottom:18px; }
  .ob-modal-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-bottom:6px; display:block; }
  .ob-modal-input { width:100%; padding:11px 14px; border:1.5px solid var(--border); border-radius:10px; font-family:'Outfit',sans-serif; font-size:15px; color:var(--text); background:white; outline:none; transition:border-color .15s; }
  .ob-modal-input:focus { border-color:var(--green); }
  .ob-modal-save { width:100%; background:var(--green); border:none; border-radius:12px; padding:14px; font-family:'Outfit',sans-serif; font-size:15px; font-weight:700; color:white; cursor:pointer; margin-top:6px; transition:background .2s; }
  .ob-modal-save:hover:not(:disabled) { background:var(--green-mid); }
  .ob-modal-save:disabled { background:#C8C4BB; cursor:not-allowed; }
  .ob-modal-cancel { width:100%; background:none; border:1.5px solid var(--border); border-radius:12px; padding:12px; font-family:'Outfit',sans-serif; font-size:14px; font-weight:600; color:var(--text-mid); cursor:pointer; margin-top:8px; }

  .ob-hist-section { padding-top:12px; border-top:1.5px solid var(--border); margin-bottom:6px; }
  .ob-hist-col-headers { display:flex; gap:6px; padding-bottom:5px; border-bottom:1.5px solid var(--border); }
  .ob-hist-ch { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--text-dim); text-align:center; }
  .ob-hist-row { display:flex; gap:6px; align-items:center; padding:5px 0; border-bottom:1px solid var(--border); }
  .ob-hist-row:last-of-type { border-bottom:none; }
  .ob-hist-lbl { width:28px; flex-shrink:0; }
  .ob-hist-lbl-n { font-size:12px; font-weight:700; color:var(--text); }
  .ob-hist-lbl-p { font-size:10px; color:var(--text-dim); }
  .ob-hist-stepper { display:flex; flex-shrink:0; }
  .ob-hist-sb { width:24px; height:30px; border:1.5px solid var(--border); background:white; color:var(--green); font-size:18px; font-weight:300; cursor:pointer; display:flex; align-items:center; justify-content:center; font-family:'Outfit',sans-serif; flex-shrink:0; }
  .ob-hist-sb.dec { border-radius:6px 0 0 6px; }
  .ob-hist-sb.inc { border-radius:0 6px 6px 0; }
  .ob-hist-sv { width:30px; height:30px; border-top:1.5px solid var(--border); border-bottom:1.5px solid var(--border); background:white; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; }
  .ob-hist-group { display:flex; gap:3px; }
  .ob-hist-t { height:28px; border:1.5px solid var(--border); border-radius:6px; background:white; font-family:'Outfit',sans-serif; font-size:11px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; flex:1; min-width:0; padding:0 2px; color:var(--text-mid); transition:all .1s; }
  .ob-hist-total { display:flex; justify-content:space-between; padding:10px 2px 2px; font-size:13px; color:var(--text-mid); }

  .ob-spinner { width:26px; height:26px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:ob-spin .7s linear infinite; }
  @keyframes ob-spin { to { transform:rotate(360deg); } }
`;

export default function StudentOnboarding({ user, onComplete, onAddCourse, pendingCourseId, onClearPendingCourse }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Data loaded on mount
  const [isPremium, setIsPremium]         = useState(false);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [hasCoach, setHasCoach]           = useState(false);
  const [histCount, setHistCount]         = useState(0);

  // Step 3 — handicap
  const [hcpInput, setHcpInput] = useState("");

  // Step 4 — home course
  const [homeCourse, setHomeCourse]   = useState("");
  const [courseMode, setCourseMode]   = useState("select"); // 'select' | 'text'

  // Step 5 — preferences
  const [puttTracking, setPuttTracking]     = useState("standard");
  const [approachLogging, setApproachLogging] = useState("enabled");

  // Step 6 — link coach
  const [inviteCode, setInviteCode] = useState("");
  const [inviteError, setInviteError] = useState("");

  // Step 7 — historical rounds modal
  const [showHistModal, setShowHistModal] = useState(false);
  const [histForm, setHistForm] = useState({
    course_id: "89e2ad4e-8d5a-4244-8568-b2c8a448a77f",
    date: "", note: "", course_handicap: "", whs_index: "",
  });
  const [histHoles, setHistHoles] = useState(() => initHistHoles("89e2ad4e-8d5a-4244-8568-b2c8a448a77f"));
  const [histSaving, setHistSaving] = useState(false);
  const [lastAdded, setLastAdded]   = useState(false);

  const [saving, setSaving] = useState(false);

  // ── Initial load ──
  useEffect(() => {
    async function load() {
      const [profRes, coursesRes, coachRes, histRes] = await Promise.all([
        supabase.from("profiles").select("official_handicap, home_courses, settings, is_premium").eq("id", user.id).single(),
        supabase.from("courses").select("id, name").order("name", { ascending: true }),
        supabase.from("coach_students").select("coach_id").eq("student_id", user.id).maybeSingle(),
        supabase.from("rounds").select("id", { count: "exact", head: true }).eq("student_id", user.id).eq("historical", true),
      ]);
      const prof = profRes.data;
      setIsPremium(!!prof?.is_premium);
      if (prof?.official_handicap != null) setHcpInput(Number(prof.official_handicap).toFixed(1));
      const avail = coursesRes.data || [];
      setAvailableCourses(avail);
      const savedCourse = prof?.home_courses?.[0] || "";
      if (savedCourse) {
        setHomeCourse(savedCourse);
        const availNames = new Set(avail.map(c => c.name));
        setCourseMode(availNames.has(savedCourse) ? "select" : "text");
      }
      setPuttTracking(prof?.settings?.putt_tracking || "standard");
      setApproachLogging(prof?.settings?.approach_logging || "enabled");
      setHasCoach(!!coachRes.data);
      setHistCount(histRes.count || 0);
      setLoading(false);
    }
    load();
  }, [user.id]);

  // ── Return from CourseForm ──
  useEffect(() => {
    if (!pendingCourseId) return;
    supabase.from("courses").select("id, name").order("name", { ascending: true }).then(({ data }) => {
      if (!data) return;
      setAvailableCourses(data);
      const found = data.find(c => c.id === pendingCourseId);
      if (found) { setHomeCourse(found.name); setCourseMode("select"); }
    });
    if (onClearPendingCourse) onClearPendingCourse();
  }, [pendingCourseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step advance helpers ──
  function computeNext(from) {
    let n = from + 1;
    if (n === 6 && hasCoach) n = 7;       // already linked — skip coach step
    if (n === 7 && histCount >= 5) n = 8; // already has max rounds — skip
    return n;
  }

  async function handleNext() {
    setSaving(true);
    try {
      if (step === 3) {
        const val = parseFloat(hcpInput);
        if (!isNaN(val) && val >= 0 && val <= 54) {
          await supabase.from("profiles").update({ official_handicap: val }).eq("id", user.id);
        }
      } else if (step === 4) {
        const val = homeCourse.trim();
        if (val) await supabase.from("profiles").update({ home_courses: [val] }).eq("id", user.id);
      } else if (step === 5) {
        await supabase.from("profiles").update({
          settings: { putt_tracking: puttTracking, approach_logging: approachLogging },
        }).eq("id", user.id);
      } else if (step === 6) {
        const code = inviteCode.trim().toUpperCase();
        if (code) {
          const { data: invite } = await supabase
            .from("invites").select("id, coach_id").eq("code", code).is("used_by", null).maybeSingle();
          if (!invite) {
            setInviteError("That code doesn't look right — check with your coach.");
            setSaving(false);
            return;
          }
          await Promise.all([
            supabase.rpc("link_coach_student", { p_coach_id: invite.coach_id, p_student_id: user.id }),
            supabase.from("invites").update({ used_by: user.id, used_at: new Date().toISOString() }).eq("id", invite.id),
          ]);
          setHasCoach(true);
        }
      } else if (step === 8) {
        await supabase.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);
        onComplete();
        setSaving(false);
        return;
      }
      setStep(computeNext(step));
    } finally {
      setSaving(false);
    }
  }

  function skip() {
    setStep(computeNext(step));
  }

  // ── Historical round modal ──
  function openHistModal() {
    setHistForm({ course_id: "89e2ad4e-8d5a-4244-8568-b2c8a448a77f", date: "", note: "", course_handicap: "", whs_index: "" });
    setHistHoles(initHistHoles("89e2ad4e-8d5a-4244-8568-b2c8a448a77f"));
    setShowHistModal(true);
  }

  function updateHistHole(i, changes) {
    setHistHoles(prev => prev.map((h, idx) => idx === i ? { ...h, ...changes } : h));
  }

  async function saveHistRound() {
    if (!histForm.date) return;
    setHistSaving(true);
    const pars        = HIST_COURSE_HOLES[histForm.course_id] || [];
    const total_score = histHoles.reduce((s, h) => s + h.score, 0);
    const total_putts = histHoles.reduce((s, h) => s + h.putts, 0);
    const holeRows    = histHoles.map((h, i) => ({
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
    const histWhsIndex = histForm.whs_index       !== "" ? parseFloat(histForm.whs_index)       : null;
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
    }]).select("id").single();
    if (!roundError && roundData) {
      await supabase.from("round_holes").insert(holeRows.map(h => ({ ...h, round_id: roundData.id })));
      const newCount = histCount + 1;
      setHistCount(newCount);
      setLastAdded(true);
      setTimeout(() => setLastAdded(false), 3000);
    }
    setHistSaving(false);
    setShowHistModal(false);
  }

  // ── Progress bar ──
  const progressPct = step >= 8 ? 100 : Math.round(((step - 1) / 7) * 100);

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="ob-page">
        <div className="ob-header">
          <div className="ob-header-inner">
            <div className="ob-logo">Caddie</div>
          </div>
          <div className="ob-progress-track"><div className="ob-progress-fill" style={{ width: "0%" }} /></div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="ob-spinner" />
        </div>
      </div>
    </>
  );

  // ── Render ──
  return (
    <>
      <style>{css}</style>

      <div className="ob-page">
        {/* Header */}
        <div className="ob-header">
          <div className="ob-header-inner">
            <div className="ob-logo">Caddie</div>
            {step < 8 && (
              <div className="ob-step-label">{step} of 7</div>
            )}
          </div>
          <div className="ob-progress-track">
            <div className="ob-progress-fill" style={{ width: progressPct + "%" }} />
          </div>
        </div>

        <div className="ob-wrap">

          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <div className="ob-step">
              <div className="ob-step-content">
                <span className="ob-emoji">🏌️</span>
                <div className="ob-heading">Welcome to Caddie</div>
                <div className="ob-body">
                  Caddie is your golf data companion. Log your rounds hole by hole, track your stats over time, and give your coach everything they need to make your lessons count.
                </div>
              </div>
              <div className="ob-step-actions">
                <button className="ob-primary" onClick={handleNext} disabled={saving}>
                  Get started
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Beta ── */}
          {step === 2 && (
            <div className="ob-step">
              <div className="ob-step-content">
                <span className="ob-emoji">🧪</span>
                <div className="ob-heading">You're one of our first users</div>
                <div className="ob-body">
                  Caddie is in beta, which means you're helping us shape the product. We'd love your honest feedback — good and bad. You'll see a 💬 Feedback button on every screen. Tap it any time to report a bug, suggest an improvement, or just tell us what you think. Your input directly influences what we build next.
                </div>
              </div>
              <div className="ob-step-actions">
                <button className="ob-primary" onClick={handleNext} disabled={saving}>
                  Got it
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Handicap ── */}
          {step === 3 && (
            <div className="ob-step">
              <div className="ob-step-content">
                <span className="ob-emoji">🏅</span>
                <div className="ob-heading">What's your handicap?</div>
                <div className="ob-body">
                  We use your WHS index to calculate net scores and Stableford points.
                </div>
                <div className="ob-field">
                  <label className="ob-label">WHS Index</label>
                  <input
                    className="ob-input"
                    type="number"
                    min="0"
                    max="54"
                    step="0.1"
                    placeholder="e.g. 18.4"
                    value={hcpInput}
                    onChange={e => setHcpInput(e.target.value)}
                  />
                </div>
              </div>
              <div className="ob-step-actions">
                <button className="ob-primary" onClick={handleNext} disabled={saving}>
                  {saving ? "Saving…" : "Next"}
                </button>
                <button className="ob-skip" onClick={skip}>Skip for now</button>
              </div>
            </div>
          )}

          {/* ── Step 4: Home course ── */}
          {step === 4 && (
            <div className="ob-step">
              <div className="ob-step-content">
                <span className="ob-emoji">📍</span>
                <div className="ob-heading">Where do you usually play?</div>
                <div className="ob-body">
                  We'll show your home course at the top of the course list when you log a round.
                </div>
                <div className="ob-field">
                  <label className="ob-label">Home course</label>
                  {courseMode === "select" ? (
                    <>
                      <select
                        className="ob-select"
                        value={homeCourse}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === "__add__") { onAddCourse(); }
                          else setHomeCourse(val);
                        }}
                      >
                        <option value="">Select a course…</option>
                        {availableCourses.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                        <option value="__add__">＋ Add a new course</option>
                      </select>
                      <button className="ob-toggle-link" onClick={() => { setHomeCourse(""); setCourseMode("text"); }}>
                        Type a name instead ↓
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        className="ob-input"
                        type="text"
                        placeholder="e.g. Greenock Golf Club"
                        value={homeCourse}
                        onChange={e => setHomeCourse(e.target.value)}
                      />
                      <button className="ob-toggle-link" onClick={() => { setHomeCourse(""); setCourseMode("select"); }}>
                        Choose from list instead ↑
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="ob-step-actions">
                <button className="ob-primary" onClick={handleNext} disabled={saving}>
                  {saving ? "Saving…" : "Next"}
                </button>
                <button className="ob-skip" onClick={skip}>Skip for now</button>
              </div>
            </div>
          )}

          {/* ── Step 5: Preferences ── */}
          {step === 5 && (
            <div className="ob-step">
              <div className="ob-step-content">
                <span className="ob-emoji">⚙️</span>
                <div className="ob-heading">How do you want to log your rounds?</div>
                <div className="ob-body">You can change these any time in Settings.</div>

                <div className="ob-pref-section">
                  <div className="ob-pref-section-lbl">Putt tracking</div>
                  <div className="ob-pill-group">
                    {PUTT_OPTIONS.map(opt => {
                      const isActive = puttTracking === opt.value;
                      const isLocked = opt.premiumOnly && !isPremium;
                      return (
                        <div
                          key={opt.value}
                          className={"ob-pill" + (isActive ? " active" : "") + (isLocked ? " locked" : "")}
                          onClick={() => { if (!isLocked) setPuttTracking(opt.value); }}
                        >
                          <div className="ob-pill-left">
                            <div className="ob-pill-name">
                              {opt.label}
                              {opt.premiumOnly && !isPremium && (
                                <span className="ob-premium-badge">Premium</span>
                              )}
                            </div>
                            <div className="ob-pill-desc">{opt.desc}</div>
                          </div>
                          {isActive && <div className="ob-pill-check">✓</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="ob-pref-section">
                  <div className="ob-pref-section-lbl">Approach distance</div>
                  <div className="ob-pill-group">
                    {[
                      { value: "enabled",  label: "Enabled",  desc: "Record approach distance for each hole." },
                      { value: "disabled", label: "Disabled", desc: "Skip approach distance entirely." },
                    ].map(opt => {
                      const isActive = approachLogging === opt.value;
                      return (
                        <div
                          key={opt.value}
                          className={"ob-pill" + (isActive ? " active" : "")}
                          onClick={() => setApproachLogging(opt.value)}
                        >
                          <div className="ob-pill-left">
                            <div className="ob-pill-name">{opt.label}</div>
                            <div className="ob-pill-desc">{opt.desc}</div>
                          </div>
                          {isActive && <div className="ob-pill-check">✓</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="ob-step-actions">
                <button className="ob-primary" onClick={handleNext} disabled={saving}>
                  {saving ? "Saving…" : "Next"}
                </button>
                <button className="ob-skip" onClick={skip}>Skip for now</button>
              </div>
            </div>
          )}

          {/* ── Step 6: Link coach ── */}
          {step === 6 && (
            <div className="ob-step">
              <div className="ob-step-content">
                <span className="ob-emoji">🤝</span>
                <div className="ob-heading">Do you have a coach on Caddie?</div>
                <div className="ob-body">
                  If your coach has given you an invite code, enter it here to link your accounts.
                </div>
                <div className="ob-field">
                  <label className="ob-label">Invite code</label>
                  <input
                    className="ob-input"
                    type="text"
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={e => { setInviteCode(e.target.value.toUpperCase()); setInviteError(""); }}
                    style={{ textTransform: "uppercase", letterSpacing: ".05em" }}
                  />
                  {inviteError && <div className="ob-error">{inviteError}</div>}
                </div>
              </div>
              <div className="ob-step-actions">
                <button className="ob-primary" onClick={handleNext} disabled={saving}>
                  {saving ? "Checking…" : "Next"}
                </button>
                <button className="ob-skip" onClick={skip}>Skip for now</button>
              </div>
            </div>
          )}

          {/* ── Step 7: Historical rounds ── */}
          {step === 7 && (
            <div className="ob-step">
              <div className="ob-step-content">
                <span className="ob-emoji">📊</span>
                <div className="ob-heading">Want to add a past round?</div>
                <div className="ob-body">
                  Adding historical rounds gives you more data to work with from day one. You can add up to 5 historical rounds — or come back to this later from your dashboard.
                </div>

                <div className="ob-hist-count-box">
                  <div className="ob-hist-num">{histCount}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                      {histCount === 1 ? "Historical round" : "Historical rounds"} added
                    </div>
                    <div className="ob-hist-sub">
                      {histCount >= 5 ? "Maximum reached" : `${5 - histCount} more available`}
                    </div>
                  </div>
                </div>
                {lastAdded && <div className="ob-added">Round added ✓</div>}
              </div>
              <div className="ob-step-actions">
                {histCount >= 5 ? (
                  <>
                    <div style={{ fontSize: 13, color: "var(--text-dim)", textAlign: "center", marginBottom: 16 }}>
                      You've added the maximum of 5 historical rounds.
                    </div>
                    <button className="ob-primary" onClick={() => setStep(8)}>Continue</button>
                  </>
                ) : (
                  <>
                    <button
                      className="ob-primary"
                      onClick={openHistModal}
                      disabled={histSaving}
                    >
                      Add a historical round
                    </button>
                    <button className="ob-secondary" onClick={() => setStep(8)}>
                      I'll do this later
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Step 8: Done ── */}
          {step === 8 && (
            <div className="ob-step">
              <div className="ob-step-content">
                <span className="ob-emoji">🎉</span>
                <div className="ob-heading">You're all set</div>
                <div className="ob-body">
                  Start logging rounds and your coach will have everything they need before your next lesson. The more you log, the better your insights get.
                </div>
              </div>
              <div className="ob-step-actions">
                <button
                  className="ob-primary"
                  onClick={handleNext}
                  disabled={saving}
                  style={{ background: "var(--green-dark)" }}
                >
                  {saving ? "Loading…" : "Go to my dashboard"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Historical round modal (step 7) ── */}
      {showHistModal && (
        <div className="ob-modal-backdrop" onClick={() => setShowHistModal(false)}>
          <div className="ob-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="ob-modal-title">Add Historical Round</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="ob-modal-label">Course</label>
                <select
                  className="ob-modal-input"
                  value={histForm.course_id}
                  onChange={e => {
                    const cid = e.target.value;
                    setHistForm(f => ({ ...f, course_id: cid }));
                    setHistHoles(initHistHoles(cid));
                  }}
                  style={{ padding: "10px 14px" }}
                >
                  <option value="89e2ad4e-8d5a-4244-8568-b2c8a448a77f">Wee Course — 9 holes</option>
                  <option value="b1a2c3d4-e5f6-7890-abcd-ef1234567890">Big Course — 18 holes</option>
                </select>
              </div>
              <div>
                <label className="ob-modal-label">Date played</label>
                <input
                  className="ob-modal-input"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={histForm.date}
                  onChange={e => setHistForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="ob-modal-label">Course hcp <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                <input className="ob-modal-input" type="number" min="0" max="54" step="1" placeholder="e.g. 18"
                  value={histForm.course_handicap}
                  onChange={e => setHistForm(f => ({ ...f, course_handicap: e.target.value }))} />
              </div>
              <div>
                <label className="ob-modal-label">WHS index <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                <input className="ob-modal-input" type="number" min="0" max="54" step="0.1" placeholder="e.g. 14.2"
                  value={histForm.whs_index}
                  onChange={e => setHistForm(f => ({ ...f, whs_index: e.target.value }))} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="ob-modal-label">Note <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <input className="ob-modal-input" type="text" placeholder="e.g. played well"
                value={histForm.note}
                onChange={e => setHistForm(f => ({ ...f, note: e.target.value }))} />
            </div>

            {/* Hole-by-hole entry */}
            <div className="ob-hist-section">
              <label className="ob-modal-label" style={{ marginBottom: 8 }}>Hole by hole</label>
              <div className="ob-hist-col-headers">
                <div style={{ width: 28, flexShrink: 0 }} />
                <div className="ob-hist-ch" style={{ width: 78, flexShrink: 0 }}>Score</div>
                <div className="ob-hist-ch" style={{ width: 78, flexShrink: 0 }}>Drive</div>
                <div className="ob-hist-ch" style={{ flex: 1 }}>🏌️ Putts</div>
                <div className="ob-hist-ch" style={{ width: 66, flexShrink: 0 }}>⚠️ Pen</div>
              </div>

              {histHoles.map((h, i) => {
                const par   = HIST_COURSE_HOLES[histForm.course_id][i];
                const diff  = h.score - par;
                const scoreColor = diff < 0 ? "var(--gold)" : diff > 0 ? "var(--orange)" : "var(--green-mid)";
                return (
                  <div key={i} className="ob-hist-row">
                    <div className="ob-hist-lbl">
                      <div className="ob-hist-lbl-n">{i + 1}</div>
                      <div className="ob-hist-lbl-p">P{par}</div>
                    </div>
                    <div className="ob-hist-stepper">
                      <button className="ob-hist-sb dec" onClick={() => updateHistHole(i, { score: Math.max(1, h.score - 1) })}>−</button>
                      <div className="ob-hist-sv" style={{ color: scoreColor }}>{h.score}</div>
                      <button className="ob-hist-sb inc" onClick={() => updateHistHole(i, { score: h.score + 1 })}>+</button>
                    </div>
                    <div className="ob-hist-group" style={{ width: 78, flexShrink: 0, visibility: par === 3 ? "hidden" : "visible" }}>
                      {[["←", "left", "var(--sky)", "#EEF0FE"], ["↑", "yes", "var(--green)", "#E8F4EE"], ["→", "right", "var(--orange)", "#FEF3E8"]].map(([lbl, val, ac, abg]) => (
                        <button key={val} className="ob-hist-t"
                          onClick={() => updateHistHole(i, { fairway: h.fairway === val ? null : val })}
                          style={h.fairway === val ? { background: abg, borderColor: ac, color: ac } : {}}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                    <div className="ob-hist-stepper">
                      <button className="ob-hist-sb dec" onClick={() => updateHistHole(i, { putts: Math.max(0, h.putts - 1) })}>−</button>
                      <div className="ob-hist-sv">{h.putts}</div>
                      <button className="ob-hist-sb inc" onClick={() => updateHistHole(i, { putts: h.putts + 1 })}>+</button>
                    </div>
                    <div className="ob-hist-group" style={{ width: 66, flexShrink: 0 }}>
                      {[0, 1, 2].map(v => (
                        <button key={v} className="ob-hist-t"
                          onClick={() => updateHistHole(i, { penalty: h.penalty === v ? 0 : v })}
                          style={h.penalty === v && v > 0 ? { background: "#FEF0F0", borderColor: "var(--red)", color: "var(--red)" } : {}}>
                          {v === 0 ? "–" : "+" + v}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="ob-hist-total">
                <span>Total</span>
                <span style={{ fontWeight: 700, color: "var(--text)" }}>
                  {histHoles.reduce((s, h) => s + h.score, 0)}
                </span>
              </div>
            </div>

            <button
              className="ob-modal-save"
              disabled={histSaving || !histForm.date}
              onClick={saveHistRound}
            >
              {histSaving ? "Saving…" : "Save round"}
            </button>
            <button className="ob-modal-cancel" onClick={() => setShowHistModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
