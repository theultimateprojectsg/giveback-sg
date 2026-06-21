import { useState } from 'react'
import { supabase } from './supabase'
import logo from './assets/logo.png'

export default function Auth() {
  const [screen, setScreen] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [nric, setNric] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showPass, setShowPass] = useState(false)

  function reset() { setError(''); setMessage('') }

  async function handleLogin() {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true); reset()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false)
  }

  async function handleSignup() {
    if (!email || !password || !name) { setError('Please fill in all fields'); return }
    if (nric && nric.length < 9) { setError('NRIC must be 9 characters (e.g. S1234567A)'); return }
    if (nric && !/^[STFG]\d{7}[A-Z]$/.test(nric.toUpperCase())) { setError('Invalid NRIC format. Should be like S1234567A'); return }
    setLoading(true); reset()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          ...(nric ? {
            nric_masked: nric.toUpperCase().slice(0, 1) + '×××××' + nric.toUpperCase().slice(-2),
            nric: nric.toUpperCase(),
          } : {}),
        }
      }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setMessage('Account created! Please check your email to confirm your account.')
    setScreen('login')
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email) { setError('Please enter your email address first'); return }
    setLoading(true); reset()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://givingtree.sg',
    })
    if (error) { setError(error.message); setLoading(false); return }
    setMessage('Password reset email sent! Check your inbox.')
    setLoading(false)
  }

  return (
    <div className="donor-auth-page">
      <style>{`
        .donor-auth-page {
          min-height: 100dvh;
          background: #0F2419;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: Georgia, serif;
          position: relative;
          overflow-x: hidden;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .donor-auth-bg-blob-1 {
          position: fixed; top: -100px; left: 50%; transform: translateX(-50%);
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(45,106,79,0.2) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .donor-auth-bg-blob-2 {
          position: fixed; bottom: -80px; right: -60px;
          width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(212,160,23,0.07) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
        .donor-auth-bg-dots {
          position: fixed; inset: 0;
          background-image: radial-gradient(rgba(116,198,157,0.04) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none; z-index: 0;
        }
        .donor-auth-content {
          width: 100%;
          max-width: 420px;
          padding: 40px 24px 48px;
          position: relative;
          z-index: 1;
          box-sizing: border-box;
        }
        .donor-auth-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
        }
        .donor-auth-intro-line {
          font-size: 14px;
          color: #74C69D;
          font-family: sans-serif;
          text-align: center;
          line-height: 1.5;
          margin-bottom: 24px;
          font-style: italic;
        }
        .donor-auth-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(116,198,157,0.15);
          border-radius: 24px;
          padding: 24px 20px;
          margin-bottom: 14px;
        }
        .donor-auth-tabs {
          display: flex;
          background: rgba(0,0,0,0.25);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 22px;
        }
        .donor-auth-tab {
          flex: 1;
          text-align: center;
          padding: 10px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: sans-serif;
          letter-spacing: 0.5px;
          transition: all 0.2s;
          color: #52B788;
        }
        .donor-auth-tab.active {
          background: #2D6A4F;
          color: white;
        }
        .donor-auth-trust-row {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 24px;
        }
      `}</style>

      <div className="donor-auth-bg-blob-1" />
      <div className="donor-auth-bg-blob-2" />
      <div className="donor-auth-bg-dots" />

      <div className="donor-auth-content">

        {/* ── HERO ── */}
        <div className="donor-auth-hero">
          <div style={{ marginBottom: 16 }}>
            <img src={logo} style={{ width: 64, height: 64, objectFit: 'contain' }} />
          </div>
          <div style={{
            fontSize: 24, fontWeight: 700, color: 'white',
            letterSpacing: '3px', textTransform: 'uppercase',
            textAlign: 'center', lineHeight: 1.1, marginBottom: 10,
          }}>
            Giving Tree
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, width: 200 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #D4A017)' }} />
            <svg width="12" height="10" viewBox="0 0 16 14">
              <path d="M8 13 C8 13 1 7.5 1 3.5 C1 1.5 2.5 0.5 4 1.5 C5.5 2.5 8 5 8 5 C8 5 10.5 2.5 12 1.5 C13.5 0.5 15 1.5 15 3.5 C15 7.5 8 13 8 13Z" fill="#D4A017" />
            </svg>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #D4A017, transparent)' }} />
          </div>
          <div style={{ fontSize: 11, color: '#74C69D', letterSpacing: '2.5px', textTransform: 'uppercase', textAlign: 'center' }}>
            Many Hearts. One Purpose.
          </div>
        </div>

        <div className="donor-auth-intro-line">
          Every donation tells a story. Let's add yours.
        </div>

        {/* ── FORM CARD ── */}
        <div className="donor-auth-card">

          {/* Tab switcher — login/signup only, not on forgot */}
          {screen !== 'forgot' && (
            <div className="donor-auth-tabs">
              {['login', 'signup'].map(s => (
                <div
                  key={s}
                  onClick={() => { setScreen(s); reset() }}
                  className={`donor-auth-tab ${screen === s ? 'active' : ''}`}
                >
                  {s === 'login' ? 'Sign In' : 'Sign Up'}
                </div>
              ))}
            </div>
          )}

          {/* Forgot heading */}
          {screen === 'forgot' && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Reset Password</div>
              <div style={{ fontSize: 12, color: '#52B788', fontFamily: 'sans-serif' }}>Enter your email and we'll send a reset link</div>
            </div>
          )}

          {/* Error / success */}
          {error && (
            <div style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', color: '#FF7B6B', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14, fontFamily: 'sans-serif', lineHeight: 1.5 }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ background: 'rgba(64,145,108,0.15)', border: '1px solid rgba(64,145,108,0.3)', color: '#74C69D', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14, fontFamily: 'sans-serif', lineHeight: 1.5 }}>
              {message}
            </div>
          )}

          {/* Signup extra fields */}
          {screen === 'signup' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Full Name *</label>
                <input
                  style={inp}
                  placeholder="As per NRIC"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>NRIC / FIN <span style={{ color: '#52B788', fontWeight: 400, letterSpacing: 0 }}>(Required for automated tax deductibles)</span></label>
                <input
                  style={inp}
                  placeholder="e.g. S1234567A"
                  value={nric}
                  onChange={e => setNric(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={9}
                />
                {nric.length > 0 && nric.length < 9 && (
                  <div style={{ fontSize: 11, color: '#D4A017', marginTop: 4, fontFamily: 'sans-serif' }}>NRIC must be 9 characters</div>
                )}
              </div>
            </>
          )}

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Email Address</label>
            <input
              style={inp}
              placeholder="you@email.com"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoCapitalize="none"
            />
          </div>

          {/* Password */}
          {screen !== 'forgot' && (
            <div style={{ marginBottom: 6, position: 'relative' }}>
              <label style={lbl}>Password</label>
              <input
                style={inp}
                placeholder="••••••••"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <div onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 16, bottom: 14,
                fontSize: 11, color: '#74C69D', cursor: 'pointer',
                fontFamily: 'sans-serif', letterSpacing: '0.5px',
              }}>
                {showPass ? 'Hide' : 'Show'}
              </div>
            </div>
          )}

          {/* Forgot link */}
          {screen === 'login' && (
            <div style={{ textAlign: 'right', marginBottom: 20, marginTop: 6 }}>
              <span onClick={() => { setScreen('forgot'); reset() }} style={{ fontSize: 12, color: '#74C69D', cursor: 'pointer', fontFamily: 'sans-serif' }}>
                Forgot password?
              </span>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={screen === 'login' ? handleLogin : screen === 'signup' ? handleSignup : handleForgotPassword}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? 'rgba(64,145,108,0.4)' : 'linear-gradient(135deg, #40916C, #2D6A4F)',
              color: 'white',
              border: 'none',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              fontFamily: 'Georgia, serif',
              boxShadow: loading ? 'none' : '0 6px 24px rgba(64,145,108,0.35)',
              marginTop: screen === 'login' ? 0 : 8,
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Please wait...' :
              screen === 'login' ? 'Sign In' :
              screen === 'signup' ? 'Create Account' :
              'Send Reset Link'}
          </button>

          {/* Back to login from forgot */}
          {screen === 'forgot' && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <span onClick={() => { setScreen('login'); reset() }} style={{ fontSize: 12, color: '#D4A017', cursor: 'pointer', fontFamily: 'sans-serif' }}>
                ← Back to Sign In
              </span>
            </div>
          )}

        </div>

        {/* NRIC note — signup only */}
        {screen === 'signup' && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(116,198,157,0.05)',
            border: '1px solid rgba(116,198,157,0.12)',
            borderRadius: 12, fontSize: 11,
            color: '#52B788', textAlign: 'center',
            fontFamily: 'sans-serif', lineHeight: 1.6, marginBottom: 14,
          }}>
            🔒 Your NRIC is masked and never stored in full.<br />
            Used only for IRAS 250% tax deduction receipts.
          </div>
        )}

        {/* Trust badges */}
        <div className="donor-auth-trust-row">
          {[
            { icon: '🏛️', label: 'IPC Charities' },
            { icon: '🧾', label: 'IRAS Deductible' },
            { icon: '🔒', label: 'Secure Payments' },
          ].map((b, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 10 }}>{b.icon}</div>
              <div style={{ fontSize: 8, color: '#52B788', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>{b.label}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

const lbl = {
  display: 'block', fontSize: 10, fontWeight: 600,
  color: '#74C69D', letterSpacing: '2px', textTransform: 'uppercase',
  marginBottom: 7, fontFamily: 'sans-serif',
}

const inp = {
  width: '100%', padding: '14px 16px',
  background: 'rgba(255,255,255,0.06)',
  border: '1.5px solid rgba(116,198,157,0.2)',
  borderRadius: 12, fontSize: 14, color: 'white',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'sans-serif',
}