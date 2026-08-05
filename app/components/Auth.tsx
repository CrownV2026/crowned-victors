"use client"
import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'

export default function Auth({ onAuth }: { onAuth?: (session: any) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      onAuth?.(session)
    })
    return () => subscription.unsubscribe()
  }, [onAuth])

  const signIn = async () => {
    setLoading(true)
    await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    alert('Check your email for a sign-in link')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (session?.user) {
    return (
      <div>
        <p>Signed in as {session.user.email}</p>
        <button onClick={signOut}>Sign out</button>
      </div>
    )
  }

  return (
    <div>
      <label>
        Email
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" />
      </label>
      <button onClick={signIn} disabled={loading || !email}>
        {loading ? 'Sending...' : 'Send magic link'}
      </button>
    </div>
  )
}
