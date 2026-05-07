'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Footer from '@/components/Footer'

export default function AccountPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', error: false })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const setError = (text: string) => setMsg({ text, error: true })
  const setSuccess = (text: string) => setMsg({ text, error: false })

  async function handleSignup() {
    if (!form.name || !form.email || !form.password || !form.phone) return setError('All fields required.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.name, phone: form.phone  } }
    })
    if (error) setError(error.message)
    else setSuccess('Verification email sent! Please check your inbox.')
    setLoading(false)
  }

  async function handleLogin() {
    if (!form.email || !form.password) return setError('Email and password required.')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleReset() {
    if (!form.email) return setError('Enter your email.')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: 'http://localhost:3000/account/reset'
    })
    if (error) setError(error.message)
    else setSuccess('Password reset email sent!')
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', fontSize: '14px',
    border: '1px solid var(--cream-dark)', borderRadius: '4px',
    background: 'var(--white)', color: 'var(--charcoal)',
    fontFamily: 'var(--font-body)', outline: 'none',
  }

  // Logged in state
  if (user) return (
    <>
      <div style={{ background: 'var(--charcoal)', padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px' }}>My Account</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 48px)', color: 'var(--cream)' }}>
          Welcome, {user.user_metadata?.full_name || user.email}
        </h1>
      </div>
      <div style={{ maxWidth: '600px', margin: '64px auto', padding: '0 24px' }}>
        <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '28px', marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>Account Details</p>
          <p style={{ fontSize: '14px', color: 'var(--charcoal)', marginBottom: '8px' }}><strong>Name:</strong> {user.user_metadata?.full_name || '—'}</p>
          <p style={{ fontSize: '14px', color: 'var(--charcoal)', marginBottom: '8px' }}><strong>Email:</strong> {user.email}</p>
          <p style={{ fontSize: '14px', color: user.email_confirmed_at ? '#10B981' : '#F59E0B' }}>
            {user.email_confirmed_at ? '✓ Email verified' : '⚠ Email not verified'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a href="/shop"><button className="btn-primary">Shop Now</button></a>
          <a href="/cart"><button className="btn-outline">View Cart</button></a>
          <button className="btn-outline" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <Footer />
    </>
  )

  return (
    <>
      <div style={{ background: 'var(--charcoal)', padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px' }}>My Account</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)', color: 'var(--cream)' }}>
          {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h1>
      </div>

      <div style={{ maxWidth: '480px', margin: '64px auto', padding: '0 24px 64px' }}>
        {/* Tabs */}
        {mode !== 'reset' && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--cream-dark)', marginBottom: '32px' }}>
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setMsg({ text: '', error: false }) }} style={{
                flex: 1, padding: '12px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase',
                color: mode === m ? 'var(--gold-dark)' : 'var(--brown-soft)',
                borderBottom: mode === m ? '2px solid var(--gold-dark)' : '2px solid transparent',
                marginBottom: '-1px',
              }}>{m === 'login' ? 'Login' : 'Sign Up'}</button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mode === 'signup' && (
            <div>
              <p style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>Full Name</p>
              <input style={inputStyle} placeholder="Your name" value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
          )}
          {mode === 'signup' && (
            <div>
              <p style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>Phone Number</p>
              <input style={inputStyle} placeholder="10-digit mobile number" maxLength={10} value={form.phone} onChange={e => update('phone', e.target.value)} />
            </div>
          )}
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>Email</p>
            <input style={inputStyle} type="email" placeholder="you@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
          </div>
          {mode !== 'reset' && (
            <div>
              <p style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>Password</p>
              <input style={inputStyle} type="password" placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} />
            </div>
          )}

          {msg.text && (
            <p style={{ fontSize: '13px', color: msg.error ? '#EF4444' : '#10B981', padding: '10px 14px', background: msg.error ? '#FFF0F0' : '#F0FFF4', borderRadius: '4px' }}>{msg.text}</p>
          )}

          <button className="btn-primary" style={{ width: '100%', marginTop: '8px' }} onClick={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleReset} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
          </button>

          {mode === 'login' && (
            <button onClick={() => { setMode('reset'); setMsg({ text: '', error: false }) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontSize: '13px', textAlign: 'right' }}>
              Forgot password?
            </button>
          )}

          {mode === 'reset' && (
            <button onClick={() => { setMode('login'); setMsg({ text: '', error: false }) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontSize: '13px' }}>
              ← Back to Login
            </button>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}