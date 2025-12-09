import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Chip,
  CircularProgress,
  Button
} from '@mui/material'
import {
  People,
  Refresh,
  OpenInNew
} from '@mui/icons-material'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

interface PickingUser {
  id: string
  name: string
  role: string
  active: boolean
  orders_completed: number
  last_activity: string | null
}

function AdminPanel() {
  const { permissions } = useAuth()
  const [users, setUsers] = useState<PickingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const storeUrl = localStorage.getItem('store_url')
      const apiKey = localStorage.getItem('api_key')

      if (!storeUrl || !apiKey) {
        setError('No hay conexion a la tienda')
        return
      }

      const response = await axios.get(
        `${storeUrl}/wp-json/picking/v1/get-users?token=${apiKey}`
      )

      if (response.data.success) {
        setUsers(response.data.users || [])
      } else {
        setError('Error al cargar usuarios')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  const openWordPressAdmin = () => {
    const storeUrl = localStorage.getItem('store_url')
    if (storeUrl) {
      window.open(`${storeUrl}/wp-admin/admin.php?page=picking-users`, '_blank')
    }
  }

  if (!permissions?.can_manage_users) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Acceso denegado. Solo los administradores pueden gestionar usuarios.
        </Alert>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Cargando usuarios...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <People sx={{ mr: 1 }} />
          Gestion de Usuarios
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchUsers}
            size="small"
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<OpenInNew />}
            onClick={openWordPressAdmin}
            size="small"
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#2d4a6f' } }}
          >
            Administrar en WordPress
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Para crear, editar o eliminar usuarios, usa el panel de WordPress. Aqui puedes ver el estado actual de los usuarios.
          </Typography>
          
          {users.length === 0 ? (
            <Alert severity="info">
              No hay usuarios registrados. Crea usuarios en WordPress &gt; Picking Connector &gt; Usuarios.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Rol</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Estado</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Pedidos</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ultima Actividad</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {user.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role === 'admin' ? 'Administrador' : user.role === 'supervisor' ? 'Supervisor' : 'Picker'} 
                          size="small"
                          color={user.role === 'admin' ? 'primary' : user.role === 'supervisor' ? 'secondary' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={user.active ? 'Activo' : 'Inactivo'} 
                          size="small"
                          color={user.active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {user.orders_completed}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {user.last_activity ? new Date(user.last_activity).toLocaleString() : 'Nunca'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Roles y Permisos
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                Administrador
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Acceso completo: ver todos los pedidos, dashboard, gestionar usuarios
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="secondary">
                Supervisor
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ver todos los pedidos, dashboard y estadisticas. No puede gestionar usuarios.
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Picker
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Solo puede ver y procesar pedidos asignados. Sin acceso a dashboard.
              </Typography>
            </Paper>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AdminPanel
