'use client';

import { Post } from '@/types';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
}

export const PostCard = ({ post, onLike, onComment }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isSaved, setIsSaved] = useState(false);

  const isVideoUrl = (url: string) => {
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
  };

  const handleLike = () => {
    if (!isLiked) {
      setLikeCount(likeCount + 1);
    } else {
      setLikeCount(likeCount - 1);
    }
    setIsLiked(!isLiked);
    onLike?.();
  };

  return (
    <article className="border-b border-gray-200 bg-white">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100">
            {post.author?.avatar && (
              <img
                src={post.author.avatar}
                alt={post.author.fullName}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm hover:underline cursor-pointer">
              {post.author?.fullName}
            </p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full transition">
          <span className="text-xl text-gray-500">•••</span>
        </button>
      </div>

      {/* Caption */}
      <div className="px-4 py-2">
        <p className="text-sm text-gray-900 break-words">{post.content}</p>
      </div>

      {/* Media */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="relative bg-black">
          <div className={`grid gap-1 ${post.mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {post.mediaUrls.slice(0, 4).map((mediaUrl, index) => (
              <div key={mediaUrl} className="relative w-full bg-black aspect-square">
                {isVideoUrl(mediaUrl) ? (
                  <video
                    src={mediaUrl}
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={`Post media ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
          {post.mediaUrls.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded">
              {Math.min(4, post.mediaUrls.length)}/{post.mediaUrls.length}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex justify-between text-gray-600">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 hover:text-red-600 transition-colors group"
        >
          <Heart
            size={24}
            className={isLiked ? 'fill-red-600 text-red-600' : 'group-hover:text-red-600'}
          />
        </button>
        <button
          onClick={onComment}
          className="flex items-center gap-2 hover:text-gray-900 transition-colors group"
        >
          <MessageCircle size={24} className="group-hover:text-gray-900" />
        </button>
        <button className="flex items-center gap-2 hover:text-gray-900 transition-colors group">
          <Share2 size={24} className="group-hover:text-gray-900" />
        </button>
        <button
          onClick={() => setIsSaved(!isSaved)}
          className="flex items-center gap-2 hover:text-gray-900 transition-colors group ml-auto"
        >
          <Bookmark
            size={24}
            className={isSaved ? 'fill-gray-900 text-gray-900' : 'group-hover:text-gray-900'}
          />
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 py-2">
        {likeCount > 0 && (
          <p className="text-sm font-semibold text-gray-900">
            {likeCount.toLocaleString()} likes
          </p>
        )}
        {post.commentCount > 0 && (
          <button className="text-sm text-gray-600 hover:text-gray-900 mt-1">
            View all {post.commentCount} comments
          </button>
        )}
      </div>
    </article>
  );
};
