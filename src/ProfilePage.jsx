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

  .prof-bar { background:var(--green-dark); padding:0 20px; display:flex; align-items:center; justify-content:space-between; height:54px; position:sticky; top:0; z-index:100; }
  .prof-logo { font-family:'Playfair Display',serif; font-size:20px; color:var(--gold); }
  .prof-bar-right { display:flex; align-items:center; gap:10px; }
  .prof-back-btn { background:none; border:none; color:rgba(255,255,255,0.7); font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; cursor:pointer; padding:0; display:flex; align-items:center; gap:5px; transition:color .15s; }
  .prof-back-btn:hover { color:white; }
  .prof-signout-btn { background:none; border:1px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.6); border-radius:8px; padding:5px 12px; font-family:'Outfit',sans-serif; font-size:12px; cursor:pointer; transition:all .2s; }
  .prof-signout-btn:hover { border-color:rgba(255,255,255,0.5); color:white; }

  .prof-wrap { max-width:480px; margin:0 auto; padding:24px 16px 80px; }

  .prof-hero { background:var(--green-dark); border-radius:20px; padding:24px; margin-bottom:24px; display:flex; align-items:center; gap:16px; position:relative; overflow:hidden; }
  .prof-hero::after { content:''; position:absolute; right:-40px; top:-40px; width:160px; height:160px; border-radius:50%; background:rgba(255,255,255,0.03); pointer-events:none; }
  .prof-avatar { width:56px; height:56px; border-radius:50%; background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif; font-size:22px; color:var(--gold); flex-shrink:0; }
  .prof-hero-info { flex:1; }
  .prof-hero-name { font-family:'Playfair Display',serif; font-size:22px; color:white; margin-bottom:4px; }
  .prof-hero-role { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:rgba(255,255,255,0.4); margin-bottom:3px; }
  .prof-hero-email { font-size:13px; color:rgba(255,255,255,0.5); }

  .prof-section-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:var(--text-dim); margin-bottom:12px; }

  .prof-card { background:white; border:1.5px solid var(--border); border-radius:16px; padding:20px; margin-bottom:16px; }

  .prof-field { margin-bottom:16px; }
  .prof-field:last-child { margin-bottom:0; }
  .prof-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-bottom:6px; display:block; }
  .prof-label-opt { font-size:10px; font-weight:400; text-transform:none; letter-spacing:0; color:var(--text-dim); }
  .prof-input { width:100%; padding:11px 14px; border:1.5px solid var(--border); border-radius:10px; font-family:'Outfit',sans-serif; font-size:15px; color:var(--text); background:white; outline:none; transition:border-color .15s; }
  .prof-input:focus { border-color:var(--green); }
  .prof-input:disabled { opacity:.55; cursor:not-allowed; background:var(--bg); }
  .prof-textarea { width:100%; padding:11px 14px; border:1.5px solid var(--border); border-radius:10px; font-family:'Outfit',sans-serif; font-size:14px; color:var(--text); background:white; outline:none; transition:border-color .15s; resize:vertical; min-height:90px; line-height:1.55; }
  .prof-textarea:focus { border-color:var(--green); }

  .prof-add-link { background:none; border:none; padding:0; font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; color:var(--green); cursor:pointer; margin-top:8px; display:inline-flex; align-items:center; gap:4px; }
  .prof-add-link:hover { color:var(--green-mid); }
  .prof-toggle-link { background:none; border:none; padding:0; font-family:'Outfit',sans-serif; font-size:11px; font-weight:600; color:var(--text-dim); cursor:pointer; margin-top:5px; display:inline-flex; align-items:center; gap:3px; text-decoration:underline; text-decoration-style:dotted; text-underline-offset:2px; }
  .prof-toggle-link:hover { color:var(--text-mid); }
  .prof-select { width:100%; padding:11px 14px; border:1.5px solid var(--border); border-radius:10px; font-family:'Outfit',sans-serif; font-size:15px; color:var(--text); background:white; outline:none; transition:border-color .15s; -webkit-appearance:none; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:36px; }
  .prof-select:focus { border-color:var(--green); }
  .prof-select option[value="__add__"] { color:var(--green); font-weight:600; }

  .prof-save-btn { width:100%; background:var(--green); border:none; border-radius:14px; padding:16px; font-family:'Outfit',sans-serif; font-size:16px; font-weight:700; color:white; cursor:pointer; transition:all .2s; }
  .prof-save-btn:hover { background:var(--green-mid); }
  .prof-save-btn:disabled { opacity:.6; cursor:not-allowed; }
  .prof-save-btn.saved { background:var(--green-mid); }

  .prof-toggle-row { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:16px 0; border-top:1px solid var(--border); margin-top:4px; }
  .prof-toggle-info { flex:1; }
  .prof-toggle-title { font-size:14px; font-weight:600; color:var(--text); margin-bottom:3px; }
  .prof-toggle-desc { font-size:12px; color:var(--text-dim); line-height:1.5; }
  .prof-switch { position:relative; width:44px; height:24px; flex-shrink:0; }
  .prof-switch input { opacity:0; width:0; height:0; }
  .prof-slider { position:absolute; inset:0; background:var(--border); border-radius:12px; cursor:pointer; transition:background .2s; }
  .prof-slider::before { content:''; position:absolute; width:18px; height:18px; left:3px; top:3px; background:white; border-radius:50%; transition:transform .2s; }
  .prof-switch input:checked + .prof-slider { background:var(--green); }
  .prof-switch input:checked + .prof-slider::before { transform:translateX(20px); }

  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:60px; }
  .big-spinner { width:28px; height:28px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
`;

export default function ProfilePage({ user, onBack, onSignOut, onAddCourse }) {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [visibleCourses, setVisibleCourses] = useState(1);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [courseMode, setCourseMode] = useState(["select", "select", "select"]); // 'select' | 'text'
  const [aiBriefEnabled, setAiBriefEnabled] = useState(true);
  const [form, setForm] = useState({
    first_name: "", last_name: "", phone: "", bio: "",
    home_courses: ["", "", ""],
  });

  useEffect(() => {
    async function load() {
      const [profRes, authRes, coursesRes] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, phone, home_courses, bio, is_premium, ai_brief_enabled, role").eq("id", user.id).single(),
        supabase.auth.getUser(),
        supabase.from("courses").select("id, name").order("name", { ascending: true }),
      ]);
      const prof = profRes.data;
      setProfile(prof);
      setAiBriefEnabled(prof?.ai_brief_enabled !== false);
      setEmail(authRes.data?.user?.email || user.email || "");
      const avail = coursesRes.data || [];
      setAvailableCourses(avail);
      const courses = prof?.home_courses || [];
      // Show as many fields as there are saved values, minimum 1
      setVisibleCourses(Math.max(1, courses.filter(c => c).length));
      const savedCourses = [courses[0] || "", courses[1] || "", courses[2] || ""];
      setForm({
        first_name:   prof?.first_name || "",
        last_name:    prof?.last_name  || "",
        phone:        prof?.phone      || "",
        bio:          prof?.bio        || "",
        home_courses: savedCourses,
      });
      // Default to 'select' mode; use 'text' if saved value doesn't match any known course
      const availNames = new Set(avail.map(c => c.name));
      setCourseMode(savedCourses.map(c => (!c || availNames.has(c)) ? "select" : "text"));
      setLoading(false);
    }
    load();
  }, [user.id, user.email]);

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    setSaved(false);
  }

  function setCourse(i, val) {
    setForm(f => {
      const hc = [...f.home_courses];
      hc[i] = val;
      return { ...f, home_courses: hc };
    });
    setSaved(false);
  }

  function toggleCourseMode(i) {
    setCourseMode(prev => {
      const next = [...prev];
      next[i] = prev[i] === "select" ? "text" : "select";
      return next;
    });
    // Clear value when switching to select if it won't match any option
    if (courseMode[i] === "text") {
      const availNames = new Set(availableCourses.map(c => c.name));
      if (!availNames.has(form.home_courses[i])) setCourse(i, "");
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const home_courses = form.home_courses.map(c => c.trim()).filter(Boolean);
    const updatePayload = {
      first_name:   form.first_name.trim(),
      last_name:    form.last_name.trim(),
      phone:        form.phone.trim() || null,
      home_courses: home_courses.length ? home_courses : null,
    };
    if (profile?.role !== "student") {
      updatePayload.bio = form.bio.trim() || null;
      updatePayload.ai_brief_enabled = aiBriefEnabled;
    }
    const { error } = await supabase.from("profiles").update(updatePayload).eq("id", user.id);
    if (!error) setSaved(true);
    setSaving(false);
  }

  const avatarInitials = ((form.first_name || "?")[0] + (form.last_name || "")[0]).toUpperCase();
  // Show "+ Add another" if last visible field has content and fewer than 3 shown
  const canAddCourse = visibleCourses < 3 && form.home_courses[visibleCourses - 1].trim() !== "";

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="prof-bar">
        <button className="prof-back-btn" onClick={onBack}>← Back</button>
        <div className="prof-logo">Caddie</div>
        <button className="prof-signout-btn" onClick={onSignOut}>Sign out</button>
      </div>
      <div className="loading-wrap"><div className="big-spinner" /></div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="prof-bar">
        <button className="prof-back-btn" onClick={onBack}>← Back</button>
        <div className="prof-logo">Caddie</div>
        <div className="prof-bar-right">
          <button className="prof-signout-btn" onClick={onSignOut}>Sign out</button>
        </div>
      </div>

      <div className="prof-wrap">
        <div className="prof-hero">
          <div className="prof-avatar">{avatarInitials}</div>
          <div className="prof-hero-info">
            <div className="prof-hero-role">{profile?.role || "student"}</div>
            <div className="prof-hero-name">{form.first_name} {form.last_name}</div>
            <div className="prof-hero-email">{email}</div>
          </div>
          {profile?.is_premium && (
            <div style={{
              background: "var(--gold)", color: "var(--green-dark)",
              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
              textTransform: "uppercase", letterSpacing: ".06em", flexShrink: 0,
            }}>
              Premium
            </div>
          )}
        </div>

        <div className="prof-card">
          <div className="prof-field">
            <label className="prof-label">First name</label>
            <input className="prof-input" value={form.first_name} onChange={e => set("first_name", e.target.value)} />
          </div>
          <div className="prof-field">
            <label className="prof-label">Last name</label>
            <input className="prof-input" value={form.last_name} onChange={e => set("last_name", e.target.value)} />
          </div>
          <div className="prof-field">
            <label className="prof-label">Email</label>
            <input className="prof-input" value={email} disabled />
          </div>
          <div className="prof-field">
            <label className="prof-label">Phone <span className="prof-label-opt">— optional</span></label>
            <input className="prof-input" type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+44 7700 900000" />
          </div>
        </div>

        <div className="prof-card">
          <div className="prof-section-label">Home courses &amp; ranges</div>
          {Array.from({ length: visibleCourses }, (_, i) => (
            <div className="prof-field" key={i}>
              <label className="prof-label">
                Course {i + 1} <span className="prof-label-opt">— optional</span>
              </label>
              {courseMode[i] === "select" ? (
                <select
                  className="prof-select"
                  value={form.home_courses[i]}
                  onChange={e => {
                    if (e.target.value === "__add__") { if (onAddCourse) onAddCourse(); }
                    else setCourse(i, e.target.value);
                  }}
                >
                  <option value="">— None —</option>
                  {availableCourses.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  {onAddCourse && <option value="__add__">+ Add a new course</option>}
                </select>
              ) : (
                <input
                  className="prof-input"
                  value={form.home_courses[i]}
                  onChange={e => setCourse(i, e.target.value)}
                  placeholder="e.g. Greenock Golf Club"
                />
              )}
              <button className="prof-toggle-link" onClick={() => toggleCourseMode(i)}>
                {courseMode[i] === "select" ? "Type a name instead" : "Choose from list instead"}
              </button>
            </div>
          ))}
          {canAddCourse && (
            <button className="prof-add-link" onClick={() => setVisibleCourses(v => v + 1)}>
              + Add another
            </button>
          )}
        </div>

        {profile?.role !== "student" && (
          <div className="prof-card">
            <div className="prof-field">
              <label className="prof-label">Bio <span className="prof-label-opt">— optional</span></label>
              <textarea
                className="prof-textarea"
                value={form.bio}
                onChange={e => set("bio", e.target.value)}
                placeholder="Tell students about your coaching background, specialisms, and approach..."
              />
            </div>
            <div className="prof-toggle-row">
              <div className="prof-toggle-info">
                <div className="prof-toggle-title">Pre-lesson AI analysis</div>
                <div className="prof-toggle-desc">Generate AI analysis when scheduling lessons. Automatically generates a pre-lesson brief from recent round data when you schedule a lesson.</div>
              </div>
              <label className="prof-switch">
                <input type="checkbox" checked={aiBriefEnabled} onChange={e => { setAiBriefEnabled(e.target.checked); setSaved(false); }} />
                <span className="prof-slider" />
              </label>
            </div>
          </div>
        )}

        <button
          className={"prof-save-btn" + (saved ? " saved" : "")}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save profile"}
        </button>
        <button
          onClick={onSignOut}
          style={{
            width:"100%", marginTop:12, background:"white",
            border:"1.5px solid var(--red)", borderRadius:14, padding:16,
            fontFamily:"'Outfit',sans-serif", fontSize:16, fontWeight:700,
            color:"var(--red)", cursor:"pointer", transition:"all .2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background="#FFF5F5"}
          onMouseLeave={e => e.currentTarget.style.background="white"}
        >
          Sign out
        </button>
      </div>
    </>
  );
}
