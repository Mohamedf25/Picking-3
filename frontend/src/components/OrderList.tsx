import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Checkbox,
  Fab,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  ShoppingCart, 
  Person, 
  AttachMoney, 
  PlayArrow,
  ViewList,
  ViewModule,
  SelectAll,
  ClearAll,
} from '@mui/icons-material'

interface Order {
  id: number
  number: string
  status: string
  total: string
  customer_name: string
  line_items: Array<{
    id: number
    name: string
    sku: string
    quantity: number
    product_id: number
  }>
}

type PickingMode = 'single' | 'batch'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function OrderList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pickingMode, setPickingMode] = useState<PickingMode>('single')
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setOrders(response.data)
    } catch (err) {
      setError('Error al cargar los pedidos')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'warning'
      case 'completed':
        return 'success'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'Procesando'
      case 'completed':
        return 'Completado'
      default:
        return status
    }
  }

  const handleModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: PickingMode | null) => {
    if (newMode !== null) {
      setPickingMode(newMode)
      if (newMode === 'single') {
        setSelectedOrders([])
      }
    }
  }

  const handleOrderSelect = (orderId: number) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId)
      } else {
        return [...prev, orderId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(orders.map(o => o.id))
    }
  }

  const handleStartBatchPicking = async () => {
    if (selectedOrders.length === 0) {
      setSnackbarMessage('Selecciona al menos un pedido')
      setSnackbarOpen(true)
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_BASE_URL}/api/batch-picking`,
        { order_ids: selectedOrders },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      navigate(`/sessions/${response.data.session_id}`)
    } catch (err) {
      setSnackbarMessage('Error al iniciar picking por lotes')
      setSnackbarOpen(true)
    }
  }

  const getTotalProducts = () => {
    return orders
      .filter(o => selectedOrders.includes(o.id))
      .reduce((sum, o) => sum + o.line_items.length, 0)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
          Pedidos Pendientes
        </Typography>
        <ToggleButtonGroup
          value={pickingMode}
          exclusive
          onChange={handleModeChange}
          size="small"
        >
          <ToggleButton value="single" aria-label="picking individual">
            <ViewList sx={{ mr: 0.5 }} />
            Individual
          </ToggleButton>
          <ToggleButton value="batch" aria-label="picking por lotes">
            <ViewModule sx={{ mr: 0.5 }} />
            Lotes
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {pickingMode === 'batch' && orders.length > 0 && (
        <Card sx={{ mb: 2, bgcolor: '#1e3a5f', color: 'white' }}>
          <CardContent sx={{ py: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleSelectAll}
                  startIcon={selectedOrders.length === orders.length ? <ClearAll /> : <SelectAll />}
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
                >
                  {selectedOrders.length === orders.length ? 'Deseleccionar' : 'Seleccionar Todo'}
                </Button>
                <Typography variant="body2">
                  {selectedOrders.length} pedido{selectedOrders.length !== 1 ? 's' : ''} seleccionado{selectedOrders.length !== 1 ? 's' : ''}
                  {selectedOrders.length > 0 && ` (${getTotalProducts()} productos)`}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {orders.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <ShoppingCart sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No hay pedidos pendientes
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {orders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: pickingMode === 'batch' && selectedOrders.includes(order.id) 
                    ? '2px solid #1e3a5f' 
                    : '2px solid transparent',
                  transition: 'border-color 0.2s',
                }} 
                onClick={() => {
                  if (pickingMode === 'batch') {
                    handleOrderSelect(order.id)
                  } else {
                    navigate(`/orders/${order.id}`)
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      {pickingMode === 'batch' && (
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleOrderSelect(order.id)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{ mt: -0.5, ml: -1 }}
                        />
                      )}
                      <Box>
                        <Typography variant="h6" component="h2">
                          Pedido #{order.number}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
                          <Person sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {order.customer_name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AttachMoney sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {order.total}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Chip
                      label={getStatusText(order.status)}
                      color={getStatusColor(order.status) as 'warning' | 'success' | 'default'}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {order.line_items.length} producto{order.line_items.length !== 1 ? 's' : ''}
                  </Typography>

                  {pickingMode === 'single' && (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/orders/${order.id}`)
                      }}
                      sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#2d4a6f' } }}
                    >
                      Ver Detalles
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {pickingMode === 'batch' && selectedOrders.length > 0 && (
        <Fab
          variant="extended"
          color="primary"
          onClick={handleStartBatchPicking}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: '#4caf50',
            '&:hover': { bgcolor: '#45a049' },
          }}
        >
          <Badge badgeContent={selectedOrders.length} color="error" sx={{ mr: 1 }}>
            <PlayArrow />
          </Badge>
          Iniciar Picking
        </Fab>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  )
}

export default OrderList
