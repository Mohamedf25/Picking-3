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
  Divider,
  InputAdornment,
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
  Search,
  Delete,
  PersonOutline,
  Group,
} from '@mui/icons-material'
import CameraScanner from './CameraScanner'
import QRLabel from './QRLabel'

interface Session {
  id: string
  order_id: number
  status: string
  started_at: string
}

interface ProductLine {
  item_id: number | string
  product_id: number
  ean: string
  ian: string
  cnd: string
  gtin: string
  sku: string
  name: string
  quantity: number
  picked_qty: number
  backorder: number
  picking_status: string
  image?: string
  is_manual?: boolean
  added_by?: string
  added_at?: string
  reason?: string
}

interface SearchProduct {
  product_id: number
  name: string
  sku: string
  ean: string
  price: number
  stock_quantity: number | null
  image: string
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
  
  // New state for manual product addition
  const [addProductDialog, setAddProductDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<SearchProduct | null>(null)
  const [manualQty, setManualQty] = useState(1)
  const [manualReason, setManualReason] = useState('')
  const [addingProduct, setAddingProduct] = useState(false)
  
  // User tracking state
  const [pickingStartedBy, setPickingStartedBy] = useState('')
  const [pickingUsers, setPickingUsers] = useState<string[]>([])
  
  // Quantity modification state
  const [updatingQty, setUpdatingQty] = useState<string | number | null>(null)

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
        is_manual: p.is_manual || false,
        added_by: p.added_by || '',
        added_at: p.added_at || '',
        reason: p.reason || '',
      }))
      
      setProductLines(lines)
      
      // Set user tracking info
      setPickingStartedBy(data.picking_started_by || data.user_claimed || '')
      setPickingUsers(data.picking_users || [])
      
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
      formData.append('photo', file)
      formData.append('order_id', currentOrderId || '')
      formData.append('appuser', pickerName)

      const response = await axios.post(
        `${storeUrl}/wp-json/picking/v1/upload-photo`,
        formData,
        {
          params: { token: apiKey },
          // Let axios set Content-Type automatically for proper multipart boundary
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

  // Search products for manual addition
  const handleSearchProducts = async () => {
    if (searchQuery.length < 2) return
    
    setSearching(true)
    setError('')
    
    try {
      const response = await axios.get(`${storeUrl}/wp-json/picking/v1/search-products`, {
        params: {
          token: apiKey,
          query: searchQuery,
          limit: 10,
        }
      })
      
      setSearchResults(response.data.products || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al buscar productos')
    } finally {
      setSearching(false)
    }
  }

  // Add manual product to picking session
  const handleAddManualProduct = async () => {
    if (!selectedProduct) return
    
    setAddingProduct(true)
    setError('')
    
    try {
      await axios.post(`${storeUrl}/wp-json/picking/v1/add-manual-item`, {
        order_id: currentOrderId,
        product_id: selectedProduct.product_id,
        qty: manualQty,
        appuser: pickerName,
        reason: manualReason,
      }, {
        params: { token: apiKey }
      })
      
      setSuccess(`Producto agregado: ${selectedProduct.name}`)
      setAddProductDialog(false)
      setSelectedProduct(null)
      setSearchQuery('')
      setSearchResults([])
      setManualQty(1)
      setManualReason('')
      
      await fetchOrderProducts()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al agregar producto')
    } finally {
      setAddingProduct(false)
    }
  }

  // Update picked quantity for a line item
  const handleUpdateQuantity = async (itemId: string | number, newQty: number) => {
    if (newQty < 0) return
    
    // Find the product line to check the maximum allowed quantity
    const line = productLines.find(l => l.item_id === itemId)
    if (line && newQty > line.quantity) {
      setError(`No puedes recoger más cantidad de la solicitada. Máximo permitido: ${line.quantity}`)
      return
    }
    
    setUpdatingQty(itemId)
    setError('')
    
    try {
      await axios.post(`${storeUrl}/wp-json/picking/v1/update-line-picking`, {
        order_id: currentOrderId,
        item_id: itemId,
        picked_qty: newQty,
        appuser: pickerName,
      }, {
        params: { token: apiKey }
      })
      
      await fetchOrderProducts()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar cantidad')
    } finally {
      setUpdatingQty(null)
    }
  }

  // Remove/reset a line item
  const handleRemoveItem = async (itemId: string | number, isManual: boolean) => {
    setError('')
    
    try {
      if (isManual) {
        await axios.post(`${storeUrl}/wp-json/picking/v1/remove-manual-item`, {
          order_id: currentOrderId,
          item_id: itemId,
          appuser: pickerName,
          reason: 'Retirado por el picker',
        }, {
          params: { token: apiKey }
        })
        setSuccess('Producto manual retirado')
      } else {
        await handleUpdateQuantity(itemId, 0)
        setSuccess('Cantidad reiniciada a 0')
      }
      
      await fetchOrderProducts()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al retirar producto')
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

      {/* User tracking info */}
      {(pickingStartedBy || pickingUsers.length > 0) && (
        <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
          <CardContent sx={{ py: 1.5 }}>
            {pickingStartedBy && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: pickingUsers.length > 0 ? 1 : 0 }}>
                <PersonOutline sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2">
                  <strong>Iniciado por:</strong> {pickingStartedBy}
                </Typography>
              </Box>
            )}
            {pickingUsers.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Group sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="body2">
                  <strong>Trabajado por:</strong> {pickingUsers.join(', ')}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 2 }}>
        <Typography variant="h6">
          Productos a Recoger
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
        <Card key={line.item_id} sx={{ mb: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                {line.image && (
                  <Box
                    component="img"
                    src={line.image}
                    alt={line.name}
                    sx={{
                      width: 60,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                    }}
                  />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {line.name}
                    {line.is_manual && (
                      <Chip label="Manual" size="small" color="info" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    SKU: {line.sku || '-'}
                  </Typography>
                  {(line.ean || line.ian) && (
                    <Typography variant="body2" color="text.secondary">
                      EAN/IAN: {line.ean || line.ian || '-'}
                    </Typography>
                  )}
                  {line.cnd && (
                    <Typography variant="body2" color="text.secondary">
                      CND: {line.cnd}
                    </Typography>
                  )}
                  {line.is_manual && line.added_by && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Agregado por: {line.added_by}
                    </Typography>
                  )}
                </Box>
              </Box>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleRemoveItem(line.item_id, line.is_manual || false)}
                title={line.is_manual ? "Retirar producto" : "Reiniciar cantidad"}
              >
                <Delete />
              </IconButton>
            </Box>
            
            <Divider sx={{ my: 1.5 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                {line.picked_qty} de {line.quantity} recogidos
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => handleUpdateQuantity(line.item_id, Math.max(0, line.picked_qty - 1))}
                  disabled={updatingQty === line.item_id || line.picked_qty <= 0}
                >
                  <Remove />
                </IconButton>
                <Typography variant="h6" sx={{ minWidth: 30, textAlign: 'center' }}>
                  {updatingQty === line.item_id ? <CircularProgress size={20} /> : line.picked_qty}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleUpdateQuantity(line.item_id, line.picked_qty + 1)}
                  disabled={updatingQty === line.item_id || line.picked_qty >= line.quantity}
                  color={line.picked_qty >= line.quantity ? 'default' : 'primary'}
                  title={line.picked_qty >= line.quantity ? 'Este producto ya ha sido escaneado completamente' : 'Aumentar cantidad'}
                >
                  <Add />
                </IconButton>
              </Box>
            </Box>
            
            {line.picked_qty >= line.quantity && (
              <Chip label="Completado" color="success" size="small" sx={{ mt: 1 }} />
            )}
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

      {/* Manual Product Addition Dialog */}
      <Dialog 
        open={addProductDialog} 
        onClose={() => {
          setAddProductDialog(false)
          setSelectedProduct(null)
          setSearchQuery('')
          setSearchResults([])
          setManualQty(1)
          setManualReason('')
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Agregar Producto Manualmente</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Buscar por SKU, EAN o Nombre"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchProducts()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearchProducts} disabled={searching || searchQuery.length < 2}>
                      {searching ? <CircularProgress size={20} /> : <Search />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            {searchResults.length > 0 && !selectedProduct && (
              <List sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #ddd', borderRadius: 1 }}>
                {searchResults.map((product) => (
                  <ListItem
                    key={product.product_id}
                    component="div"
                    onClick={() => setSelectedProduct(product)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <ListItemText
                      primary={product.name}
                      secondary={`SKU: ${product.sku} ${product.ean ? `| EAN: ${product.ean}` : ''}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            
            {selectedProduct && (
              <Card sx={{ mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {selectedProduct.name}
                  </Typography>
                  <Typography variant="body2">
                    SKU: {selectedProduct.sku} {selectedProduct.ean && `| EAN: ${selectedProduct.ean}`}
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => setSelectedProduct(null)}
                    sx={{ mt: 1, color: 'inherit' }}
                  >
                    Cambiar producto
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {selectedProduct && (
              <>
                <TextField
                  fullWidth
                  type="number"
                  label="Cantidad"
                  value={manualQty}
                  onChange={(e) => setManualQty(Math.max(1, parseInt(e.target.value) || 1))}
                  inputProps={{ min: 1 }}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Motivo (opcional)"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="Ej: Cambio de última hora, producto adicional..."
                  multiline
                  rows={2}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setAddProductDialog(false)
              setSelectedProduct(null)
              setSearchQuery('')
              setSearchResults([])
              setManualQty(1)
              setManualReason('')
            }}
            disabled={addingProduct}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddManualProduct}
            variant="contained"
            disabled={!selectedProduct || addingProduct}
            startIcon={addingProduct ? <CircularProgress size={20} /> : <Add />}
          >
            {addingProduct ? 'Agregando...' : 'Agregar Producto'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PickingSession
