import { useState, useEffect } from 'react'
import {
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Grid,
  Pagination,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Button,
  Chip,
} from '@mui/material'
import {
  Close,
  Refresh,
  ZoomIn,
  CalendarToday,
  ShoppingCart,
} from '@mui/icons-material'
import axios from 'axios'

interface Photo {
  url: string
  filename: string
  uploaded_at: string
  order_id: number
  order_number: string
  customer_name: string
}

function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const storeUrl = localStorage.getItem('store_url') || ''
  const apiKey = localStorage.getItem('api_key') || ''

  useEffect(() => {
    fetchPhotos()
  }, [page])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      const params: Record<string, any> = {
        token: apiKey,
        page,
        per_page: 24,
      }
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const response = await axios.get(`${storeUrl}/wp-json/picking/v1/get-all-photos`, { params })

      if (response.data.success) {
        setPhotos(response.data.photos)
        setTotalPages(response.data.total_pages)
      } else {
        setError('Error al cargar fotos')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    setPage(1)
    fetchPhotos()
  }

  if (loading && photos.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Cargando fotos...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Galeria de Fotos
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Desde"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Hasta"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleFilter}
              >
                Filtrar
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                  setPage(1)
                  fetchPhotos()
                }}
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {photos.length === 0 ? (
        <Alert severity="info">No hay fotos disponibles</Alert>
      ) : (
        <>
          <ImageList cols={4} gap={16}>
            {photos.map((photo, index) => (
              <ImageListItem 
                key={index}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 },
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.filename || `Foto ${index + 1}`}
                  loading="lazy"
                  style={{ 
                    height: 200, 
                    objectFit: 'cover',
                  }}
                />
                <ImageListItemBar
                  title={`Pedido #${photo.order_number}`}
                  subtitle={
                    <Box>
                      <Typography variant="caption" display="block">
                        {photo.customer_name}
                      </Typography>
                      <Typography variant="caption" color="rgba(255,255,255,0.7)">
                        {photo.uploaded_at || 'Fecha desconocida'}
                      </Typography>
                    </Box>
                  }
                  actionIcon={
                    <IconButton
                      sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPhoto(photo)
                      }}
                    >
                      <ZoomIn />
                    </IconButton>
                  }
                />
              </ImageListItem>
            ))}
          </ImageList>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </>
      )}

      <Dialog
        open={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setSelectedPhoto(null)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            }}
          >
            <Close />
          </IconButton>
          {selectedPhoto && (
            <Box>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.filename}
                style={{ 
                  width: '100%', 
                  maxHeight: '70vh',
                  objectFit: 'contain',
                }}
              />
              <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Chip
                    icon={<ShoppingCart />}
                    label={`Pedido #${selectedPhoto.order_number}`}
                    color="primary"
                  />
                  <Chip
                    label={selectedPhoto.customer_name}
                    variant="outlined"
                  />
                  {selectedPhoto.uploaded_at && (
                    <Chip
                      icon={<CalendarToday />}
                      label={selectedPhoto.uploaded_at}
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default PhotoGallery
