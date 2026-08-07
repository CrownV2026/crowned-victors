"use client"
import React, { useState } from 'react'
import supabase from '../lib/supabaseClient'

export default function ImageUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [loading, setLoading] = useState(false)

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const path = `${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage.from('Images').upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('Images').getPublicUrl(data.path)
    onUploaded(urlData.publicUrl)
    setLoading(false)
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handle} />
      {loading && <p>Uploading...</p>}
    </div>
  )
}
