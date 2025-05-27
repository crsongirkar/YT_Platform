import express from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../utils/supabaseClient.js';
import Video from '../models/Video.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import Purchase from '../models/Purchase.js';
import Gift from '../models/Gift.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Create a new video
router.post('/', auth, upload.single('videoFile'), async (req, res) => {
  try {
    const { title, description, videoType, videoUrl, price } = req.body;

    // Create video object
    const videoData = {
      title,
      description,
      videoType,
      creator: req.userId,
      price: videoType === 'long' ? Number(price) || 0 : 0,
    };

    // Handle video storage based on type
    if (videoType === 'short' && req.file) {
      // Generate unique filename to avoid collisions
      const uniqueFilename = `short/${uuidv4()}-${req.file.originalname}`;
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('boom-video')
        .upload(uniqueFilename, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ message: 'Failed to upload video to storage' });
      }

      // Get public URL for the video
      const { data: publicUrlData } = supabase.storage
        .from('boom-video')
        .getPublicUrl(data.path);

      videoData.videoUrl = publicUrlData.publicUrl;
      videoData.storagePath = data.path; // Store path for later reference
    } else if (videoType === 'long' && videoUrl) {
      // For long videos, use the provided URL
      videoData.videoUrl = videoUrl;
    } else if (videoType === 'long' && req.file) {
      // Optionally handle long videos in Supabase
      const uniqueFilename = `long/${uuidv4()}-${req.file.originalname}`;
      const { data, error } = await supabase.storage
        .from('boom-video')
        .upload(uniqueFilename, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ message: 'Failed to upload video to storage' });
      }

      // For long videos, use signed URLs for access control
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from('boom-video')
        .createSignedUrl(data.path, 60 * 60 * 24); // 24-hour expiry

      if (signedError) {
        console.error('Supabase signed URL error:', signedError);
        return res.status(500).json({ message: 'Failed to generate signed URL' });
      }

      videoData.videoUrl = signedUrlData.signedUrl;
      videoData.storagePath = data.path;
    } else {
      return res.status(400).json({ message: 'Video file or URL is required' });
    }

    // Create and save video
    const video = new Video(videoData);
    await video.save();

    res.status(201).json({
      message: 'Video uploaded successfully',
      video,
    });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all videos (with pagination)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find videos with creator info
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'username')
      .lean();

    // Mark videos as purchased for the current user
    const videosWithPurchaseInfo = await Promise.all(
      videos.map(async (video) => {
        video.price = Number(video.price);

        if (video.price > 0 && video.videoType === 'long' && video.storagePath) {
          const isPurchased = video.purchasedBy && 
            video.purchasedBy.some(id => id.toString() === req.userId.toString());

          if (isPurchased) {
            // Generate signed URL for purchased long videos
            const { data: signedUrlData, error } = await supabase.storage
              .from('boom-video')
              .createSignedUrl(video.storagePath, 60 * 60 * 24);

            if (!error) {
              video.videoUrl = signedUrlData.signedUrl;
            }
          }

          return { ...video, purchased: isPurchased };
        }

        return video;
      })
    );

    res.json({ videos: videosWithPurchaseInfo });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single video
router.get('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('creator', 'username')
      .lean();

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    video.price = Number(video.price);

    if (video.price > 0 && video.videoType === 'long' && video.storagePath) {
      const isPurchased = video.purchasedBy && 
        video.purchasedBy.some(id => id.toString() === req.userId.toString());

      if (isPurchased) {
        // Generate signed URL for purchased long videos
        const { data: signedUrlData, error } = await supabase.storage
          .from('boom-video')
          .createSignedUrl(video.storagePath, 60 * 60 * 24);

        if (error) {
          console.error('Supabase signed URL error:', error);
          return res.status(500).json({ message: 'Failed to generate signed URL' });
        }

        video.videoUrl = signedUrlData.signedUrl;
      }

      video.purchased = isPurchased;
    } else {
      video.purchased = true; // Free videos or short videos are always accessible
    }

    // Increment view count
    await Video.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.json(video);
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Purchase a video
router.post('/:id/purchase', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const videoId = req.params.id;

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (video.price <= 0) {
      return res.status(400).json({ message: 'This video is free' });
    }

    const alreadyPurchased = video.purchasedBy.includes(req.userId);
    if (alreadyPurchased) {
      return res.status(400).json({ message: 'You already own this video' });
    }

    const user = await User.findById(req.userId);

    if (user.balance < video.price) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    user.balance -= video.price;
    await user.save({ session });

    video.purchasedBy.push(req.userId);
    await video.save({ session });

    const purchase = new Purchase({
      user: req.userId,
      video: videoId,
      amount: video.price,
    });

    await purchase.save({ session });

    await session.commitTransaction();

    // Generate signed URL for the purchased video
    if (video.storagePath) {
      const { data: signedUrlData, error } = await supabase.storage
        .from('boom-video')
        .createSignedUrl(video.storagePath, 60 * 60 * 24);

      if (error) {
        console.error('Supabase signed URL error:', error);
        return res.status(500).json({ message: 'Failed to generate signed URL' });
      }

      res.json({
        message: 'Video purchased successfully',
        newBalance: user.balance,
        videoUrl: signedUrlData.signedUrl,
      });
    } else {
      res.json({
        message: 'Video purchased successfully',
        newBalance: user.balance,
        videoUrl: video.videoUrl,
      });
    }
  } catch (error) {
    await session.abortTransaction();
    console.error('Purchase video error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    session.endSession();
  }
});

// Gift to creator
router.post('/:id/gift', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount } = req.body;
    const videoId = req.params.id;

    const giftAmount = Number(amount);
    if (isNaN(giftAmount) || giftAmount <= 0) {
      return res.status(400).json({ message: 'Invalid gift amount' });
    }

    const video = await Video.findById(videoId).populate('creator');

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (video.creator._id.toString() === req.userId.toString()) {
      return res.status(400).json({ message: 'You cannot gift yourself' });
    }

    const sender = await User.findById(req.userId);

    if (sender.balance < giftAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const receiver = video.creator;

    sender.balance -= giftAmount;
    await sender.save({ session });

    receiver.balance += giftAmount;
    await receiver.save({ session });

    const gift = new Gift({
      sender: req.userId,
      receiver: receiver._id,
      video: videoId,
      amount: giftAmount,
    });

    await gift.save({ session });

    await session.commitTransaction();

    res.json({
      message: 'Gift sent successfully',
      newBalance: sender.balance,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Gift error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    session.endSession();
  }
});

// Get comments for a video
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ video: req.params.id })
      .sort({ createdAt: -1 })
      .populate('user', 'username');

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a comment to a video
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;

    const comment = new Comment({
      video: req.params.id,
      user: req.userId,
      text,
    });

    await comment.save();

    await comment.populate('user', 'username');

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a comment
router.delete('/:videoId/comments/:commentId', auth, async (req, res) => {
  try {
    const { videoId, commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;