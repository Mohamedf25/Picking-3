import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowBack, PlayArrow, Person, AttachMoney } from '@mui/icons-material'

interface LineItem {
  id: number
  name: string
  sku: string
  quantity: number
  product_id: number
}

interface Order {
  id: number
  number: string
  status: string
  total: string
  customer_name: string
  line_items: LineItem[]
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [startingSession, setStartingSession] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`)
      setOrder(response.data)
    } catch (err) {
      setError('Error al cargar el pedido')
    } finally {
      setLoading(false)
    }
  }

  const startPickingSession = async () => {
    if (!orderId) return
    
    setStartingSession(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/orders/${orderId}/start`)
      navigate(`/sessions/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al iniciar la sesión de picking')
    } finally {
      setStartingSession(false)
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

  if (!order) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Pedido no encontrado
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/orders')}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4" component="h1">
          Pedido #{order.number}
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Person sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">
                  {order.customer_name}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">
                  €{order.total}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={getStatusText(order.status)}
              color={getStatusColor(order.status) as any}
            />
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Productos ({order.line_items.length})
          </Typography>
          <List>
            {order.line_items.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary={item.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          SKU: {item.sku || 'Sin SKU'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cantidad: {item.quantity}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < order.line_items.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={startingSession ? <CircularProgress size={20} /> : <PlayArrow />}
        onClick={startPickingSession}
        disabled={startingSession || order.status !== 'processing'}
        sx={{ py: 2 }}
      >
        {startingSession ? 'Iniciando...' : 'Iniciar Picking'}
      </Button>

      {order.status !== 'processing' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Este pedido no está disponible para picking
        </Alert>
      )}
    </Box>
  )
}

export default OrderDetail
