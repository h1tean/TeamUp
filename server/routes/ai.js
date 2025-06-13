import { Router } from 'express';
import dotenv from 'dotenv';
dotenv.config();


const router = Router();

router.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Field "messages" is required (array of messages).' });
        }
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ error: 'OPENAI_API_KEY not set in .env' });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: messages,
                temperature: 0.6,
                max_tokens: 256,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[AI] OpenAI API error:', data);
            return res.status(500).json({ error: data?.error?.message || 'OpenAI error.' });
        }
        if (!data.choices || !data.choices[0]?.message?.content) {
            return res.status(500).json({ error: 'Invalid response from AI' });
        }

        const reply = data.choices[0].message.content;
        return res.json({ reply });
    } catch (err) {
        console.error('[AI][POST /api/ai/chat]', err);
        res.status(500).json({ error: 'Server error (AI)' });
    }
});

export default router;
