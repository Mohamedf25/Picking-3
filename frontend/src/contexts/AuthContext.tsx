import React, { createContext, useContext, useState, useEffect } from 'react'
import { offlineManager } from '../utils/offlineStorage'

interface User {
  id: string
  username: string
  role: string
}

interface Permissions {
  can_view_all_orders: boolean
  can_process_orders: boolean
  can_view_stats: boolean
  can_manage_users: boolean
  can_view_dashboard: boolean
}

interface AuthContextType {
  user: User | null
  permissions: Permissions | null
  token: string | null
  logout: () => void
  loading: boolean
  isOffline: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const initializeAuth = () => {
      const pickingUser = localStorage.getItem('picking_user')
      const pickingPermissions = localStorage.getItem('picking_permissions')
      const apiKey = localStorage.getItem('api_key')
      
      if (pickingUser) {
        const parsedUser = JSON.parse(pickingUser)
        setUser({
          id: parsedUser.id,
          username: parsedUser.name,
          role: parsedUser.role
        })
      }
      
      if (pickingPermissions) {
        setPermissions(JSON.parse(pickingPermissions))
      }
      
      if (apiKey) {
        setToken(apiKey)
      }
      
      const handleOnline = () => {
        setIsOffline(false)
        offlineManager.syncPendingData()
      }
      
      const handleOffline = () => {
        setIsOffline(true)
      }
      
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      setLoading(false)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
    
    initializeAuth()
  }, [])

  const logout = () => {
    localStorage.removeItem('picking_user')
    localStorage.removeItem('picking_permissions')
    localStorage.removeItem('user_logged_in')
    localStorage.removeItem('connected')
    localStorage.removeItem('store_url')
    localStorage.removeItem('api_key')
    localStorage.removeItem('store_name')
    localStorage.removeItem('picker_name')
    setUser(null)
    setPermissions(null)
    setToken(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, permissions, token, logout, loading, isOffline }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
