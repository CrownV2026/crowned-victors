"use client"

import React from 'react'
import Auth from '../../../components/Auth'

export default function AdminLoginPage() {
  return (
    <div style={{ maxWidth: 640, margin: '80px auto 32px', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 24, fontSize: 32 }}>Admin Login</h1>
      <Auth />
    </div>
  )
}
