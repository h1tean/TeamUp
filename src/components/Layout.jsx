import React from 'react';
import { Box } from '@mui/material';

export default function Layout({ children }) {
    return (
        <Box
            component="main"
            sx={{
                flexGrow: 1,
                width: '100%',
                backgroundColor: 'grey.100',
                display: 'flex',
                flexDirection: 'column',
                p: 2,
                boxSizing: 'border-box',
                minHeight: 0,
                overflowX: 'hidden',
            }}
        >
            {children}
        </Box>
    );
}
