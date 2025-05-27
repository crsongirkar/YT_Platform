import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config/constants';
import { User, Video, Gift } from 'lucide-react';

interface UserVideo {
  _id: string;
  title: string;
  videoType: 'short' | 'long';
  price: number;
  createdAt: string;
  viewCount: number;
}

interface UserPurchase {
  _id: string;
  video: {
    _id: string;
    title: string;
    videoType: 'short' | 'long';
  };
  amount: number;
  createdAt: string;
}

interface UserGift {
  _id: string;
  video: {
    _id: string;
    title: string;
  };
  amount: number;
  createdAt: string;
  sender: {
    _id: string;
    username: string;
  };
}

const Profile: React.FC = () => {
  const { user, token } = useAuth();
  const [videos, setVideos] = useState<UserVideo[]>([]);
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [gifts, setGifts] = useState<UserGift[]>([]);
  const [activeTab, setActiveTab] = useState('videos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError('');

      try {
        const endpoint =
          activeTab === 'videos'
            ? `${API_URL}/api/users/videos`
            : activeTab === 'purchases'
            ? `${API_URL}/api/users/purchases`
            : `${API_URL}/api/users/gifts`;

        const res = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (activeTab === 'videos') {
          setVideos(res.data);
        } else if (activeTab === 'purchases') {
          setPurchases(res.data);
        } else {
          setGifts(res.data);
        }
      } catch (err) {
        setError(`Failed to load ${activeTab}. Please try again.`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUserData();
    }
  }, [activeTab, token]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 font-inter text-gray-100">
      {/* Profile Header */}
      <div className="bg-gray-900 rounded-xl shadow-lg mb-8 p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-28 h-28 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-5xl font-extrabold select-none">
          {user?.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1">
            {user?.username}
          </h1>
          <p className="text-gray-400 text-lg">{user?.email}</p>
          <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 font-semibold rounded-full px-5 py-2 mt-4 shadow-md select-none">
            <span className="mr-3 text-xl">💸</span>
            <span className="text-2xl">₹{user?.balance || 0}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
        <nav className="flex border-b border-gray-700">
          {[
            { key: 'videos', label: 'My Videos', icon: <Video size={20} /> },
            { key: 'purchases', label: 'My Purchases', icon: <User size={20} /> },
            { key: 'gifts', label: 'Received Gifts', icon: <Gift size={20} /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-8 py-4 font-semibold text-sm sm:text-base transition-colors duration-300 ${
                activeTab === key
                  ? 'text-indigo-400 border-b-4 border-indigo-400'
                  : 'text-gray-500 hover:text-indigo-300'
              } focus:outline-none`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        <div className="p-8 min-h-[300px]">
          {error && (
            <div className="bg-red-700 bg-opacity-30 border border-red-600 text-red-400 p-4 rounded mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-t-indigo-500 border-b-indigo-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'videos' && (
                <>
                  {videos.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 space-y-2">
                      <p className="text-2xl font-medium">You haven't uploaded any videos yet</p>
                      <p className="text-lg">Start creating content by uploading your first video!</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg">
                      <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-gray-800">
                          <tr>
                            <th className="px-8 py-3 text-left uppercase tracking-wide font-semibold text-gray-400">
                              Title
                            </th>
                            <th className="px-8 py-3 text-left uppercase tracking-wide font-semibold text-gray-400">
                              Type
                            </th>
                            <th className="px-8 py-3 text-left uppercase tracking-wide font-semibold text-gray-400">
                              Price
                            </th>
                            <th className="px-8 py-3 text-left uppercase tracking-wide font-semibold text-gray-400">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-900 divide-y divide-gray-800">
                          {videos.map((video) => (
                            <tr
                              key={video._id}
                              className="hover:bg-indigo-900 transition-colors duration-200 cursor-pointer"
                            >
                              <td className="px-8 py-4 font-medium">{video.title}</td>
                              <td className="px-8 py-4 text-indigo-300">
                                {video.videoType === 'short' ? 'Short' : 'Long'}
                              </td>
                              <td className="px-8 py-4 text-indigo-300">
                                {video.price > 0 ? `₹${video.price}` : 'Free'}
                              </td>
                              <td className="px-8 py-4 text-indigo-300">{formatDate(video.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'purchases' && (
                <>
                  {purchases.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 space-y-2">
                      <p className="text-2xl font-medium">You haven't purchased any videos yet</p>
                      <p className="text-lg">Explore and purchase premium content from creators!</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg">
                      <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-gray-800">
                          <tr>
                            <th className="px-8 py-3 text-left uppercase tracking-wide font-semibold text-gray-400">
                              Video
                            </th>
                            <th className="px-8 py-3 text-left uppercase tracking-wide font-semibold text-gray-400">
                              Type
                            </th>
                            <th className="px-8 py-3 text-left uppercase tracking-wide font-semibold text-gray-400">
                              Amount
                            </th>
                            <th className="px-8 py-3 text-left uppercase tracking-wide font-semibold text-gray-400">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-900 divide-y divide-gray-800">
                          {purchases.map((purchase) => (
                            <tr
                              key={purchase._id}
                              className="hover:bg-indigo-900 transition-colors duration-200 cursor-pointer"
                            >
                              <td className="px-8 py-4 font-medium">{purchase.video.title}</td>
                              <td className="px-8 py-4 text-indigo-300">
                                {purchase.video.videoType === 'short' ? 'Short' : 'Long'}
                              </td>
                              <td className="px-8 py-4 text-indigo-300">₹{purchase.amount}</td>
                              <td className="px-8 py-4 text-indigo-300">{formatDate(purchase.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'gifts' && (
                <>
                  {gifts.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 space-y-2">
                      <p className="text-2xl font-medium">You haven't received any gifts yet</p>
                      <p className="text-lg">Create great content to inspire viewers to send you gifts!</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg">
                      <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-gray-800">
                          <tr>
                            <th className="px-8 py-3 text-left uppercase tracking-wide font-semibold text-gray-400">
                              Video
                            </th>
                            <th className="px-8 py-3 text-left uppercase tracking-wide font-semibold text-gray-400">
                              From
                            </th>
                            <th className="px-8 py-3 text-left uppercase tracking-wide font-semibold text-yellow-400">
                              Amount
                            </th>
                            <th className="px-8 py-3 text-left uppercase tracking-wide font-semibold text-gray-400">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-900 divide-y divide-gray-800">
                          {gifts.map((gift) => (
                            <tr
                              key={gift._id}
                              className="hover:bg-indigo-900 transition-colors duration-200 cursor-pointer"
                            >
                              <td className="px-8 py-4 font-medium">{gift.video.title}</td>
                              <td className="px-8 py-4 text-indigo-300">{gift.sender.username}</td>
                              <td className="px-8 py-4 text-yellow-400 font-semibold">₹{gift.amount}</td>
                              <td className="px-8 py-4 text-indigo-300">{formatDate(gift.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
