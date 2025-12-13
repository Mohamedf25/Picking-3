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
import { ArrowBack, PlayArrow, Person, AttachMoney, History, Engineering } from '@mui/icons-material'

interface LineItem {
  id: number
  name: string
  sku: string
  ean: string
  ian: string
  cnd: string
  quantity: number
  product_id: number
  image?: string
}

interface PickingHistoryEvent {
  event_id: string
  action: string
  user: string
  reason: string
  timestamp: string
  timestamp_unix: number
  details: Record<string, string>
}

interface Order {
  id: number
  number: string
  status: string
  pickingStatus: string
  availableForPicking: boolean
  availabilityReasonText: string
  total: string
  customer_name: string
  line_items: LineItem[]
  user_claimed: string
  picking_started_by: string
  picking_users: string[]
  picking_history: PickingHistoryEvent[]
}

function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Get store config from localStorage
  const storeUrl = localStorage.getItem('store_url') || ''
  const apiKey = localStorage.getItem('api_key') || ''
  const pickerName = localStorage.getItem('picker_name') || ''

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      // Use view_only=true to fetch order data without claiming it
      // This allows viewing order details without starting the picking process
      const response = await axios.get(`${storeUrl}/wp-json/picking/v1/get-order-products`, {
        params: {
          token: apiKey,
          order_id: orderId,
          appuser: pickerName,
          view_only: 'true'
        }
      })
      
      // Transform the response to match the expected Order interface
      const data = response.data
      setOrder({
        id: data.order_id,
        number: data.order_number || String(data.order_id),
        status: data.status || 'processing',
        pickingStatus: data.picking_status || 'pending',
        availableForPicking: data.available_for_picking ?? true,
        availabilityReasonText: data.availability_reason_text || '',
        total: data.total || '0',
        customer_name: data.customer?.name || 'Cliente',
        line_items: (data.products || []).map((p: any) => ({
          id: p.item_id || p.product_id,
          name: p.name,
          sku: p.sku || '',
          ean: p.ean || '',
          ian: p.ian || '',
          cnd: p.cnd || '',
          quantity: p.quantity || 1,
          product_id: p.product_id,
          image: p.image || ''
        })),
        user_claimed: data.user_claimed || '',
        picking_started_by: data.picking_started_by || '',
        picking_users: data.picking_users || [],
        picking_history: data.picking_history || [],
      })
    } catch (err) {
      setError('Error al cargar el pedido')
    } finally {
      setLoading(false)
    }
  }

  const [startingPicking, setStartingPicking] = useState(false)

  const startPickingSession = async () => {
    if (!orderId) return
    
    setStartingPicking(true)
    
    try {
      // Explicitly start the picking session by calling the start-picking endpoint
      // This claims the order and sets picking_status, user_claimed, picking_started_at
      await axios.post(`${storeUrl}/wp-json/picking/v1/start-picking`, {
        order_id: orderId,
        appuser: pickerName,
      }, {
        params: { token: apiKey }
      })
      
      // Navigate to picking session after successfully starting
      navigate(`/picking/${orderId}`)
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(err.response?.data?.message || 'Este pedido ya esta siendo trabajado por otro usuario')
      } else {
        setError('Error al iniciar el picking')
      }
    } finally {
      setStartingPicking(false)
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

  const getActionText = (action: string) => {
    switch (action) {
      case 'entered':
        return 'Entro al picking'
      case 'exited':
        return 'Salio del picking'
      case 'continued':
        return 'Continuo el picking'
      case 'reentered':
        return 'Reingreso al picking'
      default:
        return action
    }
  }

  const formatHistoryDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
                  <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                    {item.image && (
                      <Box
                        component="img"
                        src={item.image}
                        alt={item.name}
                        sx={{
                          width: 60,
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: 1,
                          border: '1px solid #e0e0e0',
                        }}
                      />
                    )}
                    <ListItemText
                      primary={item.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            SKU: {item.sku || '-'}
                          </Typography>
                          {(item.ean || item.ian) && (
                            <Typography variant="body2" color="text.secondary">
                              EAN/IAN: {item.ean || item.ian}
                            </Typography>
                          )}
                          {item.cnd && (
                            <Typography variant="body2" color="text.secondary">
                              CND: {item.cnd}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            Cantidad: {item.quantity}
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </ListItem>
                {index < order.line_items.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Current Worker Info */}
      {(order.user_claimed || order.picking_started_by || order.picking_users.length > 0) && (
        <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Engineering sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Estado del Picking</Typography>
            </Box>
            {order.user_claimed && (
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Trabajando actualmente:</strong> {order.user_claimed}
              </Typography>
            )}
            {order.picking_started_by && (
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Iniciado por:</strong> {order.picking_started_by}
              </Typography>
            )}
            {order.picking_users.length > 0 && (
              <Typography variant="body2">
                <strong>Usuarios que han trabajado:</strong> {order.picking_users.join(', ')}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Picking History */}
      {order.picking_history.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <History sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Historial de Picking</Typography>
            </Box>
            <List dense>
              {order.picking_history.map((event, index) => (
                <React.Fragment key={event.event_id}>
                  <ListItem sx={{ px: 0, py: 1 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {event.user} - {getActionText(event.action)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatHistoryDate(event.timestamp)}
                          </Typography>
                        </Box>
                      }
                      secondary={event.reason && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Motivo: {event.reason}
                        </Typography>
                      )}
                    />
                  </ListItem>
                  {index < order.picking_history.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={startingPicking ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
        onClick={startPickingSession}
        disabled={!order.availableForPicking || startingPicking}
        sx={{ py: 2 }}
      >
        {startingPicking ? 'Iniciando...' : 'Iniciar Picking'}
      </Button>

      {!order.availableForPicking && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {order.availabilityReasonText || 'Este pedido no esta disponible para picking'}
        </Alert>
      )}
    </Box>
  )
}

export default OrderDetail
