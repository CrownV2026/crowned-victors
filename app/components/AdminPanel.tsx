"use client"
import React, { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import supabase from '../lib/supabaseClient'

const DEFAULT_ADMIN_EMAILS = ['crownedvictors2019@gmail.com']

function isAdminUser(user: User | null | undefined) {
  if (!user) return false

  const userRole = typeof user.user_metadata?.role === 'string' ? user.user_metadata.role : ''
  const appRole = typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : ''
  const role = (userRole || appRole).toLowerCase()
  if (role === 'admin') return true

  const configured = new Set([
    ...DEFAULT_ADMIN_EMAILS,
    ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  ])

  const email = (user.email || '').trim().toLowerCase()
  return Boolean(email && configured.has(email))
}

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const session = data.session
      setUser(session?.user ?? null)
      setIsAdmin(isAdminUser(session?.user))
      setLoading(false)
    })
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsAdmin(isAdminUser(session?.user))
      setLoading(false)
    })
    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

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
