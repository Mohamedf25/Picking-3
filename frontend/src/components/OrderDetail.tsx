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
  ean: string
  ian: string
  cnd: string
  quantity: number
  product_id: number
  image?: string
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
      const response = await axios.get(`${storeUrl}/wp-json/picking/v1/get-order-products`, {
        params: {
          token: apiKey,
          order_id: orderId,
          appuser: pickerName
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
        }))
      })
    } catch (err) {
      setError('Error al cargar el pedido')
    } finally {
      setLoading(false)
    }
  }

  const startPickingSession = async () => {
    if (!orderId) return
    
    // Navigate directly to picking session - the order is already claimed when we fetched it
    navigate(`/picking/${orderId}`)
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

      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={<PlayArrow />}
        onClick={startPickingSession}
        disabled={!order.availableForPicking}
        sx={{ py: 2 }}
      >
        Iniciar Picking
      </Button>

      {!order.availableForPicking && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {order.availabilityReasonText || 'Este pedido no está disponible para picking'}
        </Alert>
      )}
    </Box>
  )
}

export default OrderDetail
