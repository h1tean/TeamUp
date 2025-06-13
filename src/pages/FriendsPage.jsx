import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    Avatar,
    IconButton,
    TextField,
    Paper,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Button,
    useTheme
} from '@mui/material';
import {
    Person as PersonIcon,
    PersonAdd as PersonAddIcon,
    Chat as ChatIcon,
    Delete as DeleteIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function a11yProps(index) {
    return {
        id: `friends-tab-${index}`,
        'aria-controls': `friends-tabpanel-${index}`,
    };
}

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`friends-tabpanel-${index}`}
            aria-labelledby={`friends-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

export default function FriendsPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId = user.id;

    const [tabValue, setTabValue] = useState(0);
    const [friendsList, setFriendsList] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const [allUsers, setAllUsers] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        axios.get(`/api/users/${userId}/friends`)
            .then(({ data }) => setFriendsList(data.friends))
            .catch(console.error);

        axios.get(`/api/users/${userId}/requests`)
            .then(({ data }) => {
                setIncomingRequests(data.incoming);
                setOutgoingRequests(data.outgoing);
            })
            .catch(console.error);

        axios.get('/api/users')
            .then(({ data }) => setAllUsers(data.users))
            .catch(console.error);
    }, [userId]);

    const handleTabChange = (_, newValue) => {
        setTabValue(newValue);
    };

    const handleGoToChat = friendId => {
        navigate(`/chat/${friendId}`);
    };

    const handleRemoveFriend = friendId => {
        axios.delete(`/api/users/${userId}/friends/${friendId}`)
            .then(() => {
                setFriendsList(prev => prev.filter(f => f.id !== friendId));
            })
            .catch(console.error);
    };

    const handleAcceptRequest = fromId => {
        axios.post(`/api/users/${userId}/friend-request/accept`, { fromUserId: fromId })
            .then(() => {
                const accepted = incomingRequests.find(r => r.id === fromId);
                setFriendsList(prev => [...prev, accepted]);
                setIncomingRequests(prev => prev.filter(r => r.id !== fromId));
            })
            .catch(console.error);
    };

    const handleRejectRequest = fromId => {
        axios.post(`/api/users/${userId}/friend-request/reject`, { fromUserId: fromId })
            .then(() => {
                setIncomingRequests(prev => prev.filter(r => r.id !== fromId));
            })
            .catch(console.error);
    };

    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }
        const lower = searchTerm.toLowerCase();
        const filtered = allUsers
            .filter(u =>
                `${u.firstName} ${u.lastName}`.toLowerCase().includes(lower) ||
                u.phone.includes(searchTerm)
            )
            .filter(u => u.id !== userId);

        const results = filtered.map(u => ({
            ...u,
            isRequested:
                outgoingRequests.some(r => r.id === u.id) ||
                friendsList.some(f => f.id === u.id)
        }));

        setSearchResults(results);
    }, [searchTerm, allUsers, outgoingRequests, friendsList, userId]);

    const handleSendRequest = toId => {
        axios.post(`/api/users/${toId}/friend-request`, { fromUserId: userId })
            .then(() => {
                const requested = searchResults.find(u => u.id === toId);
                setOutgoingRequests(prev => [...prev, requested]);
                setSearchResults(prev =>
                    prev.map(u => u.id === toId ? { ...u, isRequested: true } : u)
                );
            })
            .catch(console.error);
    };

    return (
        <Box sx={{ width: '100%', px: { xs: 1, md: 2 }, pt: 2 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>Друзі</Typography>

            <Paper elevation={1} sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab label="Мої друзі" icon={<PersonIcon />} iconPosition="start" {...a11yProps(0)} />
                    <Tab label="Пошук друзів" icon={<SearchIcon />} iconPosition="start" {...a11yProps(1)} />
                    <Tab label="Запити" icon={<PersonAddIcon />} iconPosition="start" {...a11yProps(2)} />
                </Tabs>
            </Paper>

            <TabPanel value={tabValue} index={0}>
                {friendsList.length > 0 ? (
                    <List disablePadding>
                        {friendsList.map(f => (
                            <ListItem
                                key={f.id}
                                divider
                                secondaryAction={
                                    <Box>
                                        <IconButton edge="end" onClick={() => handleGoToChat(f.id)} sx={{ mr: 1 }}>
                                            <ChatIcon />
                                        </IconButton>
                                        <IconButton edge="end" onClick={() => handleRemoveFriend(f.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar
                                        src={f.avatarUrl}
                                        sx={{ bgcolor: f.avatarUrl ? 'transparent' : theme.palette.grey[300] }}
                                    >
                                        {!f.avatarUrl && f.firstName.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography
                                            variant="subtitle1"
                                            sx={{ fontWeight: 600 }}
                                            component={RouterLink}
                                            to={`/profile/${f.id}`}
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            {f.firstName} {f.lastName}
                                        </Typography>
                                    }
                                    secondary={f.phone}
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography color="text.secondary">У вас поки немає друзів.</Typography>
                )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Box sx={{ display: 'flex', mb: 2, gap: 1 }}>
                    <TextField
                        fullWidth
                        placeholder="Введіть ім’я або телефон"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        size="small"
                    />
                    <Button onClick={() => { /* можна викликати фокус на пошуку */ }}>
                        Знайти
                    </Button>
                </Box>
                {searchResults.length > 0 ? (
                    <List disablePadding>
                        {searchResults.map(u => (
                            <ListItem
                                key={u.id}
                                divider
                                secondaryAction={
                                    <IconButton
                                        edge="end"
                                        disabled={u.isRequested}
                                        onClick={() => handleSendRequest(u.id)}
                                    >
                                        <PersonAddIcon color={u.isRequested ? 'disabled' : 'primary'} />
                                    </IconButton>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar
                                        src={u.avatarUrl}
                                        sx={{ bgcolor: u.avatarUrl ? 'transparent' : theme.palette.grey[300] }}
                                    >
                                        {!u.avatarUrl && u.firstName.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography
                                            variant="subtitle1"
                                            sx={{ fontWeight: 600 }}
                                            component={RouterLink}
                                            to={`/profile/${u.id}`}
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            {u.firstName} {u.lastName}
                                        </Typography>
                                    }
                                    secondary={u.phone}
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography color="text.secondary">Нічого не знайдено.</Typography>
                )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                {incomingRequests.length > 0 ? (
                    <List disablePadding>
                        {incomingRequests.map(r => (
                            <ListItem
                                key={r.id}
                                divider
                                secondaryAction={
                                    <Box>
                                        <IconButton edge="end" onClick={() => handleAcceptRequest(r.id)} sx={{ mr: 1 }}>
                                            <CheckIcon color="success" />
                                        </IconButton>
                                        <IconButton edge="end" onClick={() => handleRejectRequest(r.id)}>
                                            <CloseIcon color="error" />
                                        </IconButton>
                                    </Box>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar
                                        src={r.avatarUrl}
                                        sx={{ bgcolor: r.avatarUrl ? 'transparent' : theme.palette.grey[300] }}
                                    >
                                        {!r.avatarUrl && r.firstName.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography
                                            variant="subtitle1"
                                            sx={{ fontWeight: 600 }}
                                            component={RouterLink}
                                            to={`/profile/${r.id}`}
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            {r.firstName} {r.lastName}
                                        </Typography>
                                    }
                                    secondary={r.phone}
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography color="text.secondary">Немає нових запитів.</Typography>
                )}
            </TabPanel>
        </Box>
    );
}
