
export default function AdminDashboard({ user, onSignOut }) {
  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 16px", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{
        background: "#0F3D2E", color: "white", borderRadius: 16,
        padding: "24px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#C9A84C" }}>
          Caddie Admin
        </span>
        <button
          onClick={onSignOut}
          style={{ background: "none", border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 12 }}
        >
          Sign out
        </button>
      </div>

      <div style={{ background: "white", borderRadius: 16, padding: 24, color: "#1C1C1C" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", marginBottom: 8, fontSize: 20 }}>
          Admin Dashboard
        </h2>
        <p style={{ color: "#999", fontSize: 14 }}>
          Signed in as {user?.email}
        </p>
        <div style={{ marginTop: 24, padding: 16, background: "#F4F1EB", borderRadius: 12, color: "#555", fontSize: 14 }}>
          Admin features coming soon.
        </div>
      </div>
    </div>
  );
}
