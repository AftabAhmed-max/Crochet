'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPage() {
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState({ text: '', error: false })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const inputStyle = {
    width: '100%', padding: '12px 16px', fontSize: '14px',
    border: '1px solid var(--cream-dark)', borderRadius: '4px',
    background: 'var(--white)', color: 'var(--charcoal)',
    fontFamily: 'var(--font-body)', outline: 'none',
  }

  async function handleReset() {
    if (!password || password.length < 6) return setMsg({ text: 'Password must be at least 6 characters.', error: true })
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setMsg({ text: error.message, error: true })
    else {
      setMsg({ text: 'Password updated! Redirecting...', error: false })
      setTimeout(() => router.push('/account'), 2000)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: '24px' }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>
        <p style={{ fontFamily: 'var(--font-script)', fontSize: '36px', color: 'var(--gold-dark)', marginBottom: '8px' }}>Reset Password</p>
        <p style={{ fontSize: '13px', color: 'var(--brown-soft)', marginBottom: '32px' }}>Enter your new password below.</p>
        <input type="password" style={inputStyle} placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} />
        {msg.text && (
          <p style={{ fontSize: '13px', color: msg.error ? '#EF4444' : '#10B981', margin: '12px 0', padding: '10px 14px', background: msg.error ? '#FFF0F0' : '#F0FFF4', borderRadius: '4px' }}>{msg.text}</p>
        )}
        <button className="btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={handleReset} disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}