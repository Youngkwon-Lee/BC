require('dotenv').config(); // 환경 변수를 로드합니다

const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Web3 = require('web3');

const app = express();
const port = 3000;
const saltRounds = 10;
const secretKey = process.env.SECRET_KEY || 'your_secret_key';

// Web3 설정
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_URL));

// 스마트 계약 설정
const contractABI = require('../contracts/MyNFT.json').abi; // ABI 파일 경로
const contractAddress = process.env.CONTRACT_ADDRESS; // 배포된 스마트 계약 주소
const myNFTContract = new web3.eth.Contract(contractABI, contractAddress);

// 계정 설정
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public'))); // 정적 파일 제공 설정

const usersFilePath = path.join(__dirname, '../data/users.json');
const expertsFilePath = path.join(__dirname, '../data/experts.json');
const evaluationsFilePath = path.join(__dirname, '../data/evaluations.json');

// 유저 데이터 파일을 읽는 함수
function readUsersFromFile() {
    if (fs.existsSync(usersFilePath)) {
        const data = fs.readFileSync(usersFilePath);
        return JSON.parse(data);
    }
    return [];
}

// 유저 데이터를 파일에 쓰는 함수
function writeUsersToFile(users) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// 전문가 데이터 파일을 읽는 함수
function readExpertsFromFile() {
    if (fs.existsSync(expertsFilePath)) {
        const data = fs.readFileSync(expertsFilePath);
        return JSON.parse(data);
    }
    return [];
}

// 전문가 데이터를 파일에 쓰는 함수
function writeExpertsToFile(experts) {
    fs.writeFileSync(expertsFilePath, JSON.stringify(experts, null, 2));
}

// 평가 기록 파일을 읽는 함수
function readEvaluationsFromFile() {
    if (fs.existsSync(evaluationsFilePath)) {
        const data = fs.readFileSync(evaluationsFilePath);
        return JSON.parse(data);
    }
    return [];
}

// 평가 기록을 파일에 쓰는 함수
function writeEvaluationsToFile(evaluations) {
    fs.writeFileSync(evaluationsFilePath, JSON.stringify(evaluations, null, 2));
}

// 회원가입 엔드포인트
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const users = readUsersFromFile();

    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = { username, password: hashedPassword };
    users.push(newUser);
    writeUsersToFile(users);

    res.json({ message: 'User registered successfully' });
});

// 로그인 엔드포인트
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = readUsersFromFile();

    const user = users.find(user => user.username === username);
    if (!user) {
        return res.status(400).json({ error: 'Invalid username or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ username }, secretKey, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
});

// 전문가 로그인 엔드포인트
app.post('/expert-login', async (req, res) => {
    const { username, password } = req.body;
    const experts = readExpertsFromFile();

    const expert = experts.find(expert => expert.username === username);
    if (!expert) {
        return res.status(400).json({ error: 'Invalid username or password' });
    }

    const match = await bcrypt.compare(password, expert.password);
    if (!match) {
        return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ username, role: 'expert' }, secretKey, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
});

// 인증 미들웨어
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
}

// 보호된 엔드포인트 예시
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

// 기존 코드 (생략된 부분)
const conditions = ["Diabetes", "Hypertension", "Asthma", "Arthritis", "Heart Disease", "Cancer"];

