import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected successfully."))
    .catch(err => {
        console.error("❌ MongoDB connection error:", err);
        console.log("ℹ️  Continuing with fallback responses...");
    });

// --- Mongoose Schemas ---

// 1. User Schema (Existing)
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// 2. NEW: Knowledge Base Schema (How you store Q&A data)
const KnowledgeBaseSchema = new mongoose.Schema({
    // Store the regex pattern as a string
    question_pattern: { type: String, required: true, unique: true }, 
    // Store the corresponding answer
    reply_text: { type: String, required: true },
    // Optional fields for organization
    category: { type: String, default: 'General' }, 
    level: { type: String, default: 'easy' },
}, { timestamps: true });

const KnowledgeBaseEntry = mongoose.model('KnowledgeBaseEntry', KnowledgeBaseSchema);

// --------------------------------------------------------------------------------

// --- Chatbot Logic (Updated to be async and query the database) ---
/**
 * HOW THE CHATBOT ANSWERS FROM THE DATABASE:
 * 1. It fetches ALL question_pattern and reply_text pairs from the database.
 * 2. It iterates through each database entry.
 * 3. It dynamically creates a RegExp object from the stored question_pattern.
 * 4. It tests the user's message against the generated RegExp.
 * 5. If a match is found, it immediately returns the stored reply_text.
 * 6. If no match is found after checking the entire database, it falls back to hardcoded general rules.
 */
async function generateReply(userText) {
    const text = String(userText || '').toLowerCase();

    if (!text || text.trim() === '') {
        return "Please type a question about soil, crops, or fertilizers.";
    }

    // --- JSON-BASED KNOWLEDGE BASE (Fast and reliable) ---
    try {
        // Import the JSON knowledge base
        const fs = await import('fs');
        const knowledgeBaseData = JSON.parse(fs.readFileSync('./knowledge-base.json', 'utf8'));
        
        for (const entry of knowledgeBaseData) {
            // Create a RegExp object from the stored pattern string
            const regex = new RegExp(entry.question_pattern, 'i');
            
            if (regex.test(text)) {
                return entry.reply_text; // JSON answer found and returned
            }
        }
    } catch (error) {
        console.error("JSON knowledge base error:", error);
        // Fall through to database if JSON fails
        
        // Try database as backup
        try {
            const knowledgeBase = await KnowledgeBaseEntry.find({}); 
            
            for (const entry of knowledgeBase) {
                const regex = new RegExp(entry.question_pattern, 'i');
                
                if (regex.test(text)) {
                    return entry.reply_text;
                }
            }
        } catch (dbError) {
            console.error("Database query error:", dbError);
        }
    }

    // --- BASIC FALLBACK (Only if both JSON and database fail) ---
    if (/hello|hi|hey/.test(text)) {
        return "Hi! I'm your SoilScope assistant. Ask me about soil health, pH, moisture, crops, or fertilizers.";
    }

    return "I can help you with soil analysis, crop recommendations, and farming advice. Try asking about pH levels, fertilizers, or specific crops like tomatoes or corn.";
}

// --------------------------------------------------------------------------------

// --- API Routes ---

// 1. Health Check
app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

