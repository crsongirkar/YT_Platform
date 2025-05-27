import express from 'express';
import Video from '../models/Video.js';
import Purchase from '../models/Purchase.js';
import Gift from '../models/Gift.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/videos', auth, async (req, res) => {
  try {
    const videos = await Video.find({ creator: req.userId })
      .sort({ createdAt: -1 })
      .select('_id title videoType price createdAt viewCount');
    
    res.json(videos);
  } catch (error) {
    console.error('Get user videos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user's purchases
router.get('/purchases', auth, async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate('video', 'title videoType');
    
    res.json(purchases);
  } catch (error) {
    console.error('Get user purchases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get gifts received by current user
router.get('/gifts', auth, async (req, res) => {
  try {
    const gifts = await Gift.find({ receiver: req.userId })
      .sort({ createdAt: -1 })
      .populate('sender', 'username')
      .populate('video', 'title');
    
      console.log(gifts);
    res.json(gifts);
  } catch (error) {
    console.error('Get user gifts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;