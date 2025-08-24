import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  List,
  Chip,
  CircularProgress,
  FormControlLabel,
  Switch
} from '@mui/material'
import { CheckCircle, Cancel, Warning } from '@mui/icons-material'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

interface Exception {
  id: string
  session_id: string
  picker_id: string
  supervisor_id?: string
  reason: string
  status: string
  created_at: string
  resolved_at?: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function ExceptionManagement() {
  const { user } = useAuth()
  const [exceptions, setExceptions] = useState<Exception[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedException, setSelectedException] = useState<Exception | null>(null)
  const [approvalDialog, setApprovalDialog] = useState(false)
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(true)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'supervisor') {
      fetchExceptions()
    }
  }, [user])

  const fetchExceptions = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axios.get(`${API_BASE_URL}/exceptions`)
      setExceptions(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar excepciones')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveException = async () => {
    if (!selectedException) return

    setApproving(true)
    setError('')
    setSuccess('')

    try {
      await axios.post(`${API_BASE_URL}/exceptions/${selectedException.id}/approve`, {
        approved,
        notes: notes.trim() || undefined
      })

      setSuccess(`Excepción ${approved ? 'aprobada' : 'rechazada'} correctamente`)
      setApprovalDialog(false)
      setSelectedException(null)
      setNotes('')
      await fetchExceptions()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al procesar excepción')
    } finally {
      setApproving(false)
    }
  }

  const openApprovalDialog = (exception: Exception) => {
    setSelectedException(exception)
    setApproved(true)
    setNotes('')
    setApprovalDialog(true)
  }

  if (user?.role !== 'admin' && user?.role !== 'supervisor') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Acceso denegado. Se requiere rol de administrador o supervisor.
        </Alert>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Excepciones
      </Typography>

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

      {exceptions.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" color="text.secondary" textAlign="center">
              No hay excepciones pendientes
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {exceptions.map((exception) => (
            <Card key={exception.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Excepción de Sesión
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      ID de Sesión: {exception.session_id}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Motivo:</strong> {exception.reason}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Creada: {new Date(exception.created_at).toLocaleString('es-ES')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <Chip
                      icon={<Warning />}
                      label="Pendiente"
                      color="warning"
                      size="small"
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckCircle />}
                        onClick={() => openApprovalDialog(exception)}
                      >
                        Revisar
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </List>
      )}

      <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Revisar Excepción
        </DialogTitle>
        <DialogContent>
          {selectedException && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Motivo:</strong> {selectedException.reason}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Sesión: {selectedException.session_id}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Creada: {new Date(selectedException.created_at).toLocaleString('es-ES')}
              </Typography>
            </Box>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={approved}
                onChange={(e) => setApproved(e.target.checked)}
                color="success"
              />
            }
            label={approved ? "Aprobar excepción" : "Rechazar excepción"}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Notas del supervisor (opcional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Agregar comentarios sobre la decisión..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)} disabled={approving}>
            Cancelar
          </Button>
          <Button
            onClick={handleApproveException}
            variant="contained"
            color={approved ? "success" : "error"}
            disabled={approving}
            startIcon={approving ? <CircularProgress size={20} /> : (approved ? <CheckCircle /> : <Cancel />)}
          >
            {approving ? 'Procesando...' : (approved ? 'Aprobar' : 'Rechazar')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ExceptionManagement
