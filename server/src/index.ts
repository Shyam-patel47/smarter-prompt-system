import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './db';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (required for secure cookies behind Render load balancer)
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'https://smarter-prompt-system.vercel.app',
].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (proxied requests, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

import { requireValidOrigin } from './middleware/csrf';
app.use(requireValidOrigin); // CSRF protection for state-changing routes

import folderRoutes from './routes/folders';
import promptRoutes from './routes/prompts';
import tagRoutes from './routes/tags';
import comparisonRoutes from './routes/comparisons';
import dashboardRoutes from './routes/dashboard';
import settingsRoutes from './routes/settings';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/comparisons', comparisonRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
