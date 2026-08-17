'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import supabase from '../lib/supabaseClient'

function hasAuthCallbackParameters() {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.slice(1))

  return (
    search.has('code') ||
    search.has('token_hash') ||
    hash.has('access_token') ||
    hash.has('refresh_token')
  )
}

export default function AuthCallbackRedirect() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname !== '/' || !hasAuthCallbackParameters()) return

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace('/admin')
    })

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/admin')
    })

    return () => listener.subscription.unsubscribe()
  }, [pathname, router])

  return null
}