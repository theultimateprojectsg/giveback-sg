import { useState } from 'react'
import { supabase } from './supabase'

export default function Auth({ onLogin }) {
  const [screen, setScreen] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [nric, setNric] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleLogin() {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false)
  }

  async function handleSignup() {
    if (!email || !password || !name || !nric) { setError('Please fill in all fields'); return }
    if (nric.length < 9) { setError('Please enter a valid NRIC'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          nric_masked: nric.slice(0,1) + '×××××' + nric.slice(-2),
        }
      }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setMessage('Account created! Please check your email to confirm.')
    setScreen('login')
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email) { setError('Please enter your email address first'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5175',
    })
    if (error) { setError(error.message); setLoading(false); return }
    setMessage('Password reset email sent! Check your inbox.')
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>💚</div>
        <div style={styles.title}>GiveBack SG</div>
        <div style={styles.sub}>
          {screen === 'login' && 'Sign in to your giving wallet'}
          {screen === 'signup' && 'Create your giving wallet'}
          {screen === 'forgot' && 'Reset your password'}
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        {screen === 'signup' && (
          <>
            <input
              style={styles.input}
              placeholder="Full name (as per NRIC)"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="NRIC / FIN (e.g. S1234567A)"
              value={nric}
              onChange={e => setNric(e.target.value)}
              maxLength={9}
            />
          </>
        )}

        <input
          style={styles.input}
          placeholder="Email address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        {screen !== 'forgot' && (
          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        )}

        {screen === 'login' && (
          <div
            style={styles.forgotLink}
            onClick={() => { setScreen('forgot'); setError(''); setMessage('') }}
          >
            Forgot password?
          </div>
        )}

        <button
          style={loading ? styles.btnDisabled : styles.btn}
          onClick={
            screen === 'login' ? handleLogin :
            screen === 'signup' ? handleSignup :
            handleForgotPassword
          }
          disabled={loading}
        >
          {loading ? 'Please wait...' :
           screen === 'login' ? 'Sign In' :
           screen === 'signup' ? 'Create Account' :
           'Send Reset Email'}
        </button>

        {screen === 'login' && (
          <div style={styles.switchRow}>
            Don't have an account? <span style={styles.link} onClick={() => { setScreen('signup'); setError(''); setMessage('') }}>Sign up</span>
          </div>
        )}

        {screen === 'signup' && (
          <div style={styles.switchRow}>
            Already have an account? <span style={styles.link} onClick={() => { setScreen('login'); setError(''); setMessage('') }}>Sign in</span>
          </div>
        )}

        {screen === 'forgot' && (
          <div style={styles.switchRow}>
            Remember it? <span style={styles.link} onClick={() => { setScreen('login'); setError(''); setMessage('') }}>Back to sign in</span>
          </div>
        )}

        <div style={styles.note}>
          🔒 Your NRIC is masked and never stored in full. Used only for IRAS tax receipts.
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Segoe UI', sans-serif" },
  card: { background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 380, border: '1.5px solid #E8E4DC' },
  logo: { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 4 },
  sub: { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 24 },
  input: { width: '100%', padding: '12px 16px', border: '1.5px solid #E8E4DC', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 10, boxSizing: 'border-box' },
  btn: { width: '100%', padding: 16, background: '#111', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 6 },
  btnDisabled: { width: '100%', padding: 16, background: '#CCC', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'default', marginTop: 6 },
  error: { background: '#FFF0F0', color: '#CC2222', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 },
  success: { background: '#F0FDF7', color: '#00874F', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 },
  forgotLink: { textAlign: 'right', fontSize: 12, color: '#00C47A', fontWeight: 600, cursor: 'pointer', marginBottom: 8, marginTop: -4 },
  switchRow: { textAlign: 'center', fontSize: 13, color: '#999', marginTop: 16 },
  link: { color: '#00C47A', fontWeight: 600, cursor: 'pointer' },
  note: { fontSize: 11, color: '#BBB', textAlign: 'center', marginTop: 16, lineHeight: 1.5 },
}