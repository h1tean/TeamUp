import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#0D47A1',
            dark: '#0B3D91',
            light: '#5472D3'
        },
        secondary: {
            main: '#1976D2',
        },
        warning: {
            main: '#FFC107',
        },
        background: {
            default: '#F5F5F5',
            paper: '#FFFFFF'
        },
        text: {
            primary: '#212121',
            secondary: '#555555'
        }
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        h4: {
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700
        },
        h5: {
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600
        },
        body1: {
            fontSize: '1rem'
        },
        body2: {
            fontSize: '0.875rem'
        }
    },
    spacing: 4
});

export default theme;
