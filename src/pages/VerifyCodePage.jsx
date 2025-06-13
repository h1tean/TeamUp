import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Paper, Typography, TextField, Button } from '@mui/material';

export default function VerifyCodePage() {
    const { verifyCode, sendCode, user } = useAuth();
    const navigate = useNavigate();
    const { handleSubmit, control, formState: { errors, isSubmitting } } = useForm();

    const [resendCooldown, setResendCooldown] = useState(60);
    const intervalRef = useRef();

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(intervalRef.current);
    }, []);

    const handleResendCode = async () => {
        if (resendCooldown > 0) return;
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                alert('Не вдалося визначити ваш ID. Спробуйте увійти знову.');
                return;
            }
            const sent = await sendCode(userId);
            if (sent) {
                alert('Новий код надіслано!');
                setResendCooldown(60); // Скидаємо таймер
            } else {
                alert('Не вдалося надіслати код.');
            }
        } catch (error) {
            alert('Помилка при повторному надсиланні коду.');
        }
    };

    const onSubmit = async (data) => {
        try {
            const userId = localStorage.getItem('userId');
             if (!userId) {
                alert('Не вдалося визначити ваш ID. Спробуйте увійти знову.');
                navigate('/login');
                return;
            }
            const { success, error } = await verifyCode({ userId, code: data.code });
            if (success) {
                navigate('/profile/' + userId);
            } else {
                alert(error || 'Невірний код або термін його дії минув.');
            }
        } catch (err) {
            alert('Сталася помилка при верифікації.');
        }
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'grey.100', p: 2 }}>
            <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
                <Typography variant="h5" align="center" gutterBottom>
                    Підтвердження номеру
                </Typography>
                <Typography variant="body2" align="center" sx={{ mb: 3 }}>
                    Ми надіслали 4-значний код на ваш номер.
                </Typography>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Controller
                        name="code"
                        control={control}
                        defaultValue=""
                        rules={{
                            required: "Код обов'язковий",
                            minLength: { value: 4, message: 'Код має бути 4-значним' },
                            maxLength: { value: 4, message: 'Код має бути 4-значним' },
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Код верифікації"
                                fullWidth
                                error={!!errors.code}
                                helperText={errors.code?.message}
                            />
                        )}
                    />
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 1 }} disabled={isSubmitting}>
                        Підтвердити
                    </Button>
                    <Button fullWidth onClick={handleResendCode} disabled={resendCooldown > 0}>
                        {resendCooldown > 0 ? `Відправити знову через ${resendCooldown}с` : 'Відправити код знову'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
} 