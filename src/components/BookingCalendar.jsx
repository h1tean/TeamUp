import React from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';

const TIME_SLOTS = [
    '08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00',
    '16:00-18:00', '18:00-20:00', '20:00-22:00'
];

export default function BookingCalendar({ date, type, bookings, onSlotSelect, selectedSlot }) {
    const maxSlots = type === '5x5' ? 10 : 22;

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Слоти на {date.toLocaleDateString('uk-UA')}</Typography>
            <Grid container spacing={2}>
                {TIME_SLOTS.map((slot, idx) => {
                    const count = bookings.filter(b => b.timeSlot === slot).length;
                    const isFull = count >= maxSlots;
                    return (
                        <Grid item xs={12} sm={6} key={slot}>
                            <Box
                                sx={{
                                    p: 2,
                                    border: selectedSlot === slot ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                    borderRadius: 2,
                                    backgroundColor: isFull ? '#f8d7da' : '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    mb: 1,
                                }}
                            >
                                <Typography>
                                    {slot}
                                    <br />
                                    <span style={{ fontSize: 14, color: isFull ? '#d32f2f' : '#1976d2' }}>
                    {count}/{maxSlots} зайнято
                  </span>
                                </Typography>
                                <Button
                                    variant={selectedSlot === slot ? 'contained' : 'outlined'}
                                    color={isFull ? 'error' : 'primary'}
                                    disabled={isFull}
                                    onClick={() => onSlotSelect(slot)}
                                >
                                    Обрати
                                </Button>
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}
