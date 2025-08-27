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
  Print,
} from '@mui/icons-material'
import CameraScanner from './CameraScanner'
import QRLabel from './QRLabel'
import ProductLineItem from './ProductLineItem'

interface Session {
  id: string
  order_id: number
  status: string
  started_at: string
}

interface ProductLine {
  id: string
  product_id: number
  ean: string
  expected_qty: number
  picked_qty: number
  status: string
  product_name: string
  image_url?: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function PickingSession() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [productLines, setProductLines] = useState<ProductLine[]>([])
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
  const [scannerOpen, setScannerOpen] = useState(false)
  const [showQRLabel, setShowQRLabel] = useState(false)
  const [qrLabelData, setQrLabelData] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (sessionId) {
      fetchSession()
      fetchSessionLines()
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
    } catch (err) {
      setError('Error al cargar la sesión')
    } finally {
      setLoading(false)
    }
  }

  const fetchSessionLines = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/sessions/${sessionId}/lines`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProductLines(response.data)
      
      const totalExpected = response.data.reduce((sum: number, line: ProductLine) => sum + line.expected_qty, 0)
      const totalPicked = response.data.reduce((sum: number, line: ProductLine) => sum + line.picked_qty, 0)
      setProgress(totalExpected > 0 ? (totalPicked / totalExpected) * 100 : 0)
    } catch (err) {
      console.error('Error fetching session lines:', err)
    }
  }

  const handleScan = async (ean?: string) => {
    const eanToScan = ean || scanValue.trim()
    if (!eanToScan) return

    setScanning(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API_BASE_URL}/sessions/${sessionId}/scan`, {
        ean: eanToScan,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccess(`Producto escaneado: ${eanToScan}`)
      setScanValue('')
      
      await fetchSessionLines()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al escanear producto')
    } finally {
      setScanning(false)
    }
  }

  const handleCameraScan = (scannedCode: string) => {
    setScannerOpen(false)
    handleScan(scannedCode)
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = localStorage.getItem('token')

      const response = await axios.post(
        `${API_BASE_URL}/sessions/${sessionId}/photo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
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
      const token = localStorage.getItem('token')
      await axios.post(`${API_BASE_URL}/sessions/${sessionId}/finish`, {
        notes: 'Sesión completada desde la app móvil',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      try {
        const qrResponse = await axios.get(`${API_BASE_URL}/api/orders/${session?.order_id}/qr-label`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setQrLabelData(qrResponse.data)
        setShowQRLabel(true)
      } catch (qrError) {
        console.error('Error generating QR label:', qrError)
      }
      
      setSuccess('Sesión finalizada correctamente')
      setFinishDialog(false)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al finalizar sesión')
    } finally {
      setFinishing(false)
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
            Progreso General
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mb: 2, height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress)}% completado ({productLines.filter(line => line.picked_qty >= line.expected_qty).length} de {productLines.length} productos)
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
        Productos a Recoger
      </Typography>
      
      {productLines.map((line) => (
        <ProductLineItem
          key={line.id}
          line={line}
        />
      ))}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Escanear Producto
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="EAN / Código de barras"
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              placeholder="Escanee o ingrese el código EAN"
            />
            <Button
              variant="outlined"
              onClick={() => setScannerOpen(true)}
              disabled={scanning}
              startIcon={<PhotoCamera />}
              sx={{ minWidth: 100 }}
            >
              Cámara
            </Button>
            <Button
              variant="contained"
              onClick={() => handleScan()}
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

      {/* Escáner de cámara */}
      <CameraScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleCameraScan}
        title="Escanear Código de Barras"
      />

      {/* QR Label Dialog */}
      <Dialog open={showQRLabel} onClose={() => setShowQRLabel(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Print sx={{ mr: 1 }} />
          Etiqueta QR Generada
        </DialogTitle>
        <DialogContent>
          {qrLabelData && (
            <QRLabel
              orderId={qrLabelData.order_id.toString()}
              orderNumber={qrLabelData.order_number}
              customerName={qrLabelData.customer_name}
              total={qrLabelData.total}
              woocommerceUrl={qrLabelData.woocommerce_url}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQRLabel(false)}>
            Cerrar
          </Button>
          <Button
            onClick={() => {
              setShowQRLabel(false)
              setTimeout(() => navigate('/orders'), 1000)
            }}
            variant="contained"
            color="primary"
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PickingSession
