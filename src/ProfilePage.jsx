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

  .prof-save-btn { width:100%; background:var(--green); border:none; border-radius:14px; padding:16px; font-family:'Outfit',sans-serif; font-size:16px; font-weight:700; color:white; cursor:pointer; transition:all .2s; }
  .prof-save-btn:hover { background:var(--green-mid); }
  .prof-save-btn:disabled { opacity:.6; cursor:not-allowed; }
  .prof-save-btn.saved { background:var(--green-mid); }

  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:60px; }
  .big-spinner { width:28px; height:28px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
`;

export default function ProfilePage({ user, onBack, onSignOut }) {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [visibleCourses, setVisibleCourses] = useState(1);
  const [form, setForm] = useState({
    first_name: "", last_name: "", phone: "", bio: "",
    home_courses: ["", "", ""],
  });

  useEffect(() => {
    async function load() {
      const [profRes, authRes] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, phone, home_courses, bio, is_premium, role").eq("id", user.id).single(),
        supabase.auth.getUser(),
      ]);
      const prof = profRes.data;
      setProfile(prof);
      setEmail(authRes.data?.user?.email || user.email || "");
      const courses = prof?.home_courses || [];
      // Show as many fields as there are saved values, minimum 1
      setVisibleCourses(Math.max(1, courses.filter(c => c).length));
      setForm({
        first_name:   prof?.first_name || "",
        last_name:    prof?.last_name  || "",
        phone:        prof?.phone      || "",
        bio:          prof?.bio        || "",
        home_courses: [courses[0] || "", courses[1] || "", courses[2] || ""],
      });
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
              <input
                className="prof-input"
                value={form.home_courses[i]}
                onChange={e => setCourse(i, e.target.value)}
                placeholder="e.g. Greenock Golf Club"
              />
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
          </div>
        )}

        <button
          className={"prof-save-btn" + (saved ? " saved" : "")}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save profile"}
        </button>
      </div>
    </>
  );
}
