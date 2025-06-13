import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, TextField, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
    const { phone, resetPassword } = useAuth();
    const navigate = useNavigate();
    const { state } = useLocation();
    const newPassword = state?.newPassword || '';

    const {
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: { code: '' },
    });

    const onSubmit = async ({ code }) => {
        const { success, error } = await resetPassword({
            phone,
            code: code.trim(),
            newPassword,
        });
        if (success) {
            alert('Пароль успішно змінено. Увійдіть за новим паролем.');
            navigate('/login');
        } else {
            alert(error || 'Невірний код або помилка сервера');
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                p: 2,
            }}
        >
            <Paper sx={{ p: 4, maxWidth: 360, width: '100%' }}>
                <Typography variant="h5" align="center" gutterBottom>
                    Підтвердження коду
                </Typography>
                <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                    Код надіслано на номер <strong>{phone}</strong>
                </Typography>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Controller
                        name="code"
                        control={control}
                        rules={{ required: 'Введіть код' }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Код із SMS"
                                fullWidth
                                error={!!errors.code}
                                helperText={errors.code?.message}
                                sx={{ mb: 3 }}
                            />
                        )}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={isSubmitting}
                        sx={{ py: 1.5 }}
                    >
                        Змінити пароль
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
