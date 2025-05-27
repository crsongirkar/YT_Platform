import React, { useState, useEffect } from "react";
import axios from "axios";
import { useInView } from "react-intersection-observer";
import { useAuth } from "../../contexts/AuthContext";
import { API_URL, VIDEOS_PER_PAGE } from "../../config/constants";
import VideoCard from "../../components/video/VideoCard";
import { Loader } from "lucide-react";

interface Video {
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
}

const Feed: React.FC = () => {
  const { token } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"mostWatched" | "recent">("mostWatched");

  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  const fetchVideos = async (pageNumber: number, filterBy: string) => {
    setLoading(true);
    setError("");

    try {
      // Pass the filter as a sort query param, adjust on your API
      const res = await axios.get(
        `${API_URL}/api/videos?page=${pageNumber}&limit=${VIDEOS_PER_PAGE}&sort=${filterBy}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (pageNumber === 1) {
        setVideos(res.data.videos);
      } else {
        setVideos((prevVideos) => [...prevVideos, ...res.data.videos]);
      }

      setHasMore(res.data.videos.length === VIDEOS_PER_PAGE);
    } catch (err) {
      setError("Failed to load videos. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load videos when token or filter changes (reset page to 1)
  useEffect(() => {
    setPage(1);
    fetchVideos(1, filter);
  }, [token, filter]);

  // Load more videos on scroll bottom
  useEffect(() => {
    if (inView && !loading && hasMore) {
      setPage((prevPage) => {
        const nextPage = prevPage + 1;
        fetchVideos(nextPage, filter);
        return nextPage;
      });
    }
  }, [inView, loading, hasMore, token, filter]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6"> All Videos</h1>

      {error && (
        <div className="bg-red-50 text-white p-3 rounded mb-4">{error}</div>
      )}

      <div className="space-y-6">
        {videos.length === 0 && !loading ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl">No videos found</p>
            <p className="mt-2">Be the first to upload a video!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center py-4">
            <Loader size={24} className="animate-spin text-primary" />
          </div>
        )}

        {/* Sentinel element for infinite scroll */}
        {hasMore && !loading && <div ref={ref} className="h-10" />}
      </div>
    </div>
  );
};

export default Feed;
