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

  .cd-mode-bar { background:var(--green-dark); padding:0 20px; display:flex; align-items:center; justify-content:space-between; height:54px; position:sticky; top:0; z-index:100; }
  .cd-logo { font-family:'Playfair Display',serif; font-size:20px; color:var(--gold); }
  .cd-back-btn { background:none; border:1px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.6); border-radius:8px; padding:5px 12px; font-family:'Outfit',sans-serif; font-size:12px; cursor:pointer; transition:all .2s; }
  .cd-back-btn:hover { border-color:rgba(255,255,255,0.5); color:white; }

  .cd-wrap { max-width:480px; margin:0 auto; padding:24px 16px 80px; }

  .cd-heading { font-family:'Playfair Display',serif; font-size:24px; color:var(--green-dark); margin-bottom:6px; }
  .cd-subheading { font-size:13px; color:var(--text-dim); margin-bottom:20px; }

  .cd-search { width:100%; padding:11px 14px; border:1.5px solid var(--border); border-radius:12px; font-family:'Outfit',sans-serif; font-size:14px; background:white; color:var(--text); outline:none; transition:border-color .2s; margin-bottom:10px; }
  .cd-search:focus { border-color:var(--green); }

  .cd-filter-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
  .cd-filter-chip { padding:6px 14px; border-radius:20px; border:1.5px solid var(--border); background:white; font-family:'Outfit',sans-serif; font-size:12px; color:var(--text-mid); cursor:pointer; transition:all .15s; font-weight:500; }
  .cd-filter-chip.active { background:var(--green-dark); border-color:var(--green-dark); color:white; }

  .cd-card { background:white; border:1px solid var(--border); border-radius:14px; padding:16px; margin-bottom:10px; cursor:pointer; transition:box-shadow .15s, border-color .15s; }
  .cd-card:hover { border-color:var(--green-light); box-shadow:var(--shadow); }
  .cd-card-header { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
  .cd-avatar { width:44px; height:44px; border-radius:50%; background:var(--green-dark); display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif; font-size:17px; color:var(--gold); flex-shrink:0; }
  .cd-avatar-lg { width:64px; height:64px; border-radius:50%; background:var(--green-dark); display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif; font-size:24px; color:var(--gold); flex-shrink:0; margin-bottom:12px; }
  .cd-name { font-size:16px; font-weight:700; color:var(--text); }
  .cd-name-lg { font-family:'Playfair Display',serif; font-size:22px; color:var(--green-dark); margin-bottom:4px; }
  .cd-courses { font-size:12px; color:var(--green); font-weight:600; margin-top:2px; }
  .cd-bio { font-size:13px; color:var(--text-mid); margin-bottom:14px; line-height:1.6; }
  .cd-contact-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
  .cd-contact-btn { display:inline-flex; align-items:center; gap:5px; padding:9px 18px; border-radius:10px; border:1.5px solid var(--border); background:white; font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; color:var(--green-dark); cursor:pointer; text-decoration:none; transition:all .15s; }
  .cd-contact-btn:hover { background:var(--green-dark); border-color:var(--green-dark); color:white; }
  .cd-card-arrow { font-size:14px; color:var(--text-dim); margin-left:auto; flex-shrink:0; }

  .cd-divider { border:none; border-top:1px solid var(--border); margin:20px 0; }

  .cd-invite-section { background:var(--bg); border-radius:12px; padding:16px; }
  .cd-invite-heading { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-dim); margin-bottom:12px; }
  .cd-invite-input { width:100%; padding:11px 14px; border:1.5px solid var(--border); border-radius:10px; font-family:'Outfit',sans-serif; font-size:15px; background:white; color:var(--text); outline:none; transition:border-color .2s; letter-spacing:.05em; text-transform:uppercase; margin-bottom:10px; }
  .cd-invite-input:focus { border-color:var(--green); }
  .cd-invite-input.error { border-color:var(--red); }
  .cd-invite-btn { width:100%; padding:12px; background:var(--green); border:none; border-radius:10px; font-family:'Outfit',sans-serif; font-size:14px; font-weight:700; color:white; cursor:pointer; transition:background .2s; }
  .cd-invite-btn:hover:not(:disabled) { background:var(--green-mid); }
  .cd-invite-btn:disabled { background:#C8C4BB; cursor:not-allowed; }
  .cd-invite-error { font-size:13px; color:var(--red); background:#FEF2F2; border-radius:8px; padding:8px 12px; margin-bottom:10px; }
  .cd-invite-success { font-size:13px; color:var(--green); background:#E8F4EE; border:1px solid #A8D8BE; border-radius:8px; padding:10px 14px; }

  .cd-empty { text-align:center; padding:48px 16px; color:var(--text-dim); font-size:14px; }
  .cd-spinner { display:flex; justify-content:center; padding:48px 0; }
  .cd-spin { width:28px; height:28px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:cd-spin .7s linear infinite; }
  @keyframes cd-spin { to { transform:rotate(360deg); } }
`;

export default function CoachDirectory({ onBack, user, onCoachLinked }) {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [selectedCoach, setSelectedCoach] = useState(null);

  useEffect(() => {
    async function fetchCoaches() {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, bio, phone, home_courses")
        .eq("role", "coach")
        .order("last_name", { ascending: true });
      setCoaches(data || []);
      setLoading(false);
    }
    fetchCoaches();
  }, []);

  // Collect all unique course names across coaches
  const allCourses = [];
  coaches.forEach(c => {
    const courses = parseHomeCourses(c.home_courses);
    courses.forEach(name => {
      if (!allCourses.includes(name)) allCourses.push(name);
    });
  });
  const showCourseFilter = allCourses.length > 0;

  const filtered = coaches.filter(c => {
    const fullName = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase();
    const matchesSearch = !search.trim() || fullName.includes(search.trim().toLowerCase());
    const courses = parseHomeCourses(c.home_courses);
    const matchesCourse = courseFilter === "all" || courses.includes(courseFilter);
    return matchesSearch && matchesCourse;
  });

  if (selectedCoach) {
    return (
      <>
        <style>{css}</style>
        <div className="cd-mode-bar">
          <span className="cd-logo">Caddie</span>
          <button className="cd-back-btn" onClick={() => setSelectedCoach(null)}>← Back</button>
        </div>
        <div className="cd-wrap">
          <CoachDetail
            coach={selectedCoach}
            user={user}
            onCoachLinked={onCoachLinked}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="cd-mode-bar">
        <span className="cd-logo">Caddie</span>
        <button className="cd-back-btn" onClick={onBack}>← Back</button>
      </div>
      <div className="cd-wrap">
        <div className="cd-heading">Find a Coach</div>
        <div className="cd-subheading">Browse coaches and get in touch</div>

        <input
          className="cd-search"
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {showCourseFilter && (
          <div className="cd-filter-row">
            <button
              className={"cd-filter-chip" + (courseFilter === "all" ? " active" : "")}
              onClick={() => setCourseFilter("all")}
            >
              All clubs
            </button>
            {allCourses.map(name => (
              <button
                key={name}
                className={"cd-filter-chip" + (courseFilter === name ? " active" : "")}
                onClick={() => setCourseFilter(name)}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="cd-spinner"><div className="cd-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="cd-empty">No coaches found</div>
        ) : (
          filtered.map(c => {
            const courses = parseHomeCourses(c.home_courses);
            return (
              <div key={c.id} className="cd-card" onClick={() => setSelectedCoach(c)}>
                <div className="cd-card-header">
                  <div className="cd-avatar">
                    {c.first_name?.[0]}{c.last_name?.[0]}
                  </div>
                  <div style={{flex:1}}>
                    <div className="cd-name">{c.first_name} {c.last_name}</div>
                    {courses.length > 0 && (
                      <div className="cd-courses">{courses.join(" · ")}</div>
                    )}
                  </div>
                  <div className="cd-card-arrow">›</div>
                </div>
                {c.bio && <div className="cd-bio" style={{marginBottom:0}}>{c.bio}</div>}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function CoachDetail({ coach, user, onCoachLinked }) {
  const courses = parseHomeCourses(coach.home_courses);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  async function redeemInvite(e) {
    e.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    if (!code) return;
    setInviteSaving(true);
    setInviteError("");

    const { data: invite } = await supabase
      .from("invites")
      .select("id, coach_id")
      .eq("code", code)
      .is("used_by", null)
      .maybeSingle();

    if (!invite) {
      setInviteError("Invalid or already-used invite code. Ask your coach for a new one.");
      setInviteSaving(false);
      return;
    }

    const { error: linkError } = await supabase
      .from("coach_students")
      .insert([{ coach_id: invite.coach_id, student_id: user.id }]);

    if (linkError) {
      if (linkError.code === "23505") {
        setInviteError("You're already linked to this coach.");
      } else {
        setInviteError("Failed to link coach. Please try again.");
      }
      setInviteSaving(false);
      return;
    }

    await supabase.from("invites").update({ used_by: user.id }).eq("id", invite.id);
    setInviteSaving(false);
    setInviteSuccess(true);
    if (onCoachLinked) onCoachLinked();
  }

  return (
    <>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",marginBottom:16}}>
        <div className="cd-avatar-lg">
          {coach.first_name?.[0]}{coach.last_name?.[0]}
        </div>
        <div className="cd-name-lg">{coach.first_name} {coach.last_name}</div>
        {courses.length > 0 && (
          <div className="cd-courses" style={{fontSize:13}}>{courses.join(" · ")}</div>
        )}
      </div>

      {coach.bio && <div className="cd-bio">{coach.bio}</div>}

      {(coach.phone) && (
        <div className="cd-contact-row">
          {coach.phone && (
            <a className="cd-contact-btn" href={`tel:${coach.phone}`}>
              📞 Call
            </a>
          )}
        </div>
      )}

      <hr className="cd-divider" />

      <div className="cd-invite-section">
        <div className="cd-invite-heading">Already have an invite code?</div>
        {inviteSuccess ? (
          <div className="cd-invite-success">
            ✓ Coach linked successfully! Your rounds will now be shared with {coach.first_name}.
          </div>
        ) : (
          <form onSubmit={redeemInvite}>
            <input
              className={"cd-invite-input" + (inviteError ? " error" : "")}
              type="text"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={e => { setInviteCode(e.target.value.toUpperCase()); setInviteError(""); }}
            />
            {inviteError && <div className="cd-invite-error">{inviteError}</div>}
            <button
              className="cd-invite-btn"
              type="submit"
              disabled={!inviteCode.trim() || inviteSaving}
            >
              {inviteSaving ? "Linking…" : "Link to coach"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

function parseHomeCourses(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    return [];
  } catch {
    return [value];
  }
}
