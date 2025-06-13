import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    FormControlLabel,
    Checkbox,
    Link,
} from '@mui/material';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../context/AuthContext';

const schema = yup.object({
    phone: yup
        .string()
        .matches(/^\+380\d{9}$/, "Телефон у форматі +380XXXXXXXXX")
        .required("Телефон обов'язковий"),
    password: yup
        .string()
        .min(6, "Пароль мінімум 6 символів")
        .required("Пароль обов'язковий"),
    rememberMe: yup.boolean(),
});

export default function LoginPage() {
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const {
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            phone: '',
            password: '',
            rememberMe: false,
        },
    });

    const onSubmit = async ({ phone, password }) => {
        try {
            const { success, error } = await loginUser({
                phone: phone.trim(),
                password: password.trim(),
            });
            if (success) {
                navigate('/feed');
            } else {
                alert(error || 'Невірний телефон або пароль');
            }
        } catch (err) {
            console.error(err);
            alert('Сталася помилка при вході');
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: 'grey.100',
                p: 2,
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    maxWidth: 500,
                    width: '100%',
                }}
            >
                <Typography variant="h4" align="center" gutterBottom>
                    TeamUp
                </Typography>

                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
                    <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Телефон"
                                fullWidth
                                error={!!errors.phone}
                                helperText={errors.phone?.message}
                                sx={{ mb: 2 }}
                            />
                        )}
                    />

                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Пароль"
                                type="password"
                                fullWidth
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                sx={{ mb: 2 }}
                            />
                        )}
                    />

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 3,
                        }}
                    >
                        <Controller
                            name="rememberMe"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox {...field} color="primary" />}
                                    label="Запам'ятати мене"
                                />
                            )}
                        />
                        <Link component={RouterLink} to="/forgot-password" underline="hover">
                            Забули пароль?
                        </Link>
                    </Box>

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={isSubmitting}
                        sx={{ py: 1.5, mb: 2 }}
                    >
                        Увійти
                    </Button>

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2">
                            Не маєте акаунту?{' '}
                            <Link component={RouterLink} to="/register" underline="hover">
                                Зареєструватись
                            </Link>
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}
