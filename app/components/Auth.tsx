"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Session } from '@supabase/supabase-js'
import supabase, { isSupabaseConfigured } from '../lib/supabaseClient'

const CONFIG_ERROR = 'Admin portal is unavailable because Supabase is not configured correctly.'

export default function Auth({ onAuth }: { onAuth?: (session: Session | null) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [errorMessage, setErrorMessage] = useState(() => isSupabaseConfigured() ? '' : CONFIG_ERROR)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return
    }

    let subscription: { unsubscribe: () => void } | null = null

    try {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session)
        onAuth?.(data.session)
      }).catch(() => {
        setErrorMessage(CONFIG_ERROR)
      })

      const listener = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        onAuth?.(session)
      })
      subscription = listener.data.subscription
    } catch {
      queueMicrotask(() => {
        setErrorMessage(CONFIG_ERROR)
      })
    }

    return () => subscription?.unsubscribe()
  }, [onAuth])

  const signIn = async () => {
    if (!isSupabaseConfigured()) {
      setErrorMessage(CONFIG_ERROR)
      return
    }

    try {
      setLoading(true)
      setErrorMessage('')
      setSuccessMessage('')
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          shouldCreateUser: false,
        },
      })

      if (error) throw error

      setSuccessMessage('Magic link sent. Check your inbox and spam folder.')
    } catch (error) {
      const status = typeof error === 'object' && error && 'status' in error ? error.status : null
      setErrorMessage(
        status === 429
          ? 'Supabase email rate limit reached. Wait before requesting another link, or use password login below.'
          : error instanceof Error
            ? error.message
            : 'Unable to send a magic link. Please try again.'
      )
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
      {errorMessage ? (
        <p style={{ color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', padding: 10, borderRadius: 8, marginBottom: 10 }}>
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p style={{ color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 10, borderRadius: 8, marginBottom: 10 }}>
          {successMessage}
        </p>
      ) : null}
      <label>
        Email
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" />
      </label>
      <button onClick={signIn} disabled={loading || !email}>
        {loading ? 'Sending...' : 'Send magic link'}
      </button>
      <p style={{ marginTop: 12 }}>
        <Link href="/admin/editor/login">Use email and password instead</Link>
      </p>
    </div>
  )
}
