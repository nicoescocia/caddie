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

  .mode-bar { background:var(--green-dark); padding:0 20px; display:flex; align-items:center; justify-content:space-between; height:54px; position:sticky; top:0; z-index:100; }
  .mode-logo { font-family:'Playfair Display',serif; font-size:20px; color:var(--gold); }
  .signout-btn { background:none; border:1px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.6); border-radius:8px; padding:5px 12px; font-family:'Outfit',sans-serif; font-size:12px; cursor:pointer; transition:all .2s; }
  .signout-btn:hover { border-color:rgba(255,255,255,0.5); color:white; }

  .dash-wrap { max-width:480px; margin:0 auto; padding:24px 16px 80px; }

  .dash-hero { background:var(--green-dark); border-radius:20px; padding:24px; margin-bottom:24px; position:relative; overflow:hidden; }
  .dash-hero::after { content:''; position:absolute; right:-40px; top:-40px; width:180px; height:180px; border-radius:50%; background:rgba(255,255,255,0.03); pointer-events:none; }
  .dash-hero-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:rgba(255,255,255,0.4); margin-bottom:6px; }
  .dash-hero-name { font-family:'Playfair Display',serif; font-size:26px; color:white; margin-bottom:16px; }
  .dash-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  .dash-stat { background:rgba(255,255,255,0.07); border-radius:12px; padding:12px; }
  .dash-stat-val { font-family:'Playfair Display',serif; font-size:24px; color:var(--gold); line-height:1; }
  .dash-stat-lbl { font-size:11px; color:rgba(255,255,255,0.4); margin-top:4px; }

  .new-round-btn { width:100%; background:var(--green); border:none; border-radius:14px; padding:16px; font-family:'Outfit',sans-serif; font-size:16px; font-weight:700; color:white; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:24px; }
  .new-round-btn:hover { background:var(--green-mid); transform:translateY(-1px); box-shadow:0 6px 20px rgba(26,107,74,0.3); }

  .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:var(--text-dim); margin-bottom:12px; }

  .round-card { background:white; border:1.5px solid var(--border); border-radius:16px; padding:16px 18px; margin-bottom:10px; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .round-card:hover { border-color:var(--green-light); transform:translateY(-1px); box-shadow:var(--shadow); }
  .round-card-left { flex:1; }
  .round-card-course { font-size:14px; font-weight:700; color:var(--text); margin-bottom:3px; }
  .round-card-date { font-size:12px; color:var(--text-dim); }
  .round-card-badges { display:flex; gap:6px; margin-top:8px; }
  .badge-sent { background:#E8F4EE; color:var(--green); font-size:10px; font-weight:700; padding:3px 8px; border-radius:6px; }
  .badge-unsent { background:#FFF8E6; color:#8A6A00; font-size:10px; font-weight:700; padding:3px 8px; border-radius:6px; }
  .round-card-score { text-align:right; flex-shrink:0; }
  .round-score-big { font-family:'Playfair Display',serif; font-size:36px; color:var(--text); line-height:1; }
  .round-score-par { font-size:12px; color:var(--text-dim); margin-top:2px; }
  .round-score-par.under { color:var(--gold); }
  .round-score-par.over { color:var(--orange); }

  .empty-rounds { text-align:center; padding:48px 24px; background:white; border-radius:16px; border:2px dashed var(--border); }
  .empty-icon { font-size:40px; margin-bottom:12px; }
  .empty-title { font-family:'Playfair Display',serif; font-size:18px; margin-bottom:6px; }
  .empty-sub { font-size:13px; color:var(--text-mid); line-height:1.6; }

  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:60px; }
  .big-spinner { width:28px; height:28px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .delete-btn { background:none; border:none; color:var(--text-dim); font-size:16px; cursor:pointer; padding:4px 6px; border-radius:6px; transition:all .15s; flex-shrink:0; }
  .delete-btn:hover { background:#FEF0F0; color:var(--red); }
`;

// Course pars — used to calculate vs-par stats per round
const COURSE_PAR = {
  "89e2ad4e-8d5a-4244-8568-b2c8a448a77f": 32, // Wee Course (9 holes)
  "b1a2c3d4-e5f6-7890-abcd-ef1234567890": 68, // Big Course (18 holes)
};
function getCoursePar(round) {
  if (round.course_id && COURSE_PAR[round.course_id]) return COURSE_PAR[round.course_id];
  // Fallback: guess from holes_played
  return round.holes_played === 18 ? 68 : 32;
}

export default function StudentDashboard({ user, onNewRound, onEditRound, onSignOut }) {
  const [rounds, setRounds]   = useState([]);
  const [profile, setProfile] = useState(null);
  const [coach, setCoach]       = useState(null);
  const [inviteLink, setInviteLink] = useState(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: prof }, { data: rds }, { data: link }] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single(),
        supabase.from("rounds").select("*, courses(name)").eq("student_id", user.id).order("created_at", { ascending: false }),
        supabase.from("coach_students").select("coach_id").eq("student_id", user.id).single(),
      ]);
      setProfile(prof);
      setRounds(rds || []);
      // Fetch coach profile separately if link exists
      if (link?.coach_id) {
        const { data: coachProf } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", link.coach_id)
          .single();
        if (coachProf) setCoach(coachProf);
      }
      setLoading(false);
    }
    load();
  }, [user.id]);

  async function generateCoachInvite() {
    setInviteLoading(true);
    const code = "S-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await supabase.from("invites").insert([{ code, coach_id: user.id, invite_type: "coach" }]);
    if (!error) {
      setInviteLink(`${window.location.origin}?invite=${code}&type=coach`);
    }
    setInviteLoading(false);
  }

  function copyInvite() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  }

  async function deleteRound(e, roundId) {
    e.stopPropagation(); // don't trigger the edit tap
    if (!window.confirm("Delete this round? This can't be undone.")) return;
    const { error: e1 } = await supabase.from("round_holes").delete().eq("round_id", roundId);
    const { error: e2 } = await supabase.from("rounds").delete().eq("id", roundId);
    if (e1 || e2) {
      console.error("Delete failed:", e1?.message, e2?.message);
      alert("Delete failed — " + (e2?.message || e1?.message));
      return;
    }
    setRounds(prev => prev.filter(r => r.id !== roundId));
  }

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="mode-bar"><div className="mode-logo">⛳ Caddie</div><button className="signout-btn" onClick={onSignOut}>Sign out</button></div>
      <div className="loading-wrap"><div className="big-spinner" /></div>
    </>
  );

  const completedRounds = rounds.filter(r => r.total_score);
  const avgDiff  = completedRounds.length
    ? Math.round(completedRounds.reduce((s,r) => s + ((r.total_score||0) - getCoursePar(r)), 0) / completedRounds.length)
    : null;
  const bestDiff = completedRounds.length
    ? Math.min(...completedRounds.map(r => (r.total_score||0) - getCoursePar(r)))
    : null;

  return (
    <>
      <style>{css}</style>
      <div className="mode-bar">
        <div className="mode-logo">⛳ Caddie</div>
        <button className="signout-btn" onClick={onSignOut}>Sign out</button>
      </div>

      <div className="dash-wrap">
        <div className="dash-hero">
          <div className="dash-hero-label">Welcome back</div>
          <div className="dash-hero-name">{profile?.first_name} {profile?.last_name}</div>
          <div className="dash-stats">
            <div className="dash-stat">
              <div className="dash-stat-val">{rounds.length}</div>
              <div className="dash-stat-lbl">Rounds logged</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-val">{avgDiff != null ? (avgDiff > 0 ? "+" + avgDiff : avgDiff === 0 ? "E" : avgDiff) : "—"}</div>
              <div className="dash-stat-lbl">Avg vs par</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-val">{bestDiff != null ? (bestDiff > 0 ? "+" + bestDiff : bestDiff === 0 ? "E" : bestDiff) : "—"}</div>
              <div className="dash-stat-lbl">Best vs par</div>
            </div>
          </div>
        </div>

        {/* Coach card */}
        {coach ? (
          <div style={{
            background:"white", border:"1px solid var(--border)", borderRadius:14,
            padding:"14px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:12,
          }}>
            <div style={{
              width:40, height:40, borderRadius:"50%", background:"var(--green-dark)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"'Playfair Display',serif", fontSize:16, color:"var(--gold)", flexShrink:0,
            }}>
              {coach.first_name?.[0]}{coach.last_name?.[0]}
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"var(--text-dim)",marginBottom:2}}>Your coach</div>
              <div style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>{coach.first_name} {coach.last_name}</div>
            </div>
            <div style={{marginLeft:"auto",fontSize:12,color:"var(--green)",fontWeight:600}}>✓ Linked</div>
          </div>
        ) : (
          <div style={{
            background:"var(--bg)", border:"1px solid var(--border)", borderRadius:14,
            padding:"14px 16px", marginBottom:14,
          }}>
            <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:10}}>
              No coach linked yet.{" "}
              <span style={{color:"var(--text-mid)"}}>Send your coach a link to connect your account.</span>
            </div>
            {inviteLink ? (
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{
                  flex:1, background:"white", border:"1px solid var(--border)", borderRadius:8,
                  padding:"8px 10px", fontSize:11, color:"var(--text-mid)",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>
                  {inviteLink}
                </div>
                <button
                  onClick={copyInvite}
                  style={{
                    background: inviteCopied ? "var(--green-mid)" : "var(--green-dark)",
                    border:"none", borderRadius:8, padding:"8px 14px",
                    fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:700,
                    color:"white", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
                  }}
                >
                  {inviteCopied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            ) : (
              <button
                onClick={generateCoachInvite}
                disabled={inviteLoading}
                style={{
                  background:"none", border:"none", padding:0,
                  fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600,
                  color:"var(--green)", cursor:"pointer", textDecoration:"underline",
                }}
              >
                {inviteLoading ? "Generating…" : "Generate a link for your coach →"}
              </button>
            )}
          </div>
        )}

        <button className="new-round-btn" onClick={onNewRound}>
          ⛳ Start new round
        </button>

        {rounds.length > 0 && (
          <>
            <div className="section-title">Past rounds</div>
            {rounds.map(r => {
              const diff = (r.total_score || 0) - getCoursePar(r);
              const date = new Date(r.created_at).toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short" });
              return (
                <div className="round-card" key={r.id} onClick={() => onEditRound(r)}>
                  <div className="round-card-left">
                    <div className="round-card-course">{r.courses?.name || "Golf Course"}</div>
                    <div className="round-card-date">{date} · {r.holes_played} holes</div>
                    <div className="round-card-badges">
                      {r.sent_to_coach
                        ? <span className="badge-sent">✓ Sent to coach</span>
                        : <span className="badge-unsent">Not sent yet</span>}
                    </div>
                  </div>
                  <div className="round-card-score">
                    <div className="round-score-big">{r.total_score || "—"}</div>
                    <div className={`round-score-par ${diff < 0 ? "under" : diff > 0 ? "over" : ""}`}>
                      {r.total_score ? (diff === 0 ? "Level par" : (diff > 0 ? "+" : "") + diff + " vs par") : "In progress"}
                    </div>
                    {r.total_score && r.handicap != null && (
                      <div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>Net {r.total_score - r.handicap}</div>
                    )}
                  </div>
                  <button className="delete-btn" onClick={e => deleteRound(e, r.id)} title="Delete round">🗑</button>
                </div>
              );
            })}
          </>
        )}

        {rounds.length === 0 && (
          <div className="empty-rounds">
            <div className="empty-icon">🏌️</div>
            <div className="empty-title">No rounds yet</div>
            <div className="empty-sub">Tap "Start new round" above to log your first round at Greenock.</div>
          </div>
        )}
      </div>
    </>
  );
}
