import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
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
  const [codeReader, setCodeReader] = useState<BrowserMultiFormatReader | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [useCameraMode, setUseCameraMode] = useState(true)
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    if (open && useCameraMode) {
      initializeScanner()
    }
    return () => {
      stopScanning()
    }
  }, [open, useCameraMode])

  const initializeScanner = async () => {
    try {
      setError(null)
      const reader = new BrowserMultiFormatReader()
      setCodeReader(reader)

      if (videoRef.current) {
        setIsScanning(true)
        await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, error) => {
            if (result) {
              const scannedText = result.getText()
              onScan(scannedText)
              onClose()
            }
            if (error && error.name !== 'NotFoundException') {
              console.error('Scanning error:', error)
            }
          }
        )
      }
    } catch (err: any) {
      setError('Error al acceder a la cámara: ' + (err.message || 'Error desconocido'))
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (codeReader) {
      try {
        const videoElement = videoRef.current
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream
          stream.getTracks().forEach(track => track.stop())
        }
      } catch (error) {
        console.log('Scanner reset error:', error)
      }
      setIsScanning(false)
    }
  }

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
