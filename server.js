require('dotenv').config(); // 환경 변수를 로드합니다

const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // 정적 파일 제공 설정

const conditions = ["Diabetes", "Hypertension", "Asthma", "Arthritis", "Heart Disease", "Cancer"];

// OpenAI API 설정
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
    console.error('OPENAI_API_KEY is not set in the environment variables.');
    process.exit(1);
}
const openaiApiUrl = 'https://api.openai.com/v1/completions';

// ChatGPT 엔드포인트
app.post('/chat', async (req, res) => {
    const { text } = req.body;
    try {
        console.log(`Received request with text: ${text}`);
        const response = await fetch(openaiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'text-davinci-003',
                prompt: `User has submitted the following pain assessment form:\n\n${text}\n\nBased on this, provide a detailed response with advice or recommendations.`,
                max_tokens: 150
            })
        });
        
        console.log(`OpenAI API response status: ${response.status}`);
        if (!response.ok) {
            console.error(`OpenAI API error: ${response.status} ${response.statusText}`);
            const errorDetails = await response.text();
            console.error(`Error details: ${errorDetails}`);
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`OpenAI API response data: ${JSON.stringify(data)}`);
        res.json({ response: data.choices[0].text.trim() });
    } catch (error) {
        console.error('Error processing /chat request:', error);
        res.status(500).json({ error: 'Failed to process the request' });
    }
});

// 검색 조건 엔드포인트
app.get('/search', (req, res) => {
    const query = req.query.condition ? req.query.condition.toLowerCase() : '';
    const results = conditions.filter(condition => condition.toLowerCase().includes(query));
    res.json({ results });
});

// 기존 엔드포인트
app.get('/health-data', (req, res) => {
    res.json({
        steps: 10000,
        heartRate: 75,
        caloriesBurned: 500
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
