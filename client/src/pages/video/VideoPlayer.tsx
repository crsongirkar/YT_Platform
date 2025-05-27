import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { API_URL, super_chat } from "../../config/constants";
import { Link } from 'react-router-dom';

import {
  User,
  Calendar,
  DollarSign,
  Gift,
  Send,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  UserPlus,
  UserCheck,
} from "lucide-react";
import CommentSection from "../../components/comments/CommentSection";

interface Video {
  _id: string;
  title: string;
  description: string;
  videoType: "short" | "long";
  videoUrl: string;
  price: number;
  creator: {
    _id: string;
    username: string;
    isFollowed?: boolean;
  };
  createdAt: string;
  purchased: boolean;
  likes: number;
  dislikes: number;
}

const VideoPlayer: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const { user, token, updateUserBalance } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedGiftAmount, setSelectedGiftAmount] = useState<number | null>(
    null
  );
  const [customGiftAmount, setCustomGiftAmount] = useState("");
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftError, setGiftError] = useState("");
  const [giftSuccess, setGiftSuccess] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_URL}/api/videos/${videoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVideo(res.data);
        setIsFollowing(res.data.creator.isFollowed || false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load video");
      } finally {
        setLoading(false);
      }
    };
    if (videoId && token) fetchVideo();
  }, [videoId, token]);

  const handleGiftSubmit = async () => {
    setGiftLoading(true);
    setGiftError("");
    setGiftSuccess("");

    const giftAmount =
      selectedGiftAmount !== null
        ? selectedGiftAmount
        : parseInt(customGiftAmount);
    if (!giftAmount || giftAmount <= 0) {
      setGiftError("Please select or enter a valid gift amount");
      setGiftLoading(false);
      return;
    }
    if (user && user.balance < giftAmount) {
      setGiftError("Insufficient balance");
      setGiftLoading(false);
      return;
    }
    try {
      const res = await axios.post(
        `${API_URL}/api/videos/${videoId}/gift`,
        { amount: giftAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUserBalance(res.data.newBalance);
      setGiftSuccess(`Gifted ₹${giftAmount} to ${video?.creator.username}!`);
      setSelectedGiftAmount(null);
      setCustomGiftAmount("");
      setTimeout(() => {
        setShowGiftModal(false);
        setGiftSuccess("");
      }, 3000);
    } catch (err) {
      setGiftError(err.response?.data?.message || "Failed to send gift");
    } finally {
      setGiftLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleFollowToggle = async () => {
    if (!video) return;
    try {
      const res = await axios.post(
        `${API_URL}/api/users/${video.creator._id}/${
          isFollowing ? "unfollow" : "follow"
        }`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error("Failed to update follow status", err);
    }
  };

  const handleLikeDislike = async (type: "like" | "dislike") => {
    if (!video) return;
    try {
      const res = await axios.post(
        `${API_URL}/api/videos/${video._id}/${type}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVideo((prev) => prev && { ...prev, ...res.data });
    } catch (err) {
      console.error(`Failed to ${type} video`, err);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        Loading...
      </div>
    );
  if (error || !video)
    return <div className="text-red-500">{error || "Video not found"}</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="text-gray-400 hover:text-white mb-4 flex items-center"
      >
        <ArrowLeft size={18} className="mr-1" /> Back
      </button>

      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <div className="relative w-full pt-[56.25%] bg-black">
          <video
            ref={videoRef}
            src={video.videoUrl}
            className="absolute top-0 left-0 w-full h-full"
            controls
            autoPlay
          />
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-white mb-41">
                {video.title}
              </h1>
              <div className="flex items-center gap-3 text-gray-400 text-sm mb-2">
                <Link
                  // to="/profile"
                  className="flex items-center gap-1 hover:text-gray-200 transition-colors"
                >
                  <User size={20} />
                  {video.creator.username}
                </Link>
              </div>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleLikeDislike("like")}
                  className="flex items-center gap-1 text-green-500"
                >
                  <ThumbsUp size={16} /> {video.likes}
                </button>
                <button
                  onClick={() => handleLikeDislike("dislike")}
                  className="flex items-center gap-1 text-red-500"
                >
                  <ThumbsDown size={16} /> {video.dislikes}
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {/* <button
                onClick={handleFollowToggle}
                className="flex items-center px-3 py-1 rounded-full text-white bg-blue-600 hover:bg-blue-700"
              >
                {isFollowing ? <UserCheck size={16} className="mr-1" /> : <UserPlus size={16} className="mr-1" />}
                {isFollowing ? 'Following' : 'Follow'}
              </button> */}
              <button
                onClick={() => setShowGiftModal(true)}
                className="flex items-center px-3 py-1 rounded-full text-white bg-green-600 hover:bg-blue-700"
              >
                <Gift size={16} className="mr-1" /> Super Chat
              </button>
            </div>
          </div>
          <p className="text-gray-300 whitespace-pre-line mt-4">
            {video.description}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <CommentSection videoId={video._id} />
      </div>

      {/* Gift Modal same as before */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-2xl font-bold text-white mb-5 text-center">
              Gift to{" "}
              <span className="text-pink-400">{video.creator.username}</span>
            </h3>
            {giftSuccess ? (
              <div className="bg-green-600 bg-opacity-25 border border-green-600 text-green-200 p-4 rounded mb-4 text-center font-semibold">
                {giftSuccess}
              </div>
            ) : (
              <>
                {giftError && (
                  <div className="bg-red-600 bg-opacity-25 border border-red-600 text-red-300 p-4 rounded mb-4 text-center font-semibold">
                    {giftError}
                  </div>
                )}

                <p className="text-gray-300 mb-6 text-center">
                  Your current balance:{" "}
                  <span className="font-semibold text-white">
                    ₹{user?.balance || 0}
                  </span>
                </p>

                <div className="mb-6">
                  <label className="block text-gray-300 mb-3 font-medium text-sm">
                    Select a gift amount
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {super_chat.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => {
                          setSelectedGiftAmount(amount);
                          setCustomGiftAmount("");
                        }}
                        className={`py-3 rounded-lg font-semibold transition 
                          ${
                            selectedGiftAmount === amount
                              ? "bg-pink-500 border-pink-500 text-white"
                              : "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-pink-600 hover:border-pink-600"
                          }
                        `}
                      >
                        ₹{amount}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="customAmount"
                    className="block text-gray-300 mb-2 font-medium text-sm"
                  >
                    Or enter a custom amount
                  </label>
                  <div className="flex items-center rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
                    <span className="px-4 py-3 text-gray-400 select-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      id="customAmount"
                      min="1"
                      value={customGiftAmount}
                      onChange={(e) => {
                        setCustomGiftAmount(e.target.value);
                        setSelectedGiftAmount(null);
                      }}
                      placeholder="Enter amount"
                      className="flex-1 bg-gray-800 text-white placeholder-gray-400 py-3 px-4 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowGiftModal(false)}
                    className="px-5 py-2 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleGiftSubmit}
                    disabled={
                      giftLoading ||
                      (selectedGiftAmount === null && !customGiftAmount)
                    }
                    className={`px-5 py-2 rounded-lg flex items-center justify-center font-semibold text-white
                      ${
                        giftLoading
                          ? "bg-pink-400 cursor-not-allowed"
                          : "bg-pink-600 hover:bg-pink-700"
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {giftLoading ? (
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                    ) : (
                      <Send size={18} className="mr-2" />
                    )}
                    {giftLoading ? "Processing..." : "Send Gift"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
