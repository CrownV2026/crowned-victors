"use client"
import React, { useState } from 'react'
import supabase from '../lib/supabaseClient'

export default function ImageUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [loading, setLoading] = useState(false)

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const session = await supabase.auth.getSession().then((r) => r.data.session)
      if (!session) {
        alert('Sign in first')
        return
      }

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        credentials: 'include',
        body: formData,
      })

      const payload = await res.json().catch(async () => {
        const text = await res.text().catch(() => '')
        return { error: text || 'Upload failed' }
      })
      if (!res.ok) {
        alert(payload.error || 'Upload failed')
        return
      }

      onUploaded(payload.url)
    } catch (err: any) {
      alert(err?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handle} />
      {loading && <p>Uploading...</p>}
    </div>
  )
}
