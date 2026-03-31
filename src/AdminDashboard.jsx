import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { createClient } from "@supabase/supabase-js";

// Service-role client — elevated privileges, admin operations only
const adminClient = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_SERVICE_KEY
);

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

  .adm-mode-bar { background:var(--green-dark); padding:0 20px; display:flex; align-items:center; justify-content:space-between; height:54px; position:sticky; top:0; z-index:100; }
  .adm-mode-logo { font-family:'Playfair Display',serif; font-size:20px; color:var(--gold); }
  .adm-mode-logo span { font-size:12px; font-family:'Outfit',sans-serif; color:rgba(255,255,255,0.4); font-weight:500; margin-left:10px; letter-spacing:.05em; text-transform:uppercase; }
  .adm-signout-btn { background:none; border:1px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.6); border-radius:8px; padding:5px 12px; font-family:'Outfit',sans-serif; font-size:12px; cursor:pointer; transition:all .2s; }
  .adm-signout-btn:hover { border-color:rgba(255,255,255,0.5); color:white; }

  .adm-wrap { max-width:780px; margin:0 auto; padding:28px 16px 64px; }

  .adm-section-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:var(--text-dim); margin-bottom:12px; }

  /* Summary row */
  .adm-summary-row { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:28px; }
  .adm-summary-card { background:white; border:1.5px solid var(--border); border-radius:16px; padding:20px 18px; }
  .adm-summary-val { font-family:'Playfair Display',serif; font-size:36px; color:var(--text); line-height:1; }
  .adm-summary-lbl { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-top:6px; }

  /* Users table */
  .adm-card { background:white; border:1.5px solid var(--border); border-radius:18px; padding:20px 22px; margin-bottom:20px; }
  .adm-card-title { font-family:'Playfair Display',serif; font-size:18px; color:var(--text); margin-bottom:16px; }

  .adm-table { width:100%; border-collapse:collapse; font-size:13px; }
  .adm-table th { text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-dim); padding:0 10px 10px; border-bottom:1.5px solid var(--border); }
  .adm-table th:first-child { padding-left:0; }
  .adm-table th:last-child { text-align:right; }
  .adm-table td { padding:12px 10px; border-bottom:1px solid var(--border); color:var(--text); vertical-align:middle; }
  .adm-table td:first-child { padding-left:0; }
  .adm-table td:last-child { text-align:right; }
  .adm-table tr:last-child td { border-bottom:none; }
  .adm-table tr:hover td { background:rgba(244,241,235,0.5); }

  .adm-role-badge { display:inline-block; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; padding:3px 8px; border-radius:6px; }
  .adm-role-badge.student { background:#EAF5EF; color:var(--green-mid); }
  .adm-role-badge.coach { background:#FFF4E0; color:#B07A10; }
  .adm-role-badge.admin { background:#F0E8FF; color:#6B3FA0; }

  /* Action buttons */
  .adm-btn-delete { background:none; border:1px solid #F5C0C0; color:var(--red); border-radius:7px; padding:4px 10px; font-family:'Outfit',sans-serif; font-size:11px; font-weight:600; cursor:pointer; transition:all .2s; white-space:nowrap; }
  .adm-btn-delete:hover { background:#FFF0F0; border-color:var(--red); }
  .adm-btn-delete:disabled { opacity:0.4; cursor:not-allowed; }

  .adm-btn-unlink { background:none; border:1px solid var(--border); color:var(--text-dim); border-radius:7px; padding:3px 9px; font-family:'Outfit',sans-serif; font-size:11px; font-weight:600; cursor:pointer; transition:all .2s; white-space:nowrap; margin-left:auto; }
  .adm-btn-unlink:hover { border-color:var(--red); color:var(--red); }
  .adm-btn-unlink:disabled { opacity:0.4; cursor:not-allowed; }

  /* Coach-student relationships */
  .adm-coach-block { margin-bottom:16px; }
  .adm-coach-block:last-child { margin-bottom:0; }
  .adm-coach-row { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1.5px solid var(--border); }
  .adm-coach-avatar { width:38px; height:38px; border-radius:50%; background:var(--green-dark); display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif; font-size:14px; color:var(--gold); flex-shrink:0; }
  .adm-coach-name { font-size:14px; font-weight:700; color:var(--text); }
  .adm-coach-count { font-size:12px; color:var(--text-dim); margin-top:2px; }
  .adm-student-list { padding:8px 0 0 50px; }
  .adm-student-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--border); }
  .adm-student-row:last-child { border-bottom:none; }
  .adm-student-dot { width:6px; height:6px; border-radius:50%; background:var(--green-mid); flex-shrink:0; }
  .adm-student-name { font-size:13px; color:var(--text); }
  .adm-student-hcp { font-size:12px; color:var(--text-dim); }
  .adm-no-students { font-size:12px; color:var(--text-dim); padding:10px 0 4px 50px; font-style:italic; }

  /* Link form */
  .adm-link-form { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-top:20px; padding-top:16px; border-top:1.5px solid var(--border); }
  .adm-link-form select { flex:1; min-width:120px; font-family:'Outfit',sans-serif; font-size:13px; padding:8px 10px; border:1.5px solid var(--border); border-radius:9px; background:white; color:var(--text); outline:none; cursor:pointer; }
  .adm-link-form select:focus { border-color:var(--green); }
  .adm-btn-link { background:var(--green); color:white; border:none; border-radius:9px; padding:8px 16px; font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; transition:background .2s; }
  .adm-btn-link:hover { background:var(--green-mid); }
  .adm-btn-link:disabled { opacity:0.5; cursor:not-allowed; }
  .adm-link-error { font-size:12px; color:var(--red); width:100%; }

  .adm-loading-wrap { display:flex; align-items:center; justify-content:center; padding:80px; }
  .adm-spinner { width:26px; height:26px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:adm-spin .7s linear infinite; }
  @keyframes adm-spin { to { transform:rotate(360deg); } }

  .adm-empty { text-align:center; padding:32px 24px; color:var(--text-dim); font-size:13px; }

  @media(max-width:520px) {
    .adm-summary-row { grid-template-columns:1fr 1fr; }
    .adm-table th.adm-hide-sm, .adm-table td.adm-hide-sm { display:none; }
    .adm-link-form { flex-direction:column; align-items:stretch; }
  }
`;

function initials(first, last) {
  return ((first || "?")[0] + (last || "")[0]).toUpperCase();
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminDashboard({ user, onSignOut }) {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [roundCount, setRoundCount] = useState(0);
  const [relationships, setRelationships] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [unlinkingKey, setUnlinkingKey] = useState(null);

  // Link form state
  const [linkCoachId, setLinkCoachId] = useState("");
  const [linkStudentId, setLinkStudentId] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState("");

  async function load() {
    const [profilesRes, roundsRes, csRes] = await Promise.all([
      adminClient.from("profiles").select("id, first_name, last_name, role, official_handicap, created_at"),
      adminClient.from("rounds").select("id", { count: "exact", head: true }),
      adminClient.from("coach_students").select("coach_id, student_id"),
    ]);

    const allProfiles = profilesRes.data || [];
    if (profilesRes.data) setProfiles(allProfiles);
    if (roundsRes.count != null) setRoundCount(roundsRes.count);

    if (csRes.data) {
      const profileById = Object.fromEntries(allProfiles.map(p => [p.id, p]));
      const coachMap = {};
      for (const row of csRes.data) {
        const cid = row.coach_id;
        if (!coachMap[cid]) coachMap[cid] = { coach: profileById[cid], students: [] };
        const student = profileById[row.student_id];
        if (student) coachMap[cid].students.push({ ...student, _coachId: cid });
      }
      setRelationships(Object.values(coachMap).sort((a, b) => {
        const an = `${a.coach?.first_name} ${a.coach?.last_name}`;
        const bn = `${b.coach?.first_name} ${b.coach?.last_name}`;
        return an.localeCompare(bn);
      }));
    }

    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDeleteUser(profile) {
    const name = `${profile.first_name} ${profile.last_name}`;
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;

    setDeletingId(profile.id);
    try {
      // Null out any invite foreign key references first
      await adminClient.from("invites").update({ used_by: null }).eq("used_by", profile.id);
      // Delete the profile row (cascades handled by DB, or handle coach_students)
      await adminClient.from("coach_students").delete().or(`coach_id.eq.${profile.id},student_id.eq.${profile.id}`);
      await adminClient.from("profiles").delete().eq("id", profile.id);
      // Delete the auth user
      await adminClient.auth.admin.deleteUser(profile.id);
      await load();
    } catch (err) {
      alert(`Failed to delete user: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleUnlink(coachId, studentId) {
    const key = `${coachId}:${studentId}`;
    if (!window.confirm("Remove this coach-student link?")) return;
    setUnlinkingKey(key);
    const { error } = await adminClient
      .from("coach_students")
      .delete()
      .eq("coach_id", coachId)
      .eq("student_id", studentId);
    if (error) alert(`Failed to unlink: ${error.message}`);
    else await load();
    setUnlinkingKey(null);
  }

  async function handleLink() {
    setLinkError("");
    if (!linkCoachId || !linkStudentId) {
      setLinkError("Select both a coach and a student.");
      return;
    }
    if (linkCoachId === linkStudentId) {
      setLinkError("Coach and student cannot be the same person.");
      return;
    }
    setLinking(true);
    const { error } = await adminClient
      .from("coach_students")
      .insert({ coach_id: linkCoachId, student_id: linkStudentId });
    if (error) {
      setLinkError(error.message.includes("duplicate") ? "This link already exists." : error.message);
    } else {
      setLinkCoachId("");
      setLinkStudentId("");
      await load();
    }
    setLinking(false);
  }

  const totalRelationships = relationships.reduce((s, r) => s + r.students.length, 0);

  const sortedProfiles = [...profiles].sort((a, b) => {
    const roleOrder = { coach: 0, student: 1, admin: 2 };
    const ra = roleOrder[a.role] ?? 3;
    const rb = roleOrder[b.role] ?? 3;
    if (ra !== rb) return ra - rb;
    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
  });

  const coaches = profiles.filter(p => p.role === "coach");
  const students = profiles.filter(p => p.role === "student");

  return (
    <>
      <style>{css}</style>

      <div className="adm-mode-bar">
        <div className="adm-mode-logo">
          Caddie <span>Admin</span>
        </div>
        <button className="adm-signout-btn" onClick={onSignOut}>Sign out</button>
      </div>

      <div className="adm-wrap">
        {loading ? (
          <div className="adm-loading-wrap">
            <div className="adm-spinner" />
          </div>
        ) : (
          <>
            {/* ── Summary Row ── */}
            <p className="adm-section-label">Overview</p>
            <div className="adm-summary-row">
              <div className="adm-summary-card">
                <div className="adm-summary-val">{profiles.length}</div>
                <div className="adm-summary-lbl">Total users</div>
              </div>
              <div className="adm-summary-card">
                <div className="adm-summary-val">{roundCount}</div>
                <div className="adm-summary-lbl">Rounds logged</div>
              </div>
              <div className="adm-summary-card">
                <div className="adm-summary-val">{totalRelationships}</div>
                <div className="adm-summary-lbl">Coach relationships</div>
              </div>
            </div>

            {/* ── Users Table ── */}
            <div className="adm-card">
              <div className="adm-card-title">All users</div>
              {sortedProfiles.length === 0 ? (
                <div className="adm-empty">No profiles found.</div>
              ) : (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th className="adm-hide-sm">Handicap</th>
                      <th>Joined</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProfiles.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>
                          {p.first_name} {p.last_name}
                        </td>
                        <td>
                          <span className={`adm-role-badge ${p.role || "student"}`}>
                            {p.role || "student"}
                          </span>
                        </td>
                        <td className="adm-hide-sm">
                          {p.official_handicap != null ? p.official_handicap : "—"}
                        </td>
                        <td>{fmtDate(p.created_at)}</td>
                        <td>
                          {p.id !== user?.id && (
                            <button
                              className="adm-btn-delete"
                              disabled={deletingId === p.id}
                              onClick={() => handleDeleteUser(p)}
                            >
                              {deletingId === p.id ? "Deleting…" : "Delete"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── Coach–Student Relationships ── */}
            <div className="adm-card">
              <div className="adm-card-title">Coach–student relationships</div>
              {relationships.length === 0 ? (
                <div className="adm-empty">No relationships found.</div>
              ) : (
                relationships.map(({ coach, students: coachStudents }) => (
                  <div className="adm-coach-block" key={coach?.id}>
                    <div className="adm-coach-row">
                      <div className="adm-coach-avatar">
                        {initials(coach?.first_name, coach?.last_name)}
                      </div>
                      <div>
                        <div className="adm-coach-name">
                          {coach?.first_name} {coach?.last_name}
                        </div>
                        <div className="adm-coach-count">
                          {coachStudents.length} {coachStudents.length === 1 ? "student" : "students"}
                        </div>
                      </div>
                    </div>
                    {coachStudents.length === 0 ? (
                      <div className="adm-no-students">No students linked</div>
                    ) : (
                      <div className="adm-student-list">
                        {coachStudents
                          .slice()
                          .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`))
                          .map(s => {
                            const key = `${coach?.id}:${s.id}`;
                            return (
                              <div className="adm-student-row" key={s.id}>
                                <div className="adm-student-dot" />
                                <span className="adm-student-name">
                                  {s.first_name} {s.last_name}
                                </span>
                                <span className="adm-student-hcp">
                                  {s.official_handicap != null ? `HCP ${s.official_handicap}` : "\u00a0"}
                                </span>
                                <button
                                  className="adm-btn-unlink"
                                  disabled={unlinkingKey === key}
                                  onClick={() => handleUnlink(coach?.id, s.id)}
                                >
                                  {unlinkingKey === key ? "…" : "Unlink"}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Link form */}
              <div className="adm-link-form">
                <select
                  value={linkCoachId}
                  onChange={e => setLinkCoachId(e.target.value)}
                >
                  <option value="">Select coach…</option>
                  {coaches.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
                <select
                  value={linkStudentId}
                  onChange={e => setLinkStudentId(e.target.value)}
                >
                  <option value="">Select student…</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
                <button
                  className="adm-btn-link"
                  disabled={linking}
                  onClick={handleLink}
                >
                  {linking ? "Linking…" : "Link"}
                </button>
                {linkError && <span className="adm-link-error">{linkError}</span>}
              </div>
            </div>

            <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-dim)", marginTop: 8 }}>
              Signed in as {user?.email}
            </p>
          </>
        )}
      </div>
    </>
  );
}
