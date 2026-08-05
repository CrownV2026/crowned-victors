"use client"
import React from 'react'
import Auth from '../../components/Auth'
import Dashboard from '../../components/Dashboard'

export default function AdminPage() {
  return (
    <div>
      <Auth />
      <hr style={{ margin: '20px 0' }} />
      <Dashboard />
    </div>
  )
}
