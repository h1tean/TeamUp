import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, TextField, Button } from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const schema = yup
    .object({
        phone: yup
            .string()
            .matches(/^\+380\d{9}$/, 'Телефон у форматі +380XXXXXXXXX')
            .required('Телефон обовʼязковий'),
        newPassword: yup
            .string()
            .min(6, 'Мінімум 6 символів')
            .required('Новий пароль обовʼязковий'),
        confirmPassword: yup
            .string()
            .oneOf([yup.ref('newPassword')], 'Паролі мають співпадати')
            .required('Підтвердіть пароль'),
    })
    .required();

export default function ForgotPasswordPage() {
    const { forgotPassword, setPhone } = useAuth();
    const navigate = useNavigate();

    const {
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: { phone: '', newPassword: '', confirmPassword: '' },
    });

    const onSubmit = async ({ phone, newPassword }) => {
        const { success, error } = await forgotPassword(phone.trim());
        if (success) {

            setPhone(phone.trim());
            navigate('/reset-password', { state: { newPassword: newPassword.trim() } });
        } else {
            alert(error || 'Не вдалося надіслати код');
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
            <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
                <Typography variant="h5" align="center" gutterBottom>
                    Відновлення пароля
                </Typography>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Телефон (+380...)"
                                fullWidth
                                error={!!errors.phone}
                                helperText={errors.phone?.message}
                                sx={{ mb: 2 }}
                            />
                        )}
                    />
                    <Controller
                        name="newPassword"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Новий пароль"
                                type="password"
                                fullWidth
                                error={!!errors.newPassword}
                                helperText={errors.newPassword?.message}
                                sx={{ mb: 2 }}
                            />
                        )}
                    />
                    <Controller
                        name="confirmPassword"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Підтвердіть пароль"
                                type="password"
                                fullWidth
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword?.message}
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
                        Надіслати код
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
