import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import MenuIcon from '@mui/icons-material/Menu'
import ChecklistIcon from '@mui/icons-material/ChecklistRtl'
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined'
import PersonIcon from '@mui/icons-material/PersonOutline'
import LogoutIcon from '@mui/icons-material/LogoutOutlined'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useAuth } from '../context/AuthContext.jsx'

const DRAWER_WIDTH = 240

export default function Layout() {
  const { user, isManager, logout } = useAuth()
  const navigate = useNavigate()
  const isSmall = useMediaQuery('(max-width:900px)')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)

  const navItems = [
    { label: 'My tasks', to: '/tasks', icon: <ChecklistIcon /> },
    { label: 'Profile', to: '/profile', icon: <PersonIcon /> },
  ]
  if (isManager) {
    navItems.push({ label: 'Team', to: '/team', icon: <PeopleIcon /> })
  }

  const handleLogout = () => {
    setAnchorEl(null)
    logout()
    navigate('/login')
  }

  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1.25 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: '8px',
            bgcolor: 'secondary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ChecklistIcon sx={{ fontSize: 18, color: '#0B241F' }} />
        </Box>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
          Taskboard
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: '#C4D0DE',
              '&.active': {
                bgcolor: 'rgba(47, 182, 163, 0.16)',
                color: '#fff',
                '& .MuiListItemIcon-root': { color: 'secondary.main' },
              },
              '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500, fontSize: '0.92rem' }} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ p: 2 }}>
        {isManager && (
          <Chip
            label="Manager access"
            size="small"
            sx={{ bgcolor: 'rgba(47, 182, 163, 0.16)', color: 'secondary.main', fontWeight: 600 }}
          />
        )}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{ width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` } }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isSmall && (
              <IconButton edge="start" color="inherit" onClick={() => setMobileOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
          </Box>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.main', color: '#0B241F', fontSize: '0.85rem', fontWeight: 700 }}>
              {initials}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                setAnchorEl(null)
                navigate('/profile')
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isSmall ? 'temporary' : 'permanent'}
          open={isSmall ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
