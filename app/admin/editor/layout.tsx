import React from 'react'

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 16 }}>
      <nav style={{ marginBottom: 16 }}>
        <a href="/admin" style={{ marginRight: 12 }}>Back</a>
      </nav>
      <div>{children}</div>
    </div>
  )
}
