/*
 * SQL to run in Supabase SQL editor before this feature is live:
 *
 *   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;
 *   ALTER TABLE round_holes ADD COLUMN IF NOT EXISTS putt3 text;
 */

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

  .set-bar { background:var(--green-dark); padding:0 20px; display:flex; align-items:center; justify-content:space-between; height:54px; position:sticky; top:0; z-index:100; }
  .set-logo { font-family:'Playfair Display',serif; font-size:20px; color:var(--gold); }
  .set-bar-right { display:flex; align-items:center; gap:10px; }
  .set-back-btn { background:none; border:none; color:rgba(255,255,255,0.7); font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; cursor:pointer; padding:0; display:flex; align-items:center; gap:5px; transition:color .15s; }
  .set-back-btn:hover { color:white; }
  .set-signout-btn { background:none; border:1px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.6); border-radius:8px; padding:5px 12px; font-family:'Outfit',sans-serif; font-size:12px; cursor:pointer; transition:all .2s; }
  .set-signout-btn:hover { border-color:rgba(255,255,255,0.5); color:white; }

  .set-wrap { max-width:480px; margin:0 auto; padding:24px 16px 80px; }

  .set-page-title { font-family:'Playfair Display',serif; font-size:26px; color:var(--text); margin-bottom:6px; }
  .set-page-sub { font-size:13px; color:var(--text-dim); margin-bottom:24px; line-height:1.6; }

  .set-card { background:white; border:1.5px solid var(--border); border-radius:16px; padding:20px; margin-bottom:16px; }
  .set-section-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:var(--text-dim); margin-bottom:14px; }

  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:60px; }
  .big-spinner { width:28px; height:28px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
`;

const PUTT_OPTIONS = [
  {
    value: "first_only",
    label: "First putt only",
    desc: "Record the distance of your first putt only. Nothing else.",
    premiumOnly: false,
  },
  {
    value: "standard",
    label: "Standard",
    desc: "Record first putt distance always. On 3-putts, also record second putt distance.",
    premiumOnly: false,
  },
  {
    value: "full",
    label: "Full putt distances",
    desc: "Record a distance for every putt — 1 putt, 2 putts, or 3 putts.",
    premiumOnly: true,
  },
];

export default function StudentSettings({ user, onBack, onSignOut }) {
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [puttTracking, setPuttTracking] = useState("standard");
  const [approachLogging, setApproachLogging] = useState("enabled");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("settings, is_premium")
        .eq("id", user.id)
        .single();
      setIsPremium(!!data?.is_premium);
      setPuttTracking(data?.settings?.putt_tracking || "standard");
      setApproachLogging(data?.settings?.approach_logging || "enabled");
      setLoading(false);
    }
    load();
  }, [user.id]);

  async function handleSelect(val) {
    const opt = PUTT_OPTIONS.find(o => o.value === val);
    if (opt?.premiumOnly && !isPremium) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ settings: { putt_tracking: val, approach_logging: approachLogging } })
      .eq("id", user.id);
    if (!error) setPuttTracking(val);
    setSaving(false);
  }

  async function handleApproachSelect(val) {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ settings: { putt_tracking: puttTracking, approach_logging: val } })
      .eq("id", user.id);
    if (!error) setApproachLogging(val);
    setSaving(false);
  }

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="set-bar">
        <button className="set-back-btn" onClick={onBack}>← Back</button>
        <div className="set-logo">Caddie</div>
        <button className="set-signout-btn" onClick={onSignOut}>Sign out</button>
      </div>
      <div className="loading-wrap"><div className="big-spinner" /></div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="set-bar">
        <button className="set-back-btn" onClick={onBack}>← Back</button>
        <div className="set-logo">Caddie</div>
        <div className="set-bar-right">
          <button className="set-signout-btn" onClick={onSignOut}>Sign out</button>
        </div>
      </div>

      <div className="set-wrap">
        <div className="set-page-title">Settings</div>
        <div className="set-page-sub">Manage your round logging preferences.</div>

        <div className="set-card">
          <div className="set-section-label">Putting</div>
          <div style={{marginBottom:4}}>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text)",marginBottom:4}}>Putt tracking detail</div>
            <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:14,lineHeight:1.55}}>
              Controls how much distance data is recorded for your putts.
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {PUTT_OPTIONS.map(opt => {
                const isActive    = puttTracking === opt.value;
                const isLocked    = opt.premiumOnly && !isPremium;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      background: isActive ? "var(--green-dark)" : "white",
                      border: "1.5px solid " + (isActive ? "var(--green-dark)" : "var(--border)"),
                      borderRadius: 12, padding: "14px 16px",
                      cursor: isLocked ? "not-allowed" : "pointer",
                      opacity: isLocked ? 0.6 : 1,
                      transition: "all .18s",
                    }}
                  >
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{flex:1}}>
                        <div style={{
                          fontSize: 14, fontWeight: 700, marginBottom: 3,
                          color: isActive ? "white" : "var(--text)",
                          display: "flex", alignItems: "center", gap: 8,
                        }}>
                          {opt.label}
                          {opt.premiumOnly && !isPremium && (
                            <span style={{
                              background: "var(--gold)", color: "var(--green-dark)",
                              fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                              textTransform: "uppercase", letterSpacing: ".05em",
                            }}>Premium</span>
                          )}
                        </div>
                        <div style={{
                          fontSize: 12, lineHeight: 1.5,
                          color: isActive ? "rgba(255,255,255,0.6)" : "var(--text-dim)",
                        }}>
                          {opt.desc}
                        </div>
                      </div>
                      {isActive && (
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%", background: "var(--gold)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, marginLeft: 12, fontSize: 12,
                          color: "var(--green-dark)", fontWeight: 700,
                        }}>✓</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!isPremium && (
              <div style={{
                background: "#FFF8E6", border: "1px solid #E8D080", borderRadius: 10,
                padding: "10px 13px", fontSize: 12, color: "#7A5A00", lineHeight: 1.55, marginTop: 12,
              }}>
                Full putt distances is a <strong>Premium</strong> feature. Upgrade to unlock detailed putt tracking.
              </div>
            )}

            {saving && (
              <div style={{fontSize:12,color:"var(--text-dim)",marginTop:10,textAlign:"center"}}>Saving…</div>
            )}
          </div>
        </div>

        <div className="set-card">
          <div className="set-section-label">Approach distance logging</div>
          <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:14,lineHeight:1.55}}>
            Controls whether approach distance is recorded for each hole.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              { value: "enabled",  label: "Enabled",  desc: "Record approach distance (e.g. 75–100 yds) for each hole." },
              { value: "disabled", label: "Disabled", desc: "Skip the approach distance input entirely. Approach is saved as blank." },
            ].map(opt => {
              const isActive = approachLogging === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => handleApproachSelect(opt.value)}
                  style={{
                    background: isActive ? "var(--green-dark)" : "white",
                    border: "1.5px solid " + (isActive ? "var(--green-dark)" : "var(--border)"),
                    borderRadius: 12, padding: "14px 16px",
                    cursor: "pointer", transition: "all .18s",
                  }}
                >
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700,marginBottom:3,color:isActive?"white":"var(--text)"}}>
                        {opt.label}
                      </div>
                      <div style={{fontSize:12,lineHeight:1.5,color:isActive?"rgba(255,255,255,0.6)":"var(--text-dim)"}}>
                        {opt.desc}
                      </div>
                    </div>
                    {isActive && (
                      <div style={{
                        width:20,height:20,borderRadius:"50%",background:"var(--gold)",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        flexShrink:0,marginLeft:12,fontSize:12,
                        color:"var(--green-dark)",fontWeight:700,
                      }}>✓</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
