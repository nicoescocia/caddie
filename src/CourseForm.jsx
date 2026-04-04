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

  .cf-bar { background:var(--green-dark); padding:0 20px; display:flex; align-items:center; justify-content:space-between; height:54px; position:sticky; top:0; z-index:100; }
  .cf-logo { font-family:'Playfair Display',serif; font-size:20px; color:var(--gold); }
  .cf-bar-right { display:flex; align-items:center; gap:8px; }
  .cf-back-btn { background:none; border:none; color:rgba(255,255,255,0.7); font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; cursor:pointer; padding:0; display:flex; align-items:center; gap:5px; transition:color .15s; }
  .cf-back-btn:hover { color:white; }
  .cf-signout-btn { background:none; border:1px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.6); border-radius:8px; padding:5px 12px; font-family:'Outfit',sans-serif; font-size:12px; cursor:pointer; transition:all .2s; }
  .cf-signout-btn:hover { border-color:rgba(255,255,255,0.5); color:white; }

  .cf-wrap { max-width:480px; margin:0 auto; padding:24px 16px 80px; }
  .cf-title { font-family:'Playfair Display',serif; font-size:24px; color:var(--text); margin-bottom:6px; }
  .cf-sub { font-size:13px; color:var(--text-dim); margin-bottom:24px; line-height:1.6; }

  .cf-field { margin-bottom:20px; }
  .cf-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:var(--text-dim); margin-bottom:7px; display:block; }
  .cf-input { width:100%; padding:12px 14px; border:1.5px solid var(--border); border-radius:11px; font-family:'Outfit',sans-serif; font-size:15px; color:var(--text); background:white; outline:none; transition:border-color .15s; }
  .cf-input:focus { border-color:var(--green); }
  .cf-input.err { border-color:var(--red); }
  .cf-err-msg { font-size:12px; color:var(--red); margin-top:5px; }

  .cf-pill-row { display:flex; gap:8px; }
  .cf-pill { flex:1; padding:10px 0; border-radius:11px; border:1.5px solid var(--border); background:white; font-family:'Outfit',sans-serif; font-size:14px; font-weight:600; color:var(--text-mid); cursor:pointer; transition:all .15s; text-align:center; }
  .cf-pill:hover { border-color:var(--green-light); }
  .cf-pill.sel { background:var(--green-dark); border-color:var(--green-dark); color:white; }

  .cf-card { background:white; border:1.5px solid var(--border); border-radius:16px; overflow:hidden; margin-bottom:16px; }
  .cf-table { width:100%; border-collapse:collapse; }
  .cf-table th { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); padding:10px 6px; text-align:center; border-bottom:1.5px solid var(--border); background:var(--bg); }
  .cf-table th:first-child { padding-left:12px; text-align:left; }
  .cf-table td { padding:8px 5px; text-align:center; border-top:1px solid var(--border); vertical-align:middle; }
  .cf-table td:first-child { padding-left:12px; text-align:left; font-weight:700; font-size:14px; color:var(--text); }

  .cf-par-group { display:inline-flex; gap:3px; }
  .cf-par-btn { width:30px; height:30px; border:1.5px solid var(--border); border-radius:6px; background:white; font-family:'Outfit',sans-serif; font-size:13px; font-weight:700; color:var(--text-mid); cursor:pointer; transition:all .1s; display:flex; align-items:center; justify-content:center; }
  .cf-par-btn:hover { border-color:var(--green-light); }
  .cf-par-btn.sel { background:var(--green-dark); border-color:var(--green-dark); color:white; }

  .cf-num-input { width:52px; padding:5px 4px; border:1.5px solid var(--border); border-radius:7px; font-family:'Outfit',sans-serif; font-size:13px; text-align:center; color:var(--text); background:white; outline:none; transition:border-color .15s; }
  .cf-num-input:focus { border-color:var(--green); }
  .cf-num-input.err { border-color:var(--red); background:#FFF8F8; }

  .cf-submit-btn { width:100%; background:var(--green); border:none; border-radius:14px; padding:16px; font-family:'Outfit',sans-serif; font-size:16px; font-weight:700; color:white; cursor:pointer; transition:all .2s; margin-top:8px; }
  .cf-submit-btn:hover:not(:disabled) { background:var(--green-mid); transform:translateY(-1px); box-shadow:0 6px 20px rgba(26,107,74,0.3); }
  .cf-submit-btn:disabled { background:#C8C4BB; cursor:not-allowed; transform:none; }

  .cf-loading { display:flex; align-items:center; justify-content:center; padding:60px; }
  .cf-spinner { width:28px; height:28px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:cf-spin .7s linear infinite; }
  @keyframes cf-spin { to { transform:rotate(360deg); } }
`;

function initHoles(n) {
  return Array.from({ length: n }, () => ({ par: 4, yardage: "", si: "" }));
}

export default function CourseForm({ user, editCourseId, onBack, onDone, onSignOut }) {
  const [name, setName]         = useState("");
  const [holeCount, setHoleCount] = useState(18);
  const [holes, setHoles]       = useState(() => initHoles(18));
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(!!editCourseId);
  const [nameErr, setNameErr]   = useState("");
  const [siErr, setSiErr]       = useState("");

  useEffect(() => {
    if (!editCourseId) return;
    async function load() {
      const [{ data: course }, { data: holeRows }] = await Promise.all([
        supabase.from("courses").select("name, hole_count").eq("id", editCourseId).single(),
        supabase.from("course_holes").select("hole_number, par, yardage, stroke_index")
          .eq("course_id", editCourseId).order("hole_number", { ascending: true }),
      ]);
      if (course) {
        setName(course.name || "");
        const n = course.hole_count || (holeRows?.length) || 18;
        setHoleCount(n);
        setHoles(
          holeRows && holeRows.length > 0
            ? holeRows.map(h => ({
                par: h.par || 4,
                yardage: h.yardage != null ? String(h.yardage) : "",
                si: h.stroke_index != null ? String(h.stroke_index) : "",
              }))
            : initHoles(n)
        );
      }
      setLoading(false);
    }
    load();
  }, [editCourseId]);

  function handleHoleCount(n) {
    setHoleCount(n);
    setHoles(initHoles(n));
    setNameErr(""); setSiErr("");
  }

  function updateHole(i, fields) {
    setHoles(prev => prev.map((h, idx) => idx === i ? { ...h, ...fields } : h));
  }

  // Per-hole SI validity for inline highlighting
  function siStatus() {
    const nums = holes.map(h => parseInt(h.si, 10));
    const counts = {};
    nums.forEach((n, i) => {
      if (!isNaN(n)) counts[n] = (counts[n] || []).concat(i);
    });
    const dupes = new Set();
    Object.values(counts).forEach(idxs => { if (idxs.length > 1) idxs.forEach(i => dupes.add(i)); });
    return nums.map((n, i) => {
      if (holes[i].si === "") return "empty";
      if (isNaN(n) || n < 1 || n > holeCount) return "err";
      if (dupes.has(i)) return "err";
      return "ok";
    });
  }

  function validate() {
    let ok = true;
    if (!name.trim()) { setNameErr("Course name is required."); ok = false; } else setNameErr("");
    const nums = holes.map(h => parseInt(h.si, 10));
    const anyInvalid = nums.some(n => isNaN(n) || n < 1 || n > holeCount);
    if (anyInvalid) {
      setSiErr(`All stroke indexes must be between 1 and ${holeCount}.`);
      ok = false;
    } else if (new Set(nums).size !== holeCount) {
      setSiErr("Stroke indexes must all be unique.");
      ok = false;
    } else {
      setSiErr("");
    }
    return ok;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    const holeRows = holes.map((h, i) => ({
      hole_number: i + 1,
      par: h.par,
      yardage: h.yardage !== "" ? parseInt(h.yardage, 10) : null,
      stroke_index: parseInt(h.si, 10),
    }));

    if (editCourseId) {
      const { error } = await supabase.from("courses")
        .update({ name: name.trim(), hole_count: holeCount })
        .eq("id", editCourseId);
      if (!error) {
        await supabase.from("course_holes").delete().eq("course_id", editCourseId);
        await supabase.from("course_holes").insert(holeRows.map(r => ({ ...r, course_id: editCourseId })));
        onDone({ id: editCourseId, name: name.trim(), hole_count: holeCount });
      }
    } else {
      const { data: courseData, error } = await supabase.from("courses")
        .insert({ name: name.trim(), hole_count: holeCount, created_by: user.id })
        .select("id, name, hole_count")
        .single();
      if (!error && courseData) {
        await supabase.from("course_holes").insert(holeRows.map(r => ({ ...r, course_id: courseData.id })));
        onDone({ id: courseData.id, name: courseData.name, hole_count: courseData.hole_count });
      }
    }
    setSaving(false);
  }

  const siStatuses = siStatus();

  return (
    <>
      <style>{css}</style>
      <div className="cf-bar">
        <button className="cf-back-btn" onClick={onBack}>← Back</button>
        <div className="cf-logo">Caddie</div>
        <div className="cf-bar-right">
          {onSignOut && <button className="cf-signout-btn" onClick={onSignOut}>Sign out</button>}
        </div>
      </div>

      {loading ? (
        <div className="cf-loading"><div className="cf-spinner" /></div>
      ) : (
        <div className="cf-wrap">
          <div className="cf-title">{editCourseId ? "Edit course" : "Add new course"}</div>
          <div className="cf-sub">
            {editCourseId
              ? "Update the course details and hole-by-hole data below."
              : "Enter the course details. Stroke indexes must be unique and within range."}
          </div>

          {/* Course name */}
          <div className="cf-field">
            <label className="cf-label">Course name</label>
            <input
              className={"cf-input" + (nameErr ? " err" : "")}
              type="text"
              placeholder="e.g. Greenock Golf Club"
              value={name}
              onChange={e => { setName(e.target.value); if (nameErr) setNameErr(""); }}
            />
            {nameErr && <div className="cf-err-msg">{nameErr}</div>}
          </div>

          {/* Hole count */}
          <div className="cf-field">
            <label className="cf-label">Number of holes</label>
            <div className="cf-pill-row">
              {[9, 18].map(n => (
                <button
                  key={n}
                  className={"cf-pill" + (holeCount === n ? " sel" : "")}
                  onClick={() => handleHoleCount(n)}
                >
                  {n} holes
                </button>
              ))}
            </div>
          </div>

          {/* Hole table */}
          <div className="cf-field">
            <label className="cf-label">Hole by hole</label>
            {siErr && <div className="cf-err-msg" style={{marginBottom:8}}>{siErr}</div>}
            <div className="cf-card">
              <table className="cf-table">
                <thead>
                  <tr>
                    <th>Hole</th>
                    <th>Par</th>
                    <th>Yds</th>
                    <th>SI</th>
                  </tr>
                </thead>
                <tbody>
                  {holes.map((h, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        <div className="cf-par-group">
                          {[3, 4, 5].map(p => (
                            <button
                              key={p}
                              className={"cf-par-btn" + (h.par === p ? " sel" : "")}
                              onClick={() => updateHole(i, { par: p })}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td>
                        <input
                          className="cf-num-input"
                          type="number"
                          min="1"
                          max="700"
                          placeholder="—"
                          value={h.yardage}
                          onChange={e => updateHole(i, { yardage: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className={"cf-num-input" + (siStatuses[i] === "err" ? " err" : "")}
                          type="number"
                          min="1"
                          max={holeCount}
                          placeholder={String(i + 1)}
                          value={h.si}
                          onChange={e => updateHole(i, { si: e.target.value })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button className="cf-submit-btn" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : editCourseId ? "Save changes" : "Add course"}
          </button>
        </div>
      )}
    </>
  );
}
