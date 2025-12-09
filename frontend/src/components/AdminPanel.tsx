import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Settings,
  Assessment,
  People,
  Visibility,
  PhotoCamera,
  Person
} from '@mui/icons-material'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

interface User {
  id: string
  username: string
  role: string
  warehouse_id?: string
  created_at: string
  updated_at: string
}

interface SessionAudit {
  id: string
  order_id: number
  user_id: string
  status: string
  started_at: string
  finished_at?: string
  warehouse_id?: string
}

interface OrderAudit {
  order_id: number
  order_number: string
  status: string
  total: string
  customer_name: string
  sessions: Array<{
    id: string
    user_id: string
    status: string
    started_at: string
    finished_at?: string
  }>
}

interface SessionDetail {
  id: string
  order_id: number
  status: string
  started_at: string
  finished_at?: string
  started_by?: {
    id: string
    username: string
    role: string
  }
  participants: Array<{
    id: string
    username: string
    role: string
  }>
  photos: Array<{
    id: string
    url: string
    created_at: string
  }>
  lines: Array<{
    id: string
    product_id: number
    ean: string
    expected_qty: number
    picked_qty: number
    status: string
    product_name: string
  }>
  events_count: number
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function AdminPanel() {
  const { user } = useAuth()
  const [tabValue, setTabValue] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const [sessions, setSessions] = useState<SessionAudit[]>([])
  const [orders, setOrders] = useState<OrderAudit[]>([])
  const [config, setConfig] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
    const [userDialog, setUserDialog] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [newUser, setNewUser] = useState({
      username: '',
      password: '',
      role: 'picker',
      warehouse_id: ''
    })
    const [sessionDetailDialog, setSessionDetailDialog] = useState(false)
    const [selectedSessionDetail, setSelectedSessionDetail] = useState<SessionDetail | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)

