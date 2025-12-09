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
  Collapse,
  Divider,
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
  Add,
  Remove,
  Delete,
  Undo,
  ExpandMore,
  ExpandLess,
  People,
  Image,
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

interface PhotoData {
  id: string
  url: string
  created_at: string
}

interface Participant {
  id: string
  username: string
  role: string
  is_starter: boolean
  first_action: string
  last_action: string
  actions_count: number
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
  const [photos, setPhotos] = useState<PhotoData[]>([])
  const [progress, setProgress] = useState(0)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [showQRLabel, setShowQRLabel] = useState(false)
  const [qrLabelData, setQrLabelData] = useState<any>(null)
  const [addProductDialog, setAddProductDialog] = useState(false)
  const [newProductEan, setNewProductEan] = useState('')
  const [newProductQty, setNewProductQty] = useState(1)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [showParticipants, setShowParticipants] = useState(false)
  const [editingLine, setEditingLine] = useState<ProductLine | null>(null)
  const [editQtyDialog, setEditQtyDialog] = useState(false)
  const [editQtyValue, setEditQtyValue] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (sessionId) {
      fetchSession()
      fetchSessionLines()
      fetchSessionPhotos()
      fetchParticipants()
    }
  }, [sessionId])

    const fetchSession = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${API_BASE_URL}/sessions/${sessionId}/detail`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setSession({
          id: response.data.id,
          order_id: response.data.order_id,
          status: response.data.status,
          started_at: response.data.started_at,
        })
      } catch (err) {
        setSession({
          id: sessionId!,
          order_id: 0,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
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

    const fetchSessionPhotos = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${API_BASE_URL}/sessions/${sessionId}/photos`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setPhotos(response.data)
      } catch (err) {
        console.error('Error fetching session photos:', err)
      }
    }

    const fetchParticipants = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${API_BASE_URL}/sessions/${sessionId}/participants`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setParticipants(response.data)
      } catch (err) {
        console.error('Error fetching participants:', err)
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

        setPhotos(prev => [...prev, { id: response.data.id, url: response.data.url, created_at: response.data.created_at }])
        setSuccess('Foto subida correctamente')
        setPhotoDialog(false)
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error al subir foto')
      } finally {
        setUploading(false)
      }
    }

    const handleAddProduct = async () => {
      if (!newProductEan.trim()) {
        setError('Debe ingresar un EAN/SKU')
        return
      }

      try {
        const token = localStorage.getItem('token')
        await axios.post(`${API_BASE_URL}/sessions/${sessionId}/lines`, {
          ean: newProductEan.trim(),
          expected_qty: newProductQty
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setSuccess('Producto agregado correctamente')
        setAddProductDialog(false)
        setNewProductEan('')
        setNewProductQty(1)
        await fetchSessionLines()
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error al agregar producto')
      }
    }

    const handleEditQuantity = async () => {
      if (!editingLine) return

      try {
        const token = localStorage.getItem('token')
        await axios.put(`${API_BASE_URL}/sessions/${sessionId}/lines/${editingLine.id}`, {
          expected_qty: editQtyValue
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setSuccess('Cantidad actualizada correctamente')
        setEditQtyDialog(false)
        setEditingLine(null)
        await fetchSessionLines()
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error al actualizar cantidad')
      }
    }

    const handleRemoveLine = async (lineId: string) => {
      if (!confirm('¿Está seguro de que desea eliminar este producto?')) return

      try {
        const token = localStorage.getItem('token')
        await axios.delete(`${API_BASE_URL}/sessions/${sessionId}/lines/${lineId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setSuccess('Producto eliminado correctamente')
        await fetchSessionLines()
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error al eliminar producto')
      }
    }

    const handleUndoScan = async (lineId: string, ean: string) => {
      try {
        const token = localStorage.getItem('token')
        await axios.post(`${API_BASE_URL}/sessions/${sessionId}/undo-scan`, {
          line_id: lineId,
          ean: ean
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setSuccess('Escaneo deshecho correctamente')
        await fetchSessionLines()
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error al deshacer escaneo')
      }
    }

    const openEditQtyDialog = (line: ProductLine) => {
      setEditingLine(line)
      setEditQtyValue(line.expected_qty)
      setEditQtyDialog(true)
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

            {/* Participants Section */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box 
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setShowParticipants(!showParticipants)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <People color="primary" />
                    <Typography variant="h6">
                      Participantes ({participants.length})
                    </Typography>
                  </Box>
                  {showParticipants ? <ExpandLess /> : <ExpandMore />}
                </Box>
                <Collapse in={showParticipants}>
                  <List dense sx={{ mt: 1 }}>
                    {participants.map((participant) => (
                      <ListItem key={participant.id}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {participant.username}
                              {participant.is_starter && (
                                <Chip label="Inició" size="small" color="primary" />
                              )}
                              <Chip label={participant.role} size="small" variant="outlined" />
                            </Box>
                          }
                          secondary={`${participant.actions_count} acciones - Última: ${participant.last_action ? new Date(participant.last_action).toLocaleString() : 'N/A'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 2 }}>
              <Typography variant="h6">
                Productos a Recoger ({productLines.length})
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setAddProductDialog(true)}
                size="small"
              >
                Agregar Producto
              </Button>
            </Box>
      
            {productLines.map((line) => (
              <Card key={line.id} sx={{ mb: 2, border: line.picked_qty >= line.expected_qty ? '2px solid #4caf50' : '1px solid #e0e0e0' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {line.product_name || `Producto ${line.product_id}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        EAN: {line.ean}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="body2">
                          Recogido: {line.picked_qty} / {line.expected_qty}
                        </Typography>
                        {line.picked_qty >= line.expected_qty ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : null}
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(line.picked_qty / line.expected_qty) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: line.picked_qty >= line.expected_qty ? '#4caf50' : '#2196f3'
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => openEditQtyDialog(line)}
                        title="Editar cantidad"
                      >
                        <Add fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleUndoScan(line.id, line.ean)}
                        disabled={line.picked_qty <= 0}
                        title="Deshacer escaneo"
                      >
                        <Undo fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleRemoveLine(line.id)}
                        title="Eliminar producto"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Image color="primary" />
                    <Typography variant="h6">
                      Fotos de Evidencia ({photos.length})
                    </Typography>
                  </Box>
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
                    {photos.map((photo, index) => (
                      <ListItem key={photo.id || index} divider>
                        <ListItemText
                          primary={`Foto ${index + 1}`}
                          secondary={photo.created_at ? `Subida: ${new Date(photo.created_at).toLocaleString()}` : 'Subida correctamente'}
                        />
                        <Chip label="Subida" color="success" size="small" />
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

        {/* Add Product Dialog */}
        <Dialog open={addProductDialog} onClose={() => setAddProductDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Agregar Producto Manualmente</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="EAN / SKU"
                value={newProductEan}
                onChange={(e) => setNewProductEan(e.target.value)}
                fullWidth
                placeholder="Ingrese el código EAN o SKU del producto"
              />
              <TextField
                label="Cantidad"
                type="number"
                value={newProductQty}
                onChange={(e) => setNewProductQty(Math.max(1, parseInt(e.target.value) || 1))}
                fullWidth
                inputProps={{ min: 1 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddProductDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddProduct}
              variant="contained"
              startIcon={<Add />}
            >
              Agregar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Quantity Dialog */}
        <Dialog open={editQtyDialog} onClose={() => setEditQtyDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Editar Cantidad</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              {editingLine && (
                <Typography variant="body2" color="text.secondary">
                  Producto: {editingLine.product_name || editingLine.ean}
                </Typography>
              )}
              <TextField
                label="Cantidad Esperada"
                type="number"
                value={editQtyValue}
                onChange={(e) => setEditQtyValue(Math.max(1, parseInt(e.target.value) || 1))}
                fullWidth
                inputProps={{ min: 1 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditQtyDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEditQuantity}
              variant="contained"
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
}

export default PickingSession
