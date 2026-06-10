'use client';

import { getApiErrorMessage } from '@/services/api';
import { postService } from '@/services/postService';
import { Comment, EntityId, Post, User } from '@/types';
import { Heart, MessageCircle, Share2, Bookmark, Loader2, Send } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
  currentUser?: User | null;
  onLikeChange?: (postId: EntityId, liked: boolean, likeCount: number) => void;
  onCommentCreated?: (postId: EntityId, commentCount: number) => void;
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
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/80">
      <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-slate-100 to-slate-200 ring-2 ring-white shadow-sm">
            {post.author?.avatar && (
              <img src={post.author.avatar} alt={post.author.fullName} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-950 transition hover:text-blue-600">
              {post.author?.fullName}
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <button
          className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="More actions"
        >
          <span className="text-xl leading-none">...</span>
        </button>
      </div>

      <div className="px-4 pb-3 sm:px-5">
        <p className="break-words text-[15px] leading-6 text-slate-800">{post.content}</p>
      </div>

      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="relative mx-4 overflow-hidden rounded-2xl bg-slate-950 sm:mx-5">
          <div className={`grid gap-1 ${post.mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {post.mediaUrls.slice(0, 4).map((mediaUrl, index) => (
              <div key={mediaUrl} className="relative aspect-square w-full bg-slate-950">
                {isVideoUrl(mediaUrl) ? (
                  <video src={mediaUrl} className="h-full w-full object-cover" controls preload="metadata" />
                ) : (
                  <img src={mediaUrl} alt={`Post media ${index + 1}`} className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
          {post.mediaUrls.length > 1 && (
            <div className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur">
              {Math.min(4, post.mediaUrls.length)}/{post.mediaUrls.length}
            </div>
          )}
        </div>
      )}

      <div className="mx-4 mt-3 flex items-center justify-between border-y border-slate-100 py-2 text-slate-500 sm:mx-5">
        <button
          onClick={handleLike}
          disabled={isLikePending}
          className={`group flex h-10 w-10 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isLiked ? 'bg-red-50 text-red-600' : 'hover:bg-red-50 hover:text-red-600'
          }`}
          aria-label={isLiked ? 'Unlike post' : 'Like post'}
        >
          <Heart size={22} className={isLiked ? 'fill-red-600 text-red-600' : 'group-hover:text-red-600'} />
        </button>
        <button
          onClick={handleToggleComments}
          className={`group flex h-10 w-10 items-center justify-center rounded-full transition ${
            commentsOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-blue-50 hover:text-blue-600'
          }`}
          aria-label="Toggle comments"
        >
          <MessageCircle size={22} />
        </button>
        <button
          className="group flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-emerald-50 hover:text-emerald-600"
          aria-label="Share post"
        >
          <Share2 size={22} />
        </button>
        <button
          onClick={() => setIsSaved(!isSaved)}
          className={`group ml-auto flex h-10 w-10 items-center justify-center rounded-full transition ${
            isSaved ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
          aria-label={isSaved ? 'Unsave post' : 'Save post'}
        >
          <Bookmark size={22} className={isSaved ? 'fill-slate-900 text-slate-900' : ''} />
        </button>
      </div>

      <div className="px-4 py-3 sm:px-5">
        {likeCount > 0 && <p className="text-sm font-semibold text-slate-950">{likeCount.toLocaleString()} likes</p>}
        {commentCount > 0 && (
          <button type="button" onClick={handleToggleComments} className="mt-1 text-sm text-slate-500 hover:text-slate-900">
            View all {commentCount} comments
          </button>
        )}
      </div>

      {(actionError || commentsOpen) && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-5">
          {actionError && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{actionError}</p>}

          {commentsOpen && (
            <div className="space-y-3">
              {commentsLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Loading comments...</span>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-white">
                        {comment.author.avatar && (
                          <img
                            src={comment.author.avatar}
                            alt={comment.author.fullName}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200/70">
                          <p className="text-sm font-semibold text-slate-950">{comment.author.fullName}</p>
                          <p className="break-words text-sm leading-5 text-slate-700">{comment.content}</p>
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-sm text-slate-500">No comments yet</p>
              )}

              <form onSubmit={handleCreateComment} className="flex items-center gap-2 pt-1">
                <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-white">
                  {currentUser?.avatar && (
                    <img src={currentUser.avatar} alt={currentUser.fullName} className="h-full w-full object-cover" />
                  )}
                </div>
                <input
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Add a comment..."
                  className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  disabled={isCommenting}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isCommenting}
                  className="rounded-full bg-blue-600 p-2.5 text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
