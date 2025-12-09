import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material'
import { Person, Login } from '@mui/icons-material'
import axios from 'axios'

interface UserLoginProps {
  onLoggedIn: () => void
}

interface UserPermissions {
  can_view_all_orders: boolean
  can_process_orders: boolean
  can_view_stats: boolean
  can_manage_users: boolean
  can_view_dashboard: boolean
}

interface PickingUser {
  id: string
  name: string
  role: 'admin' | 'supervisor' | 'picker'
  orders_completed: number
}

function UserLogin({ onLoggedIn }: UserLoginProps) {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [storeName, setStoreName] = useState('')

  useEffect(() => {
    const savedStoreName = localStorage.getItem('store_name')
    if (savedStoreName) setStoreName(savedStoreName)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const storeUrl = localStorage.getItem('store_url')
      const apiKey = localStorage.getItem('api_key')

      if (!storeUrl || !apiKey) {
        setError('No hay conexion a la tienda. Vuelve a conectar.')
        setLoading(false)
        return
      }

      const response = await axios.post(
        `${storeUrl}/wp-json/picking/v1/user-login?token=${apiKey}`,
        {
          username: username.trim(),
          pin: pin.trim()
        }
      )

      if (response.data.success) {
        const user: PickingUser = response.data.user
        const permissions: UserPermissions = response.data.permissions

        localStorage.setItem('picking_user', JSON.stringify(user))
        localStorage.setItem('picking_permissions', JSON.stringify(permissions))
        localStorage.setItem('picker_name', user.name)
        localStorage.setItem('user_logged_in', 'true')

        onLoggedIn()
      } else {
        setError(response.data.message || 'Error al iniciar sesion')
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('PIN incorrecto')
      } else if (err.response?.status === 403) {
        setError('Usuario inactivo. Contacta al administrador.')
      } else if (err.response?.status === 404) {
        setError('Usuario no encontrado')
      } else {
        setError(err.response?.data?.message || 'Error de conexion')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSkipLogin = () => {
    const pickerName = localStorage.getItem('picker_name') || 'Usuario'
    localStorage.setItem('picking_user', JSON.stringify({
      id: 'guest',
      name: pickerName,
      role: 'picker',
      orders_completed: 0
    }))
    localStorage.setItem('picking_permissions', JSON.stringify({
      can_view_all_orders: true,
      can_process_orders: true,
      can_view_stats: false,
      can_manage_users: false,
      can_view_dashboard: false
    }))
    localStorage.setItem('user_logged_in', 'true')
    onLoggedIn()
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Person sx={{ fontSize: 48, color: '#1e3a5f', mb: 2 }} />
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              Iniciar Sesion
            </Typography>
            {storeName && (
              <Typography variant="body2" color="text.secondary">
                {storeName}
              </Typography>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Usuario"
              placeholder="Tu nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="PIN"
              type="password"
              placeholder="****"
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                setPin(value)
              }}
              margin="normal"
              required
              inputProps={{ maxLength: 4, inputMode: 'numeric', pattern: '[0-9]*' }}
              helperText="PIN de 4 digitos"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                bgcolor: '#1e3a5f',
                '&:hover': { bgcolor: '#2d4a6f' }
              }}
              disabled={loading || pin.length !== 4}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Login />}
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesion'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              variant="text"
              size="small"
              onClick={handleSkipLogin}
              sx={{ color: 'text.secondary' }}
            >
              Continuar sin usuario registrado
            </Button>
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" display="block" gutterBottom sx={{ fontWeight: 600 }}>
              Nota:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              Tu usuario y PIN son creados por el administrador en WordPress &gt; Picking App &gt; Usuarios
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default UserLogin
