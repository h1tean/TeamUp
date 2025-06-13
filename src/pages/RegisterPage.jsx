import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Link,
} from '@mui/material';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../context/AuthContext';

const schema = yup
    .object({
        firstName: yup
            .string()
            .matches(/^[A-Za-zА-Яа-яҐґЄєІіЇї']+$/, 'Тільки літери')
            .min(2, 'Мінімум 2 символи')
            .required("Ім'я обов'язкове"),
        lastName: yup
            .string()
            .matches(/^[A-Za-zА-Яа-яҐґЄєІіЇї']+$/, 'Тільки літери')
            .min(2, 'Мінімум 2 символи')
            .required("Прізвище обов'язкове"),
        password: yup
            .string()
            .min(6, 'Мінімум 6 символів')
            .required("Пароль обов'язковий"),
        confirmPassword: yup
            .string()
            .oneOf([yup.ref('password'), null], 'Паролі не збігаються')
            .required("Підтвердіть пароль"),
        birthDate: yup
            .string()
            .matches(/^\d{4}-\d{2}-\d{2}$/, 'Невірний формат (YYYY-MM-DD)')
            .test(
                'age',
                'Ви повинні бути старші за 12 років',
                (val) => {
                    if (!val) return false;
                    const [year, month, day] = val.split('-').map(Number);
                    const birth = new Date(year, month - 1, day);
                    const age = (Date.now() - birth.getTime()) / (1000 * 3600 * 24 * 365.25);
                    return age >= 12;
                }
            )
            .required("Дата народження обов'язкова"),
        phone: yup
            .string()
            .matches(/^\+380\d{9}$/, 'Телефон у форматі +380XXXXXXXXX')
            .required("Телефон обов'язковий"),
    })
    .required();

export default function RegisterPage() {
    const { registerUser, sendCode } = useAuth();
    const navigate = useNavigate();

    const {
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            firstName: '',
            lastName: '',
            password: '',
            confirmPassword: '',
            birthDate: '',
            phone: '',
        },
    });

    const onSubmit = async (data) => {
        try {
            const payload = {
                firstName: data.firstName.trim(),
                lastName:  data.lastName.trim(),
                phone:     data.phone.trim(),
                password:  data.password.trim(),
                confirmPassword: data.confirmPassword.trim(),
                birthDate: data.birthDate,
            };

            const { success, userId, error } = await registerUser(payload);
            if (!success || !userId) {
                alert(error || 'Помилка реєстрації або телефон уже використовується.');
                return;
            }

            const sent = await sendCode(userId);
            if (!sent) {
                alert('Не вдалося надіслати код верифікації. Спробуйте ще раз.');
                return;
            }

            navigate('/verify-code');
        } catch (err) {
            console.error(err);
            alert('Сталася помилка при реєстрації');
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
            <Paper elevation={3} sx={{ p: 4, maxWidth: 490, width: '100%' }}>
                <Typography variant="h4" align="center" gutterBottom>
                    TeamUp
                </Typography>

                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="firstName"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Ім'я"
                                        fullWidth
                                        error={!!errors.firstName}
                                        helperText={errors.firstName?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="lastName"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Прізвище"
                                        fullWidth
                                        error={!!errors.lastName}
                                        helperText={errors.lastName?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
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
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
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
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
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
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="birthDate"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Дата народження"
                                        type="date"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!errors.birthDate}
                                        helperText={errors.birthDate?.message}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isSubmitting}
                            sx={{ py: 1.5 }}
                        >
                            Зареєструватись
                        </Button>
                    </Box>
                </Box>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2">
                        Уже є акаунт?{' '}
                        <Link component={RouterLink} to="/login" underline="hover">
                            Увійти
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}
