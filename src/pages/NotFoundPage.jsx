import React from 'react';
import { Box, Typography } from '@mui/material';

export default function NotFoundPage() {
    return (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                404 — Сторінку не знайдено
            </Typography>
            <Typography variant="body1" color="text.secondary">
                Можливо, ви потрапили за неправильною адресою.
            </Typography>
        </Box>
    );
}
