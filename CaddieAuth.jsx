import { useState } from "react";
import { supabase } from './supabaseClient';

// ── Design tokens (matching caddie_v4.html) ──
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Outfit:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

  :root {
    --green-dark: #0F3D2E;
    --green:      #1A6B4A;
    --green-mid:  #2A8A60;
    --green-light:#3DAA78;
    --grass:      #52C97A;
    --bg:         #F4F1EB;
    --gold:       #C9A84C;
    --red:        #C94040;
    --orange:     #D4763A;
    --sky:        #4A90D9;
    --text:       #1C1C1C;
    --text-mid:   #555;
    --text-dim:   #999;
    --border:     #E2DDD4;
    --shadow:     0 2px 16px rgba(0,0,0,0.08);
    --shadow-lg:  0 8px 32px rgba(0,0,0,0.12);
  }

  body { font-family: 'Outfit', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

  .caddie-auth {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 16px 48px;
    position: relative;
    overflow: hidden;
  }

  .caddie-auth::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(15,61,46,0.06) 0%, transparent 70%),
      radial-gradient(circle at 90% 90%, rgba(201,168,76,0.05) 0%, transparent 50%);
    pointer-events: none;
  }

  .auth-card {
    width: 100%;
    max-width: 400px;
    background: white;
    border-radius: 24px;
    border: 1px solid var(--border);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .auth-header {
    background: var(--green-dark);
    padding: 28px 28px 24px;
    position: relative;
    overflow: hidden;
  }

  .auth-header::after {
    content: '';
    position: absolute;
    right: -40px; top: -40px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: rgba(255,255,255,0.03);
    pointer-events: none;
  }

  .auth-logo {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    color: var(--gold);
    letter-spacing: -0.5px;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .auth-logo-flag { font-size: 20px; }

  .auth-subtitle {
    font-size: 13px;
    color: rgba(255,255,255,0.45);
    font-weight: 400;
  }

  .auth-body { padding: 28px; }

  .auth-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    color: var(--text);
    margin-bottom: 6px;
  }

  .auth-desc {
    font-size: 13px;
    color: var(--text-dim);
    margin-bottom: 24px;
    line-height: 1.6;
  }

  .role-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 24px;
  }

  .role-btn {
    background: white;
    border: 2px solid var(--border);
    border-radius: 14px;
    padding: 16px 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.18s;
    font-family: 'Outfit', sans-serif;
    position: relative;
    overflow: hidden;
  }

  .role-btn:hover { border-color: var(--green-light); transform: translateY(-1px); }

  .role-btn.active {
    background: var(--green-dark);
    border-color: var(--green-dark);
  }

  .role-btn.active .role-icon,
  .role-btn.active .role-label { color: white; }
  .role-btn.active .role-sub { color: rgba(255,255,255,0.5); }

  .role-icon { font-size: 26px; display: block; margin-bottom: 6px; }
  .role-label { font-size: 14px; font-weight: 700; color: var(--text); display: block; margin-bottom: 3px; }
  .role-sub { font-size: 11px; color: var(--text-dim); display: block; line-height: 1.4; }

  .field { margin-bottom: 16px; }

  .field-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    margin-bottom: 7px;
  }

  .field-input {
    width: 100%;
    background: var(--bg);
    border: 1.5px solid var(--border);
    border-radius: 11px;
    padding: 12px 14px;
    font-family: 'Outfit', sans-serif;
    font-size: 15px;
    color: var(--text);
    outline: none;
    transition: border-color 0.15s;
    -webkit-appearance: none;
  }

  .field-input:focus { border-color: var(--green-light); background: white; }
  .field-input.error { border-color: var(--red); }
  .field-input::placeholder { color: var(--text-dim); }

  .name-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .error-msg {
    background: #FEF0F0;
    border: 1px solid #F5C6C6;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    color: var(--red);
    margin-bottom: 16px;
    line-height: 1.5;
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .error-msg-icon { flex-shrink: 0; margin-top: 1px; }

  .success-msg {
    background: #E8F4EE;
    border: 1px solid #A8D8BE;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    color: var(--green);
    margin-bottom: 16px;
    line-height: 1.5;
  }

  .primary-btn {
    width: 100%;
    background: var(--green);
    border: none;
    border-radius: 13px;
    padding: 15px;
    font-family: 'Outfit', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 4px;
  }

  .primary-btn:hover:not(:disabled) {
    background: var(--green-mid);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(26,107,74,0.28);
  }

  .primary-btn:disabled {
    background: #C8C4BB;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .auth-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 18px 0;
    font-size: 12px;
    color: var(--text-dim);
  }

  .auth-divider::before,
  .auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .auth-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 20px;
    font-size: 13px;
    color: var(--text-dim);
  }

  .auth-link {
    color: var(--green);
    font-weight: 600;
    cursor: pointer;
    background: none;
    border: none;
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    padding: 0;
    text-decoration: none;
    transition: color 0.15s;
  }

  .auth-link:hover { color: var(--green-mid); text-decoration: underline; }

  .forgot-link {
    display: block;
    text-align: right;
    margin-top: 6px;
    font-size: 12px;
    color: var(--text-dim);
    cursor: pointer;
    background: none;
    border: none;
    font-family: 'Outfit', sans-serif;
    padding: 0;
  }

  .forgot-link:hover { color: var(--green); }

  .invite-badge {
    background: linear-gradient(135deg, #F0E8FF, #E8F0FF);
    border: 1px solid #C4B0E8;
    border-radius: 10px;
    padding: 11px 14px;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #5A3FA0;
  }

  .invite-badge-icon { font-size: 18px; flex-shrink: 0; }
  .invite-badge-text { line-height: 1.4; }
  .invite-badge-coach { font-weight: 700; }

  .success-screen {
    text-align: center;
    padding: 8px 0 4px;
  }

  .success-check {
    width: 64px; height: 64px;
    background: var(--green-dark);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px;
    margin: 0 auto 18px;
  }

  .success-screen-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    color: var(--text);
    margin-bottom: 8px;
  }

  .success-screen-sub {
    font-size: 14px;
    color: var(--text-dim);
    line-height: 1.7;
    margin-bottom: 24px;
  }

  .pw-strength {
    display: flex;
    gap: 4px;
    margin-top: 7px;
  }

  .pw-bar {
    flex: 1;
    height: 3px;
    border-radius: 2px;
    background: var(--border);
    transition: background 0.2s;
  }

  .pw-bar.filled-weak   { background: var(--red); }
  .pw-bar.filled-fair   { background: var(--orange); }
  .pw-bar.filled-strong { background: var(--green-light); }
  .pw-bar.filled-great  { background: var(--green); }

  .pw-label {
    font-size: 11px;
    color: var(--text-dim);
    margin-top: 5px;
  }

  .auth-wordmark {
    margin-top: 28px;
    font-size: 12px;
    color: rgba(0,0,0,0.22);
    text-align: center;
    font-family: 'Playfair Display', serif;
  }

  @media (max-width: 420px) {
    .auth-card { border-radius: 20px; }
    .auth-body { padding: 22px 20px; }
    .auth-header { padding: 22px 20px 20px; }
  }
