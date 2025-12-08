import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material'
import { Store, CheckCircle } from '@mui/icons-material'
import axios from 'axios'

interface StoreConfigProps {
  onConnected: () => void
}

function StoreConfig({ onConnected }: StoreConfigProps) {
  const [storeUrl, setStoreUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [pickerName, setPickerName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const savedUrl = localStorage.getItem('store_url')
    const savedKey = localStorage.getItem('api_key')
    const savedName = localStorage.getItem('picker_name')
    if (savedUrl) setStoreUrl(savedUrl)
    if (savedKey) setApiKey(savedKey)
    if (savedName) setPickerName(savedName)
  }, [])

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      let url = storeUrl.trim()
      if (!url.startsWith('http')) {
        url = 'https://' + url
      }
      if (url.endsWith('/')) {
        url = url.slice(0, -1)
      }

      const response = await axios.get(`${url}/wp-json/picking/v1/connect`, {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`
        }
      })

      if (response.data.success) {
        localStorage.setItem('store_url', url)
        localStorage.setItem('api_key', apiKey.trim())
        localStorage.setItem('picker_name', pickerName.trim())
        localStorage.setItem('store_name', response.data.store_name || 'Tienda')
        localStorage.setItem('connected', 'true')
        
        setSuccess('Conectado exitosamente a ' + (response.data.store_name || url))
        setTimeout(() => {
          onConnected()
        }, 1500)
      } else {
        setError(response.data.message || 'Error al conectar')
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('API Key invalida')
      } else if (err.response?.status === 404) {
        setError('Plugin Picking Connector no encontrado. Asegurate de que esta instalado y activado.')
      } else {
        setError('Error de conexion. Verifica la URL y que el plugin este activo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Store sx={{ fontSize: 48, color: '#1e3a5f', mb: 2 }} />
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              Conectar Tienda
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresa los datos de tu tienda WooCommerce
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleConnect}>
            <TextField
              fullWidth
              label="URL de la Tienda"
              placeholder="https://tutienda.com"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              margin="normal"
              required
              helperText="La URL de tu tienda WooCommerce"
            />
            <TextField
              fullWidth
              label="API Key"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              margin="normal"
              required
              helperText="Generada en Picking Connector > Configuracion"
            />
            <TextField
              fullWidth
              label="Tu Nombre (Picker)"
              placeholder="Juan"
              value={pickerName}
              onChange={(e) => setPickerName(e.target.value)}
              margin="normal"
              required
              helperText="Tu nombre para identificarte en los pedidos"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                bgcolor: '#1e3a5f',
                '&:hover': { bgcolor: '#2d4a6f' }
              }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Store />}
            >
              {loading ? 'Conectando...' : 'Conectar'}
            </Button>
          </form>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" display="block" gutterBottom sx={{ fontWeight: 600 }}>
              Instrucciones:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              1. Instala el plugin "Picking Connector" en WordPress<br />
              2. Ve a Picking Connector en el menu de WordPress<br />
              3. Genera una API Key en Configuracion<br />
              4. Copia la API Key y pegala aqui
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default StoreConfig
