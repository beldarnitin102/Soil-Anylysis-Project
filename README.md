## SoilScope Simple Chatbot (No API Keys)

1. Install dependencies and start the server:

```
npm install
npm run dev
```

2. Open `index4.html` in your browser (use Live Server or open the file). The chat bubble opens a panel that talks to `http://localhost:3000/api/chat`.

3. The chatbot is rule-based and answers common soil questions (pH, moisture, NPK, compost, crop suggestions). Edit the rules in `server.js` inside `generateReply()` to customize responses.

Troubleshooting:
- Ensure port 3000 is reachable (allow Node through Windows Firewall if prompted).
- Visit `http://localhost:3000/api/health` to check that the server is running.

