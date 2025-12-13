import { useState, useEffect } from 'react'
import {
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Pagination,
  List,
  ListItem,
  ListItemText,
  ImageList,
  ImageListItem,
} from '@mui/material'
import {
  History,
  PhotoLibrary,
  Search,
  Refresh,
  Close,
  Timeline,
  Person,
  AccessTime,
} from '@mui/icons-material'
import axios from 'axios'

interface Order {
  order_id: number
  order_number: string
  status: string
  picking_status: string
  user_claimed: string
  picking_started_at: string
  picking_completed_at: string
  picking_completed_by: string
  picking_users: string[]
  date_created: string
  date_modified: string
  customer_name: string
  customer_email: string
  total: string
  currency: string
  item_count: number
  has_photos: boolean
  photo_count: number
}

interface OrderHistory {
  timeline: TimelineEvent[]
  notes: OrderNote[]
  photos: Photo[]
  extra_items: ExtraItem[]
  picking: PickingData
}

interface TimelineEvent {
  event_id?: string
  event_type: string
  timestamp: string
  user: string
  details: Record<string, any>
}

interface OrderNote {
  id: number
  content: string
  date: string
  added_by: string
}

interface Photo {
  url: string
  filename: string
  uploaded_at: string
}

interface ExtraItem {
  item_id: string
  product_id: number
  name: string
  qty: number
  added_by: string
  added_at: string
  reason: string
  status: string
}

