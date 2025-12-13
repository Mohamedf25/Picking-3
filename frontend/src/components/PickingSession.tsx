import React, { useState, useEffect, useRef } from 'react'
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
  Print,
  Add,
  Remove,
  Search,
  Delete,
  PersonOutline,
  Group,
  Videocam,
  PlayArrow,
  Close,
  Inventory,
} from '@mui/icons-material'
import CameraScanner from './CameraScanner'
import QRLabel from './QRLabel'
import { useAlert } from '../contexts/AlertContext'

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
  stock_quantity?: number | null
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

interface EvidenceItem {
  url: string
  type: 'photo' | 'video'
  uploaded_by?: string
  uploaded_at?: string
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
  const [videoDialog, setVideoDialog] = useState(false)
  const [finishDialog, setFinishDialog] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [evidence, setEvidence] = useState<EvidenceItem[]>([])
  const [progress, setProgress] = useState(0)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [showQRLabel, setShowQRLabel] = useState(false)
  const [qrLabelData, setQrLabelData] = useState<any>(null)
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false)
  const [currentVideoUrl, setCurrentVideoUrl] = useState('')
  const [isRecordingVideo, setIsRecordingVideo] = useState(false)
  const [isTakingPhoto, setIsTakingPhoto] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const photoVideoRef = useRef<HTMLVideoElement>(null)
  const photoStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const navigate = useNavigate()
  const { showError, showWarning, showSuccess } = useAlert()
  
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
  const [_pickingHistory, setPickingHistory] = useState<any[]>([])
  
  // Quantity modification state
  const [updatingQty, setUpdatingQty] = useState<string | number | null>(null)
  
  // Exit picking modal state
  const [exitDialog, setExitDialog] = useState(false)
  const exitReasons = [
    { id: 'falta_mercancia', label: 'Falta de mercancía' },
    { id: 'pedido_incompleto', label: 'Pedido incompleto' },
    { id: 'cliente_no_confirma', label: 'Cliente no confirma' },
    { id: 'error_sku', label: 'Error en el SKU' },
    { id: 'otro', label: 'Otro' },
  ]
  const [selectedExitReason, setSelectedExitReason] = useState('')
  const [customExitReason, setCustomExitReason] = useState('')
  const [exiting, setExiting] = useState(false)

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
        ian: p.ian || '',
        cnd: p.cnd || '',
        gtin: p.gtin || '',
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
        stock_quantity: p.stock_quantity,
      }))
      
      setProductLines(lines)
      
      // Check for inventory issues and show warnings
      const zeroStockProducts = lines.filter((l: ProductLine) => l.stock_quantity === 0)
      const insufficientStockProducts = lines.filter((l: ProductLine) => 
        l.stock_quantity !== null && l.stock_quantity !== undefined && l.stock_quantity > 0 && l.stock_quantity < l.quantity
      )
      
      if (zeroStockProducts.length > 0) {
        const productNames = zeroStockProducts.map((p: ProductLine) => p.name).join(', ')
        showError('Sin Stock', `Los siguientes productos no tienen inventario disponible: ${productNames}`)
      } else if (insufficientStockProducts.length > 0) {
        const productNames = insufficientStockProducts.map((p: ProductLine) => p.name).join(', ')
        showWarning('Inventario Insuficiente', `Los siguientes productos tienen menos unidades disponibles que las solicitadas: ${productNames}`)
      }
      
      // Set user tracking info
      setPickingStartedBy(data.picking_started_by || data.user_claimed || '')
      setPickingUsers(data.picking_users || [])
      setPickingHistory(data.picking_history || [])
      
      // Calculate progress
      const totalExpected = lines.reduce((sum: number, line: ProductLine) => sum + line.quantity, 0)
      const totalPicked = lines.reduce((sum: number, line: ProductLine) => sum + line.picked_qty, 0)
      setProgress(totalExpected > 0 ? (totalPicked / totalExpected) * 100 : 0)
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        showError('Sin Autorizacion', 'Sesion expirada o usuario inactivo. Por favor, inicie sesion de nuevo.', () => {
          localStorage.removeItem('user_logged_in')
          localStorage.removeItem('picking_user')
          window.location.href = '/'
        })
      } else {
        showError('Error', 'Error al cargar los productos del pedido')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async (ean?: string) => {
    const eanToScan = ean || scanValue.trim()
    if (!eanToScan) return

    const eanLower = eanToScan.toLowerCase()
    
    // Find matching product for optimistic update
    const matchingLine = productLines.find(line => 
      line.ean?.toLowerCase() === eanLower ||
      line.ian?.toLowerCase() === eanLower ||
      line.gtin?.toLowerCase() === eanLower ||
      line.cnd?.toLowerCase() === eanLower ||
      line.sku?.toLowerCase() === eanLower
    )

    // Check if product is already fully picked
    if (matchingLine && matchingLine.picked_qty >= matchingLine.quantity) {
      showWarning('Producto Completado', 'Este producto ya ha sido escaneado completamente.')
      setScanValue('')
      return
    }

    // Store previous state for potential rollback
    const previousLines = [...productLines]
    const previousProgress = progress

    // Optimistic UI update - update immediately without waiting for API
    if (matchingLine) {
      const updatedLines = productLines.map(line => {
        if (line.item_id === matchingLine.item_id) {
          return {
            ...line,
            picked_qty: Math.min(line.picked_qty + 1, line.quantity)
          }
        }
        return line
      })
      setProductLines(updatedLines)
      
      // Update progress optimistically
      const totalExpected = updatedLines.reduce((sum, line) => sum + line.quantity, 0)
      const totalPicked = updatedLines.reduce((sum, line) => sum + line.picked_qty, 0)
      setProgress(totalExpected > 0 ? (totalPicked / totalExpected) * 100 : 0)
      
      // Show success immediately
      showSuccess('Producto Escaneado', `Codigo: ${eanToScan}`)
      setScanValue('')
    }

    // Set scanning state briefly for visual feedback
    setScanning(true)
    setError('')
    setSuccess('')

    // Make API call in background (async)
    try {
      await axios.post(`${storeUrl}/wp-json/picking/v1/scan-product`, {
        order_id: currentOrderId,
        ean: eanToScan,
        appuser: pickerName,
      }, {
        params: { token: apiKey }
      })
      
      // If no matching line was found locally but API succeeded, refresh to get updated data
      if (!matchingLine) {
        showSuccess('Producto Escaneado', `Codigo: ${eanToScan}`)
        setScanValue('')
        await fetchOrderProducts()
      }
      // If optimistic update was applied, no need to fetch again - API confirmed success
    } catch (err: any) {
      // Rollback optimistic update on error
      if (matchingLine) {
        setProductLines(previousLines)
        setProgress(previousProgress)
      }
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        showError('Sin Autorizacion', 'Sesion expirada o usuario inactivo. Por favor, inicie sesion de nuevo.', () => {
          localStorage.removeItem('user_logged_in')
          localStorage.removeItem('picking_user')
          window.location.href = '/'
        })
      } else if (err.response?.status === 404) {
        showError('Producto No Encontrado', 'El codigo escaneado no corresponde a ningun producto de este pedido.')
      } else if (err.response?.status === 400 && err.response?.data?.code === 'already_picked') {
        showWarning('Producto Completado', 'Este producto ya ha sido escaneado completamente.')
      } else {
        showError('Error de Escaneo', err.response?.data?.message || 'Error al escanear producto')
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
        showError('Sin Autorizacion', 'Sesion expirada o usuario inactivo. Por favor, inicie sesion de nuevo.', () => {
          localStorage.removeItem('user_logged_in')
          localStorage.removeItem('picking_user')
          window.location.href = '/'
        })
      } else {
        showError('Error de Subida', err.response?.data?.message || 'Error al subir el archivo')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleFinishSession = async () => {
    if (photos.length === 0 && evidence.length === 0) {
      showWarning('Evidencia Requerida', 'Debe subir al menos una foto o video antes de finalizar el pedido.')
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
        showError('Sin Autorizacion', 'Sesion expirada o usuario inactivo. Por favor, inicie sesion de nuevo.', () => {
          localStorage.removeItem('user_logged_in')
          localStorage.removeItem('picking_user')
          window.location.href = '/'
        })
      } else {
        showError('Error', err.response?.data?.message || 'Error al finalizar sesion')
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
      showError('Error de Busqueda', err.response?.data?.message || 'Error al buscar productos')
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
      
      showSuccess('Producto Agregado', `${selectedProduct.name} ha sido agregado al pedido.`)
      setAddProductDialog(false)
      setSelectedProduct(null)
      setSearchQuery('')
      setSearchResults([])
      setManualQty(1)
      setManualReason('')
      
      await fetchOrderProducts()
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Error al agregar producto')
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
      showError('Cantidad Excedida', `No puedes recoger mas cantidad de la solicitada. Maximo permitido: ${line.quantity}`)
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
      showError('Error', err.response?.data?.message || 'Error al actualizar cantidad')
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
        showSuccess('Producto Retirado', 'El producto manual ha sido retirado del pedido.')
      } else {
        await handleUpdateQuantity(itemId, 0)
        showSuccess('Cantidad Reiniciada', 'La cantidad ha sido reiniciada a 0.')
      }
      
      await fetchOrderProducts()
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Error al retirar producto')
    }
  }

  // Video recording functions
  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: true 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        stream.getTracks().forEach(track => track.stop())
        await uploadVideo(blob)
      }
      
      mediaRecorder.start()
      setIsRecordingVideo(true)
    } catch (err) {
      showError('Error de Camara', 'No se pudo acceder a la camara. Verifica los permisos.')
    }
  }

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecordingVideo) {
      mediaRecorderRef.current.stop()
      setIsRecordingVideo(false)
    }
  }

  const uploadVideo = async (blob: Blob) => {
    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('photo', blob, `video_${Date.now()}.webm`)
      formData.append('order_id', currentOrderId || '')
      formData.append('appuser', pickerName)
      formData.append('evidence_type', 'video')

      const response = await axios.post(
        `${storeUrl}/wp-json/picking/v1/upload-photo`,
        formData,
        {
          params: { token: apiKey },
        }
      )

      const newEvidence: EvidenceItem = {
        url: response.data.url || response.data.photo_url || 'uploaded',
        type: 'video',
        uploaded_by: pickerName,
        uploaded_at: new Date().toISOString(),
      }
      setEvidence(prev => [...prev, newEvidence])
      setPhotos(prev => [...prev, newEvidence.url])
      showSuccess('Video Subido', 'El video ha sido subido correctamente.')
      setVideoDialog(false)
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        showError('Sin Autorizacion', 'Sesion expirada o usuario inactivo. Por favor, inicie sesion de nuevo.', () => {
          localStorage.removeItem('user_logged_in')
          localStorage.removeItem('picking_user')
          window.location.href = '/'
        })
      } else {
        showError('Error de Subida', err.response?.data?.message || 'Error al subir el video')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate video file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov']
    if (!validTypes.includes(file.type)) {
      showError('Formato No Valido', 'Solo se permiten videos en formato MP4, MOV o WEBM.')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('order_id', currentOrderId || '')
      formData.append('appuser', pickerName)
      formData.append('evidence_type', 'video')

      const response = await axios.post(
        `${storeUrl}/wp-json/picking/v1/upload-photo`,
        formData,
        {
          params: { token: apiKey },
        }
      )

      const newEvidence: EvidenceItem = {
        url: response.data.url || response.data.photo_url || 'uploaded',
        type: 'video',
        uploaded_by: pickerName,
        uploaded_at: new Date().toISOString(),
      }
      setEvidence(prev => [...prev, newEvidence])
      setPhotos(prev => [...prev, newEvidence.url])
      showSuccess('Video Subido', 'El video ha sido subido correctamente.')
      setVideoDialog(false)
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        showError('Sin Autorizacion', 'Sesion expirada o usuario inactivo. Por favor, inicie sesion de nuevo.', () => {
          localStorage.removeItem('user_logged_in')
          localStorage.removeItem('picking_user')
          window.location.href = '/'
        })
      } else {
        showError('Error de Subida', err.response?.data?.message || 'Error al subir el video')
      }
    } finally {
      setUploading(false)
    }
  }

  const openVideoPlayer = (url: string) => {
    setCurrentVideoUrl(url)
    setVideoPlayerOpen(true)
  }

  // Camera photo functions
  const startPhotoCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      })
      
      photoStreamRef.current = stream
      
      if (photoVideoRef.current) {
        photoVideoRef.current.srcObject = stream
        photoVideoRef.current.play()
      }
      
      setIsTakingPhoto(true)
    } catch (err) {
      showError('Error de Camara', 'No se pudo acceder a la camara. Por favor, verifique los permisos.')
    }
  }

  const capturePhoto = async () => {
    if (!photoVideoRef.current || !photoStreamRef.current) return
    
    setUploading(true)
    
    try {
      // Create canvas to capture the photo
      const video = photoVideoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create blob'))
          }, 'image/jpeg', 0.9)
        })
        
        // Create file from blob
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
        
        // Upload the photo
        const formData = new FormData()
        formData.append('photo', file)
        formData.append('order_id', currentOrderId || '')
        formData.append('appuser', pickerName)

        const response = await axios.post(
          `${storeUrl}/wp-json/picking/v1/upload-photo`,
          formData,
          {
            params: { token: apiKey },
          }
        )

        setPhotos(prev => [...prev, response.data.url || response.data.photo_url || 'uploaded'])
        showSuccess('Foto Capturada', 'La foto ha sido subida correctamente.')
        stopPhotoCamera()
        setPhotoDialog(false)
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        showError('Sin Autorizacion', 'Sesion expirada o usuario inactivo. Por favor, inicie sesion de nuevo.', () => {
          localStorage.removeItem('user_logged_in')
          localStorage.removeItem('picking_user')
          window.location.href = '/'
        })
      } else {
        showError('Error de Subida', err.response?.data?.message || 'Error al subir la foto')
      }
    } finally {
      setUploading(false)
    }
  }

  const stopPhotoCamera = () => {
    if (photoStreamRef.current) {
      photoStreamRef.current.getTracks().forEach(track => track.stop())
      photoStreamRef.current = null
    }
    setIsTakingPhoto(false)
  }

  const handleExitPicking = async () => {
    if (!selectedExitReason) {
      showError('Motivo Requerido', 'Por favor seleccione un motivo para salir del picking.')
      return
    }

    setExiting(true)
    setError('')

    try {
      await axios.post(`${storeUrl}/wp-json/picking/v1/exit-picking`, {
        order_id: currentOrderId,
        appuser: pickerName,
        reason_id: selectedExitReason,
        reason_text: selectedExitReason === 'otro' ? customExitReason : '',
      }, {
        params: { token: apiKey }
      })

      showSuccess('Sesion Finalizada', 'El pedido queda disponible para otros usuarios.')
      setExitDialog(false)
      setSelectedExitReason('')
      setCustomExitReason('')
      navigate('/orders')
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        showError('Sin Autorizacion', 'Sesion expirada o usuario inactivo. Por favor, inicie sesion de nuevo.', () => {
          localStorage.removeItem('user_logged_in')
          localStorage.removeItem('picking_user')
          window.location.href = '/'
        })
      } else {
        showError('Error', err.response?.data?.message || 'Error al salir del picking')
      }
    } finally {
      setExiting(false)
    }
  }

  const handleBackClick = () => {
    setExitDialog(true)
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
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackClick}
          sx={{ 
            mr: { xs: 0, sm: 2 },
            alignSelf: { xs: 'flex-start', sm: 'center' }
          }}
        >
          Salir
        </Button>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
            textAlign: { xs: 'center', sm: 'left' },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          Sesión de Picking
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            fontSize: { xs: '1rem', sm: '0.875rem' },
            py: { xs: 1.5, sm: 1 },
            '& .MuiAlert-message': {
              width: '100%',
              textAlign: { xs: 'center', sm: 'left' }
            }
          }}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 2,
            fontSize: { xs: '1rem', sm: '0.875rem' },
            py: { xs: 1.5, sm: 1 },
            '& .MuiAlert-message': {
              width: '100%',
              textAlign: { xs: 'center', sm: 'left' }
            }
          }}
        >
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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            Escanear Producto
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1.5, sm: 1 }, 
            mb: 2 
          }}>
            <TextField
              fullWidth
              label="EAN / Código de barras"
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              placeholder="Escanee o ingrese el código EAN, CND o SKU"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '1rem', sm: '0.9rem' },
                  minHeight: { xs: 56, sm: 40 }
                }
              }}
            />
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              flexDirection: { xs: 'row', sm: 'row' },
              width: { xs: '100%', sm: 'auto' }
            }}>
              <Button
                variant="outlined"
                onClick={() => setScannerOpen(true)}
                disabled={scanning}
                startIcon={<PhotoCamera />}
                sx={{ 
                  minWidth: { xs: 'auto', sm: 100 },
                  flex: { xs: 1, sm: 'none' },
                  py: { xs: 1.5, sm: 1 },
                  fontSize: { xs: '0.9rem', sm: '0.875rem' }
                }}
              >
                Cámara
              </Button>
              <Button
                variant="contained"
                onClick={() => handleScan()}
                disabled={scanning || !scanValue.trim()}
                startIcon={scanning ? <CircularProgress size={20} /> : <QrCodeScanner />}
                sx={{ 
                  minWidth: { xs: 'auto', sm: 120 },
                  flex: { xs: 1, sm: 'none' },
                  py: { xs: 1.5, sm: 1 },
                  fontSize: { xs: '0.9rem', sm: '0.875rem' }
                }}
              >
                {scanning ? 'Escaneando...' : 'Escanear'}
              </Button>
            </Box>
          </Box>
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
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                    {line.name}
                    {line.is_manual && (
                      <Chip label="Manual" size="small" color="info" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                    SKU: {line.sku || '-'}
                  </Typography>
                  {(line.ean || line.ian || line.gtin) && (
                    <Box sx={{ 
                      mt: 0.5, 
                      p: 0.75, 
                      bgcolor: 'primary.50', 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'primary.200'
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'primary.main', fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                        EAN: {line.ean || line.ian || line.gtin || '-'}
                      </Typography>
                    </Box>
                  )}
                  {line.cnd && (
                    <Box sx={{ 
                      mt: 0.5, 
                      p: 0.75, 
                      bgcolor: 'secondary.50', 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'secondary.200'
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'secondary.main', fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                        CND: {line.cnd}
                      </Typography>
                    </Box>
                  )}
                  {line.is_manual && line.added_by && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Agregado por: {line.added_by}
                    </Typography>
                  )}
                  {/* Inventory Display */}
                  <Box sx={{ 
                    mt: 1, 
                    p: 0.75, 
                    bgcolor: line.stock_quantity === 0 ? 'error.50' : (line.stock_quantity != null && line.stock_quantity < line.quantity) ? 'warning.50' : 'success.50',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: line.stock_quantity === 0 ? 'error.200' : (line.stock_quantity != null && line.stock_quantity < line.quantity) ? 'warning.200' : 'success.200',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    <Inventory sx={{ 
                      fontSize: 16, 
                      color: line.stock_quantity === 0 ? 'error.main' : (line.stock_quantity != null && line.stock_quantity < line.quantity) ? 'warning.main' : 'success.main' 
                    }} />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'medium', 
                        color: line.stock_quantity === 0 ? 'error.main' : (line.stock_quantity != null && line.stock_quantity < line.quantity) ? 'warning.main' : 'success.main',
                        fontSize: { xs: '0.8rem', sm: '0.85rem' } 
                      }}
                    >
                      Inventario: {line.stock_quantity != null ? `${line.stock_quantity} unidades` : 'No disponible'}
                    </Typography>
                  </Box>
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
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 0 }
            }}>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.95rem', sm: '0.875rem' } }}>
                {line.picked_qty} de {line.quantity} recogidos
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 2, sm: 1 },
                bgcolor: { xs: 'grey.100', sm: 'transparent' },
                borderRadius: 2,
                p: { xs: 1, sm: 0 }
              }}>
                <IconButton
                  onClick={() => handleUpdateQuantity(line.item_id, Math.max(0, line.picked_qty - 1))}
                  disabled={updatingQty === line.item_id || line.picked_qty <= 0}
                  sx={{ 
                    width: { xs: 48, sm: 32 },
                    height: { xs: 48, sm: 32 },
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'grey.200' }
                  }}
                >
                  <Remove />
                </IconButton>
                <Typography variant="h6" sx={{ 
                  minWidth: { xs: 50, sm: 30 }, 
                  textAlign: 'center',
                  fontSize: { xs: '1.5rem', sm: '1.25rem' }
                }}>
                  {updatingQty === line.item_id ? <CircularProgress size={24} /> : line.picked_qty}
                </Typography>
                <IconButton
                  onClick={() => handleUpdateQuantity(line.item_id, line.picked_qty + 1)}
                  disabled={updatingQty === line.item_id || line.picked_qty >= line.quantity}
                  color={line.picked_qty >= line.quantity ? 'default' : 'primary'}
                  title={line.picked_qty >= line.quantity ? 'Este producto ya ha sido escaneado completamente' : 'Aumentar cantidad'}
                  sx={{ 
                    width: { xs: 48, sm: 32 },
                    height: { xs: 48, sm: 32 },
                    bgcolor: line.picked_qty >= line.quantity ? 'grey.200' : 'primary.main',
                    color: line.picked_qty >= line.quantity ? 'text.disabled' : 'white',
                    '&:hover': { 
                      bgcolor: line.picked_qty >= line.quantity ? 'grey.300' : 'primary.dark' 
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'grey.200',
                      color: 'text.disabled'
                    }
                  }}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6">
              Evidencia ({photos.length + evidence.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<PhotoCamera />}
                onClick={() => setPhotoDialog(true)}
                size="small"
              >
                Foto
              </Button>
              <Button
                variant="outlined"
                startIcon={<Videocam />}
                onClick={() => setVideoDialog(true)}
                size="small"
                color="secondary"
              >
                Video
              </Button>
            </Box>
          </Box>
          
          {(photos.length > 0 || evidence.length > 0) ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {photos.map((url, index) => {
                const isVideo = url.includes('.webm') || url.includes('.mp4') || url.includes('.mov') || evidence.find(e => e.url === url)?.type === 'video'
                return (
                  <Box
                    key={index}
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '2px solid',
                      borderColor: isVideo ? 'secondary.main' : 'primary.main',
                      position: 'relative',
                      cursor: isVideo ? 'pointer' : 'default',
                      bgcolor: 'grey.200',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => isVideo && openVideoPlayer(url)}
                  >
                    {isVideo ? (
                      <>
                        <Videocam sx={{ fontSize: 32, color: 'secondary.main' }} />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            fontSize: '0.65rem',
                            textAlign: 'center',
                            py: 0.25,
                          }}
                        >
                          <PlayArrow sx={{ fontSize: 12 }} /> Video
                        </Box>
                      </>
                    ) : (
                      <>
                        <Box
                          component="img"
                          src={url}
                          alt={`Evidencia ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e: any) => {
                            e.target.style.display = 'none'
                          }}
                        />
                        <PhotoCamera sx={{ fontSize: 32, color: 'primary.main', position: 'absolute' }} />
                      </>
                    )}
                    <Chip
                      label={index + 1}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        minWidth: 20,
                        height: 20,
                        fontSize: '0.7rem',
                      }}
                      color={isVideo ? 'secondary' : 'primary'}
                    />
                  </Box>
                )
              })}
            </Box>
          ) : (
            <Alert severity="warning">
              Debe subir al menos una foto o video para completar el pedido
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

      {/* Photo Dialog - Camera and Gallery options */}
      <Dialog open={photoDialog} onClose={() => !isTakingPhoto && !uploading && setPhotoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Subir Foto</DialogTitle>
        <DialogContent>
          {isTakingPhoto ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{ position: 'relative', width: '100%', maxWidth: 400, mx: 'auto', mb: 2 }}>
                <video
                  ref={photoVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', borderRadius: 8, backgroundColor: '#000' }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={capturePhoto}
                  startIcon={uploading ? <CircularProgress size={20} /> : <PhotoCamera />}
                  size="large"
                  disabled={uploading}
                >
                  {uploading ? 'Subiendo...' : 'Capturar Foto'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={stopPhotoCamera}
                  startIcon={<Close />}
                  size="large"
                  disabled={uploading}
                >
                  Cancelar
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ py: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                Seleccione como desea agregar la foto
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                {/* Take photo with camera */}
                <Box sx={{ textAlign: 'center', p: 2, border: '1px dashed', borderColor: 'primary.main', borderRadius: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={startPhotoCamera}
                    disabled={uploading}
                    startIcon={<PhotoCamera />}
                    fullWidth
                  >
                    Tomar Foto con Camara
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Abre la camara para tomar una foto
                  </Typography>
                </Box>

                {/* Upload photo from gallery */}
                <Box sx={{ textAlign: 'center', p: 2, border: '1px dashed', borderColor: 'grey.400', borderRadius: 2 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="photo-upload"
                    type="file"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                  <label htmlFor="photo-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      disabled={uploading}
                      startIcon={uploading ? <CircularProgress size={20} /> : <PhotoCamera />}
                      fullWidth
                    >
                      {uploading ? 'Subiendo...' : 'Subir Foto desde Galeria'}
                    </Button>
                  </label>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Selecciona una imagen de tu dispositivo
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { stopPhotoCamera(); setPhotoDialog(false); }} disabled={uploading}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Video Dialog - Camera and Gallery options */}
      <Dialog open={videoDialog} onClose={() => !isRecordingVideo && !uploading && setVideoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Subir Video</DialogTitle>
        <DialogContent>
          {isRecordingVideo ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{ position: 'relative', width: '100%', maxWidth: 400, mx: 'auto', mb: 2 }}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', borderRadius: 8, backgroundColor: '#000' }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'error.main',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Box sx={{ width: 8, height: 8, bgcolor: 'white', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                  GRABANDO
                </Box>
              </Box>
              <Button
                variant="contained"
                color="error"
                onClick={stopVideoRecording}
                startIcon={<Close />}
                size="large"
              >
                Detener Grabacion
              </Button>
            </Box>
          ) : (
            <Box sx={{ py: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                Seleccione como desea agregar el video
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                {/* Record video with camera */}
                <Box sx={{ textAlign: 'center', p: 2, border: '1px dashed', borderColor: 'secondary.main', borderRadius: 2 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={startVideoRecording}
                    disabled={uploading}
                    startIcon={<Videocam />}
                    fullWidth
                  >
                    Grabar Video con Camara
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Abre la camara para grabar un video
                  </Typography>
                </Box>

                {/* Upload video from gallery */}
                <Box sx={{ textAlign: 'center', p: 2, border: '1px dashed', borderColor: 'grey.400', borderRadius: 2 }}>
                  <input
                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                    style={{ display: 'none' }}
                    id="video-upload"
                    type="file"
                    onChange={handleVideoUpload}
                    disabled={uploading}
                  />
                  <label htmlFor="video-upload">
                    <Button
                      variant="outlined"
                      color="secondary"
                      component="span"
                      disabled={uploading}
                      startIcon={uploading ? <CircularProgress size={20} /> : <Videocam />}
                      fullWidth
                    >
                      {uploading ? 'Subiendo...' : 'Subir Video desde Galeria'}
                    </Button>
                  </label>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Selecciona un video de tu dispositivo
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVideoDialog(false)} disabled={uploading || isRecordingVideo}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Video Player Modal */}
      <Dialog open={videoPlayerOpen} onClose={() => setVideoPlayerOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Reproductor de Video
          <IconButton onClick={() => setVideoPlayerOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ width: '100%', bgcolor: '#000', borderRadius: 1, overflow: 'hidden' }}>
            <video
              src={currentVideoUrl}
              controls
              autoPlay
              style={{ width: '100%', maxHeight: '70vh' }}
            />
          </Box>
        </DialogContent>
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

      {/* Exit Picking Dialog */}
      <Dialog 
        open={exitDialog} 
        onClose={() => !exiting && setExitDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Salir del Picking</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Por favor, seleccione el motivo por el cual desea salir del picking.
            El pedido quedara disponible para que otro usuario pueda continuar.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {exitReasons.map((reason) => (
              <Button
                key={reason.id}
                variant={selectedExitReason === reason.id ? 'contained' : 'outlined'}
                onClick={() => setSelectedExitReason(reason.id)}
                sx={{ 
                  justifyContent: 'flex-start',
                  py: 1.5,
                  textTransform: 'none',
                }}
              >
                {reason.label}
              </Button>
            ))}
          </Box>
          
          {selectedExitReason === 'otro' && (
            <TextField
              fullWidth
              label="Especifique el motivo"
              value={customExitReason}
              onChange={(e) => setCustomExitReason(e.target.value)}
              multiline
              rows={2}
              sx={{ mt: 2 }}
              placeholder="Escriba el motivo..."
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setExitDialog(false)
              setSelectedExitReason('')
              setCustomExitReason('')
            }}
            disabled={exiting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExitPicking}
            variant="contained"
            color="warning"
            disabled={!selectedExitReason || (selectedExitReason === 'otro' && !customExitReason.trim()) || exiting}
            startIcon={exiting ? <CircularProgress size={20} /> : <ArrowBack />}
          >
            {exiting ? 'Saliendo...' : 'Confirmar Salida'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PickingSession
