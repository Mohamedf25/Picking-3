import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { Logout, ShoppingCart, Dashboard } from '@mui/icons-material'

function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (location.pathname === '/login') {
    return null
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <ShoppingCart sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Sistema de Picking
        </Typography>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/orders')}
              startIcon={<ShoppingCart />}
              size="small"
            >
              Pedidos
            </Button>
            {(user.role === 'admin' || user.role === 'supervisor') && (
              <>
                <Button
                  color="inherit"
                  onClick={() => navigate('/dashboard')}
                  startIcon={<Dashboard />}
                  size="small"
                >
                  Métricas
                </Button>
                <Button
                  color="inherit"
                  onClick={() => navigate('/exceptions')}
                  size="small"
                >
                  Excepciones
                </Button>
                {user.role === 'admin' && (
                  <>
                    <Button
                      color="inherit"
                      onClick={() => navigate('/admin')}
                      size="small"
                    >
                      Panel Admin
                    </Button>
                    <Button
                      color="inherit"
                      onClick={() => navigate('/warehouses')}
                      size="small"
                    >
                      Almacenes
                    </Button>
                  </>
                )}
              </>
            )}
            <Typography variant="body2">
              {user.username} ({user.role})
            </Typography>
            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<Logout />}
              size="small"
            >
              Salir
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}

export default Header
