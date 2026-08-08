"use client"

import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'

type OrderItem = {
  id: string
  bookId: string
  bookTitle: string
  customerName: string
  phone: string
  email: string
  quantity: number
  deliveryAddress: string
  cityTown: string
  country: string
  additionalInstructions: string
  status: string
  orderDate: string
}

type OrdersResponse = {
  orders: OrderItem[]
  statuses: string[]
  error?: string
}

export default function OrdersManager() {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchOrders = async () => {
    setLoading(true)
    setErrorMessage('')

    const session = await supabase.auth.getSession().then((result) => result.data.session)
    if (!session) {
      setErrorMessage('Sign in to manage customer orders.')
      setLoading(false)
      return
    }

    const role = session.user.user_metadata?.role
    if (role !== 'admin') {
      setErrorMessage('Access denied. Admin role is required.')
      setLoading(false)
      return
    }

    const response = await fetch('/api/book-orders', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    const payload = (await response.json().catch(() => ({ orders: [], statuses: [] }))) as OrdersResponse
    if (!response.ok) {
      setErrorMessage(payload.error || 'Unable to load orders.')
      setLoading(false)
      return
    }

    setOrders(Array.isArray(payload.orders) ? payload.orders : [])
    setStatuses(Array.isArray(payload.statuses) ? payload.statuses : [])
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders().catch(() => {
      setErrorMessage('Unable to load orders.')
      setLoading(false)
    })
  }, [])

  const updateStatus = async (id: string, status: string) => {
    const session = await supabase.auth.getSession().then((result) => result.data.session)
    if (!session) return

    const response = await fetch('/api/book-orders', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id, status }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: 'Unable to update status.' }))
      setErrorMessage(payload.error || 'Unable to update status.')
      return
    }

    const updated = (await response.json()) as OrderItem
    setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)))
  }

  if (loading) {
    return <p>Loading orders...</p>
  }

  return (
    <section style={{ marginTop: 20 }}>
      <h2>Book Orders</h2>
      <p style={{ color: '#4b5563', marginTop: 4 }}>Customer orders are only visible to authenticated administrators.</p>
      {errorMessage ? (
        <p style={{ marginTop: 10, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', padding: 10, borderRadius: 8 }}>
          {errorMessage}
        </p>
      ) : null}

      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
          <thead>
            <tr>
              <th style={headerCell}>Book</th>
              <th style={headerCell}>Customer</th>
              <th style={headerCell}>Phone</th>
              <th style={headerCell}>Email</th>
              <th style={headerCell}>Qty</th>
              <th style={headerCell}>Delivery Address</th>
              <th style={headerCell}>Country</th>
              <th style={headerCell}>Order Date</th>
              <th style={headerCell}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td style={bodyCell}>{order.bookTitle}</td>
                <td style={bodyCell}>{order.customerName}</td>
                <td style={bodyCell}>{order.phone}</td>
                <td style={bodyCell}>{order.email}</td>
                <td style={bodyCell}>{order.quantity}</td>
                <td style={bodyCell}>
                  {order.deliveryAddress}
                  <br />
                  {order.cityTown}
                  {order.additionalInstructions ? <p style={{ marginTop: 6, color: '#6b7280' }}>{order.additionalInstructions}</p> : null}
                </td>
                <td style={bodyCell}>{order.country}</td>
                <td style={bodyCell}>{new Date(order.orderDate).toLocaleString()}</td>
                <td style={bodyCell}>
                  <select
                    value={order.status}
                    onChange={(event) => updateStatus(order.id, event.target.value)}
                    style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td style={emptyCell} colSpan={9}>No hard-copy orders yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const headerCell: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '2px solid #e5e7eb',
  color: '#374151',
  fontSize: 13,
}

const bodyCell: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid #f3f4f6',
  color: '#111827',
  fontSize: 14,
  verticalAlign: 'top',
}

const emptyCell: React.CSSProperties = {
  ...bodyCell,
  textAlign: 'center',
  color: '#6b7280',
}
