import { useState, useEffect } from 'react'
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material'
import {
  Assignment,
  LocalShipping,
  CheckCircle,
  People
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

interface DashboardStats {
  pending_orders: number
  picking_orders: number
  completed_today: number
  total_users: number
}

interface PickerStats {
  name: string
  role: string
  orders_completed: number
  active: boolean
}

function Dashboard() {
  const { permissions } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pickers, setPickers] = useState<PickerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const storeUrl = localStorage.getItem('store_url')
      const apiKey = localStorage.getItem('api_key')

      if (!storeUrl || !apiKey) {
        setError('No hay conexion a la tienda')
        return
      }

      const response = await axios.get(
        `${storeUrl}/wp-json/picking/v1/get-dashboard-stats?token=${apiKey}`
      )

      if (response.data.success) {
        setStats(response.data.stats)
        setPickers(response.data.pickers || [])
      } else {
        setError('Error al cargar estadisticas')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  if (!permissions?.can_view_dashboard) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Acceso denegado. Se requiere rol de administrador o supervisor.
        </Alert>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Cargando estadisticas...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Dashboard
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Assignment sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats?.pending_orders || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <LocalShipping sx={{ fontSize: 40, color: '#f57c00', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats?.picking_orders || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                En Picking
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircle sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats?.completed_today || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completados Hoy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: '#f3e5f5' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <People sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats?.total_users || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usuarios
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <People sx={{ mr: 1 }} />
          Equipo de Picking
        </Typography>
        {pickers.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay usuarios registrados
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="right">Pedidos</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pickers.map((picker, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {picker.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={picker.role === 'admin' ? 'Admin' : picker.role === 'supervisor' ? 'Supervisor' : 'Picker'} 
                        size="small" 
                        color={picker.role === 'admin' ? 'primary' : picker.role === 'supervisor' ? 'secondary' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={picker.active ? 'Activo' : 'Inactivo'} 
                        size="small" 
                        color={picker.active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">{picker.orders_completed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}

export default Dashboard
