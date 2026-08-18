"use client"
import React, { useState } from 'react'
import supabase from '../lib/supabaseClient'

type ImageUploadProps = {
  onUploaded: (url: string) => void
  accept?: string
}

export default function ImageUpload({ onUploaded, accept = 'image/*' }: ImageUploadProps) {
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

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          accessToken: session.access_token,
        }),
      })

      const payload = await res.json().catch(async () => {
        const text = await res.text().catch(() => '')
        return { error: text || 'Upload failed' }
      })
      if (!res.ok) {
        alert(payload.error || 'Upload failed')
        return
      }

      const bucket = typeof payload.bucket === 'string' ? payload.bucket : ''
      const path = typeof payload.path === 'string' ? payload.path : ''
      const token = typeof payload.token === 'string' ? payload.token : ''
      const url = typeof payload.url === 'string' ? payload.url : ''

      if (!bucket || !path || !token || !url) {
        alert('Upload failed: invalid upload response')
        return
      }

      const { error: uploadError } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file)
      if (uploadError) {
        alert(uploadError.message || 'Upload failed')
        return
      }

      onUploaded(url)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input type="file" accept={accept} onChange={handle} />
      {loading && <p>Uploading...</p>}
    </div>
  )
}
