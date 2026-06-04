import { useState } from 'react'
import { supabase } from './supabase'
import logo from './assets/logo.png'

function TreeLogo({ size = 80 }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 100 110" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="goldL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0C84A"/>
          <stop offset="100%" stopColor="#D4A017"/>
        </linearGradient>
      </defs>
      <path d="M42 108 Q40 96 40 86 Q40 77 43 71 Q46 66 50 65 Q54 66 57 71 Q60 77 60 86 Q60 96 58 108Z" fill="#8B5E3C"/>
      <path d="M42 104 Q33 108 24 110" stroke="#8B5E3C" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M58 104 Q67 108 76 110" stroke="#8B5E3C" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="30" cy="72" r="22" fill="#1B4332"/>
      <circle cx="70" cy="72" r="22" fill="#1B4332"/>
      <circle cx="50" cy="76" r="28" fill="#1B4332"/>
      <circle cx="37" cy="56" r="20" fill="#1B4332"/>
      <circle cx="63" cy="56" r="20" fill="#1B4332"/>
      <circle cx="50" cy="52" r="24" fill="#1B4332"/>
      <circle cx="50" cy="34" r="20" fill="#1B4332"/>
      <circle cx="50" cy="22" r="14" fill="#1B4332"/>
      <circle cx="30" cy="70" r="18" fill="#2D6A4F"/>
      <circle cx="70" cy="70" r="18" fill="#2D6A4F"/>
      <circle cx="50" cy="72" r="24" fill="#2D6A4F"/>
      <circle cx="37" cy="53" r="16" fill="#2D6A4F"/>
      <circle cx="63" cy="53" r="16" fill="#2D6A4F"/>
      <circle cx="50" cy="48" r="20" fill="#2D6A4F"/>
      <circle cx="50" cy="31" r="16" fill="#2D6A4F"/>
      <circle cx="30" cy="67" r="13" fill="#40916C"/>
      <circle cx="70" cy="67" r="13" fill="#40916C"/>
      <circle cx="50" cy="67" r="18" fill="#40916C"/>
      <circle cx="37" cy="50" r="11" fill="#40916C"/>
      <circle cx="63" cy="50" r="11" fill="#40916C"/>
      <circle cx="50" cy="43" r="14" fill="#40916C"/>
      <circle cx="50" cy="27" r="11" fill="#40916C"/>
      <circle cx="50" cy="20" r="8" fill="#52B788"/>
      <circle cx="48" cy="16" r="5" fill="#74C69D"/>
      <path d="M50 54 C50 54 41 47 41 41.5 C41 37.8 44 36 46.5 37.5 C48 38.3 50 40.5 50 40.5 C50 40.5 52 38.3 53.5 37.5 C56 36 59 37.8 59 41.5 C59 47 50 54 50 54Z" fill="white"/>
      <path d="M41 41.5 C41 37.8 44 36 46.5 37.5 C48 38.3 50 40.5 50 40.5 C50 40.5 52 38.3 53.5 37.5 C56 36 59 37.8 59 41.5Z" fill="#EF3340"/>
      <circle cx="46.5" cy="40" r="2.2" fill="white"/>
      <circle cx="47.3" cy="39.4" r="1.6" fill="#EF3340"/>
      <text x="51" y="41.5" fontSize="2.8" fill="white">★</text>
      <text x="52.8" y="40.2" fontSize="2.5" fill="white">★</text>
      <text x="53.8" y="42" fontSize="2.5" fill="white">★</text>
      <text x="52.5" y="43.8" fontSize="2.5" fill="white">★</text>
      <text x="50.8" y="44.2" fontSize="2.5" fill="white">★</text>
      <path d="M50 33 C50 33 47.2 30.5 47.2 28.8 C47.2 27.6 48.2 27 49.1 27.6 C49.6 27.9 50 28.5 50 28.5 C50 28.5 50.4 27.9 50.9 27.6 C51.8 27 52.8 27.6 52.8 28.8 C52.8 30.5 50 33 50 33Z" fill="url(#goldL)"/>
      <path d="M36 52 C36 52 33.5 49.8 33.5 48.3 C33.5 47.2 34.4 46.7 35.2 47.2 C35.6 47.4 36 48 36 48 C36 48 36.4 47.4 36.8 47.2 C37.6 46.7 38.5 47.2 38.5 48.3 C38.5 49.8 36 52 36 52Z" fill="url(#goldL)"/>
      <path d="M64 52 C64 52 61.5 49.8 61.5 48.3 C61.5 47.2 62.4 46.7 63.2 47.2 C63.6 47.4 64 48 64 48 C64 48 64.4 47.4 64.8 47.2 C65.6 46.7 66.5 47.2 66.5 48.3 C66.5 49.8 64 52 64 52Z" fill="url(#goldL)"/>
      <path d="M26 66 C26 66 23.5 63.8 23.5 62.3 C23.5 61.2 24.4 60.7 25.2 61.2 C25.6 61.4 26 62 26 62 C26 62 26.4 61.4 26.8 61.2 C27.6 60.7 28.5 61.2 28.5 62.3 C28.5 63.8 26 66 26 66Z" fill="url(#goldL)"/>
      <path d="M74 66 C74 66 71.5 63.8 71.5 62.3 C71.5 61.2 72.4 60.7 73.2 61.2 C73.6 61.4 74 62 74 62 C74 62 74.4 61.4 74.8 61.2 C75.6 60.7 76.5 61.2 76.5 62.3 C76.5 63.8 74 66 74 66Z" fill="url(#goldL)"/>
    </svg>
  )
}

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
    <div style={{
      minHeight: '100dvh',
    background: '#0F2419',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Georgia, serif',
    position: 'relative',
    overflowX: 'hidden',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    }}>

      {/* Background glows */}
      <div style={{
        position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(45,106,79,0.2) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
      }}/>
      <div style={{
        position: 'fixed', bottom: -80, right: -60,
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,160,23,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }}/>
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'radial-gradient(rgba(116,198,157,0.04) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        pointerEvents: 'none', zIndex: 0,
      }}/>

      {/* Content */}
      <div style={{
        width: '100%', maxWidth: 420,
        padding: '40px 24px 48px',
        position: 'relative', zIndex: 1,
        boxSizing: 'border-box',
      }}>

        {/* ── HERO ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ marginBottom: 16 }}>
            <img src={logo} style={{ width: 90, height: 90, objectFit: 'contain' }} />
          </div>
          <div style={{
            fontSize: 30, fontWeight: 700, color: 'white',
            letterSpacing: '3px', textTransform: 'uppercase',
            textAlign: 'center', lineHeight: 1.1, marginBottom: 10,
          }}>
            Giving Tree
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, width: 200 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #D4A017)' }}/>
            <svg width="12" height="10" viewBox="0 0 16 14">
              <path d="M8 13 C8 13 1 7.5 1 3.5 C1 1.5 2.5 0.5 4 1.5 C5.5 2.5 8 5 8 5 C8 5 10.5 2.5 12 1.5 C13.5 0.5 15 1.5 15 3.5 C15 7.5 8 13 8 13Z" fill="#D4A017"/>
            </svg>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #D4A017, transparent)' }}/>
          </div>
          <div style={{ fontSize: 11, color: '#74C69D', letterSpacing: '2.5px', textTransform: 'uppercase', textAlign: 'center' }}>
            Many Hearts. One Purpose.
          </div>
        </div>

        {/* ── FORM CARD ── */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(116,198,157,0.15)',
          borderRadius: 24,
          padding: '24px 20px',
          marginBottom: 14,
        }}>

          {/* Tab switcher — login/signup only, not on forgot */}
          {screen !== 'forgot' && (
            <div style={{
              display: 'flex',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: 12, padding: 4, marginBottom: 22,
            }}>
              {['login', 'signup'].map(s => (
                <div key={s} onClick={() => { setScreen(s); reset() }} style={{
                  flex: 1, textAlign: 'center', padding: '10px',
                  borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'sans-serif',
                  background: screen === s ? '#2D6A4F' : 'transparent',
                  color: screen === s ? 'white' : '#52B788',
                  transition: 'all 0.2s', letterSpacing: '0.5px',
                }}>
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
            🔒 Your NRIC is masked and never stored in full.<br/>
            Used only for IRAS 250% tax deduction receipts.
          </div>
        )}

        {/* Trust badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24 }}>
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
