"use client"
import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'
import { getSupabasePublicConfig } from '../lib/supabaseConfig'

export default function Auth({ onAuth }: { onAuth?: (session: any) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<any>(null)
  const configured = Boolean(getSupabasePublicConfig())

  useEffect(() => {
    if (!configured) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      onAuth?.(session)
    })

    return () => subscription.unsubscribe()
  }, [configured, onAuth])

  const signIn = async () => {
    setLoading(true)
   await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/admin`,
  },
}) 
    setLoading(false)
    alert('Check your email for a sign-in link')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (!configured) {
    return <p>Authentication is not available — Supabase is not configured.</p>
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
