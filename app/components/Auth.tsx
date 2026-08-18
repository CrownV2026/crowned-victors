"use client"
import React, { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import supabase, { isSupabaseConfigured } from '../lib/supabaseClient'

export default function Auth({ onAuth }: { onAuth?: (session: Session | null) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const isConfigured = isSupabaseConfigured()
  const configurationErrorMessage = 'Admin portal is unavailable because Supabase is not configured correctly.'

  useEffect(() => {
    if (!isConfigured) return

    let subscription: { unsubscribe: () => void } | null = null

    try {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session)
      }).catch(() => {
        setErrorMessage(configurationErrorMessage)
      })

      const listener = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        onAuth?.(session)
      })
      subscription = listener.data.subscription
    } catch {
      queueMicrotask(() => {
        setErrorMessage(configurationErrorMessage)
      })
    }

    return () => subscription?.unsubscribe()
  }, [configurationErrorMessage, isConfigured, onAuth])

  const signIn = async () => {
    if (!isConfigured) {
      setErrorMessage(configurationErrorMessage)
      return
    }

    try {
      setLoading(true)
      setErrorMessage('')
      await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      })
      alert('Check your email for a sign-in link')
    } catch {
      setErrorMessage('Unable to sign in. Verify Supabase environment variables and try again.')
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setSession(null)
    } catch {
      setErrorMessage('Unable to sign out right now. Please refresh and try again.')
    }
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
    {errorMessage || !isConfigured ? (
        <p style={{ color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', padding: 10, borderRadius: 8, marginBottom: 10 }}>
        {errorMessage || configurationErrorMessage}
        </p>
      ) : null}
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
