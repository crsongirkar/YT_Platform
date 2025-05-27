import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/videos.js';
import userRoutes from './routes/users.js';


dotenv.config();


const app = express();
const PORT = process.env.PORT || 5002;

const allowedOrigins = [
  'http://localhost:5173'
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boom_video')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/users', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Boom Video Platform API');
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});