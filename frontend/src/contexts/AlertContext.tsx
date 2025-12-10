import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from '@mui/material'
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from '@mui/icons-material'

type AlertType = 'error' | 'warning' | 'success' | 'info'

interface AlertConfig {
  type: AlertType
  title: string
  message: string
  onClose?: () => void
}

interface AlertContextType {
  showAlert: (config: AlertConfig) => void
  showError: (title: string, message: string, onClose?: () => void) => void
  showWarning: (title: string, message: string, onClose?: () => void) => void
  showSuccess: (title: string, message: string, onClose?: () => void) => void
  showInfo: (title: string, message: string, onClose?: () => void) => void
  hideAlert: () => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function useAlert() {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider')
  }
  return context
}

interface AlertProviderProps {
  children: ReactNode
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [open, setOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null)

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config)
    setOpen(true)
  }, [])

  const showError = useCallback((title: string, message: string, onClose?: () => void) => {
    showAlert({ type: 'error', title, message, onClose })
  }, [showAlert])

  const showWarning = useCallback((title: string, message: string, onClose?: () => void) => {
    showAlert({ type: 'warning', title, message, onClose })
  }, [showAlert])

  const showSuccess = useCallback((title: string, message: string, onClose?: () => void) => {
    showAlert({ type: 'success', title, message, onClose })
  }, [showAlert])

  const showInfo = useCallback((title: string, message: string, onClose?: () => void) => {
    showAlert({ type: 'info', title, message, onClose })
  }, [showAlert])

  const hideAlert = useCallback(() => {
    setOpen(false)
    if (alertConfig?.onClose) {
      alertConfig.onClose()
    }
    setTimeout(() => setAlertConfig(null), 300)
  }, [alertConfig])

  const getIcon = (type: AlertType) => {
    const iconProps = { sx: { fontSize: 48 } }
    switch (type) {
      case 'error':
        return <ErrorIcon {...iconProps} color="error" />
      case 'warning':
        return <WarningIcon {...iconProps} color="warning" />
      case 'success':
        return <SuccessIcon {...iconProps} color="success" />
      case 'info':
        return <InfoIcon {...iconProps} color="info" />
    }
  }

  const getColor = (type: AlertType) => {
    switch (type) {
      case 'error':
        return 'error.main'
      case 'warning':
        return 'warning.main'
      case 'success':
        return 'success.main'
      case 'info':
        return 'info.main'
    }
  }

  const getBgColor = (type: AlertType) => {
    switch (type) {
      case 'error':
        return 'error.light'
      case 'warning':
        return 'warning.light'
      case 'success':
        return 'success.light'
      case 'info':
        return 'info.light'
    }
  }

  return (
    <AlertContext.Provider value={{ showAlert, showError, showWarning, showSuccess, showInfo, hideAlert }}>
      {children}
      <Dialog
        open={open}
        onClose={hideAlert}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          }
        }}
      >
        {alertConfig && (
          <>
            <Box
              sx={{
                bgcolor: getBgColor(alertConfig.type),
                py: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              <IconButton
                onClick={hideAlert}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: 'text.secondary',
                }}
              >
                <CloseIcon />
              </IconButton>
              {getIcon(alertConfig.type)}
            </Box>
            <DialogTitle
              sx={{
                textAlign: 'center',
                pt: 3,
                pb: 1,
                color: getColor(alertConfig.type),
                fontWeight: 'bold',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              }}
            >
              {alertConfig.title}
            </DialogTitle>
            <DialogContent>
              <Typography
                variant="body1"
                sx={{
                  textAlign: 'center',
                  color: 'text.secondary',
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  px: { xs: 1, sm: 3 },
                }}
              >
                {alertConfig.message}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
              <Button
                onClick={hideAlert}
                variant="contained"
                size="large"
                sx={{
                  minWidth: 120,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  py: 1.5,
                  bgcolor: getColor(alertConfig.type),
                  '&:hover': {
                    bgcolor: getColor(alertConfig.type),
                    filter: 'brightness(0.9)',
                  },
                }}
              >
                OK
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </AlertContext.Provider>
  )
}

export default AlertContext
