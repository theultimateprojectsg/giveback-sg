import { useState, useRef } from 'react'
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
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resending, setResending] = useState(false)
  const toastTimerRef = useRef(null)

  function reset() { setError(''); setMessage('') }

  function showToast(msg, type = 'error') {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    if (type === 'error') setError(msg)
    else setMessage(msg)
    toastTimerRef.current = setTimeout(() => { setError(''); setMessage('') }, 6000)
  }

  async function handleGoogleSignIn() {
    if (loading) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://givingtree.sg',
      }
    })
    if (error) { showToast(error.message); setLoading(false); return }
  }

  async function handleLogin() {
    if (loading) return
    if (!email || !password) { showToast('Please fill in all fields'); return }
    setLoading(true); reset()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { showToast(error.message); setLoading(false); return }
    setLoading(false)
  }

  async function handleSignup() {
    if (loading) return
    if (!email || !password || !name) { showToast('Please fill in all fields'); return }
    if (password.length < 6) { showToast('Password must be at least 6 characters'); return }
    if (!agreedToTerms) { showToast('Please agree to the Terms of Use and Privacy Policy to continue'); return }
    if (nric && nric.length < 9) { showToast('NRIC must be 9 characters (e.g. S1234567A)'); return }
    if (nric && !/^[A-Z]\d{7}[A-Z]$/.test(nric.toUpperCase())) { showToast('Invalid NRIC format. Should be like S1234567A'); return }
    setLoading(true); reset()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    })
    if (error) { showToast(error.message); setLoading(false); return }
    if (nric) {
      localStorage.setItem('giveback_pending_nric', JSON.stringify({ nric: nric.toUpperCase(), full_name: name }))
    }
    showToast('Account created! Please check your email to confirm your account.', 'success')
    setShowResend(true)
    setScreen('login')
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (loading) return
    if (!email) { showToast('Please enter your email address first'); return }
    setLoading(true); reset()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://givingtree.sg',
    })
    if (error) { showToast(error.message); setLoading(false); return }
    showToast('Password reset email sent! Check your inbox.', 'success')
    setLoading(false)
  }

  async function handleResendConfirmation() {
    if (resending) return
    if (!email) { showToast('Please enter your email address first'); return }
    setResending(true); reset()
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) { showToast(error.message); setResending(false); return }
    showToast('Confirmation email resent! Check your inbox (and spam folder).', 'success')
    setResending(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      if (screen === 'login') handleLogin()
      else if (screen === 'signup') handleSignup()
      else handleForgotPassword()
    }
  }

  return (
    <div className="donor-auth-page">
      <style>{`
        .donor-auth-page {
          min-height: 100vh;
          background: #0F2419;
          font-family: Georgia, serif;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px 16px;
          box-sizing: border-box;
        }
        .donor-auth-shell {
          width: 100%;
          max-width: 1000px;
          display: flex;
          flex-direction: row;
          background: rgba(255,255,255,0.01);
          border-radius: 24px;
          overflow: hidden;
          position: relative;
        }
        .donor-auth-bg-blob-1 {
          position: absolute; top: -200px; left: -200px; width: 700px; height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(45,106,79,0.35) 0%, transparent 65%);
          pointer-events: none;
        }
        .donor-auth-bg-blob-2 {
          position: absolute; bottom: -150px; right: -100px; width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212,160,23,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .donor-auth-bg-dots {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(116,198,157,0.03) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }
        .donor-auth-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 56px;
          border-right: 1px solid rgba(116,198,157,0.08);
          position: relative;
          z-index: 1;
        }
        .donor-auth-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 56px;
          background: rgba(255,255,255,0.02);
          position: relative;
          z-index: 1;
          box-sizing: border-box;
        }
        .donor-auth-right-inner {
          width: 100%;
          max-width: 380px;
        }
        .donor-auth-intro {
          text-align: left;
          margin-bottom: 28px;
        }
        .donor-auth-feature-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
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

        @media (max-width: 768px) {
          .donor-auth-shell {
            flex-direction: column;
            border-radius: 20px;
          }
          .donor-auth-left {
            padding: 40px 24px 24px;
            border-right: none;
            border-bottom: 1px solid rgba(116,198,157,0.08);
          }
          .donor-auth-right {
            padding: 32px 24px;
          }
          .donor-auth-intro {
            text-align: center;
          }
          .donor-auth-feature-block {
            display: none;
          }
          .donor-auth-logo-img {
            width: 64px !important;
            height: 64px !important;
          }
          .donor-auth-brand-name {
            font-size: 24px !important;
          }
          .donor-auth-welcome-heading {
            font-size: 22px !important;
          }
        }
      `}</style>

      <div className="donor-auth-shell">
        <div className="donor-auth-bg-blob-1" />
        <div className="donor-auth-bg-blob-2" />
        <div className="donor-auth-bg-dots" />

        {/* ── LEFT PANEL ── */}
        <div className="donor-auth-left">
          <a href="https://givingtree.sg" style={{ fontSize: 11, color: '#52B788', fontFamily: 'sans-serif', textDecoration: 'none', marginBottom: 20, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to givingtree.sg
          </a>
          <div style={{ marginBottom: 28 }}>
            <img src={logo} className="donor-auth-logo-img" style={{ width: 110, height: 110, objectFit: 'contain' }} />
          </div>
          <div className="donor-auth-brand-name" style={{ fontSize: 36, fontWeight: 700, color: 'white', letterSpacing: '4px', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1, marginBottom: 12 }}>
            Giving Tree
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, width: 220 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #D4A017)' }} />
            <svg width="14" height="12" viewBox="0 0 16 14">
              <path d="M8 13 C8 13 1 7.5 1 3.5 C1 1.5 2.5 0.5 4 1.5 C5.5 2.5 8 5 8 5 C8 5 10.5 2.5 12 1.5 C13.5 0.5 15 1.5 15 3.5 C15 7.5 8 13 8 13Z" fill="#D4A017" />
            </svg>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #D4A017, transparent)' }} />
          </div>
          <div style={{ fontSize: 11, color: '#74C69D', letterSpacing: '3px', textTransform: 'uppercase', textAlign: 'center', marginBottom: 20 }}>
            Many Hearts. One Purpose.
          </div>

          <div className="donor-auth-feature-block">
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(116,198,157,0.15)', borderRadius: 16, padding: '16px 28px', textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#D4A017', letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>Donor Portal</div>
            </div>
            <div className="donor-auth-feature-list">
              {[
                { icon: '🏛️', text: 'IPC-registered charities' },
                { icon: '🧾', text: '250% automated tax receipts' },
                { icon: '🔒', text: 'Secure PayNow donations' },
                { icon: '📱', text: 'Track every gift you give' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 20 }}>{f.icon}</div>
                  <div style={{ fontSize: 13, color: '#52B788', fontFamily: 'sans-serif' }}>{f.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="donor-auth-right">
          <div className="donor-auth-right-inner">

            <div className="donor-auth-intro">
              <div style={{ fontSize: 11, color: '#D4A017', letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'sans-serif', marginBottom: 10 }}>
                {screen === 'forgot' ? 'Reset Your Password' : 'Donor Portal Access'}
              </div>
              {screen !== 'forgot' ? (
                <>
                  <div className="donor-auth-welcome-heading" style={{ fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 8 }}>
                    {screen === 'login' ? 'Welcome back' : 'Join Giving Tree'}
                  </div>
                  <div style={{ fontSize: 13, color: '#52B788', fontFamily: 'sans-serif', lineHeight: 1.6 }}>
                    Every donation tells a story. Let's add yours.
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: '#52B788', fontFamily: 'sans-serif', lineHeight: 1.6 }}>
                  Enter your email and we'll send a reset link.
                </div>
              )}
            </div>

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

            {screen !== 'forgot' && (
              <>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px', marginBottom: 16,
                    background: 'white', color: '#1C1C1C', border: 'none', borderRadius: 12,
                    fontSize: 14, fontWeight: 600, fontFamily: 'sans-serif',
                    cursor: loading ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.27h2.92c1.71-1.57 2.69-3.88 2.69-6.64z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.97 10.7c-.18-.54-.28-1.11-.28-1.7s.1-1.16.28-1.7V4.96H.96C.35 6.18 0 7.55 0 9s.35 2.82.96 4.04l3.01-2.34z"/>
                    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"/>
                  </svg>
                  Continue with Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(116,198,157,0.2)' }} />
                  <div style={{ fontSize: 11, color: '#52B788', fontFamily: 'sans-serif' }}>OR</div>
                  <div style={{ flex: 1, height: 1, background: 'rgba(116,198,157,0.2)' }} />
                </div>
              </>
            )}

            
            {showResend && screen === 'login' && (
              <div style={{ textAlign: 'center', marginBottom: 20, marginTop: -8 }}>
                <span onClick={handleResendConfirmation} style={{ fontSize: 12, color: '#74C69D', cursor: resending ? 'default' : 'pointer', fontFamily: 'sans-serif', textDecoration: 'underline', opacity: resending ? 0.6 : 1 }}>
                  {resending ? 'Resending...' : "Didn't get the email? Resend confirmation"}
                </span>
              </div>
            )}

            {/* Signup extra fields */}
            {screen === 'signup' && (
              <>
                <div style={{ marginBottom: 18 }}>
                  <label style={lbl}>Full Name *</label>
                  <input style={inp} placeholder="As per NRIC" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} autoComplete="name" />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={lbl}>NRIC / FIN <span style={{ color: '#52B788', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>(for tax deduction receipts)</span></label>
                  <input
                    style={inp}
                    placeholder="e.g. S1234567A"
                    value={nric}
                    onChange={e => setNric(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    maxLength={9}
                    onKeyDown={handleKeyDown}
                  />
                  {nric.length > 0 && nric.length < 9 && (
                    <div style={{ fontSize: 11, color: '#D4A017', marginTop: 4, fontFamily: 'sans-serif' }}>NRIC must be 9 characters</div>
                  )}
                </div>
              </>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Email Address</label>
              <input style={inp} placeholder="you@email.com" type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown} autoCapitalize="none" autoComplete="email" autoFocus />
            </div>

            {screen !== 'forgot' && (
              <div style={{ marginBottom: 10, position: 'relative' }}>
                <label style={lbl}>Password</label>
                <input style={inp} placeholder="••••••••" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} autoComplete={screen === 'signup' ? 'new-password' : 'current-password'} />
                <div onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 16, bottom: screen === 'signup' ? 35 : 15, fontSize: 12, color: '#74C69D', cursor: 'pointer', fontFamily: 'sans-serif', userSelect: 'none' }}>
                  {showPass ? 'Hide' : 'Show'}
                </div>
                {screen === 'signup' && (
                  <div style={{ fontSize: 11, color: password.length > 0 && password.length < 6 ? '#D4A017' : '#52B788', marginTop: 6, fontFamily: 'sans-serif' }}>Must be at least 6 characters</div>
                )}
              </div>
            )}

            {screen === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span onClick={handleResendConfirmation} style={{ fontSize: 12, color: '#74C69D', cursor: resending ? 'default' : 'pointer', fontFamily: 'sans-serif', opacity: resending ? 0.6 : 1 }}>
                  {resending ? 'Resending...' : 'Resend confirmation email'}
                </span>
                <span onClick={() => { setScreen('forgot'); reset() }} style={{ fontSize: 12, color: '#74C69D', cursor: 'pointer', fontFamily: 'sans-serif' }}>
                  Forgot password?
                </span>
              </div>
            )}

            {screen === 'signup' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  style={{ marginTop: 3, width: 16, height: 16, accentColor: '#40916C', cursor: 'pointer', flexShrink: 0 }}
                />
                <label style={{ fontSize: 12, color: '#52B788', fontFamily: 'sans-serif', lineHeight: 1.6, cursor: 'pointer' }} onClick={() => setAgreedToTerms(!agreedToTerms)}>
                  I agree to Giving Tree's{' '}
                  <a href="https://givingtree.sg/terms" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#D4A017', textDecoration: 'underline' }}>Terms of Use</a>
                  {' '}and{' '}
                  <a href="https://givingtree.sg/privacy" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#D4A017', textDecoration: 'underline' }}>Privacy Policy</a>.
                </label>
              </div>
            )}

            <button
              onClick={screen === 'login' ? handleLogin : screen === 'signup' ? handleSignup : handleForgotPassword}
              disabled={loading}
              style={{
                width: '100%', padding: '16px',
                background: loading ? 'rgba(64,145,108,0.3)' : 'linear-gradient(135deg, #40916C, #1B4332)',
                color: 'white', border: 'none', borderRadius: 14,
                fontSize: 15, fontWeight: 700,
                cursor: loading ? 'default' : 'pointer',
                letterSpacing: '1.5px', textTransform: 'uppercase',
                fontFamily: 'Georgia, serif',
                boxShadow: loading ? 'none' : '0 6px 28px rgba(27,67,50,0.5)',
                marginTop: 16, transition: 'all 0.2s',
              }}
            >
              {loading ? 'Please wait...' :
                screen === 'login' ? 'Sign In' :
                screen === 'signup' ? 'Create Account' :
                'Send Reset Link'}
            </button>

            {screen === 'forgot' && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <span onClick={() => { setScreen('login'); reset() }} style={{ fontSize: 12, color: '#D4A017', cursor: 'pointer', fontFamily: 'sans-serif' }}>
                  ← Back to Sign In
                </span>
              </div>
            )}

            {screen === 'signup' && (
              <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(116,198,157,0.04)', border: '1px solid rgba(116,198,157,0.1)', borderRadius: 12, fontSize: 12, color: '#52B788', fontFamily: 'sans-serif', lineHeight: 1.7, textAlign: 'center' }}>
                🔒 Your NRIC is masked everywhere it's displayed, and used only for IRAS 250% tax deduction receipts.
              </div>
            )}

            <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 10, opacity: 0.4 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(116,198,157,0.3)' }} />
              <div style={{ fontSize: 11, color: '#52B788', fontFamily: 'sans-serif', letterSpacing: '2px', textTransform: 'uppercase' }}>The Giving Tree</div>
              <div style={{ flex: 1, height: 1, background: 'rgba(116,198,157,0.3)' }} />
            </div>

          </div>
        </div>
      </div>
      {(error || message) && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: error ? '#C0392B' : '#2D6A4F',
          color: 'white', padding: '16px 24px', borderRadius: 14,
          fontSize: 14, fontWeight: 600, fontFamily: 'sans-serif',
          zIndex: 999, maxWidth: '90%', minWidth: 280,
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', gap: 12,
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{error ? '⚠️' : '✓'}</span>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{error || message}</span>
          <span
            onClick={() => { setError(''); setMessage('') }}
            style={{ cursor: 'pointer', opacity: 0.8, fontSize: 18, lineHeight: 1, flexShrink: 0 }}
          >✕</span>
        </div>
      )}
    </div>
  )
}

const lbl = {
  display: 'block', fontSize: 10, fontWeight: 600,
  color: '#74C69D', letterSpacing: '2px', textTransform: 'uppercase',
  marginBottom: 8, fontFamily: 'sans-serif',
}

const inp = {
  width: '100%', padding: '14px 18px',
  background: 'rgba(255,255,255,0.05)',
  border: '1.5px solid rgba(116,198,157,0.18)',
  borderRadius: 12, fontSize: 14, color: 'white',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'sans-serif',
}