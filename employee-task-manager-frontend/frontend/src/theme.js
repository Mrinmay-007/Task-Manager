import { createTheme } from '@mui/material/styles'

// --- Design tokens -------------------------------------------------------
// A steady navy + teal pairing for an internal, trust-first work tool —
// deliberately not the default MUI blue, and not a warm-cream/terracotta
// marketing palette. Status colors are muted rather than neon so a task
// board full of chips stays calm to scan.
const tokens = {
  navy: '#16233A',
  navyMid: '#1E3A5F',
  navyLight: '#3C5A82',
  teal: '#2FB6A3',
  tealDark: '#1F8E7E',
  surface: '#FFFFFF',
  canvas: '#F3F6F9',
  border: '#E1E6EC',
  textSecondary: '#5B6B82',
  amber: '#B98900',
  amberBg: '#FCF3DC',
  blue: '#2F6FED',
  blueBg: '#E7EEFD',
  green: '#1E8E5A',
  greenBg: '#E4F5EC',
  red: '#C53434',
  redBg: '#FBEAEA',
}

export const statusColors = {
  pending: { fg: tokens.amber, bg: tokens.amberBg, label: 'Pending' },
  in_progress: { fg: tokens.blue, bg: tokens.blueBg, label: 'In progress' },
  completed: { fg: tokens.green, bg: tokens.greenBg, label: 'Completed' },
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: tokens.navyMid,
      light: tokens.navyLight,
      dark: tokens.navy,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: tokens.teal,
      dark: tokens.tealDark,
      contrastText: '#0B241F',
    },
    error: { main: tokens.red, light: tokens.redBg },
    warning: { main: tokens.amber, light: tokens.amberBg },
    success: { main: tokens.green, light: tokens.greenBg },
    info: { main: tokens.blue, light: tokens.blueBg },
    background: {
      default: tokens.canvas,
      paper: tokens.surface,
    },
    text: {
      primary: tokens.navy,
      secondary: tokens.textSecondary,
    },
    divider: tokens.border,
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.01em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.01em' },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontWeight: 600, fontSize: '1.05rem' },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.navy,
          boxShadow: 'none',
          borderBottom: `1px solid ${tokens.border}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: tokens.navy,
          color: '#D8E1EC',
          borderRight: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 6, paddingInline: 16 },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation1: { boxShadow: '0 1px 3px rgba(22, 35, 58, 0.08)' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${tokens.border}`,
          boxShadow: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: tokens.navy,
          backgroundColor: tokens.canvas,
        },
      },
    },
  },
})

export default theme
export { tokens }
