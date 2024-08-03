const express = require('express');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

const HASURA_URL = 'http://localhost:8080/v1/graphql';
const HASURA_ADMIN_SECRET = 'myadminsecretkey';
const JWT_SECRET = 'your_jwt_secret';

const MONGO_URI = 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/fintech';
const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Registration
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        await client.connect();
        const db = client.db('fintech');
        const users = db.collection('users');

        const existingUser = await users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            name,
            email,
            password: hashedPassword,
            created_at: new Date()
        };

        await users.insertOne(newUser);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//  Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        await client.connect();
        const db = client.db('fintech');
        const users = db.collection('users');

        const user = await users.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Middleware 
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    });
};


app.post('/deposit', authenticateToken, async (req, res) => {
    const { accountId, amount } = req.body;

    const query = `
    mutation {
        insert_transactions(objects: { account_id: "${accountId}", amount: ${amount}, type: "deposit" }) {
            returning {
                id
            }
        }
    }`;

    try {
        const response = await axios.post(HASURA_URL, { query }, {
            headers: {
                'x-hasura-admin-secret': HASURA_ADMIN_SECRET
            }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, async () => {
    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas');
    } catch (err) {
        console.error(err);
    }
    console.log('Server running on port 3000');
});
