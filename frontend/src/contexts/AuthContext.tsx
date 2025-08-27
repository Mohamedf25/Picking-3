import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { offlineManager } from '../utils/offlineStorage'
import { deviceLockManager } from '../utils/deviceLock'

interface User {
  id: string
  username: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  isOffline: boolean
  deviceId: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [deviceId, setDeviceId] = useState<string | null>(null)

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        setToken(storedToken)
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        const userData = localStorage.getItem('user')
        if (userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          
          const deviceIdValue = await deviceLockManager.getDeviceId()
          setDeviceId(deviceIdValue)
          
          const isAuthorized = await deviceLockManager.isDeviceAuthorized(parsedUser.id)
          if (!isAuthorized) {
            await deviceLockManager.authorizeDevice(parsedUser.id)
          }
        }
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

  const login = async (username: string, password: string) => {
    try {
      const isDeviceValid = await deviceLockManager.validateDeviceIntegrity()
      if (!isDeviceValid && localStorage.getItem('device_id')) {
        console.warn('Device fingerprint changed - clearing device data')
        deviceLockManager.clearDeviceData()
      }
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
      })
      
      const { access_token, user } = response.data
      localStorage.setItem('token', access_token)
      setToken(access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      const userData = { 
        id: user.id, 
        username: user.username, 
        role: user.role
      }
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      const deviceIdValue = await deviceLockManager.getDeviceId()
      setDeviceId(deviceIdValue)
      await deviceLockManager.authorizeDevice(user.id)
      
    } catch (error) {
      if (offlineManager.isOffline()) {
        throw new Error('Sin conexión - no se puede autenticar')
      }
      throw new Error('Credenciales inválidas')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    setToken(null)
    setDeviceId(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isOffline, deviceId }}>
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