const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
    console.error('OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
}
const openaiApiUrl = 'https://api.openai.com/v1/completions';

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
                prompt: `사용자가 다음 통증 평가 양식을 제출했습니다:\\n\\n${text}\\n\\n이를 기반으로 조언이나 추천 사항을 제공하십시오.`,
                max_tokens: 150
            })
        });

        console.log(`OpenAI API 응답 상태: ${response.status}`);
        if (!response.ok) {
            console.error(`OpenAI API 오류: ${response.status} ${response.statusText}`);
            const errorDetails = await response.text();
            console.error(`오류 세부 정보: ${errorDetails}`);
            throw new Error(`OpenAI API 오류: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`OpenAI API 응답 데이터: ${JSON.stringify(data)}`);
        res.json({ response: data.choices[0].text.trim() });
    } catch (error) {
        console.error('/chat 요청 처리 중 오류:', error);
        res.status(500).json({ error: '요청을 처리하는 데 실패했습니다' });
    }
});

app.get('/search', (req, res) => {
    const query = req.query.condition ? req.query.condition.toLowerCase() : '';
    const results = conditions.filter(condition => condition.toLowerCase().includes(query));
    res.json({ results });
});

// JSON 데이터를 제공하는 엔드포인트 추가
app.get('/health-data', (req, res) => {
    const filePath = path.join(__dirname, '../data/health-data.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('건강 데이터를 읽는 중 오류 발생:', err);
            return res.status(500).json({ error: '건강 데이터를 읽는 데 실패했습니다' });
        }
        res.json(JSON.parse(data));
    });
});

// NFT 보상을 설정하는 엔드포인트 추가
app.post('/set-reward', async (req, res) => {
    const { address, steps } = req.body;
    try {
        const receipt = await myNFTContract.methods.setReward(address, steps).send({ from: account.address, gas: 1000000 });
        res.json({ message: 'Reward set successfully', receipt });
    } catch (error) {
        console.error('Error setting reward:', error);
        res.status(500).json({ error: 'Failed to set reward' });
    }
});

// NFT 보상을 청구하는 엔드포인트 추가
app.post('/claim-reward', async (req, res) => {
    const { address, ticketType } = req.body;
    try {
        const receipt = await myNFTContract.methods.claimReward(ticketType).send({ from: address, gas: 1000000 });
        res.json({ message: 'Reward claimed successfully', receipt });
    } catch (error) {
        console.error('Error claiming reward:', error);
        res.status(500).json({ error: 'Failed to claim reward' });
    }
});

// 총 NFT 개수를 반환하는 엔드포인트 추가
app.get('/total-nfts', async (req, res) => {
    try {
        const totalNFTs = await myNFTContract.methods.getTotalNFTs().call();
        res.json({ totalNFTs });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch total NFTs' });
    }
});

// NFT를 티켓으로 교환하는 엔드포인트 추가
app.post('/exchange-nfts', async (req, res) => {
    const { address, tokenIds, ticketType } = req.body;
    try {
        const receipt = await myNFTContract.methods.exchangeNFTsForTicket(tokenIds, ticketType).send({ from: address, gas: 1000000 });
        res.json({ message: 'NFTs exchanged for ticket successfully', receipt });
    } catch (error) {
        console.error('Error exchanging NFTs for ticket:', error);
        res.status(500).json({ error: 'Failed to exchange NFTs for ticket' });
    }
});

// NFT를 피트니스 센터에 전송하는 엔드포인트 추가
app.post('/transfer-nft-to-fitness-center', async (req, res) => {
    const { address, tokenId } = req.body;
    try {
        const receipt = await myNFTContract.methods.transferNFTToFitnessCenter(tokenId).send({ from: address, gas: 1000000 });
        res.json({ message: 'NFT transferred to fitness center successfully', receipt });
    } catch (error) {
        console.error('Error transferring NFT to fitness center:', error);
        res.status(500).json({ error: 'Failed to transfer NFT to fitness center' });
    }
});

// 평가 기록을 저장하는 엔드포인트 추가
app.post('/submit-evaluation', authenticateToken, (req, res) => {
    if (req.user.role !== 'expert') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const { userAddress, evaluation } = req.body;
    const evaluations = readEvaluationsFromFile();

    const newEvaluation = { userAddress, evaluation, expert: req.user.username, date: new Date().toISOString() };
    evaluations.push(newEvaluation);
    writeEvaluationsToFile(evaluations);

    res.json({ message: 'Evaluation submitted successfully' });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.post('/submit-health-data', (req, res) => {
    const healthData = req.body;

    const filePath = path.join(__dirname, '../data/health-data.json');
    fs.writeFile(filePath, JSON.stringify(healthData, null, 2), (err) => {
        if (err) {
            console.error('건강 데이터를 저장하는 중 오류 발생:', err);
            return res.status(500).json({ error: '데이터 저장에 실패했습니다' });
        }

        console.log('건강 데이터가 성공적으로 저장되었습니다');
        res.json({ message: '건강 데이터가 성공적으로 저장되었습니다' });
    });
});

app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다`);
});
