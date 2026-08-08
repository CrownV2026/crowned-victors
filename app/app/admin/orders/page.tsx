"use client"

import React from 'react'
import Auth from '../../../components/Auth'
import OrdersManager from '../../../components/OrdersManager'

export default function AdminOrdersPage() {
  return (
    <div>
      <Auth />
      <hr style={{ margin: '20px 0' }} />
      <OrdersManager />
    </div>
  )
}
