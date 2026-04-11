import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

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
  .ob-step-actions { margin-top:24px; }
  .ob-emoji { font-size:64px; display:block; text-align:center; margin-bottom:16px; line-height:1; }

  .ob-heading { font-family:'Playfair Display',serif; font-size:26px; color:var(--text); margin-bottom:12px; line-height:1.25; }
  .ob-body { font-size:14px; color:var(--text-mid); line-height:1.75; margin-bottom:28px; }

  .ob-primary { width:100%; background:var(--green); border:none; border-radius:14px; padding:16px; font-family:'Outfit',sans-serif; font-size:16px; font-weight:700; color:white; cursor:pointer; transition:all .2s; }
  .ob-primary:hover:not(:disabled) { background:var(--green-mid); transform:translateY(-1px); }
  .ob-primary:disabled { opacity:.55; cursor:not-allowed; transform:none; }
  .ob-skip { display:block; width:100%; background:none; border:none; font-family:'Outfit',sans-serif; font-size:13px; color:var(--text-dim); cursor:pointer; padding:14px 0 0; text-align:center; }
  .ob-skip:hover { color:var(--text-mid); }

  .ob-field { margin-bottom:20px; }
  .ob-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-bottom:7px; display:block; }
  .ob-input { width:100%; padding:13px 16px; border:1.5px solid var(--border); border-radius:12px; font-family:'Outfit',sans-serif; font-size:16px; color:var(--text); background:white; outline:none; transition:border-color .15s; }
  .ob-input:focus { border-color:var(--green); }
  .ob-textarea { width:100%; padding:13px 16px; border:1.5px solid var(--border); border-radius:12px; font-family:'Outfit',sans-serif; font-size:15px; color:var(--text); background:white; outline:none; transition:border-color .15s; resize:vertical; min-height:100px; line-height:1.6; }
  .ob-textarea:focus { border-color:var(--green); }
  .ob-select { width:100%; padding:13px 40px 13px 16px; border:1.5px solid var(--border); border-radius:12px; font-family:'Outfit',sans-serif; font-size:15px; color:var(--text); background:white; outline:none; -webkit-appearance:none; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; transition:border-color .15s; }
  .ob-select:focus { border-color:var(--green); }
  .ob-toggle-link { background:none; border:none; padding:0; font-family:'Outfit',sans-serif; font-size:12px; font-weight:600; color:var(--text-dim); cursor:pointer; margin-top:7px; display:inline-block; text-decoration:underline; text-decoration-style:dotted; text-underline-offset:2px; }
  .ob-toggle-link:hover { color:var(--text-mid); }
  .ob-add-another { background:none; border:none; padding:4px 0; font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; color:var(--green); cursor:pointer; display:inline-flex; align-items:center; gap:4px; }
  .ob-add-another:hover { color:var(--green-mid); }

  .ob-link-primary-box { background:white; border:2px solid var(--green); border-radius:14px; padding:18px; margin-bottom:16px; }
  .ob-link-primary-url { font-size:12px; color:var(--text-dim); margin-bottom:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .ob-link-primary-btn { width:100%; background:var(--green-dark); border:none; border-radius:10px; padding:13px; font-family:'Outfit',sans-serif; font-size:15px; font-weight:700; color:white; cursor:pointer; transition:all .2s; }
  .ob-link-primary-btn:hover { background:var(--green); }
  .ob-link-primary-btn.copied { background:var(--green-mid); }

  .ob-code-secondary { background:white; border:1.5px solid var(--border); border-radius:12px; padding:14px 16px; margin-bottom:24px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .ob-code-secondary-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-bottom:4px; }
  .ob-code-secondary-val { font-family:'Playfair Display',serif; font-size:22px; color:var(--text-mid); letter-spacing:.12em; }
  .ob-code-secondary-btn { background:none; border:1.5px solid var(--border); border-radius:8px; padding:7px 14px; font-family:'Outfit',sans-serif; font-size:12px; font-weight:700; color:var(--text-mid); cursor:pointer; white-space:nowrap; flex-shrink:0; transition:all .2s; }
  .ob-code-secondary-btn:hover { border-color:var(--green-light); color:var(--green); }
  .ob-code-secondary-btn.copied { border-color:var(--green-mid); color:var(--green-mid); }
  .ob-code-section-label { font-size:12px; color:var(--text-dim); margin-bottom:8px; }

  .ob-spinner { width:26px; height:26px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:ob-spin .7s linear infinite; margin:40px auto; display:block; }
  @keyframes ob-spin { to { transform:rotate(360deg); } }
`;

const TOTAL_STEPS = 6;

export default function CoachOnboarding({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 3 — profile
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");

  // Step 4 — home course
  const [availableCourses, setAvailableCourses] = useState([]);
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [course1, setCourse1] = useState("");
  const [courseMode1, setCourseMode1] = useState("select");
  const [course2, setCourse2] = useState("");
  const [courseMode2, setCourseMode2] = useState("select");
  const [showCourse2, setShowCourse2] = useState(false);

  // Step 5 — invite
  const [inviteCode, setInviteCode] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Load courses when we reach step 4
  useEffect(() => {
    if (step !== 4 || coursesLoaded) return;
    supabase.from("courses").select("id, name").order("name", { ascending: true }).then(({ data }) => {
      setAvailableCourses(data || []);
      setCoursesLoaded(true);
    });
  }, [step, coursesLoaded]);

  // Load invite code when we reach step 5
  useEffect(() => {
    if (step !== 5) return;
    setInviteLoading(true);
    async function loadInvite() {
      const { data: existing } = await supabase
        .from("invites")
        .select("code")
        .eq("coach_id", user.id)
        .eq("invite_type", "student")
        .is("used_by", null)
        .limit(1)
        .maybeSingle();

      if (existing?.code) {
        setInviteCode(existing.code);
        setInviteLoading(false);
        return;
      }

      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const { error } = await supabase.from("invites").insert([{
        code,
        coach_id: user.id,
        invite_type: "student",
        used_by: null,
      }]);
      if (!error) setInviteCode(code);
      setInviteLoading(false);
    }
    loadInvite();
  }, [step, user.id]);

  const progress = (step / TOTAL_STEPS) * 100;
  const inviteLink = inviteCode ? `https://caddie-rust.vercel.app?invite=${inviteCode}` : "";

  function copyCode() {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  function copyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function handleStep3Next() {
    if (bio.trim() || phone.trim()) {
      await supabase.from("profiles").update({
        ...(bio.trim() ? { bio: bio.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      }).eq("id", user.id);
    }
    setStep(4);
  }

  async function handleStep4Next() {
    const vals = [course1.trim(), course2.trim()].filter(Boolean);
    if (vals.length > 0) {
      await supabase.from("profiles").update({ home_courses: vals }).eq("id", user.id);
    }
    setStep(5);
  }

  async function handleFinish() {
    setSaving(true);
    await supabase.from("profiles").update({ onboarding_complete_coach: true }).eq("id", user.id);
    setSaving(false);
    onComplete();
  }

  return (
    <>
      <style>{css}</style>
      <div className="ob-page">
        <div className="ob-header">
          <div className="ob-header-inner">
            <span className="ob-logo">⛳ Caddie</span>
            <span className="ob-step-label">Step {step} of {TOTAL_STEPS}</span>
          </div>
          <div className="ob-progress-track">
            <div className="ob-progress-fill" style={{ width: progress + "%" }} />
          </div>
        </div>

        <div className="ob-wrap">
          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <div className="ob-step">
              <span className="ob-emoji">🏌️</span>
              <h1 className="ob-heading">Welcome to Caddie</h1>
              <p className="ob-body">
                Caddie gives you a structured data layer for every coaching relationship. Your students log rounds hole by hole, and you get everything you need before each lesson — stats, trends, and AI analysis — without asking them to remember a thing.
              </p>
              <div className="ob-step-actions">
                <button className="ob-primary" onClick={() => setStep(2)}>Get started</button>
              </div>
            </div>
          )}

          {/* ── Step 2: Beta ── */}
          {step === 2 && (
            <div className="ob-step">
              <span className="ob-emoji">🧪</span>
              <h1 className="ob-heading">You're one of our first coaches</h1>
              <p className="ob-body">
                Caddie is in beta and your feedback shapes the product. You'll see a 💬 Feedback button on every screen — tap it any time to report a bug, suggest an improvement, or tell us what would make Caddie more useful in your coaching practice.
              </p>
              <div className="ob-step-actions">
                <button className="ob-primary" onClick={() => setStep(3)}>Got it</button>
              </div>
            </div>
          )}

          {/* ── Step 3: Profile ── */}
          {step === 3 && (
            <div className="ob-step">
              <span className="ob-emoji">👤</span>
              <h1 className="ob-heading">Tell students about yourself</h1>
              <p className="ob-body">
                Your bio appears on your coach profile. Let students know your background, specialisms, and coaching approach.
              </p>
              <div className="ob-field">
                <label className="ob-label">Bio</label>
                <textarea
                  className="ob-textarea"
                  placeholder="Tell students about your coaching background, specialisms, and approach..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
              </div>
              <div className="ob-field">
                <label className="ob-label">Phone number</label>
                <input
                  type="tel"
                  className="ob-input"
                  placeholder="Phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <div className="ob-step-actions">
                <button className="ob-primary" onClick={handleStep3Next}>Next</button>
                <button className="ob-skip" onClick={() => setStep(4)}>Skip for now</button>
              </div>
            </div>
          )}

          {/* ── Step 4: Home course ── */}
          {step === 4 && (
            <div className="ob-step">
              <span className="ob-emoji">📍</span>
              <h1 className="ob-heading">Where do you coach?</h1>
              <p className="ob-body">
                Add your home course or driving range. Students will see this on your profile.
              </p>

              {/* Course 1 */}
              <div className="ob-field">
                <label className="ob-label">Home course / range</label>
                {courseMode1 === "select" ? (
                  <>
                    <select
                      className="ob-select"
                      value={course1}
                      onChange={e => setCourse1(e.target.value)}
                    >
                      <option value="">Select a course…</option>
                      {availableCourses.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <button className="ob-toggle-link" onClick={() => setCourseMode1("text")}>
                      Type a name instead
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      className="ob-input"
                      placeholder="e.g. Greenock Golf Club"
                      value={course1}
                      onChange={e => setCourse1(e.target.value)}
                    />
                    <button className="ob-toggle-link" onClick={() => { setCourseMode1("select"); setCourse1(""); }}>
                      Choose from list instead
                    </button>
                  </>
                )}
              </div>

              {/* Progressive reveal of second course */}
              {course1.trim() && !showCourse2 && (
                <button className="ob-add-another" onClick={() => setShowCourse2(true)}>
                  + Add another
                </button>
              )}

              {showCourse2 && (
                <div className="ob-field">
                  <label className="ob-label">Second location</label>
                  {courseMode2 === "select" ? (
                    <>
                      <select
                        className="ob-select"
                        value={course2}
                        onChange={e => setCourse2(e.target.value)}
                      >
                        <option value="">Select a course…</option>
                        {availableCourses.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <button className="ob-toggle-link" onClick={() => setCourseMode2("text")}>
                        Type a name instead
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        className="ob-input"
                        placeholder="e.g. Greenock Driving Range"
                        value={course2}
                        onChange={e => setCourse2(e.target.value)}
                      />
                      <button className="ob-toggle-link" onClick={() => { setCourseMode2("select"); setCourse2(""); }}>
                        Choose from list instead
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="ob-step-actions">
                <button className="ob-primary" onClick={handleStep4Next}>Next</button>
                <button className="ob-skip" onClick={() => setStep(5)}>Skip for now</button>
              </div>
            </div>
          )}

          {/* ── Step 5: Invite ── */}
          {step === 5 && (
            <div className="ob-step">
              <span className="ob-emoji">🤝</span>
              <h1 className="ob-heading">Invite your first student</h1>
              <p className="ob-body">
                Share this link with your student. When they tap it, they'll be taken straight to Caddie with your invite pre-filled.
              </p>
              {inviteLoading ? (
                <div className="ob-spinner" />
              ) : (
                <>
                  {inviteLink && (
                    <div className="ob-link-primary-box">
                      <div className="ob-link-primary-url">{inviteLink}</div>
                      <button
                        className={"ob-link-primary-btn" + (linkCopied ? " copied" : "")}
                        onClick={copyLink}
                      >
                        {linkCopied ? "Copied ✓" : "Copy invite link"}
                      </button>
                    </div>
                  )}
                  <div className="ob-code-section-label">Student already has Caddie? Share the code instead</div>
                  <div className="ob-code-secondary">
                    <div>
                      <div className="ob-code-secondary-label">Invite code</div>
                      <div className="ob-code-secondary-val">{inviteCode}</div>
                    </div>
                    <button
                      className={"ob-code-secondary-btn" + (codeCopied ? " copied" : "")}
                      onClick={copyCode}
                    >
                      {codeCopied ? "Copied ✓" : "Copy code"}
                    </button>
                  </div>
                </>
              )}
              <div className="ob-step-actions">
                <button className="ob-primary" onClick={() => setStep(6)}>Next</button>
                <button className="ob-skip" onClick={() => setStep(6)}>Skip for now</button>
              </div>
            </div>
          )}

          {/* ── Step 6: Done ── */}
          {step === 6 && (
            <div className="ob-step">
              <span className="ob-emoji">🎉</span>
              <h1 className="ob-heading">You're ready to coach</h1>
              <p className="ob-body">
                Once your students start logging rounds, you'll see their data here before every lesson. The more they log, the better your insights.
              </p>
              <div className="ob-step-actions">
                <button className="ob-primary" onClick={handleFinish} disabled={saving}>
                  {saving ? "Loading…" : "Go to my dashboard"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
