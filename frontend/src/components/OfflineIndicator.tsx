import { Alert, Box, Chip } from '@mui/material'
import { CloudOff, Cloud, Sync } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

function OfflineIndicator() {
  const { isOffline } = useAuth()

  if (!isOffline) {
    return (
      <Box sx={{ position: 'fixed', top: 70, right: 20, zIndex: 1000 }}>
        <Chip
          icon={<Cloud />}
          label="En línea"
          color="success"
          size="small"
          variant="outlined"
        />
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'fixed', top: 70, right: 20, left: 20, zIndex: 1000 }}>
      <Alert 
        severity="warning" 
        icon={<CloudOff />}
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          '& .MuiAlert-message': {
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sync sx={{ animation: 'spin 2s linear infinite' }} />
          <span>Modo offline - Los datos se sincronizarán cuando vuelva la conexión</span>
        </Box>
      </Alert>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  )
}

export default OfflineIndicator
