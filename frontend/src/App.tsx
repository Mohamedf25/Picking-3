import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Container } from '@mui/material'
import { AuthProvider } from './contexts/AuthContext'
import StoreConfig from './components/StoreConfig'
import UserLogin from './components/UserLogin'
import OrderList from './components/OrderList'
import OrderDetail from './components/OrderDetail'
import PickingSession from './components/PickingSession'
import Dashboard from './components/Dashboard'
import ExceptionManagement from './components/ExceptionManagement'
import WarehouseManagement from './components/WarehouseManagement'
import AdminPanel from './components/AdminPanel'
import OrderManagement from './components/OrderManagement'
import PhotoGallery from './components/PhotoGallery'
import Header from './components/Header'
import OfflineIndicator from './components/OfflineIndicator'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isConnected = localStorage.getItem('connected') === 'true'
  
  if (!isConnected) {
    return <Navigate to="/connect" />
  }
  
  return <>{children}</>
}

function AppContent(){
  const [isConnected, setIsConnected] = useState(localStorage.getItem('connected') === 'true')
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('user_logged_in') === 'true')

  const handleConnected = () => {
    setIsConnected(true)
  }

  const handleLoggedIn = () => {
    setIsLoggedIn(true)
  }

  // Step 1: Store connection
  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Container maxWidth="md" sx={{ py: 2 }}>
          <StoreConfig onConnected={handleConnected} />
        </Container>
      </div>
    )
  }

  // Step 2: User login
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Container maxWidth="md" sx={{ py: 2 }}>
          <UserLogin onLoggedIn={handleLoggedIn} />
        </Container>
      </div>
    )
  }

  return (
    <AuthProvider>
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Header />
        <OfflineIndicator />
        <Container maxWidth="md" sx={{ py: 2 }}>
          <Routes>
            <Route path="/login" element={<Navigate to="/orders" />} />
            <Route path="/connect" element={<StoreConfig onConnected={handleConnected} />} />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrderList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:orderId"
              element={
                <ProtectedRoute>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/picking/:orderId"
              element={
                <ProtectedRoute>
                  <PickingSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sessions/:sessionId"
              element={
                <ProtectedRoute>
                  <PickingSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exceptions"
              element={
                <ProtectedRoute>
                  <ExceptionManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/warehouses"
              element={
                <ProtectedRoute>
                  <WarehouseManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-management"
              element={
                <ProtectedRoute>
                  <OrderManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/photos"
              element={
                <ProtectedRoute>
                  <PhotoGallery />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/orders" />} />
          </Routes>
        </Container>
      </div>
    </AuthProvider>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
