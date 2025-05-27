import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config/constants';
import { Send, MessageSquare, Trash2, Heart } from 'lucide-react';

interface Comment {
  _id: string;
  text: string;
  likes: number;
  likedByUser: boolean;
  user: {
    _id: string;
    username: string;
  };
  createdAt: string;
}

interface CommentSectionProps {
  videoId: string;
  videoOwnerId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ videoId, videoOwnerId }) => {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  const fetchComments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/api/videos/${videoId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(res.data);
    } catch (err) {
      setError('Failed to load comments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videoId && token) fetchComments();
  }, [videoId, token]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await axios.post(
        `${API_URL}/api/videos/${videoId}/comments`,
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments([res.data, ...comments]);
      setCommentText('');
    } catch (err) {
      setError('Failed to post comment');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

const handleDeleteComment = async (commentId: string) => {
  const confirmed = window.confirm('Are you sure you want to delete this comment?');
  if (!confirmed) return; // User cancelled deletion

  setError(''); // clear previous errors

  try {
    await axios.delete(`${API_URL}/api/videos/${videoId}/comments/${commentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setComments(comments.filter((comment) => comment._id !== commentId));
  } catch (err: any) {
    if (err.response) {
      setError(`Failed to delete comment: ${err.response.status} ${err.response.data.message || ''}`);
      console.error('Delete comment error response:', err.response.data);
    } else if (err.request) {
      setError('Failed to delete comment: No response from server');
      console.error('Delete comment no response:', err.request);
    } else {
      setError(`Failed to delete comment: ${err.message}`);
      console.error('Delete comment error:', err.message);
    }
  }
};

  const toggleLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment._id === commentId) {
          const liked = !comment.likedByUser;
          const likesCount = liked ? comment.likes + 1 : comment.likes - 1;
          return { ...comment, likedByUser: liked, likes: likesCount };
        }
        return comment;
      })
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredComments =
    filter === 'mine' ? comments.filter((c) => c.user._id === user?._id) : comments;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
        <MessageSquare size={20} className="mr-2" />
        Comments
      </h3>

      <div className="mb-4 flex space-x-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full font-semibold transition ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All Comments
        </button>
        <button
          onClick={() => setFilter('mine')}
          className={`px-4 py-2 rounded-full font-semibold transition ${
            filter === 'mine' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          My Comments
        </button>
      </div>

      <form onSubmit={handleSubmitComment} className="mb-8">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold">
            {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary text-white resize-none"
              rows={3}
              required
            ></textarea>
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-full text-sm font-medium transition duration-300 ease-in-out flex items-center disabled:opacity-50"
              >
                {submitting ? 'Posting...' : <><Send size={16} className="mr-2" />Post Comment</>}
              </button>
            </div>
          </div>
        </div>
      </form>

      {error && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredComments.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No comments yet. Be the first to comment!</p>
        ) : (
          filteredComments.map((comment) => {
            const canDelete = user?._id === comment.user._id || user?._id === videoOwnerId;

            return (
              <div
                key={comment._id}
                className="flex space-x-3 p-3 rounded-lg hover:bg-gray-700 transition"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold">
                  {comment.user.username ? comment.user.username.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className="font-medium text-white">{comment.user.username}</span>
                      <span className="text-xs text-gray-400 ml-2">{formatDate(comment.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-gray-400 hover:text-red-500 transition focus:outline-none"
                          aria-label="Delete comment"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-300 break-words">{comment.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommentSection;
