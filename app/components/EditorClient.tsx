"use client"
import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import ImageUpload from './ImageUpload'
import supabase from '../lib/supabaseClient'

const QuillNoSSR = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

export default function EditorClient({ slug }: { slug: string }) {
  const [content, setContent] = useState<any>({ title: '', subtitle: '', body: '', banner_url: '' })

  useEffect(() => {
    fetch(`/api/content?slug=${slug}`).then((r) => r.json()).then((data) => {
      if (data) setContent(data)
    })
  }, [slug])

  const save = async () => {
    const session = await supabase.auth.getSession().then(r => r.data.session)
    if (!session) return alert('Sign in first')
    const token = session.access_token
    const method = content.id ? 'PUT' : 'POST'
    const payload = { ...content, slug }
    const res = await fetch('/api/content', { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (res.ok) alert('Saved')
    else alert(data.error || 'Error')
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <label>Title</label>
        <input value={content.title || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Subtitle</label>
        <input value={content.subtitle || ''} onChange={(e) => setContent({ ...content, subtitle: e.target.value })} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Banner Image</label>
        <ImageUpload onUploaded={(url) => setContent({ ...content, banner_url: url })} />
        {content.banner_url && <img src={content.banner_url} alt="banner" style={{ maxWidth: 320, marginTop: 8 }} />}
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Body</label>
        <QuillNoSSR theme="snow" value={content.body || ''} onChange={(v: any) => setContent({ ...content, body: v })} />
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={save} style={{ background: '#f5d06d', border: 'none', padding: '8px 12px' }}>Save</button>
      </div>
    </div>
  )
}
