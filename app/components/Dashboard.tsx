"use client"
import React from 'react'
import Link from 'next/link'

const pages = [
  'home',
  'gallery',
  'about',
  'vision',
  'mission',
  'statement-of-faith',
  'ministries',
  'events',
  'books-and-resources',
  'contacts',
  'give-online',
  'scripture-banner',
]

const tools = [
  { title: 'Orders', description: 'View hard-copy customer orders and update order status.', href: '/admin/orders' },
]

export default function Dashboard() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
      {pages.map((p) => (
        <article key={p} style={{ background: '#0b2340', color: 'white', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, color: '#f5d06d' }}>{p.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</h3>
          <p style={{ fontSize: 13 }}>Edit content for the {p} page.</p>
          <div style={{ marginTop: 12 }}>
            <Link href={`/admin/editor/${p}`} style={{ color: 'white', background: '#f5d06d', padding: '8px 12px', borderRadius: 6, textDecoration: 'none' }}>Edit</Link>
          </div>
        </article>
      ))}

      {tools.map((tool) => (
        <article key={tool.href} style={{ background: '#0f172a', color: 'white', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, color: '#f5d06d' }}>{tool.title}</h3>
          <p style={{ fontSize: 13 }}>{tool.description}</p>
          <div style={{ marginTop: 12 }}>
            <Link href={tool.href} style={{ color: 'white', background: '#f5d06d', padding: '8px 12px', borderRadius: 6, textDecoration: 'none' }}>Open</Link>
          </div>
        </article>
      ))}
    </div>
  )
}