`;

function getStrength(pw) {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["", "Weak", "Fair", "Good", "Strong", "Very strong"];
  const keys   = ["", "weak", "fair", "strong", "great", "great"];
  return { score, label: labels[score], key: keys[score] };
}

function PasswordStrength({ password }) {
  const { score, label, key } = getStrength(password);
  if (!password) return null;
  return (
    <div>
      <div className="pw-strength">
        {[1,2,3,4].map(i => (
          <div key={i} className={`pw-bar ${i <= score ? `filled-${key}` : ""}`} />
        ))}
      </div>
      <div className="pw-label">{label}</div>
    </div>
  );
}

function RoleSelector({ role, onChange }) {
  return (
    <div className="role-grid">
      <button
        type="button"
        className={`role-btn ${role === "student" ? "active" : ""}`}
        onClick={() => onChange("student")}
      >
        <span className="role-icon">🏌️</span>
        <span className="role-label">Student</span>
        <span className="role-sub">Track rounds &amp; share with your coach</span>
      </button>
      <button
        type="button"
        className={`role-btn ${role === "coach" ? "active" : ""}`}
        onClick={() => onChange("coach")}
      >
        <span className="role-icon">📋</span>
        <span className="role-label">Coach</span>
        <span className="role-sub">Analyse student rounds &amp; send feedback</span>
      </button>
    </div>
  );
}

function LoginScreen({ onSwitch, onForgot, onSuccess }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    onSuccess({ email }, profile?.role ?? "student");
  }

  return (
    <>
      <div className="auth-title">Welcome back</div>
      <div className="auth-desc">Sign in to your Caddie account.</div>

      {error && (
        <div className="error-msg">
          <span className="error-msg-icon">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div className="field">
          <label className="field-label">Email</label>
          <input
            className={`field-input ${error ? "error" : ""}`}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label className="field-label">Password</label>
          <input
            className={`field-input ${error ? "error" : ""}`}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button type="button" className="forgot-link" onClick={onForgot}>
            Forgot password?
          </button>
        </div>

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? <div className="spinner" /> : <>Sign in <span>→</span></>}
        </button>
      </form>

      <div className="auth-footer">
        <span>Don't have an account?</span>
        <button className="auth-link" onClick={onSwitch}>Create one</button>
      </div>
    </>
  );
}

function SignUpScreen({ onSwitch, onSuccess, inviteCoach }) {
  const [role, setRole]           = useState("student");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");

    if (!firstName.trim()) { setError("Please enter your first name."); return; }
    if (!email)             { setError("Please enter your email address."); return; }
    if (!password)          { setError("Please choose a password."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);

    const { data, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name:  lastName,
          role,
          ...(inviteCoach ? { coach_id: inviteCoach.id } : {})
        }
      }
    });

    if (authErr) { setLoading(false); setError(authErr.message); return; }

    await supabase.from("profiles").insert([{
      id:         data.user?.id,
      first_name: firstName,
      last_name:  lastName,
      role,
      ...(inviteCoach ? { coach_id: inviteCoach.id } : {})
    }]);

    setLoading(false);
    onSuccess({ firstName, role, email }, role);
  }

  return (
    <>
      <div className="auth-title">Create your account</div>
      <div className="auth-desc">Join Caddie and start improving your game.</div>

      {inviteCoach && (
        <div className="invite-badge">
          <span className="invite-badge-icon">🔗</span>
          <div className="invite-badge-text">
            Invited by <span className="invite-badge-coach">{inviteCoach.name}</span> — your account will be linked automatically.
          </div>
        </div>
      )}

      {!inviteCoach && <RoleSelector role={role} onChange={setRole} />}

      {error && (
        <div className="error-msg">
          <span className="error-msg-icon">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSignUp}>
        <div className="name-row">
          <div className="field">
            <label className="field-label">First name</label>
            <input
              className="field-input"
              type="text"
              placeholder="Alex"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="field">
            <label className="field-label">Last name</label>
            <input
              className="field-input"
              type="text"
              placeholder="Smith"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="field">
          <label className="field-label">Email</label>
          <input
            className="field-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label className="field-label">Password</label>
          <input
            className="field-input"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordStrength password={password} />
        </div>

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading
            ? <div className="spinner" />
            : <>{role === "coach" ? "Create coach account" : "Create student account"} <span>→</span></>
          }
        </button>
      </form>

      <div className="auth-footer">
        <span>Already have an account?</span>
        <button className="auth-link" onClick={onSwitch}>Sign in</button>
      </div>
    </>
  );
}

function ForgotScreen({ onBack }) {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="success-screen">
        <div className="success-check">📬</div>
        <div className="success-screen-title">Check your inbox</div>
        <div className="success-screen-sub">
          We've sent a password reset link to<br /><strong>{email}</strong>
        </div>
        <button className="primary-btn" onClick={onBack}>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="auth-title">Reset password</div>
      <div className="auth-desc">We'll send a reset link to your email.</div>

      {error && (
        <div className="error-msg">
          <span className="error-msg-icon">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleReset}>
        <div className="field">
          <label className="field-label">Email</label>
          <input
            className="field-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? <div className="spinner" /> : <>Send reset link <span>→</span></>}
        </button>
      </form>

      <div className="auth-footer">
        <button className="auth-link" onClick={onBack}>← Back to sign in</button>
      </div>
    </>
  );
}

function WelcomeScreen({ user, onContinue }) {
  return (
    <div className="success-screen">
      <div className="success-check">⛳</div>
      <div className="success-screen-title">
        Welcome{user.firstName ? `, ${user.firstName}` : ""}!
      </div>
      <div className="success-screen-sub">
        {user.role === "coach"
          ? "Your coach account is ready. Head to your dashboard to invite students and start analysing rounds."
          : "Your student account is ready. Start logging your first round and your coach will receive the data automatically."}
      </div>
      <button className="primary-btn" onClick={onContinue}>
        {user.role === "coach" ? "Go to dashboard →" : "Log a round →"}
      </button>
    </div>
  );
}

// ── ROOT COMPONENT ──
export default function CaddieAuth({ onAuthSuccess }) {
  const inviteCoach = null;

  const [screen, setScreen]       = useState("login");
  const [authedUser, setAuthedUser] = useState(null);

  function handleAuthSuccess(user, role) {
    const fullUser = { ...user, role };
    setAuthedUser(fullUser);
    setScreen("welcome");
  }

  return (
    <>
      <style>{css}</style>
      <div className="caddie-auth">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <span className="auth-logo-flag">⛳</span>
              Caddie
            </div>
            <div className="auth-subtitle">Golf coaching, beautifully simple</div>
          </div>

          <div className="auth-body">
            {screen === "login" && (
              <LoginScreen
                onSwitch={() => setScreen("signup")}
                onForgot={() => setScreen("forgot")}
                onSuccess={handleAuthSuccess}
              />
            )}
            {screen === "signup" && (
              <SignUpScreen
                onSwitch={() => setScreen("login")}
                onSuccess={handleAuthSuccess}
                inviteCoach={inviteCoach}
              />
            )}
            {screen === "forgot" && (
              <ForgotScreen
                onBack={() => setScreen("login")}
              />
            )}
            {screen === "welcome" && authedUser && (
              <WelcomeScreen
                user={authedUser}
                onContinue={() => onAuthSuccess(authedUser, authedUser.role)}
              />
            )}
          </div>
        </div>

        <div className="auth-wordmark">Caddie · Golf Coaching Platform</div>
      </div>
    </>
  );
}
