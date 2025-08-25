import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Fab
} from '@mui/material'
import { Add, Edit, LocationOn } from '@mui/icons-material'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

interface Warehouse {
  id: string
  name: string
  code: string
  address?: string
  created_at: string
  updated_at: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function WarehouseManagement() {
  const { user } = useAuth()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [createDialog, setCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    code: '',
    address: ''
  })

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'supervisor') {
      fetchWarehouses()
    }
  }, [user])

  const fetchWarehouses = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axios.get(`${API_BASE_URL}/warehouses`)
      setWarehouses(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar almacenes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWarehouse = async () => {
    if (!newWarehouse.name.trim() || !newWarehouse.code.trim()) {
      setError('Nombre y código son obligatorios')
      return
    }

    setCreating(true)
    setError('')
    setSuccess('')

    try {
      await axios.post(`${API_BASE_URL}/warehouses`, {
        name: newWarehouse.name.trim(),
        code: newWarehouse.code.trim().toUpperCase(),
        address: newWarehouse.address.trim() || undefined
      })

      setSuccess('Almacén creado correctamente')
      setCreateDialog(false)
      setNewWarehouse({ name: '', code: '', address: '' })
      await fetchWarehouses()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear almacén')
    } finally {
      setCreating(false)
    }
  }

  const openCreateDialog = () => {
    setNewWarehouse({ name: '', code: '', address: '' })
    setError('')
    setSuccess('')
    setCreateDialog(true)
  }

  if (user?.role !== 'admin' && user?.role !== 'supervisor') {
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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, position: 'relative' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Almacenes
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {warehouses.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" color="text.secondary" textAlign="center">
              No hay almacenes configurados
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
              Crea el primer almacén para comenzar
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id} sx={{ mb: 2 }}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn color="primary" />
                      <Typography variant="h6">
                        {warehouse.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({warehouse.code})
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      {warehouse.address && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Dirección:</strong> {warehouse.address}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Creado: {new Date(warehouse.created_at).toLocaleString('es-ES')}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="editar">
                    <Edit />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </Card>
          ))}
        </List>
      )}

      {user?.role === 'admin' && (
        <Fab
          color="primary"
          aria-label="agregar almacén"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={openCreateDialog}
        >
          <Add />
        </Fab>
      )}

      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Crear Nuevo Almacén
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre del Almacén"
            fullWidth
            variant="outlined"
            value={newWarehouse.name}
            onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Código del Almacén"
            fullWidth
            variant="outlined"
            value={newWarehouse.code}
            onChange={(e) => setNewWarehouse({ ...newWarehouse, code: e.target.value.toUpperCase() })}
            helperText="Código único para identificar el almacén (ej: MAIN, NORTE, SUR)"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Dirección (opcional)"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={newWarehouse.address}
            onChange={(e) => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)} disabled={creating}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreateWarehouse}
            variant="contained"
            disabled={creating || !newWarehouse.name.trim() || !newWarehouse.code.trim()}
            startIcon={creating ? <CircularProgress size={20} /> : <Add />}
          >
            {creating ? 'Creando...' : 'Crear Almacén'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default WarehouseManagement
