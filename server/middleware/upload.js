import multer from 'multer';

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB

const storage = multer.memoryStorage(); // or use diskStorage

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE,
  },
});
