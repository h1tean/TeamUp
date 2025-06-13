import React from 'react';
import {
    Box,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Button,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import ArticleIcon from '@mui/icons-material/Article';
import ChatIcon from '@mui/icons-material/Chat';
import GroupsIcon from '@mui/icons-material/Groups';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const isInTeam = Boolean(user);

    const handleLogout = () => {
        logout();
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        navigate('/login', { replace: true });
    };

    if (user?.role === 'admin') {
        return (
            <Box
                sx={{
                    width: 330,
                    bgcolor: 'primary.main',
                    color: '#fff',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box
                    sx={{
                        height: '64px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        typography: 'h6',
                        fontWeight: 'bold',
                    }}
                >
                    TeamUp (Admin)
                </Box>

                <Divider sx={{ bgcolor: '#fff' }} />

                <List component="nav" sx={{ flexGrow: 1 }}>
                    <ListItemButton
                        component={RouterLink}
                        to="/fields/admin"
                        selected={location.pathname === '/fields/admin'}
                        sx={{
                            color: '#fff',
                            '&.Mui-selected': {
                                bgcolor: 'primary.dark',
                            },
                        }}
                    >
                        <ListItemIcon sx={{ color: '#fff' }}>
                            <AdminPanelSettingsIcon />
                            {/* або <BuildIcon /> */}
                        </ListItemIcon>
                        <ListItemText primary="Панель адміністратора" />
                    </ListItemButton>
                </List>

                <Divider sx={{ bgcolor: '#fff' }} />

                <Box
                    sx={{
                        height: '64px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 1,
                    }}
                >
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleLogout}
                        sx={{
                            color: '#fff',
                            borderColor: '#fff',
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderColor: '#fff',
                            },
                        }}
                        startIcon={<HomeIcon />}
                    >
                        Вихід
                    </Button>
                </Box>
            </Box>
        );
    }

    const navItems = [
        { label: 'Профіль', icon: <PersonIcon />, to: `/profile/${user?.id || ''}` },
        { label: 'Друзі', icon: <PeopleIcon />, to: '/friends' },
        { label: 'Дописи', icon: <ArticleIcon />, to: '/feed' },
        { label: 'Чат', icon: <ChatIcon />, to: '/chat' },
        { label: 'Команди', icon: <GroupsIcon />, to: '/team' },
        { label: 'Моя команда', icon: <GroupsIcon />, to: '/team/my', disabled: !isInTeam },
        { label: 'Бронювання', icon: <CalendarTodayIcon />, to: '/booking' },
        { label: 'Мої бронювання', icon: <CalendarTodayIcon />, to: '/my-bookings' },

    ];

    return (
        <Box
            sx={{
                width: 330,
                bgcolor: 'primary.main',
                color: '#fff',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box
                sx={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    typography: 'h6',
                    fontWeight: 'bold',
                }}
            >
                TeamUp
            </Box>

            <Divider sx={{ bgcolor: '#fff' }} />

            <List component="nav" sx={{ flexGrow: 1 }}>
                {navItems.map((item) => (
                    <ListItemButton
                        key={item.label}
                        component={RouterLink}
                        to={item.to}
                        disabled={item.disabled}
                        selected={location.pathname === item.to}
                        sx={{
                            color: '#fff',
                            '&.Mui-selected': {
                                bgcolor: 'primary.dark',
                            },
                        }}
                    >
                        <ListItemIcon sx={{ color: '#fff' }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} />
                    </ListItemButton>
                ))}
            </List>

            <Divider sx={{ bgcolor: '#fff' }} />

            <Box
                sx={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1,
                }}
            >
                <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleLogout}
                    sx={{
                        color: '#fff',
                        borderColor: '#fff',
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderColor: '#fff',
                        },
                    }}
                    startIcon={<HomeIcon />}
                >
                    Вихід
                </Button>
            </Box>
        </Box>
    );
}
