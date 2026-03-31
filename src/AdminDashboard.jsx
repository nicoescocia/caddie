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
  .adm-table td:last-child { text-align:right; color:var(--text-dim); }
  .adm-table tr:last-child td { border-bottom:none; }
  .adm-table tr:hover td { background:rgba(244,241,235,0.5); }

  .adm-role-badge { display:inline-block; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; padding:3px 8px; border-radius:6px; }
  .adm-role-badge.student { background:#EAF5EF; color:var(--green-mid); }
  .adm-role-badge.coach { background:#FFF4E0; color:#B07A10; }
  .adm-role-badge.admin { background:#F0E8FF; color:#6B3FA0; }

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
  .adm-student-hcp { font-size:12px; color:var(--text-dim); margin-left:auto; }
  .adm-no-students { font-size:12px; color:var(--text-dim); padding:10px 0 4px 50px; font-style:italic; }

  .adm-loading-wrap { display:flex; align-items:center; justify-content:center; padding:80px; }
  .adm-spinner { width:26px; height:26px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:adm-spin .7s linear infinite; }
  @keyframes adm-spin { to { transform:rotate(360deg); } }

  .adm-empty { text-align:center; padding:32px 24px; color:var(--text-dim); font-size:13px; }

  @media(max-width:520px) {
    .adm-summary-row { grid-template-columns:1fr 1fr; }
    .adm-table th.adm-hide-sm, .adm-table td.adm-hide-sm { display:none; }
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
  const [relationships, setRelationships] = useState([]); // [{ coach, students: [] }]

  useEffect(() => {
    async function load() {
      const [profilesRes, roundsRes, csRes] = await Promise.all([
        supabase.from("profiles").select("id, first_name, last_name, role, official_handicap, created_at"),
        supabase.from("rounds").select("id", { count: "exact", head: true }),
        supabase.from("coach_students").select("coach_id, student_id"),
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
          if (student) coachMap[cid].students.push(student);
        }
        setRelationships(Object.values(coachMap).sort((a, b) => {
          const an = `${a.coach?.first_name} ${a.coach?.last_name}`;
          const bn = `${b.coach?.first_name} ${b.coach?.last_name}`;
          return an.localeCompare(bn);
        }));
      }

      setLoading(false);
    }
    load();
  }, []);

  const totalRelationships = relationships.reduce((s, r) => s + r.students.length, 0);

  // Sort profiles: coach first, then student, then admin; within role by name
  const sortedProfiles = [...profiles].sort((a, b) => {
    const roleOrder = { coach: 0, student: 1, admin: 2 };
    const ra = roleOrder[a.role] ?? 3;
    const rb = roleOrder[b.role] ?? 3;
    if (ra !== rb) return ra - rb;
    const an = `${a.first_name} ${a.last_name}`;
    const bn = `${b.first_name} ${b.last_name}`;
    return an.localeCompare(bn);
  });

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
                relationships.map(({ coach, students }) => (
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
                          {students.length} {students.length === 1 ? "student" : "students"}
                        </div>
                      </div>
                    </div>
                    {students.length === 0 ? (
                      <div className="adm-no-students">No students linked</div>
                    ) : (
                      <div className="adm-student-list">
                        {students
                          .slice()
                          .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`))
                          .map(s => (
                            <div className="adm-student-row" key={s.id}>
                              <div className="adm-student-dot" />
                              <span className="adm-student-name">
                                {s.first_name} {s.last_name}
                              </span>
                              <span className="adm-student-hcp">
                                {s.official_handicap != null ? `HCP ${s.official_handicap}` : "\u00a0"}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))
              )}
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
