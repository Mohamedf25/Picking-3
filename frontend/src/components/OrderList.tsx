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
  order_id: number
  order_number: string
  status: string
  total: string
  customer_name: string
  item_count: number
  picking_status: string
  user_claimed: string
  date_created: string
}

type PickingMode = 'single' | 'batch'

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
      const storeUrl = localStorage.getItem('store_url')
      const apiKey = localStorage.getItem('api_key')
      const pickerName = localStorage.getItem('picker_name')
      
      if (!storeUrl || !apiKey) {
        setError('No hay conexion con la tienda')
        setLoading(false)
        return
      }
      
      const response = await axios.get(`${storeUrl}/wp-json/picking/v1/orders-list`, {
        params: {
          token: apiKey,
          appuser: pickerName
        }
      })
      
      setOrders(response.data.orders || [])
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
      setSelectedOrders(orders.map(o => o.order_id))
    }
  }

  const handleStartBatchPicking = async () => {
    if (selectedOrders.length === 0) {
      setSnackbarMessage('Selecciona al menos un pedido')
      setSnackbarOpen(true)
      return
    }
    
    try {
      const storeUrl = localStorage.getItem('store_url')
      const apiKey = localStorage.getItem('api_key')
      const pickerName = localStorage.getItem('picker_name')
      
      const response = await axios.post(
        `${storeUrl}/wp-json/picking/v1/create-batch`,
        { order_ids: selectedOrders },
        {
          params: {
            token: apiKey,
            appuser: pickerName
          }
        }
      )
      
      if (response.data.success) {
        navigate(`/orders/${selectedOrders[0]}`)
      } else {
        setSnackbarMessage('Error al iniciar picking por lotes')
        setSnackbarOpen(true)
      }
    } catch (err) {
      setSnackbarMessage('Error al iniciar picking por lotes')
      setSnackbarOpen(true)
    }
  }

  const getTotalProducts = () => {
    return orders
      .filter(o => selectedOrders.includes(o.order_id))
      .reduce((sum, o) => sum + o.item_count, 0)
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
            <Grid item xs={12} key={order.order_id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: pickingMode === 'batch' && selectedOrders.includes(order.order_id) 
                    ? '2px solid #1e3a5f' 
                    : '2px solid transparent',
                  transition: 'border-color 0.2s',
                }} 
                onClick={() => {
                  if (pickingMode === 'batch') {
                    handleOrderSelect(order.order_id)
                  } else {
                    navigate(`/orders/${order.order_id}`)
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      {pickingMode === 'batch' && (
                        <Checkbox
                          checked={selectedOrders.includes(order.order_id)}
                          onChange={() => handleOrderSelect(order.order_id)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{ mt: -0.5, ml: -1 }}
                        />
                      )}
                      <Box>
                        <Typography variant="h6" component="h2">
                          Pedido #{order.order_number}
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
                    {order.item_count} producto{order.item_count !== 1 ? 's' : ''}
                  </Typography>

                  {pickingMode === 'single' && (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/orders/${order.order_id}`)
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
