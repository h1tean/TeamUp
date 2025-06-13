import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';

import RegisterPage       from './pages/RegisterPage';
import CodePage           from './pages/CodePage';
import LoginPage          from './pages/LoginPage';
import ProfilePage        from './pages/ProfilePage';
import FeedPage           from './pages/FeedPage';
import ChatPage           from './pages/ChatPage';
import BookingPage        from './pages/BookingPage';
import BookingDetailPage  from './pages/BookingDetailPage';
import AdminFieldsPage from './pages/AdminFieldsPage';
import MyBookingsPage     from './pages/MyBookingsPage';
import FieldCreatePage from './pages/FieldCreatePage';
import TeamListPage       from './pages/TeamListPage';
import TeamDetailPage     from './pages/TeamDetailPage';
import TeamCreatePage     from './pages/TeamCreatePage';
import TeamEditPage       from './pages/TeamEditPage';
import MyTeamPage         from './pages/MyTeamPage';
import NotFoundPage       from './pages/NotFoundPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import FriendsPage        from './pages/FriendsPage';

import Sidebar            from './components/Sidebar';
import RightSidebar       from './components/RightSidebar';
import Layout             from './components/Layout';

import { useAuth }        from './context/AuthContext';

export default function App() {
    const { isAuthenticated, phone, user } = useAuth();
    console.log('🛠️ App.jsx → isAuthenticated =', isAuthenticated, '| phone =', phone, '| user =', user);

    if (!isAuthenticated) {
        return (
            <>
                <CssBaseline />
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        pb: 2,
                        px: 1,
                        backgroundColor: 'grey.100',
                    }}
                >
                    <Routes>
                        <Route path="/" element={<Navigate to="/login" replace />} />

                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/verify-code" element={<CodePage />} />

                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />

                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Box>
            </>
        );
    }

    return (
        <>
            <CssBaseline />

            <Box sx={{ display: 'flex', height: '100vh', position: 'relative' }}>
                <Sidebar user={user} />

                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Navigate to="/feed" replace />} />

                            <Route path="/feed" element={<FeedPage />} />
                            <Route path="/profile/:id" element={<ProfilePage />} />

                            <Route path="/friends" element={<FriendsPage />} />

                            <Route path="/chat" element={<ChatPage />} />
                            <Route path="/chat/:id" element={<ChatPage />} />

                            <Route path="/booking" element={<BookingPage />} />
                            <Route path="/booking/:id" element={<BookingDetailPage />} />
                            <Route path="/my-bookings" element={<MyBookingsPage />} />
                            <Route path="/fields/admin" element={<AdminFieldsPage />} />
                            <Route path="/fields/create" element={<FieldCreatePage />} />

                            <Route path="/team" element={<TeamListPage />} />
                            <Route path="/team/create" element={<TeamCreatePage />} />
                            <Route path="/team/:id" element={<TeamDetailPage />} />
                            <Route path="/team/my" element={<MyTeamPage />} />
                            <Route path="/team/:id/edit" element={<TeamEditPage />} />

                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </Layout>
                </Box>

                <RightSidebar />
            </Box>
        </>
    );
}
