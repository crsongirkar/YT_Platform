import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL, MAX_VIDEO_SIZE, ALLOWED_VIDEO_TYPES } from '../../config/constants';
import { AlertCircle, Upload, CheckCircle } from 'lucide-react';

type VideoType = 'short' | 'long' | 'youtube';

const isValidYouTubeUrl = (url: string) => {

  const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$/;
  return ytRegex.test(url);
};

const VideoUpload: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoType, setVideoType] = useState<VideoType>('short');

  // For short form video file upload
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // For long form direct video URL
  const [videoUrl, setVideoUrl] = useState('');

  // For YouTube URL input
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [price, setPrice] = useState(0);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateVideoFile = (file: File) => {
    if (file.size > MAX_VIDEO_SIZE) {
      setFileError(`File size exceeds the maximum limit of ${MAX_VIDEO_SIZE / (1024 * 1024)} MB`);
      return false;
    }
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !ALLOWED_VIDEO_TYPES.includes(`.${fileExt}`)) {
      setFileError(`Invalid file type. Allowed types: ${ALLOWED_VIDEO_TYPES.join(', ')}`);
      return false;
    }
    setFileError('');
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (validateVideoFile(selectedFile)) {
        setVideoFile(selectedFile);
      } else {
        e.target.value = '';
        setVideoFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFileError('');
    setLoading(true);
    setUploadProgress(0);

    try {
      // Validation before sending
      if (videoType === 'short') {
        if (!videoFile) {
          throw new Error('Please upload a video file for short-form content');
        }
      } else if (videoType === 'long') {
        if (!videoUrl) {
          throw new Error('Please enter a valid video URL for long-form content');
        }
      } else if (videoType === 'youtube') {
        if (!youtubeUrl || !isValidYouTubeUrl(youtubeUrl)) {
          throw new Error('Please enter a valid YouTube video URL');
        }
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('videoType', videoType);

      if (videoType === 'short') {
        formData.append('videoFile', videoFile as Blob);
      } else if (videoType === 'long') {
        formData.append('videoUrl', videoUrl);
        formData.append('price', price.toString());
      } else if (videoType === 'youtube') {
        formData.append('youtubeUrl', youtubeUrl);
      }

      await axios.post(`${API_URL}/api/videos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to upload video. Please try again.');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-8">
        <h2 className="text-2xl font-bold text-center mb-6">Upload Your Video</h2>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4 text-sm flex items-center">
            <AlertCircle size={18} className="mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-gray-300 mb-2">
              Video Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-primary text-white"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-primary text-white h-24"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Video Type</label>
            <div className="flex space-x-6">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="videoType"
                  value="short"
                  checked={videoType === 'short'}
                  onChange={() => {
                    setVideoType('short');
                    setVideoFile(null);
                    setVideoUrl('');
                    setYoutubeUrl('');
                    setPrice(0);
                    setFileError('');
                    setError('');
                  }}
                  className="form-radio text-primary h-5 w-5"
                  disabled={loading}
                />
                <span className="ml-2 text-gray-300">Short-Form (Upload)</span>
              </label>

              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="videoType"
                  value="long"
                  checked={videoType === 'long'}
                  onChange={() => {
                    setVideoType('long');
                    setVideoFile(null);
                    setVideoUrl('');
                    setYoutubeUrl('');
                    setPrice(0);
                    setFileError('');
                    setError('');
                  }}
                  className="form-radio text-primary h-5 w-5"
                  disabled={loading}
                />
                <span className="ml-2 text-gray-300">Long-Form (Direct URL)</span>
              </label>

              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="videoType"
                  value="youtube"
                  checked={videoType === 'youtube'}
                  onChange={() => {
                    setVideoType('youtube');
                    setVideoFile(null);
                    setVideoUrl('');
                    setYoutubeUrl('');
                    setPrice(0);
                    setFileError('');
                    setError('');
                  }}
                  className="form-radio text-primary h-5 w-5"
                  disabled={loading}
                />
                <span className="ml-2 text-gray-300">YouTube Link</span>
              </label>
            </div>
          </div>

          {videoType === 'short' && (
            <div>
              <label htmlFor="videoFile" className="block text-gray-300 mb-2">
                Upload Video (Max {MAX_VIDEO_SIZE / (1024 * 1024)}MB)
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-600 hover:border-primary rounded-lg cursor-pointer">
                  <div className="flex flex-col items-center justify-center pt-7">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <p className="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-100">
                      {videoFile ? videoFile.name : 'Select a file'}
                    </p>
                  </div>
                  <input
                    type="file"
                    id="videoFile"
                    className="hidden"
                    accept={ALLOWED_VIDEO_TYPES.join(',')}
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                </label>
              </div>
              {fileError && <p className="text-red-500 text-sm mt-2">{fileError}</p>}
              {videoFile && !fileError && (
                <div className="flex items-center mt-2 text-green-500">
                  <CheckCircle size={16} className="mr-1" />
                  <span className="text-sm">File ready for upload</span>
                </div>
              )}
            </div>
          )}

          {videoType === 'long' && (
            <>
              <div>
                <label htmlFor="videoUrl" className="block text-gray-300 mb-2">
                  Video URL
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-primary text-white"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-gray-300 mb-2">
                  Price (₹) - Set to 0 for free
                </label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                  min={0}
                  step={1}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-primary text-white"
                  required
                  disabled={loading}
                />
              </div>
            </>
          )}

          {videoType === 'youtube' && (
            <div>
              <label htmlFor="youtubeUrl" className="block text-gray-300 mb-2">
                YouTube Video URL
              </label>
              <input
                type="url"
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-primary text-white"
                required
                disabled={loading}
              />
            </div>
          )}

          {loading && uploadProgress > 0 && (
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <p className="text-xs text-gray-400 mt-1 text-right">{uploadProgress}% uploaded</p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              (videoType === 'short' && !videoFile) ||
              (videoType === 'long' && !videoUrl) ||
              (videoType === 'youtube' && !youtubeUrl)
            }
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload Video'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VideoUpload;
