const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json());

// Registration endpoint
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields required.' });
    }
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
        users = JSON.parse(fs.readFileSync(USERS_FILE));
    }
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, message: 'Email already registered.' });
    }
    const newUser = {
        id: Date.now(),
        name,
        email,
        password // For demo only; use hashing in production!
    };
    users.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    res.json({ success: true, message: 'User registered successfully.' });
});

// Get all users (for display)
app.get('/api/users', (req, res) => {
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
        users = JSON.parse(fs.readFileSync(USERS_FILE));
    }
    res.json(users);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// ...existing code...

// ...existing code...
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields required.' });
    }
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
        users = JSON.parse(fs.readFileSync(USERS_FILE));
    }
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, message: 'Email already registered.' });
    }
    const newUser = {
        id: Date.now(),
        name,
        email,
        password
    };
    users.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    res.json({ success: true, message: 'User registered successfully.' });
});
// ...existing code...