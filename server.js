import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { exec } from 'child_process';

const app = express();
const PORT = process.env.PORT || 3002;

// --- Security & Middleware ---
app.use(helmet());
app.use(cors()); // Allow all origins for unbridged access (adjust for production)
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// --- Database Connection ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nextbot';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- Schemas ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  settings: {
    theme: { type: String, default: 'dark' },
    voice: { type: String, default: 'en-US' }
  },
  createdAt: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  platform: { type: String, enum: ['desktop', 'mobile', 'web'], default: 'desktop' },
  messages: [{
    role: { type: String, enum: ['user', 'bot'], required: true },
    content: { type: String, required: true },
    intent: { type: String }, // AI Intent detected
    timestamp: { type: Date, default: Date.now }
  }]
});

const logSchema = new mongoose.Schema({
  level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
  message: String,
  metadata: Object,
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);
const Log = mongoose.model('Log', logSchema);

// --- Helpers ---
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'No token provided' });

  jwt.verify(token.split(' ')[1], process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = decoded.id;
    next();
  });
};

// --- Routes ---

// 1. Health Check
app.get('/', (req, res) => res.send({ status: 'NextBot Server Online', version: '1.0.0' }));

// 2. Auth: Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);
    const user = await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: 'User registered', userId: user._id });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 3. Auth: Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
    res.json({ token, settings: user.settings });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// 4. Desktop Bridge Command Execution (Local System Interaction)
// This endpoint allows the 'unbridged' API to still perform system actions on the host machine
app.post('/command', async (req, res) => {
  const { command } = req.body;
  console.log(`[CMD] Executing: ${command}`);

  // Map common app names to Windows commands
  const appMap = {
    'notepad': 'notepad',
    'calculator': 'calc',
    'paint': 'mspaint',
    'excel': 'start excel',
    'word': 'start winword',
    'browser': 'start chrome',
    'cmd': 'start cmd',
    'settings': 'start ms-settings:',
    'explorer': 'explorer'
  };

  const sysCmd = appMap[command.toLowerCase()] || `start ${command}`;

  exec(sysCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      // Log error
      Log.create({ level: 'error', message: `Command failed: ${command}`, metadata: { error: error.toString() } });
      return res.status(500).json({ status: 'error', message: error.message });
    }
    // Log success
    Log.create({ level: 'info', message: `Command executed: ${command}` });
    res.json({ status: 'success', output: stdout });
  });
});

// 5. Store Conversation (AI Context)
app.post('/api/conversation', verifyToken, async (req, res) => {
  try {
    const { platform, messages } = req.body;
    // Find active conversation or create new
    // For simplicity, just logging or creating new entries
    const conv = await Conversation.create({
      userId: req.userId,
      platform,
      messages
    });
    res.status(201).json({ id: conv._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save context' });
  }
});

// 6. Get History
app.get('/api/history', verifyToken, async (req, res) => {
  try {
    const history = await Conversation.find({ userId: req.userId }).sort({ _id: -1 }).limit(10);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 NextBot Unbridged Server running on http://localhost:${PORT}`);
});
