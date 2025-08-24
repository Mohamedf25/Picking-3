import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  QrCodeScanner,
  PhotoCamera,
  CheckCircle,
  ArrowBack,
  Upload,
} from '@mui/icons-material'

interface Session {
  id: string
  order_id: number
  status: string
  started_at: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function PickingSession() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [, setSession] = useState<Session | null>(null)
  const [scanValue, setScanValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [photoDialog, setPhotoDialog] = useState(false)
  const [finishDialog, setFinishDialog] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (sessionId) {
      fetchSession()
    }
  }, [sessionId])

  const fetchSession = async () => {
    try {
      setSession({
        id: sessionId!,
        order_id: 123,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      setProgress(Math.random() * 100)
    } catch (err) {
      setError('Error al cargar la sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async () => {
    if (!scanValue.trim()) return

    setScanning(true)
    setError('')
    setSuccess('')

    try {
      await axios.post(`${API_BASE_URL}/sessions/${sessionId}/scan`, {
        sku: scanValue.trim(),
      })
      setSuccess(`Producto escaneado: ${scanValue}`)
      setScanValue('')
      setProgress(prev => Math.min(prev + 10, 100))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al escanear producto')
    } finally {
      setScanning(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(
        `${API_BASE_URL}/sessions/${sessionId}/photo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      setPhotos(prev => [...prev, response.data.url])
      setSuccess('Foto subida correctamente')
      setPhotoDialog(false)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al subir foto')
    } finally {
      setUploading(false)
    }
  }

  const handleFinishSession = async () => {
    if (photos.length === 0) {
      setError('Debe subir al menos una foto antes de finalizar')
      return
    }

    setFinishing(true)
    setError('')

    try {
      await axios.post(`${API_BASE_URL}/sessions/${sessionId}/finish`, {
        notes: 'Sesión completada desde la app móvil',
      })
      setSuccess('Sesión finalizada correctamente')
      setTimeout(() => navigate('/orders'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al finalizar sesión')
    } finally {
      setFinishing(false)
      setFinishDialog(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
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
          Sesión de Picking
        </Typography>
      </Box>

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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Progreso
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mb: 2, height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress)}% completado
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Escanear Producto
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="SKU / Código de barras"
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              placeholder="Escanee o ingrese el código"
            />
            <Button
              variant="contained"
              onClick={handleScan}
              disabled={scanning || !scanValue.trim()}
              startIcon={scanning ? <CircularProgress size={20} /> : <QrCodeScanner />}
              sx={{ minWidth: 120 }}
            >
              {scanning ? 'Escaneando...' : 'Escanear'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Fotos ({photos.length})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => setPhotoDialog(true)}
            >
              Agregar Foto
            </Button>
          </Box>
          
          {photos.length > 0 ? (
            <List>
              {photos.map((_, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`Foto ${index + 1}`}
                    secondary="Subida correctamente"
                  />
                  <Chip label="✓" color="success" size="small" />
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="warning">
              Debe subir al menos una foto para completar el pedido
            </Alert>
          )}
        </CardContent>
      </Card>

      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={<CheckCircle />}
        onClick={() => setFinishDialog(true)}
        disabled={photos.length === 0}
        sx={{ py: 2 }}
      >
        Finalizar Pedido
      </Button>

      <Dialog open={photoDialog} onClose={() => setPhotoDialog(false)}>
        <DialogTitle>Subir Foto</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="photo-upload"
              type="file"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
            <label htmlFor="photo-upload">
              <IconButton
                color="primary"
                aria-label="upload picture"
                component="span"
                disabled={uploading}
                sx={{ fontSize: 64 }}
              >
                {uploading ? <CircularProgress /> : <Upload sx={{ fontSize: 64 }} />}
              </IconButton>
            </label>
            <Typography variant="body2" sx={{ mt: 2 }}>
              {uploading ? 'Subiendo foto...' : 'Toque para seleccionar una foto'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoDialog(false)} disabled={uploading}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={finishDialog} onClose={() => setFinishDialog(false)}>
        <DialogTitle>Finalizar Sesión</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea finalizar esta sesión de picking?
            Esta acción marcará el pedido como completado en WooCommerce.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinishDialog(false)} disabled={finishing}>
            Cancelar
          </Button>
          <Button
            onClick={handleFinishSession}
            variant="contained"
            disabled={finishing}
            startIcon={finishing ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {finishing ? 'Finalizando...' : 'Finalizar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PickingSession
