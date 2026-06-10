'use client';

import { getApiErrorMessage } from '@/services/api';
import { postService } from '@/services/postService';
import { Comment, Post, User } from '@/types';
import { Heart, MessageCircle, Share2, Bookmark, Loader2, Send } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
  currentUser?: User | null;
  onLikeChange?: (postId: number, liked: boolean, likeCount: number) => void;
  onCommentCreated?: (postId: number, commentCount: number) => void;
}

export const PostCard = ({ post, currentUser, onLikeChange, onCommentCreated }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [isSaved, setIsSaved] = useState(false);
  const [isLikePending, setIsLikePending] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setLikeCount(post.likeCount);
    setCommentCount(post.commentCount);
  }, [post.isLiked, post.likeCount, post.commentCount]);

  useEffect(() => {
    setComments([]);
    setCommentsLoaded(false);
    setCommentsOpen(false);
    setCommentText('');
    setActionError(null);
  }, [post.id]);

  const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);

  const handleLike = async () => {
    if (isLikePending) return;

    if (!currentUser) {
      setActionError('Please sign in to like this post.');
      return;
    }

    const previousLiked = isLiked;
    const previousLikeCount = likeCount;
    const nextLiked = !previousLiked;
    const nextLikeCount = Math.max(0, previousLikeCount + (nextLiked ? 1 : -1));

    setActionError(null);
    setIsLikePending(true);
    setIsLiked(nextLiked);
    setLikeCount(nextLikeCount);

    try {
      const response = nextLiked
        ? await postService.likePost(post.id, currentUser.id)
        : await postService.unlikePost(post.id, currentUser.id);

      setIsLiked(response.liked);
      setLikeCount(response.likeCount);
      onLikeChange?.(post.id, response.liked, response.likeCount);
    } catch (error) {
      setIsLiked(previousLiked);
      setLikeCount(previousLikeCount);
      setActionError(getApiErrorMessage(error, nextLiked ? 'Like failed.' : 'Unlike failed.'));
    } finally {
      setIsLikePending(false);
    }
  };

  const loadComments = async () => {
    if (commentsLoaded || commentsLoading) return;

    setCommentsLoading(true);
    setActionError(null);

    try {
      const loadedComments = await postService.getComments(post.id);
      setComments(loadedComments);
      setCommentsLoaded(true);
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Load comments failed.'));
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleToggleComments = async () => {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);

    if (nextOpen) {
      await loadComments();
    }
  };

  const handleCreateComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = commentText.trim();
    if (!content || isCommenting) return;

    if (!currentUser) {
      setActionError('Please sign in to comment.');
      return;
    }

    setIsCommenting(true);
    setActionError(null);

    try {
      const result = await postService.createComment(post.id, currentUser, content);
      setComments((prev) => [result.comment, ...prev]);
      setCommentsLoaded(true);
      setCommentsOpen(true);
      setCommentText('');
      setCommentCount(result.commentCount);
      onCommentCreated?.(post.id, result.commentCount);
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Create comment failed.'));
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <article className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-100">
            {post.author?.avatar && (
              <img src={post.author.avatar} alt={post.author.fullName} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="flex-1">
            <p className="cursor-pointer text-sm font-semibold hover:underline">{post.author?.fullName}</p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <button className="rounded-full p-2 transition hover:bg-gray-100" aria-label="More actions">
          <span className="text-xl leading-none text-gray-500">...</span>
        </button>
      </div>

      <div className="px-4 py-2">
        <p className="break-words text-sm text-gray-900">{post.content}</p>
      </div>

      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="relative bg-black">
          <div className={`grid gap-1 ${post.mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {post.mediaUrls.slice(0, 4).map((mediaUrl, index) => (
              <div key={mediaUrl} className="relative aspect-square w-full bg-black">
                {isVideoUrl(mediaUrl) ? (
                  <video src={mediaUrl} className="h-full w-full object-cover" controls preload="metadata" />
                ) : (
                  <img src={mediaUrl} alt={`Post media ${index + 1}`} className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
          {post.mediaUrls.length > 1 && (
            <div className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white">
              {Math.min(4, post.mediaUrls.length)}/{post.mediaUrls.length}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between px-4 py-3 text-gray-600">
        <button
          onClick={handleLike}
          disabled={isLikePending}
          className="group flex items-center gap-2 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={isLiked ? 'Unlike post' : 'Like post'}
        >
          <Heart size={24} className={isLiked ? 'fill-red-600 text-red-600' : 'group-hover:text-red-600'} />
        </button>
        <button
          onClick={handleToggleComments}
          className="group flex items-center gap-2 transition-colors hover:text-gray-900"
          aria-label="Toggle comments"
        >
          <MessageCircle size={24} className="group-hover:text-gray-900" />
        </button>
        <button className="group flex items-center gap-2 transition-colors hover:text-gray-900" aria-label="Share post">
          <Share2 size={24} className="group-hover:text-gray-900" />
        </button>
        <button
          onClick={() => setIsSaved(!isSaved)}
          className="group ml-auto flex items-center gap-2 transition-colors hover:text-gray-900"
          aria-label={isSaved ? 'Unsave post' : 'Save post'}
        >
          <Bookmark size={24} className={isSaved ? 'fill-gray-900 text-gray-900' : 'group-hover:text-gray-900'} />
        </button>
      </div>

      <div className="px-4 py-2">
        {likeCount > 0 && <p className="text-sm font-semibold text-gray-900">{likeCount.toLocaleString()} likes</p>}
        {commentCount > 0 && (
          <button type="button" onClick={handleToggleComments} className="mt-1 text-sm text-gray-600 hover:text-gray-900">
            View all {commentCount} comments
          </button>
        )}
      </div>

      {(actionError || commentsOpen) && (
        <div className="border-t border-gray-100 px-4 py-3">
          {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}

          {commentsOpen && (
            <div className="space-y-3">
              {commentsLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Loading comments...</span>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                        {comment.author.avatar && (
                          <img
                            src={comment.author.avatar}
                            alt={comment.author.fullName}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="rounded-lg bg-gray-50 px-3 py-2">
                          <p className="text-sm font-semibold text-gray-900">{comment.author.fullName}</p>
                          <p className="break-words text-sm text-gray-800">{comment.content}</p>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-sm text-gray-500">No comments yet</p>
              )}

              <form onSubmit={handleCreateComment} className="flex items-center gap-2 pt-1">
                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {currentUser?.avatar && (
                    <img src={currentUser.avatar} alt={currentUser.fullName} className="h-full w-full object-cover" />
                  )}
                </div>
                <input
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Add a comment..."
                  className="min-w-0 flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none transition focus:border-blue-400"
                  disabled={isCommenting}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isCommenting}
                  className="rounded-full bg-blue-500 p-2 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send comment"
                >
                  {isCommenting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </article>
  );
};
