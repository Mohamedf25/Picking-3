import { useState, useEffect } from 'react'
import {
  Container,
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
  Alert
} from '@mui/material'
import {
  TrendingUp,
  Assignment,
  Timer,
  Error,
  People,
  Inventory
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

interface PickerMetrics {
  picker_email: string
  picker_role: string
  completed_orders: number
  avg_picking_time_minutes: number
  total_items_picked: number
}

interface ProductMetrics {
  sku: string
  product_name: string
  error_count: number
  total_picked: number
  error_rate: number
}

interface MetricsData {
  total_completed_orders: number
  total_active_sessions: number
  avg_picking_time_minutes: number
  picker_metrics: PickerMetrics[]
  top_error_products: ProductMetrics[]
  incidents_count: number
}

function Dashboard() {
  const { token, user } = useAuth()
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw 'Error al cargar métricas'
      }

      const data = await response.json()
      setMetrics(data)
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'admin' && user?.role !== 'supervisor') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Acceso denegado. Se requiere rol de administrador o supervisor.
        </Alert>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Cargando métricas...
        </Typography>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!metrics) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">No hay datos disponibles</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        📊 Dashboard de Métricas
      </Typography>
      
      {/* Métricas generales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assignment color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pedidos Completados
                  </Typography>
                  <Typography variant="h4">
                    {metrics.total_completed_orders}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Sesiones Activas
                  </Typography>
                  <Typography variant="h4">
                    {metrics.total_active_sessions}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Timer color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Tiempo Promedio
                  </Typography>
                  <Typography variant="h4">
                    {metrics.avg_picking_time_minutes.toFixed(1)}m
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Error color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Incidencias
                  </Typography>
                  <Typography variant="h4">
                    {metrics.incidents_count}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Métricas por Picker */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ mr: 1 }} />
                Rendimiento por Picker
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Picker</TableCell>
                      <TableCell align="right">Pedidos</TableCell>
                      <TableCell align="right">Tiempo Prom.</TableCell>
                      <TableCell align="right">Items</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.picker_metrics.map((picker, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {picker.picker_email}
                            </Typography>
                            <Chip 
                              label={picker.picker_role} 
                              size="small" 
                              color={picker.picker_role === 'admin' ? 'primary' : 'default'}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">{picker.completed_orders}</TableCell>
                        <TableCell align="right">{picker.avg_picking_time_minutes.toFixed(1)}m</TableCell>
                        <TableCell align="right">{picker.total_items_picked}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top productos con errores */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Inventory sx={{ mr: 1 }} />
                Productos con Más Errores
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>SKU</TableCell>
                      <TableCell align="right">Errores</TableCell>
                      <TableCell align="right">% Error</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.top_error_products.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {product.sku}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={product.error_count} 
                            size="small" 
                            color="error"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {product.error_rate.toFixed(1)}%
                        </TableCell>
                        <TableCell align="right">{product.total_picked}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default Dashboard
