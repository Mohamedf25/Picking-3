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
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  IconButton,
} from '@mui/material'
import {
  Assignment,
  LocalShipping,
  CheckCircle,
  People,
  ExpandMore,
  ExpandLess,
  CalendarToday,
  Person,
  AccessTime,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

interface DashboardStats {
  pending_orders: number
  picking_orders: number
  completed_count: number
  total_users: number
}

interface PickerStats {
  name: string
  role: string
  orders_completed: number
  active: boolean
}

interface CompletedOrder {
  order_id: number
  order_number: string
  customer_name: string
  total: string
  date_created: string
  completed_at: string
  payment_method: string
  completed_by: string
}

type FilterType = 'day' | 'week' | 'month'

function Dashboard() {
  const { permissions } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pickers, setPickers] = useState<PickerStats[]>([])
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('day')
  const [showCompletedList, setShowCompletedList] = useState(false)

  useEffect(() => {
    fetchDashboardStats(filter)
  }, [filter])

  const fetchDashboardStats = async (filterType: FilterType) => {
    try {
      setLoading(true)
      const storeUrl = localStorage.getItem('store_url')
      const apiKey = localStorage.getItem('api_key')

      if (!storeUrl || !apiKey) {
        setError('No hay conexion a la tienda')
        return
      }

      const response = await axios.get(
        `${storeUrl}/wp-json/picking/v1/get-dashboard-stats?token=${apiKey}&filter=${filterType}`
      )

      if (response.data.success) {
        setStats(response.data.stats)
        setPickers(response.data.pickers || [])
        setCompletedOrders(response.data.completed_orders || [])
      } else {
        setError('Error al cargar estadisticas')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (_event: React.MouseEvent<HTMLElement>, newFilter: FilterType | null) => {
    if (newFilter !== null) {
      setFilter(newFilter)
    }
  }

  const getFilterLabel = (filterType: FilterType) => {
    switch (filterType) {
      case 'day':
        return 'Hoy'
      case 'week':
        return 'Esta Semana'
      case 'month':
        return 'Este Mes'
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
          <Card 
            sx={{ bgcolor: '#e8f5e9', cursor: 'pointer' }}
            onClick={() => setShowCompletedList(!showCompletedList)}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircle sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats?.completed_count || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completados {getFilterLabel(filter)}
              </Typography>
              <IconButton size="small" sx={{ mt: 0.5 }}>
                {showCompletedList ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
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

      {/* Filter buttons */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          size="small"
        >
          <ToggleButton value="day">Hoy</ToggleButton>
          <ToggleButton value="week">Semana</ToggleButton>
          <ToggleButton value="month">Mes</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Completed orders list */}
      <Collapse in={showCompletedList}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle sx={{ mr: 1, color: '#4caf50' }} />
            Pedidos Completados {getFilterLabel(filter)}
          </Typography>
          {completedOrders.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay pedidos completados en este periodo
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Pedido</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Fecha</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Completado</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Pago</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {completedOrders.map((order) => (
                    <TableRow key={order.order_id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          #{order.order_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {order.customer_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarToday sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {new Date(order.date_created).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTime sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {new Date(order.completed_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Chip 
                          label={order.payment_method || 'N/A'} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          ${order.total}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Collapse>

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
