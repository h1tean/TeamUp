import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function BookingPage() {
    const [fields, setFields] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/fields')
            .then(res => res.json())
            .then(data => setFields(data.fields || []));
    }, []);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100%',
                bgcolor: '#f9f9fa',
                py: 4,
            }}
        >
            <Box sx={{ maxWidth: 1350, mx: 'auto', width: '100%' }}>
                <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, mb: 3, textAlign: 'left' }}
                >
                    Список полів для бронювання
                </Typography>

                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '28px',
                        justifyContent: 'center', // центр по ширині
                        width: '100%',
                    }}
                >
                    {fields.map((field) => (
                        <Card
                            key={field._id}
                            elevation={4}
                            sx={{
                                width: 280,
                                minHeight: 280,
                                borderRadius: '20px',
                                p: 0,
                                boxShadow: '0 6px 30px 0 rgba(0,0,0,0.07)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                background: '#fff',
                            }}
                        >
                            <CardMedia
                                component="img"
                                height="140"
                                image={field.images && field.images[0] ? field.images[0] : ''}
                                alt={field.name}
                                sx={{
                                    borderTopLeftRadius: '20px',
                                    borderTopRightRadius: '20px',
                                    objectFit: 'cover',
                                }}
                            />
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" fontWeight={700}>{field.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Адреса: {field.location}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Тип: {field.type === '5x5' ? '5 x 5' : '11 x 11'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Кількість слотів: {field.type === '5x5' ? 10 : 22}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    onClick={() => navigate(`/booking/${field._id}`)}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        px: 2.5,
                                        fontWeight: 500,
                                        ml: 1,
                                    }}
                                >
                                    Докладніше
                                </Button>
                            </CardActions>
                        </Card>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}
