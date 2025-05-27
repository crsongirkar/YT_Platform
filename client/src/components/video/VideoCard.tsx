import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { useAuth } from "../../contexts/AuthContext";
import {
  Play,
  DollarSign,
  User,
  Calendar,
  Volume2,
  VolumeX,
} from "lucide-react";
import axios from "axios";
import { API_URL } from "../../config/constants";

interface VideoCardProps {
  video: {
    _id: string;
    title: string;
    description: string;
    videoType: "short" | "long";
    videoUrl: string;
    thumbnailUrl: string;
    price: number;
    creator: {
      _id: string;
      username: string;
    };
    createdAt: string;
    purchased?: boolean;
  };
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const { user, token, updateUserBalance } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle intersection observer for autoplay
  const { ref, inView } = useInView({
    threshold: 0.7,
    triggerOnce: false,
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Play/pause video based on visibility
  useEffect(() => {
    if (videoRef.current) {
      if (inView) {
        videoRef.current.play().catch(() => {
          // Auto-play was prevented, handle it silently
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [inView]);

  // Handle mute toggle
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  // Handle video click
  const handleVideoClick = () => {
    if (video.videoType === "short") {
      navigate(`/video/${video._id}`);
    }
  };

  // Handle purchase
  const handlePurchase = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setError("");
    setIsLoading(true);

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      if (user.balance < video.price) {
        setError("Insufficient balance to purchase this video");
        return;
      }

      const res = await axios.post(
        `${API_URL}/api/videos/${video._id}/purchase`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      updateUserBalance(res.data.newBalance);

      // Navigate to video
      navigate(`/video/${video._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to purchase video");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle watch
  const handleWatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/video/${video._id}`);
  };

  return (
    <div
      ref={ref}
      className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:transform hover:scale-[1.01] ${
        video.videoType === "short" ? "cursor-pointer" : ""
      }`}
      onClick={video.videoType === "short" ? handleVideoClick : undefined}
    >
      <div className="relative">
        {video.videoType === "short" ? (
          <>
            <video
              ref={videoRef}
              src={video.videoUrl}
              className="w-full h-[50vh] object-cover"
              muted={isMuted}
              loop
              playsInline
              onClick={handleVideoClick}
            />
            <button
              className="absolute bottom-4 right-4 bg-black bg-opacity-50 rounded-full p-2 text-white"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </>
        ) : (
          <div className="relative w-full pt-[56.25%] bg-gray-900">
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-700">
                <Play size={48} className="text-gray-500" />
              </div>
            )}
          </div>
        )}

        {/* Video type badge */}
        <div
          className={`absolute top-4 left-4 ${
            video.videoType === "short" ? "bg-green-600" : "bg-blue-600"
          } text-white text-xs px-2 py-1 rounded`}
        >
          {video.videoType === "short" ? "Short" : "Long"}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-xl font-semibold text-white mb-2">{video.title}</h3>

        <div className="flex items-center text-gray-400 mb-3">
          <User size={16} className="mr-1" />
          <span className="text-sm mr-4">{video.creator.username}</span>

          <Calendar size={16} className="mr-1" />
          <span className="text-sm">{formatDate(video.createdAt)}</span>
        </div>

        {video.videoType === "long" && (
          <div className="mt-4 flex justify-between items-center">
            {video.price > 0 && !video.purchased ? (
              <>
                <div className="flex items-center text-yellow-500">
                  <span className="text-lg font-bold">₹</span>
                  <span className="font-bold ml-1">{video.price}</span>
                </div>
                <button
                  onClick={handlePurchase}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium transition duration-300 ease-in-out disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : `Buy for ₹${video.price}`}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center">
                  {video.price > 0 ? (
                    <span className="text-green-500 text-sm font-medium">
                      Purchased
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Free</span>
                  )}
                </div>
                <button
                  onClick={handleWatch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition duration-300 ease-in-out"
                >
                  <Play size={16} className="inline mr-1" />
                  Watch Now
                </button>
              </>
            )}
          </div>
        )}

        {error && <div className="mt-2 text-black-500 text-sm">{error}</div>}
      </div>
    </div>
  );
};

export default VideoCard;
