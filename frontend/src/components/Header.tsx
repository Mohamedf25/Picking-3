import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { Logout, ShoppingCart, Person, Menu as MenuIcon } from '@mui/icons-material'
import { useState } from 'react'

function Header() {
  const { user, permissions, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    logout()
  }

  const handleNavigate = (path: string) => {
    handleMenuClose()
    navigate(path)
  }

  if (location.pathname === '/login' || location.pathname === '/connect') {
    return null
  }

  return (
    <AppBar position="static" sx={{ bgcolor: '#1e3a5f' }}>
      <Toolbar>
        <ShoppingCart sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Sistema de Picking
        </Typography>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <Button
                color="inherit"
                onClick={() => navigate('/orders')}
                size="small"
              >
                Pedidos
              </Button>
              {permissions?.can_view_dashboard && (
                <Button
                  color="inherit"
                  onClick={() => navigate('/dashboard')}
                  size="small"
                >
                  Dashboard
                </Button>
              )}
              {permissions?.can_manage_users && (
                <Button
                  color="inherit"
                  onClick={() => navigate('/admin')}
                  size="small"
                >
                  Usuarios
                </Button>
              )}
            </Box>
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
              sx={{ display: { xs: 'flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => handleNavigate('/orders')}>Pedidos</MenuItem>
              {permissions?.can_view_dashboard && (
                <MenuItem onClick={() => handleNavigate('/dashboard')}>Dashboard</MenuItem>
              )}
              {permissions?.can_manage_users && (
                <MenuItem onClick={() => handleNavigate('/admin')}>Usuarios</MenuItem>
              )}
              <MenuItem onClick={handleLogout}>Cerrar Sesion</MenuItem>
            </Menu>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, ml: 2 }}>
              <Person fontSize="small" />
              <Typography variant="body2">
                {user.username}
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
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}

export default Header
