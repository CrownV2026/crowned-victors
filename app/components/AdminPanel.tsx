"use client"
import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'
import { getSupabasePublicConfig } from '../lib/supabaseConfig'

export default function AdminPanel() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const configured = Boolean(getSupabasePublicConfig())

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }

    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const session = data.session
      setUser(session?.user ?? null)
      const role = session?.user?.user_metadata?.role
      setIsAdmin(role === 'admin')
      setLoading(false)
    })
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      const role = session?.user?.user_metadata?.role
      setIsAdmin(role === 'admin')
      setLoading(false)
    })
    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [configured])

  if (!configured) return <p>Authentication is not available — Supabase is not configured.</p>
  if (loading) return <p>Loading...</p>
  if (!user) return <p>Please sign in to access the admin portal.</p>
  if (!isAdmin) return <p>Access denied — you are not an admin.</p>

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>Welcome, {user.email}</p>
      <section>
        <h3>Content</h3>
        <p>Implement CRUD operations here backed by Supabase tables.</p>
      </section>
    </div>
  )
}
