import React from 'react'

export const metadata = {
  title: 'Admin — Crowned Victors',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ padding: 24 }}>
      <header style={{ marginBottom: 20 }}>
        <h1>Admin Portal</h1>
      </header>
      <section>{children}</section>
    </main>
  )
}
