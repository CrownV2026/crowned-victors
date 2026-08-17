"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import Auth from '../../../components/Auth'

export default function AdminLoginPage() {
  const router = useRouter()

  return (
    <div style={{ maxWidth: 640, margin: '80px auto 32px', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 24, fontSize: 32 }}>Admin Login</h1>
      <Auth onAuth={(session) => {
        if (session) router.replace('/admin')
      }} />
    </div>
  )
}