// 2. Setup Database (populate knowledge base)
app.post('/api/setup-database', async (req, res) => {
    try {
        // Knowledge base data directly in server
        const knowledgeBaseData = [
            {
                question_pattern: "hello|hi|hey|namaste|hola|good morning|good afternoon|good evening|start|begin",
                reply_text: "Hi! I'm your SoilScope assistant. Ask me about soil health, pH, moisture, crops, fertilizers, or farming techniques. How can I help you today?",
                category: "Greetings",
                level: "basic",
                keywords: ["greeting", "hello", "start"]
            },
            {
                question_pattern: "(ph|pH).*range|ph level|soil ph|acidity|alkaline|acid.*soil",
                reply_text: "Most crops thrive in soil pH 6.0–7.0. Acidic soils (<6.0) can limit nutrient uptake; add lime to raise pH. For alkaline soils (>7.5), add sulfur or organic matter to lower pH.",
                category: "pH Management",
                level: "basic",
                keywords: ["ph", "acidity", "alkaline", "lime", "sulfur"]
            },
            {
                question_pattern: "how.*test.*ph|ph.*test|measure.*ph",
                reply_text: "Test soil pH using: 1) Digital pH meter (most accurate), 2) pH test strips, 3) Home test kits, or 4) Professional lab testing. Test in spring before planting for best results.",
                category: "pH Management",
                level: "intermediate",
                keywords: ["ph", "test", "measure", "meter", "strips"]
            },
            {
                question_pattern: "moisture|irrigation|water(ing)?|dry soil|wet soil|drought",
                reply_text: "Aim for 35–60% soil moisture depending on crop and growth stage. Water early morning to reduce evaporation, use mulch to retain moisture, and ensure proper drainage to avoid waterlogging.",
                category: "Water Management",
                level: "basic",
                keywords: ["moisture", "irrigation", "watering", "drought", "mulch"]
            },
            {
                question_pattern: "nitrogen|phosphorus|potassium|npk|fertilizer|nutrients",
                reply_text: "Balanced NPK fertilizer depends on your soil test results. Common ratios: 10-10-10 for general use, 10-26-26 for root crops, 20-10-10 for leafy greens. Always test your soil first for best results.",
                category: "Fertilizers",
                level: "basic",
                keywords: ["npk", "nitrogen", "phosphorus", "potassium", "fertilizer"]
            },
            {
                question_pattern: "crop(s)? recommendation|what to plant|which crop|best crop",
                reply_text: "Crop selection depends on your soil type, climate, and season. For neutral pH (6.0-7.0): corn, wheat, soybeans, tomatoes. For acidic soil: potatoes, blueberries, azaleas. For clay soil: rice, wheat, cabbage.",
                category: "Crop Selection",
                level: "basic",
                keywords: ["crops", "plant", "selection", "recommendation"]
            },
            {
                question_pattern: "corn|maize",
                reply_text: "Corn grows best in well-drained soil with pH 6.0-6.8, requires high nitrogen (150-200 lbs/acre), and needs consistent moisture (1-1.5 inches/week). Plant after soil temperature reaches 60°F (15°C).",
                category: "Specific Crops",
                level: "intermediate",
                keywords: ["corn", "maize", "nitrogen", "temperature"]
            },
            {
                question_pattern: "tomato|tomatoes",
                reply_text: "Tomatoes prefer slightly acidic soil (pH 6.0-6.8), need consistent watering (1-2 inches/week), and benefit from calcium to prevent blossom end rot. Use stakes or cages for support. Mulch to retain moisture.",
                category: "Specific Crops",
                level: "intermediate",
                keywords: ["tomato", "calcium", "blossom end rot", "support"]
            },
            {
                question_pattern: "wheat",
                reply_text: "Wheat thrives in well-drained soil with pH 6.0-7.0, requires moderate nitrogen (80-120 lbs/acre), and is typically planted in fall for spring harvest in temperate climates. Needs good air circulation.",
                category: "Specific Crops",
                level: "intermediate",
                keywords: ["wheat", "fall planting", "nitrogen", "circulation"]
            },
            {
                question_pattern: "potato|potatoes",
                reply_text: "Potatoes prefer slightly acidic soil (pH 5.8-6.2), need loose, well-drained soil, and benefit from hilling to prevent green tubers. Avoid fresh manure which can cause scab disease.",
                category: "Specific Crops",
                level: "intermediate",
                keywords: ["potato", "acidic", "hilling", "scab disease"]
            },
            {
                question_pattern: "compost|organic|manure|organic matter",
                reply_text: "Add 2–5 kg/m² of well-decomposed compost annually. It improves soil structure, increases water retention, feeds beneficial microbes, and provides slow-release nutrients. Turn compost every 2-3 weeks.",
                category: "Soil Health",
                level: "basic",
                keywords: ["compost", "organic matter", "microbes", "structure"]
            },
            {
                question_pattern: "soil test|testing|analysis",
                reply_text: "Test your soil every 2-3 years for pH, NPK levels, and organic matter. Spring is ideal for testing. Use our SoilScope image analysis or get a professional lab test for detailed results including micronutrients.",
                category: "Soil Testing",
                level: "basic",
                keywords: ["soil test", "analysis", "lab", "micronutrients"]
            },
            {
                question_pattern: "pest|disease|bug|insect|fungus",
                reply_text: "Healthy soil supports plants' natural pest resistance. Use crop rotation, beneficial insects, companion planting, and organic treatments. Avoid overwatering which can promote fungal diseases.",
                category: "Pest Management",
                level: "basic",
                keywords: ["pest", "disease", "rotation", "beneficial insects"]
            }
        ];

        // Clear existing data and insert new data
        await KnowledgeBaseEntry.deleteMany({});
        await KnowledgeBaseEntry.insertMany(knowledgeBaseData);
        
        res.json({ 
            success: true, 
            message: `Database populated with ${knowledgeBaseData.length} knowledge base entries!`,
            count: knowledgeBaseData.length
        });
    } catch (error) {
        console.error('Database setup error:', error);
        res.status(500).json({ success: false, message: 'Failed to setup database', error: error.message });
    }
});

// 3. Registration Route (JSON-based with MongoDB backup)
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Try JSON-based storage first
        try {
            const fs = await import('fs');
            const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
            
            // Check if user already exists
            const existingUser = users.find(u => u.email === email);
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'User already exists with this email.' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Add new user
            const newUser = {
                id: Date.now().toString(),
                name,
                email,
                password: hashedPassword,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
            
            res.status(201).json({ success: true, message: 'User registered successfully.' });
            
        } catch (jsonError) {
            console.error("JSON user storage error:", jsonError);
            
            // Fallback to MongoDB if JSON fails
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ success: false, message: 'User already exists with this email.' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({ name, email, password: hashedPassword });
            await user.save();

            res.status(201).json({ success: true, message: 'User registered successfully.' });
        }

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
});

// 4. Login Route (JSON-based with MongoDB backup)
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Try JSON-based storage first
        try {
            const fs = await import('fs');
            const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
            
            const user = users.find(u => u.email === email);
            if (!user) {
                return res.status(400).json({ success: false, message: 'Invalid credentials.' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Invalid credentials.' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.json({ success: true, message: 'Login successful.', token });
            
        } catch (jsonError) {
            console.error("JSON user storage error:", jsonError);
            
            // Fallback to MongoDB if JSON fails
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ success: false, message: 'Invalid credentials.' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Invalid credentials.' });
            }

            const token = jwt.sign(
                { id: user._id, email: user.email },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.json({ success: true, message: 'Login successful.', token });
        }

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});

// 4. Chat Route (Updated to be async and await the reply)
app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;
        // MUST await the async function
        const reply = await generateReply(message); 
        res.json({ reply });
    } catch (error) {
        console.error("Chatbot error:", error);
        res.status(500).json({ error: 'Server error' });
    }
});


// --- Start Server ---
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));