    useEffect(() => {
      if (user?.role === 'admin') {
        fetchUsers()
        fetchConfig()
        fetchSessions()
        fetchOrders()
      }
    }, [user])

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users`, getAuthHeaders())
      setUsers(response.data)
    } catch (err) {
      setError('Error al cargar usuarios')
    }
  }

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/config`, getAuthHeaders())
      setConfig(response.data)
    } catch (err) {
      setError('Error al cargar configuración')
    }
  }

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/audit/sessions`, getAuthHeaders())
      setSessions(response.data)
    } catch (err) {
      setError('Error al cargar sesiones')
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/audit/orders`, getAuthHeaders())
      setOrders(response.data)
    } catch (err) {
      setError('Error al cargar pedidos')
    }
  }

  const handleCreateUser = async () => {
    try {
      setLoading(true)
      await axios.post(`${API_BASE_URL}/admin/users`, newUser, getAuthHeaders())
      setSuccess('Usuario creado exitosamente')
      setUserDialog(false)
      setNewUser({ username: '', password: '', role: 'picker', warehouse_id: '' })
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear usuario')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    
    try {
      setLoading(true)
      await axios.put(`${API_BASE_URL}/admin/users/${editingUser.id}`, newUser, getAuthHeaders())
      setSuccess('Usuario actualizado exitosamente')
      setUserDialog(false)
      setEditingUser(null)
      setNewUser({ username: '', password: '', role: 'picker', warehouse_id: '' })
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar usuario')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Está seguro de que desea desactivar este usuario?')) return
    
    try {
      await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, getAuthHeaders())
      setSuccess('Usuario desactivado exitosamente')
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al desactivar usuario')
    }
  }

  const handleConfigChange = async (key: string, value: boolean) => {
    try {
      const newConfig = { ...config, [key]: value }
      await axios.put(`${API_BASE_URL}/admin/config`, newConfig, getAuthHeaders())
      setConfig(newConfig)
      setSuccess('Configuración actualizada')
    } catch (err: any) {
      setError('Error al actualizar configuración')
    }
  }

    const openUserDialog = (user?: User) => {
      if (user) {
        setEditingUser(user)
        setNewUser({
          username: user.username,
          password: '',
          role: user.role,
          warehouse_id: user.warehouse_id || ''
        })
      } else {
        setEditingUser(null)
        setNewUser({ username: '', password: '', role: 'picker', warehouse_id: '' })
      }
      setUserDialog(true)
    }

    const fetchSessionDetail = async (sessionId: string) => {
      setLoadingDetail(true)
      try {
        const response = await axios.get(`${API_BASE_URL}/sessions/${sessionId}/detail`, getAuthHeaders())
        setSelectedSessionDetail(response.data)
        setSessionDetailDialog(true)
      } catch (err) {
        setError('Error al cargar detalles de la sesión')
      } finally {
        setLoadingDetail(false)
      }
    }

    const getUsernameById = (userId: string) => {
      const foundUser = users.find(u => u.id === userId)
      return foundUser ? foundUser.username : userId.substring(0, 8) + '...'
    }

  if (user?.role !== 'admin') {
    return (
      <Alert severity="error">
        Acceso denegado. Solo los administradores pueden acceder a este panel.
      </Alert>
    )
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Panel de Administración
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab icon={<People />} label="Usuarios" />
          <Tab icon={<Settings />} label="Configuración" />
          <Tab icon={<Visibility />} label="Auditoría" />
          <Tab icon={<Assessment />} label="Estadísticas" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Gestión de Usuarios</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => openUserDialog()}
              >
                Crear Usuario
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Almacén</TableCell>
                    <TableCell>Creado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role} 
                          color={user.role === 'admin' ? 'error' : user.role === 'supervisor' ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{user.warehouse_id || 'Sin asignar'}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => openUserDialog(user)} size="small">
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteUser(user.id)} size="small" color="error">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Configuración del Sistema</Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.mandatory_photos || false}
                    onChange={(e) => handleConfigChange('mandatory_photos', e.target.checked)}
                  />
                }
                label="Fotos Obligatorias"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.allow_exceptions || false}
                    onChange={(e) => handleConfigChange('allow_exceptions', e.target.checked)}
                  />
                }
                label="Permitir Excepciones"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.offline_mode || false}
                    onChange={(e) => handleConfigChange('offline_mode', e.target.checked)}
                  />
                }
                label="Modo Offline"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.camera_scanning || false}
                    onChange={(e) => handleConfigChange('camera_scanning', e.target.checked)}
                  />
                }
                label="Escaneo con Cámara"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.qr_labels || false}
                    onChange={(e) => handleConfigChange('qr_labels', e.target.checked)}
                  />
                }
                label="Etiquetas QR"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.multi_warehouse || false}
                    onChange={(e) => handleConfigChange('multi_warehouse', e.target.checked)}
                  />
                }
                label="Multi-almacén"
              />
            </Box>
          </CardContent>
        </Card>
      )}

            {tabValue === 2 && (
              <Box>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Sesiones de Picking</Typography>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>ID Sesión</TableCell>
                            <TableCell>Pedido</TableCell>
                            <TableCell>Usuario</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Iniciado</TableCell>
                            <TableCell>Finalizado</TableCell>
                            <TableCell>Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sessions.slice(0, 10).map((session) => (
                            <TableRow key={session.id}>
                              <TableCell>{session.id.substring(0, 8)}...</TableCell>
                              <TableCell>{session.order_id}</TableCell>
                              <TableCell>{getUsernameById(session.user_id)}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={session.status} 
                                  color={session.status === 'finished' ? 'success' : 'primary'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{new Date(session.started_at).toLocaleString()}</TableCell>
                              <TableCell>{session.finished_at ? new Date(session.finished_at).toLocaleString() : '-'}</TableCell>
                              <TableCell>
                                <IconButton 
                                  size="small" 
                                  onClick={() => fetchSessionDetail(session.id)}
                                  disabled={loadingDetail}
                                  title="Ver detalles"
                                >
                                  {loadingDetail ? <CircularProgress size={16} /> : <Visibility />}
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Auditoría de Pedidos</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Pedido</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Sesiones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.slice(0, 10).map((order) => (
                      <TableRow key={order.order_id}>
                        <TableCell>{order.order_number}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={order.status} 
                            color={order.status === 'completed' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{order.total}</TableCell>
                        <TableCell>{order.sessions.length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {tabValue === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Estadísticas del Sistema</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4" color="primary">{users.length}</Typography>
                  <Typography variant="body2">Usuarios Totales</Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4" color="success.main">{sessions.filter(s => s.status === 'finished').length}</Typography>
                  <Typography variant="body2">Sesiones Completadas</Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4" color="warning.main">{sessions.filter(s => s.status === 'in_progress').length}</Typography>
                  <Typography variant="body2">Sesiones Activas</Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4" color="info.main">{orders.length}</Typography>
                  <Typography variant="body2">Pedidos Procesados</Typography>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        </Card>
      )}

      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Editar Usuario' : 'Crear Usuario'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Usuario"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              fullWidth
            />
            
            <TextField
              label="Contraseña"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              fullWidth
              helperText={editingUser ? "Dejar vacío para mantener la contraseña actual" : ""}
            />
            
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <MenuItem value="picker">Picker</MenuItem>
                <MenuItem value="supervisor">Supervisor</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="ID Almacén"
              value={newUser.warehouse_id}
              onChange={(e) => setNewUser({ ...newUser, warehouse_id: e.target.value })}
              fullWidth
              helperText="Opcional"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Cancelar</Button>
          <Button 
            onClick={editingUser ? handleUpdateUser : handleCreateUser}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Session Detail Dialog */}
      <Dialog 
        open={sessionDetailDialog} 
        onClose={() => setSessionDetailDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Detalles de la Sesión de Picking
        </DialogTitle>
        <DialogContent>
          {selectedSessionDetail && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Session Info */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Información General</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Pedido</Typography>
                      <Typography variant="body1">{selectedSessionDetail.order_id}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Estado</Typography>
                      <Chip 
                        label={selectedSessionDetail.status} 
                        color={selectedSessionDetail.status === 'finished' ? 'success' : 'primary'}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Iniciado</Typography>
                      <Typography variant="body1">
                        {selectedSessionDetail.started_at ? new Date(selectedSessionDetail.started_at).toLocaleString() : '-'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Finalizado</Typography>
                      <Typography variant="body1">
                        {selectedSessionDetail.finished_at ? new Date(selectedSessionDetail.finished_at).toLocaleString() : '-'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Iniciado por</Typography>
                      <Typography variant="body1">
                        {selectedSessionDetail.started_by?.username || 'Desconocido'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total de Eventos</Typography>
                      <Typography variant="body1">{selectedSessionDetail.events_count}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Participants */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <People color="primary" />
                    <Typography variant="h6">
                      Participantes ({selectedSessionDetail.participants.length})
                    </Typography>
                  </Box>
                  <List dense>
                    {selectedSessionDetail.participants.map((participant) => (
                      <ListItem key={participant.id}>
                        <Person sx={{ mr: 1 }} />
                        <ListItemText
                          primary={participant.username}
                          secondary={participant.role}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>

              {/* Photos */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PhotoCamera color="primary" />
                    <Typography variant="h6">
                      Fotos de Evidencia ({selectedSessionDetail.photos.length})
                    </Typography>
                  </Box>
                  {selectedSessionDetail.photos.length > 0 ? (
                    <List dense>
                      {selectedSessionDetail.photos.map((photo, index) => (
                        <ListItem key={photo.id} divider>
                          <ListItemText
                            primary={`Foto ${index + 1}`}
                            secondary={`Subida: ${new Date(photo.created_at).toLocaleString()}`}
                          />
                          <Chip label="Subida" color="success" size="small" />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="warning">No hay fotos de evidencia</Alert>
                  )}
                </CardContent>
              </Card>

              {/* Products */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Productos ({selectedSessionDetail.lines.length})
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Producto</TableCell>
                          <TableCell>EAN</TableCell>
                          <TableCell>Esperado</TableCell>
                          <TableCell>Recogido</TableCell>
                          <TableCell>Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedSessionDetail.lines.map((line) => (
                          <TableRow key={line.id}>
                            <TableCell>{line.product_name}</TableCell>
                            <TableCell>{line.ean}</TableCell>
                            <TableCell>{line.expected_qty}</TableCell>
                            <TableCell>{line.picked_qty}</TableCell>
                            <TableCell>
                              <Chip 
                                label={line.status} 
                                color={line.status === 'completed' ? 'success' : line.status === 'in_progress' ? 'warning' : 'default'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionDetailDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminPanel
