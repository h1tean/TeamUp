import React, { useState, useEffect } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

export default function FeedPage() {
    const { user, token } = useAuth();
    const [posts, setPosts] = useState([]);
    const [friendIds, setFriendIds] = useState([]);

    useEffect(() => {
        if (!user?.id || !token) return;
        fetch(`/api/users/${user.id}/friends`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                const ids = (data.friends || []).map(f => f._id || f.id);
                setFriendIds(ids);
            })
            .catch(() => setFriendIds([]));
    }, [user?.id, token]);

    useEffect(() => {
        if (!user?.id || !token) return;
        const allIds = [user.id, ...friendIds];
        Promise.all(
            allIds.map(id =>
                fetch(`/api/users/${id}/posts`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                    .then(r => r.json())
                    .then(arr => Array.isArray(arr) ? arr : [])
                    .catch(() => [])
            )
        ).then(allPostsArrays => {
            const allPosts = allPostsArrays.flat();

            const shaped = allPosts.map(p => ({
                id:        p._id || p.id,
                author:    {
                    id:     p.authorId?._id || p.authorId?.id || p.author?.id,
                    name:   p.authorId
                        ? `${p.authorId.firstName} ${p.authorId.lastName}`
                        : (p.author?.name || ""),
                    avatar: p.authorId?.avatarUrl || p.author?.avatar || "",
                },
                date:      p.createdAt,
                content:   p.content,
                imageUrl:  (p.files && p.files.length > 0) ? p.files[0].url : "",
                likes:     Array.isArray(p.likes) ? p.likes.length : (p.likes || 0),
                likedByMe: false,
                saved:     false,
                comments:  Array.isArray(p.comments) ? p.comments.map(c => ({
                    id:         c._id || c.id,
                    authorId:   c.authorId?._id || c.authorId?.id || c.authorId,
                    authorName: c.authorId?.firstName
                        ? `${c.authorId.firstName} ${c.authorId.lastName}`
                        : (c.authorName || ""),
                    authorPhone: c.authorId?.phone || c.authorPhone || "",
                    text:       c.text,
                    createdAt:  c.createdAt,
                    likes:      Array.isArray(c.likes) ? c.likes.length : (c.likes || 0),
                    likedByMe:  false,
                })) : []
            }));

            shaped.sort((a, b) => new Date(b.date) - new Date(a.date));
            setPosts(shaped);
        });
    }, [friendIds, user?.id, token]);

    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 4,
            px: 2,
        }}>
            <Box sx={{ width: '100%', maxWidth: 1240 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" sx={{ flexGrow: 1 }}>
                        Дописи
                    </Typography>
                </Box>

                <Stack spacing={2}>
                    {posts.length === 0 ? (
                        <Typography color="text.secondary">
                            Тут поки що немає дописів від вас чи друзів.
                        </Typography>
                    ) : (
                        posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                            />
                        ))
                    )}
                </Stack>
            </Box>
        </Box>
    );
}
