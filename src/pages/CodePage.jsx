import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Typography, TextField, Button, Box, Stack } from '@mui/material';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const schema = yup
    .object({
        code: yup
            .string()
            .length(6, 'Код має бути 6 цифр')
            .required('Введіть код'),
    })
    .required();

export default function CodePage() {
    const { user, phone, verifyCode, sendCode } = useAuth();
    const navigate = useNavigate();

    const {
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: { code: '' },
    });

    useEffect(() => {
        if (user?.id) {
            sendCode(user.id);
        }
    }, [user, sendCode]);

    const onSubmit = async ({ code }) => {
        const { success, error } = await verifyCode({ userId: user.id, code });
        if (success) {
            navigate('/feed');
        } else {
            alert(error || 'Невірний код або помилка сервера');
        }
    };

    const onResend = async () => {
        if (user?.id) {
            const ok = await sendCode(user.id);
            alert(ok ? 'Код відправлено повторно' : 'Не вдалося надіслати код');
        }
    };

    return (
        <Box
            sx={{
                mt: 4,
                mx: 'auto',
                maxWidth: 360,
                px: 1,
                boxSizing: 'border-box',
            }}
        >
            <Typography variant="h5" mb={2} align="center">
                Підтвердження коду
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2} align="center">
                SMS із кодом надіслано на номер: <strong>{phone}</strong>
            </Typography>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Controller
                    name="code"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Код із SMS"
                            fullWidth
                            margin="normal"
                            error={!!errors.code}
                            helperText={errors.code?.message}
                        />
                    )}
                />
                <Stack spacing={2} sx={{ mt: 2 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={isSubmitting}
                        sx={{ py: 1.5 }}
                    >
                        Підтвердити
                    </Button>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={onResend}
                        disabled={!user?.id || isSubmitting}
                        sx={{ py: 1.5 }}
                    >
                        Відправити код знову
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
}
