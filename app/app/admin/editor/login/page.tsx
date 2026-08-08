'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../../../../lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn() {
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push('/admin/editor')
  }

  return (
    <div
      style={{
        maxWidth: 400,
        margin: '100px auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <h2>Admin Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={signIn} disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </div>
  )
}
