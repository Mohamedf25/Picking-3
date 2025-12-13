import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  TextField,
  Switch,
  FormControlLabel
} from '@mui/material'
import { QrCodeScanner } from '@mui/icons-material'

interface CameraScannerProps {
  open: boolean
  onClose: () => void
  onScan: (result: string) => void
  title?: string
}

function CameraScanner({ open, onClose, onScan, title = "Escanear Código" }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isInitializingRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [useCameraMode, setUseCameraMode] = useState(true)
  const [isScanning, setIsScanning] = useState(false)

  const stopScanning = useCallback(() => {
    try {
      if (controlsRef.current) {
        controlsRef.current.stop()
        controlsRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream
          stream.getTracks().forEach(track => track.stop())
        }
        videoRef.current.srcObject = null
      }
    } catch (err) {
      console.log('Scanner cleanup error:', err)
    }
    setIsScanning(false)
    isInitializingRef.current = false
  }, [])

  const initializeScanner = useCallback(async () => {
    if (isInitializingRef.current) {
      return
    }
    
    stopScanning()
    
    isInitializingRef.current = true
    setError(null)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      
      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop())
        isInitializingRef.current = false
        return
      }
      
      videoRef.current.srcObject = stream
      
      await new Promise<void>((resolve, reject) => {
        const video = videoRef.current
        if (!video) {
          reject(new Error('Video element not available'))
          return
        }
        
        const onLoadedMetadata = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          resolve()
        }
        
        const onError = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          reject(new Error('Video failed to load'))
        }
        
        video.addEventListener('loadedmetadata', onLoadedMetadata)
        video.addEventListener('error', onError)
        
        if (video.readyState >= 1) {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          resolve()
        }
      })
      
      await videoRef.current.play()
      
      const reader = new BrowserMultiFormatReader()
      
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err) => {
          if (result) {
            const scannedText = result.getText()
            onScan(scannedText)
            onClose()
          }
          if (err && err.name !== 'NotFoundException') {
            console.error('Scanning error:', err)
          }
        }
      )
      
      controlsRef.current = controls
      setIsScanning(true)
      isInitializingRef.current = false
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError('Error al acceder a la cámara: ' + errorMessage)
      setIsScanning(false)
      isInitializingRef.current = false
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [onScan, onClose, stopScanning])

  useEffect(() => {
    if (open && useCameraMode) {
      const timeoutId = setTimeout(() => {
        initializeScanner()
      }, 100)
      return () => {
        clearTimeout(timeoutId)
        stopScanning()
      }
    } else {
      stopScanning()
    }
    return () => {
      stopScanning()
    }
  }, [open, useCameraMode, initializeScanner, stopScanning])

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim())
      setManualInput('')
      onClose()
    }
  }

  const handleClose = () => {
    stopScanning()
    setManualInput('')
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <QrCodeScanner />
        {title}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={useCameraMode}
                onChange={(e) => setUseCameraMode(e.target.checked)}
              />
            }
            label="Usar cámara"
          />
        </Box>

        {useCameraMode ? (
          <Box>
            {error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
                <br />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Cambia a modo manual para continuar.
                </Typography>
              </Alert>
            ) : (
              <Box>
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    backgroundColor: '#000',
                    borderRadius: '8px'
                  }}
                  autoPlay
                  playsInline
                />
                {isScanning && (
                  <Typography variant="body2" color="primary" sx={{ mt: 1, textAlign: 'center' }}>
                    📷 Apunta la cámara hacia el código de barras o QR
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Introduce el código manualmente:
            </Typography>
            <TextField
              fullWidth
              label="Código de barras / SKU"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleManualSubmit()
                }
              }}
              autoFocus
              placeholder="Ej: 1234567890"
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancelar
        </Button>
        {!useCameraMode && (
          <Button 
            onClick={handleManualSubmit} 
            variant="contained"
            disabled={!manualInput.trim()}
          >
            Confirmar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default CameraScanner
