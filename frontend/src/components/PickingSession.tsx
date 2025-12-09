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
  item_id: number
  product_id: number
  ean: string
  sku: string
  name: string
  quantity: number
  picked_qty: number
  backorder: number
  picking_status: string
  image?: string
}

function PickingSession() {
  const { sessionId, orderId } = useParams<{ sessionId?: string; orderId?: string }>()
  const [_session, setSession] = useState<Session | null>(null)
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

  // Get store config from localStorage
  const storeUrl = localStorage.getItem('store_url') || ''
  const apiKey = localStorage.getItem('api_key') || ''
  const pickerName = localStorage.getItem('picker_name') || ''
  
  // Use orderId from URL params (from /picking/:orderId route) or sessionId
  const currentOrderId = orderId || sessionId

  useEffect(() => {
    if (currentOrderId) {
      fetchOrderProducts()
    }
  }, [currentOrderId])

  const fetchOrderProducts = async () => {
    try {
      const response = await axios.get(`${storeUrl}/wp-json/picking/v1/get-order-products`, {
        params: {
          token: apiKey,
          order_id: currentOrderId,
          appuser: pickerName
        }
      })
      
      const data = response.data
      
      // Set session info
      setSession({
        id: currentOrderId!,
        order_id: data.order_id,
        status: data.picking_status || 'picking',
        started_at: data.picking_started_at || new Date().toISOString(),
      })
      
      // Transform products to ProductLine format
      const lines: ProductLine[] = (data.products || []).map((p: any) => ({
        item_id: p.item_id || p.product_id,
        product_id: p.product_id,
        ean: p.ean || '',
        sku: p.sku || '',
        name: p.name,
        quantity: p.quantity || 1,
        picked_qty: p.picked_qty || 0,
        backorder: p.backorder || 0,
        picking_status: p.picking_status || 'pending',
        image: p.image,
      }))
      
      setProductLines(lines)
      
      // Calculate progress
      const totalExpected = lines.reduce((sum: number, line: ProductLine) => sum + line.quantity, 0)
      const totalPicked = lines.reduce((sum: number, line: ProductLine) => sum + line.picked_qty, 0)
      setProgress(totalExpected > 0 ? (totalPicked / totalExpected) * 100 : 0)
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Sesión expirada o usuario inactivo. Por favor, inicie sesión de nuevo.')
        // Clear auth and redirect to login
        localStorage.removeItem('user_logged_in')
        localStorage.removeItem('picking_user')
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } else {
        setError('Error al cargar los productos del pedido')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async (ean?: string) => {
    const eanToScan = ean || scanValue.trim()
    if (!eanToScan) return

    setScanning(true)
    setError('')
    setSuccess('')

    try {
      await axios.post(`${storeUrl}/wp-json/picking/v1/scan-product`, {
        order_id: currentOrderId,
        ean: eanToScan,
        appuser: pickerName,
      }, {
        params: { token: apiKey }
      })
      setSuccess(`Producto escaneado: ${eanToScan}`)
      setScanValue('')
      
      await fetchOrderProducts()
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Sesión expirada o usuario inactivo. Por favor, inicie sesión de nuevo.')
        localStorage.removeItem('user_logged_in')
        localStorage.removeItem('picking_user')
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } else {
        setError(err.response?.data?.message || 'Error al escanear producto')
      }
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
      formData.append('order_id', currentOrderId || '')
      formData.append('appuser', pickerName)

      const response = await axios.post(
        `${storeUrl}/wp-json/picking/v1/upload-photo`,
        formData,
        {
          params: { token: apiKey },
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      setPhotos(prev => [...prev, response.data.url || response.data.photo_url || 'uploaded'])
      setSuccess('Foto subida correctamente')
      setPhotoDialog(false)
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Sesión expirada o usuario inactivo. Por favor, inicie sesión de nuevo.')
        localStorage.removeItem('user_logged_in')
        localStorage.removeItem('picking_user')
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } else {
        setError(err.response?.data?.message || 'Error al subir foto')
      }
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
      // Complete the picking session via plugin API
      await axios.post(`${storeUrl}/wp-json/picking/v1/complete-order`, {
        order_id: currentOrderId,
        appuser: pickerName,
        notes: 'Sesión completada desde la app móvil',
      }, {
        params: { token: apiKey }
      })
      
      // Try to get QR label data
      try {
        const qrResponse = await axios.get(`${storeUrl}/wp-json/picking/v1/get-qr-label`, {
          params: {
            token: apiKey,
            order_id: currentOrderId,
          }
        })
        setQrLabelData(qrResponse.data)
        setShowQRLabel(true)
      } catch (qrError) {
        console.error('Error generating QR label:', qrError)
        // Continue even if QR label fails
      }
      
      setSuccess('Sesión finalizada correctamente')
      setFinishDialog(false)
      
      // Navigate back to orders after a delay if no QR label
      if (!showQRLabel) {
        setTimeout(() => navigate('/orders'), 2000)
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Sesión expirada o usuario inactivo. Por favor, inicie sesión de nuevo.')
        localStorage.removeItem('user_logged_in')
        localStorage.removeItem('picking_user')
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } else {
        setError(err.response?.data?.message || 'Error al finalizar sesión')
      }
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
            {Math.round(progress)}% completado ({productLines.filter(line => line.picked_qty >= line.quantity).length} de {productLines.length} productos)
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
        Productos a Recoger
      </Typography>
      
      {productLines.map((line) => (
        <ProductLineItem
          key={line.item_id}
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