interface PickingData {
  status: string
  started_at: string
  started_by: string
  completed_at: string
  completed_by: string
  users: string[]
  user_claimed: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

interface WooStatus {
  value: string
  label: string
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [pickingStatusFilter, setPickingStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [wooStatuses, setWooStatuses] = useState<WooStatus[]>([])
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderHistory, setOrderHistory] = useState<OrderHistory | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [photosDialogOpen, setPhotosDialogOpen] = useState(false)
  const [orderPhotos, setOrderPhotos] = useState<Photo[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  
  const [tabValue, setTabValue] = useState(0)

  const storeUrl = localStorage.getItem('store_url') || ''
  const apiKey = localStorage.getItem('api_key') || ''

  useEffect(() => {
    fetchWooStatuses()
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter, pickingStatusFilter])

  const fetchWooStatuses = async () => {
    try {
      const response = await axios.get(`${storeUrl}/wp-json/picking/v1/order-statuses`, {
        params: { token: apiKey }
      })
      if (response.data.success) {
        setWooStatuses(response.data.statuses || [])
      }
    } catch (err) {
      console.error('Error fetching WooCommerce statuses:', err)
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params: Record<string, any> = {
        token: apiKey,
        page,
        per_page: 20,
      }
      if (statusFilter) params.status = statusFilter
      if (pickingStatusFilter) params.picking_status = pickingStatusFilter
      if (searchQuery) params.search = searchQuery

      const response = await axios.get(`${storeUrl}/wp-json/picking/v1/get-all-orders`, { params })

      if (response.data.success) {
        setOrders(response.data.orders)
        setTotalPages(response.data.total_pages)
      } else {
        setError('Error al cargar pedidos')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderHistory = async (orderId: number) => {
    try {
      setHistoryLoading(true)
      const response = await axios.get(`${storeUrl}/wp-json/picking/v1/get-order-history`, {
        params: { token: apiKey, order_id: orderId }
      })

      if (response.data.success) {
        setOrderHistory({
          timeline: response.data.timeline || [],
          notes: response.data.notes || [],
          photos: response.data.photos || [],
          extra_items: response.data.extra_items || [],
          picking: response.data.picking || {},
        })
      }
    } catch (err) {
      console.error('Error fetching order history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchOrderPhotos = async (orderId: number) => {
    try {
      setPhotosLoading(true)
      const response = await axios.get(`${storeUrl}/wp-json/picking/v1/get-order-photos`, {
        params: { token: apiKey, order_id: orderId }
      })

      if (response.data.success) {
        setOrderPhotos(response.data.photos || [])
      }
    } catch (err) {
      console.error('Error fetching order photos:', err)
    } finally {
      setPhotosLoading(false)
    }
  }

  const handleViewHistory = (order: Order) => {
    setSelectedOrder(order)
    setHistoryDialogOpen(true)
    fetchOrderHistory(order.order_id)
  }

  const handleViewPhotos = (order: Order) => {
    setSelectedOrder(order)
    setPhotosDialogOpen(true)
    fetchOrderPhotos(order.order_id)
  }

  const getPickingStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default'
      case 'picking': return 'warning'
      case 'packing': return 'info'
      case 'completed': return 'success'
      default: return 'default'
    }
  }

  const getPickingStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'picking': return 'En Picking'
      case 'packing': return 'Empacando'
      case 'completed': return 'Completado'
      default: return status
    }
  }

  const getEventTypeText = (eventType: string) => {
    switch (eventType) {
      case 'picking_started': return 'Picking Iniciado'
      case 'picking_completed': return 'Picking Completado'
      case 'picking_entered': return 'Usuario Entro al Picking'
      case 'picking_exited': return 'Usuario Salio del Picking'
      case 'picking_continued': return 'Usuario Continuo Picking'
      case 'picking_reentered': return 'Usuario Reingreso al Picking'
      case 'item_added': return 'Producto Agregado'
      case 'item_removed': return 'Producto Retirado'
      case 'quantity_changed': return 'Cantidad Modificada'
      case 'photo_uploaded': return 'Foto Subida'
      case 'scanned': return 'Producto Escaneado'
      case 'item_added_to_order': return 'Producto Agregado al Pedido'
      case 'item_removed_from_order': return 'Producto Eliminado del Pedido'
      default: return eventType
    }
  }

  if (loading && orders.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Cargando pedidos...</Typography>
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
        Gestion de Pedidos
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Buscar pedido"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado WooCommerce</InputLabel>
                <Select
                  value={statusFilter}
                  label="Estado WooCommerce"
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {wooStatuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado Picking</InputLabel>
                <Select
                  value={pickingStatusFilter}
                  label="Estado Picking"
                  onChange={(e) => {
                    setPickingStatusFilter(e.target.value)
                    setPage(1)
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="pending">Pendiente</MenuItem>
                  <MenuItem value="picking">En Picking</MenuItem>
                  <MenuItem value="packing">Empacando</MenuItem>
                  <MenuItem value="completed">Completado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchOrders}
              >
                Actualizar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Pedido</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Estado Picking</TableCell>
              <TableCell>Picker</TableCell>
              <TableCell align="center">Fotos</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.order_id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    #{order.order_number}
                  </Typography>
                </TableCell>
                <TableCell>{order.customer_name}</TableCell>
                <TableCell>
                  {new Date(order.date_created).toLocaleDateString('es-ES')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getPickingStatusText(order.picking_status)}
                    color={getPickingStatusColor(order.picking_status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {order.picking_users?.length > 0 
                    ? order.picking_users.join(', ')
                    : order.user_claimed || '-'}
                </TableCell>
                <TableCell align="center">
                  {order.has_photos && (
                    <Chip label={order.photo_count} size="small" color="info" />
                  )}
                </TableCell>
                <TableCell align="right">
                  {order.currency} {order.total}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleViewHistory(order)}
                    title="Ver historial"
                  >
                    <History />
                  </IconButton>
                  {order.has_photos && (
                    <IconButton
                      size="small"
                      onClick={() => handleViewPhotos(order)}
                      title="Ver fotos"
                    >
                      <PhotoLibrary />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Box>

      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Historial del Pedido #{selectedOrder?.order_number}
            </Typography>
            <IconButton onClick={() => setHistoryDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {historyLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : orderHistory ? (
            <>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                <Tab label="Timeline" icon={<Timeline />} iconPosition="start" />
                <Tab label="Fotos" icon={<PhotoLibrary />} iconPosition="start" />
                <Tab label="Notas" icon={<History />} iconPosition="start" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Informacion del Picking
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Estado:</strong> {getPickingStatusText(orderHistory.picking.status)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Iniciado por:</strong> {orderHistory.picking.started_by || '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Inicio:</strong> {orderHistory.picking.started_at || '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Completado:</strong> {orderHistory.picking.completed_at || '-'}
                        </Typography>
                      </Grid>
                      {orderHistory.picking.users?.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Trabajado por:</strong> {orderHistory.picking.users.join(', ')}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>

                <Typography variant="subtitle2" gutterBottom>
                  Eventos ({orderHistory.timeline.length})
                </Typography>
                <List>
                  {orderHistory.timeline.map((event, index) => (
                    <ListItem key={event.event_id || index} divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={getEventTypeText(event.event_type)}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            {event.user && (
                              <Chip
                                icon={<Person />}
                                label={event.user}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTime fontSize="small" />
                              {event.timestamp}
                            </Typography>
                            {event.details && Object.keys(event.details).length > 0 && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {event.details.message || 
                                 event.details.product_name || 
                                 JSON.stringify(event.details)}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                  {orderHistory.timeline.length === 0 && (
                    <ListItem>
                      <ListItemText primary="No hay eventos registrados" />
                    </ListItem>
                  )}
                </List>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                {orderHistory.photos.length > 0 ? (
                  <ImageList cols={3} gap={8}>
                    {orderHistory.photos.map((photo, index) => (
                      <ImageListItem key={index}>
                        <img
                          src={photo.url || photo as unknown as string}
                          alt={`Foto ${index + 1}`}
                          loading="lazy"
                          style={{ borderRadius: 8 }}
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                ) : (
                  <Alert severity="info">No hay fotos para este pedido</Alert>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <List>
                  {orderHistory.notes.map((note) => (
                    <ListItem key={note.id} divider>
                      <ListItemText
                        primary={note.content}
                        secondary={`${note.date} - ${note.added_by}`}
                      />
                    </ListItem>
                  ))}
                  {orderHistory.notes.length === 0 && (
                    <ListItem>
                      <ListItemText primary="No hay notas para este pedido" />
                    </ListItem>
                  )}
                </List>
              </TabPanel>
            </>
          ) : (
            <Alert severity="error">Error al cargar el historial</Alert>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={photosDialogOpen}
        onClose={() => setPhotosDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Fotos del Pedido #{selectedOrder?.order_number}
            </Typography>
            <IconButton onClick={() => setPhotosDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {photosLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : orderPhotos.length > 0 ? (
            <ImageList cols={2} gap={16}>
              {orderPhotos.map((photo, index) => (
                <ImageListItem key={index}>
                  <img
                    src={photo.url}
                    alt={photo.filename || `Foto ${index + 1}`}
                    loading="lazy"
                    style={{ borderRadius: 8 }}
                  />
                  <Box sx={{ p: 1, bgcolor: 'background.paper' }}>
                    <Typography variant="caption" color="text.secondary">
                      {photo.uploaded_at || 'Fecha desconocida'}
                    </Typography>
                  </Box>
                </ImageListItem>
              ))}
            </ImageList>
          ) : (
            <Alert severity="info">No hay fotos para este pedido</Alert>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default OrderManagement
