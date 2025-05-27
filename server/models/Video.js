import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  videoType: {
    type: String,
    enum: ['short', 'long'],
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    default: 0 // Free by default
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  purchasedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Video = mongoose.model('Video', videoSchema);

export default Video;