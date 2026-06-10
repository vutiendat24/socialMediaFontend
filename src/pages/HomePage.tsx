import { useEffect, useMemo, useRef, useState } from 'react'
import { Globe2, Heart, Image, Loader2, Lock, MessageCircle, RotateCcw, Users, Video, X } from 'lucide-react'
import { PostCard } from '../components/PostCard'
import { authService } from '@/services/authService'
import { getApiErrorMessage } from '@/services/api'
import type { User as AuthUser } from '@/services/authService'
import { mediaService, type UploadedMedia } from '@/services/mediaService'
import { postService } from '@/services/postService'
import { useAuthStore } from '@/store/authStore'
import type { Post, User } from '@/types'

type Visibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE'
type MediaStatus = 'pending' | 'uploading' | 'uploaded' | 'failed'

interface SelectedMedia {
  id: string
  file: File
  name: string
  type: 'image' | 'video'
  previewUrl: string
  progress: number
  status: MediaStatus
  mediaId?: number
  mediaUrl?: string
  fileType?: string
  error?: string
}

const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4']
const maxFileSize = 20 * 1024 * 1024

const formatFileSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`

const getReadableError = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

const getAccessToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

type StoredUser = AuthUser & Partial<Pick<User, 'postCount' | 'updatedAt'>>

const toPostAuthor = (user: AuthUser): User => {
  const storedUser = user as StoredUser

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName || user.username,
    bio: user.bio ?? undefined,
    avatar: user.avatar ?? undefined,
    coverImage: user.coverImage ?? undefined,
    followerCount: user.followerCount ?? 0,
    followingCount: user.followingCount ?? 0,
    postCount: storedUser.postCount ?? 0,
    createdAt: user.createdAt,
    updatedAt: storedUser.updatedAt ?? user.createdAt,
  }
}

const validateFile = (file: File) => {
  if (!allowedTypes.includes(file.type)) {
    return `${file.name}: chi cho phep JPEG, PNG, GIF, WebP hoac MP4.`
  }

  if (file.size > maxFileSize) {
    return `${file.name}: dung luong ${formatFileSize(file.size)} vuot qua gioi han 20MB.`
  }

  return null
}

const visibilityOptions: Array<{ value: Visibility; label: string; icon: typeof Globe2 }> = [
  { value: 'PUBLIC', label: 'Public', icon: Globe2 },
  { value: 'FRIENDS', label: 'Friends', icon: Users },
  { value: 'PRIVATE', label: 'Private', icon: Lock },
]

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [caption, setCaption] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC')
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([])
  const [isFeedLoading, setIsFeedLoading] = useState(false)
  const [feedError, setFeedError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const selectedMediaRef = useRef<SelectedMedia[]>([])
  const authUser = useAuthStore((state) => state.user)

  const currentUser = authUser ?? authService.getStoredUser()
  const currentPostAuthor = currentUser ? toPostAuthor(currentUser) : null
  const hasAccessToken = Boolean(getAccessToken())
  const hasUploadingMedia = selectedMedia.some((media) => media.status === 'uploading')
  const hasPendingMedia = selectedMedia.some((media) => media.status === 'pending')
  const hasFailedMedia = selectedMedia.some((media) => media.status === 'failed')
  const uploadedMediaIds = selectedMedia
    .map((media) => media.mediaId)
    .filter((mediaId): mediaId is number => typeof mediaId === 'number')
  const canSubmit =
    Boolean(currentUser && hasAccessToken) &&
    !isSubmitting &&
    !hasUploadingMedia &&
    !hasPendingMedia &&
    !hasFailedMedia &&
    (caption.trim().length > 0 || uploadedMediaIds.length > 0)

  const statusSummary = useMemo(() => {
    if (isSubmitting) return 'Dang xu ly bai viet...'
    if (hasUploadingMedia) return 'Dang upload tep...'
    if (hasFailedMedia) return 'Co tep upload loi, ban co the thu lai.'
    if (successMessage) return successMessage
    return null
  }, [hasFailedMedia, hasUploadingMedia, isSubmitting, successMessage])

  useEffect(() => {
    selectedMediaRef.current = selectedMedia
  }, [selectedMedia])

  useEffect(() => {
    return () => {
      selectedMediaRef.current.forEach((media) => URL.revokeObjectURL(media.previewUrl))
    }
  }, [])

  useEffect(() => {
    if (!currentUser || !hasAccessToken) {
      setPosts([])
      setFeedError('Vui long dang nhap de xem bai viet.')
      setIsFeedLoading(false)
      return
    }

    let isCurrent = true
    setIsFeedLoading(true)
    setFeedError(null)

    postService
      .getFeed(currentUser.id)
      .then((response) => {
        if (!isCurrent) return
        setPosts(response.items)
      })
      .catch((error) => {
        if (!isCurrent) return
        setPosts([])
        setFeedError(getApiErrorMessage(error, 'Khong tai duoc danh sach bai viet.'))
      })
      .finally(() => {
        if (isCurrent) {
          setIsFeedLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [currentUser?.id, hasAccessToken])

  const updateMedia = (mediaId: string, changes: Partial<SelectedMedia>) => {
    setSelectedMedia((prev) =>
      prev.map((media) => (media.id === mediaId ? { ...media, ...changes } : media))
    )
  }

  const uploadMediaItem = async (media: SelectedMedia): Promise<UploadedMedia> => {
    if (!currentUser) {
      throw new Error('Vui long dang nhap lai truoc khi upload file.')
    }

    if (media.status === 'uploaded' && media.mediaId && media.mediaUrl && media.fileType) {
      return {
        mediaId: media.mediaId,
        mediaUrl: media.mediaUrl,
        fileType: media.fileType,
      }
    }

    updateMedia(media.id, { status: 'uploading', progress: 0, error: undefined })

    try {
      const uploadedMedia = await mediaService.uploadViaPresignedUrl(
        currentUser.id,
        media.file,
        (progressEvent) => {
          const total = progressEvent.total ?? media.file.size
          const progress = Math.min(99, Math.round((progressEvent.loaded / total) * 100))
          updateMedia(media.id, { progress })
        }
      )

      updateMedia(media.id, {
        status: 'uploaded',
        progress: 100,
        mediaId: uploadedMedia.mediaId,
        mediaUrl: uploadedMedia.mediaUrl,
        fileType: uploadedMedia.fileType,
        error: undefined,
      })

      return uploadedMedia
    } catch (error) {
      const message = getApiErrorMessage(error, 'Upload file that bai.')
      updateMedia(media.id, { status: 'failed', progress: 0, error: message })
      throw new Error(`${media.name}: ${message}`)
    }
  }

  const handleCreatePost = async () => {
    if (isSubmitting || hasUploadingMedia) {
      setFormError('Upload hoac tao bai dang chay, vui long doi hoan tat.')
      return
    }

    if (!caption.trim() && selectedMedia.length === 0) {
      setFormError('Nhap noi dung hoac chon it nhat mot anh/video.')
      return
    }

    const token = getAccessToken()
    if (!currentUser || !currentPostAuthor || !token) {
      setFormError('Phien dang nhap thieu hoac da het han. Vui long dang nhap lai.')
      return
    }

    const mediaIds = selectedMedia
      .map((media) => media.mediaId)
      .filter((mediaId): mediaId is number => typeof mediaId === 'number')
    const media = selectedMedia
      .filter((item): item is SelectedMedia & { mediaId: number; mediaUrl: string } =>
        typeof item.mediaId === 'number' && typeof item.mediaUrl === 'string'
      )
      .map((item) => ({
        mediaId: item.mediaId,
        mediaUrl: item.mediaUrl,
        fileType: item.fileType ?? item.file.type,
      }))

    if (selectedMedia.length > 0 && media.length !== selectedMedia.length) {
      setFormError('Vui long doi upload file hoan tat truoc khi dang bai.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)
    setSuccessMessage(null)

    try {
      const createdPost = await postService.createPost({
        userId: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.fullName,
        avatarUrl: currentUser.avatar ?? undefined,
        content: caption.trim(),
        visibility,
        mediaIds,
        media,
      })

      const newPostUserId = createdPost.userId ?? currentUser.id
      const newPostAuthor =
        newPostUserId === currentUser.id
          ? { ...currentPostAuthor, postCount: currentPostAuthor.postCount + 1 }
          : createdPost.author

      const newPost: Post = {
        ...createdPost,
        id: createdPost.id ?? Math.max(...posts.map((post) => post.id), 0) + 1,
        userId: newPostUserId,
        content: createdPost.content ?? caption,
        mediaUrls: createdPost.mediaUrls ?? [],
        likeCount: createdPost.likeCount ?? 0,
        commentCount: createdPost.commentCount ?? 0,
        shareCount: createdPost.shareCount ?? 0,
        visibility: createdPost.visibility ?? visibility,
        createdAt: createdPost.createdAt ?? new Date().toISOString(),
        updatedAt: createdPost.updatedAt ?? new Date().toISOString(),
        author: newPostAuthor,
      }

      setPosts((prev) => [newPost, ...prev])
      selectedMedia.forEach((media) => URL.revokeObjectURL(media.previewUrl))
      setCaption('')
      setVisibility('PUBLIC')
      setSelectedMedia([])
      setSuccessMessage('Dang bai thanh cong.')
    } catch (error) {
      setFormError(getApiErrorMessage(error, getReadableError(error, 'Tao bai viet that bai.')))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    setSuccessMessage(null)

    if (files.length === 0) return

    if (!currentUser || !getAccessToken()) {
      setFormError('Phien dang nhap thieu hoac da het han. Vui long dang nhap lai.')
      return
    }

    const errors = files.map(validateFile).filter((error): error is string => Boolean(error))
    const validFiles = files.filter((file) => !validateFile(file))

    if (errors.length > 0) {
      setFormError(errors.join(' '))
    } else {
      setFormError(null)
    }

    if (validFiles.length === 0) return

    const mediaItems: SelectedMedia[] = validFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      name: file.name,
      type: file.type === 'video/mp4' ? 'video' : 'image',
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
    }))

    setSelectedMedia((prev) => [...prev, ...mediaItems])

    mediaItems.forEach((media) => {
      uploadMediaItem(media).catch((error) => {
        setFormError(getApiErrorMessage(error, getReadableError(error, 'Upload file that bai.')))
      })
    })
  }

  const handleRetryMedia = async (mediaId: string) => {
    const media = selectedMedia.find((item) => item.id === mediaId)
    if (!media || isSubmitting || media.status === 'uploading') return

    setFormError(null)
    setSuccessMessage(null)

    try {
      await uploadMediaItem(media)
    } catch (error) {
      setFormError(getApiErrorMessage(error, getReadableError(error, 'Upload file that bai.')))
    }
  }

  const handleRemoveMedia = (mediaId: string) => {
    setSelectedMedia((prev) => {
      const media = prev.find((item) => item.id === mediaId)
      if (media) {
        URL.revokeObjectURL(media.previewUrl)
      }

      return prev.filter((item) => item.id !== mediaId)
    })
  }

  const handleLikeChange = (postId: number, liked: boolean, nextLikeCount: number) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, isLiked: liked, likeCount: nextLikeCount } : post
      )
    )
  }

  const handleCommentCreated = (postId: number, nextCommentCount: number) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, commentCount: nextCommentCount } : post
      )
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl border-l border-r border-gray-200">
      <div className="border-b border-gray-200 bg-white/80 p-4 backdrop-blur">
        <div className="flex gap-4">
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-300">
            {currentUser?.avatar && (
              <img src={currentUser.avatar} alt={currentUser.fullName} className="h-full w-full object-cover" />
            )}
          </div>

          <div className="flex-1">
            <textarea
              value={caption}
              onChange={(event) => {
                setCaption(event.target.value)
                setFormError(null)
                setSuccessMessage(null)
              }}
              placeholder={currentUser ? 'Share your moment...' : 'Dang nhap de dang bai...'}
              className="w-full resize-none text-xl outline-none placeholder-gray-500"
              rows={3}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {visibilityOptions.map((option) => {
                const Icon = option.icon
                const active = visibility === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                      active
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                    {option.label}
                  </button>
                )
              })}
            </div>

            {selectedMedia.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {selectedMedia.map((media) => (
                  <div key={media.id} className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                    {media.type === 'video' ? (
                      <video
                        src={media.previewUrl}
                        className="h-48 w-full object-cover"
                        controls={media.status !== 'uploading'}
                        muted
                      />
                    ) : (
                      <img src={media.previewUrl} alt={media.name} className="h-48 w-full object-cover" />
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(media.id)}
                      disabled={media.status === 'uploading' || isSubmitting}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>

                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white">
                      {media.type === 'video' ? <Video size={14} /> : <Image size={14} />}
                      {media.status}
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 rounded bg-black/65 px-2 py-1.5 text-xs text-white">
                      <p className="truncate font-semibold">{media.name}</p>
                      <p>{formatFileSize(media.file.size)}</p>
                    </div>

                    {(media.status === 'uploading' || media.status === 'failed' || media.status === 'uploaded') && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 px-4 text-center text-white">
                        {media.status === 'uploading' && (
                          <>
                            <Loader2 size={28} className="mb-3 animate-spin" />
                            <p className="text-sm font-semibold">Uploading {media.progress}%</p>
                            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/30">
                              <div
                                className="h-full rounded-full bg-blue-400 transition-all"
                                style={{ width: `${media.progress}%` }}
                              />
                            </div>
                          </>
                        )}

                        {media.status === 'uploaded' && (
                          <p className="rounded-full bg-emerald-500 px-3 py-1 text-sm font-semibold">Uploaded</p>
                        )}

                        {media.status === 'failed' && (
                          <>
                            <p className="text-sm font-semibold">{media.error}</p>
                            <button
                              type="button"
                              onClick={() => handleRetryMedia(media.id)}
                              className="mt-3 flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
                            >
                              <RotateCcw size={15} />
                              Retry
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {(formError || statusSummary) && (
              <div className="mt-3 text-sm">
                {formError && <p className="text-red-600">{formError}</p>}
                {!formError && statusSummary && (
                  <p className={successMessage ? 'text-emerald-600' : 'text-gray-500'}>{statusSummary}</p>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="flex gap-4 text-blue-500">
                <label className="cursor-pointer rounded-full p-2 transition hover:bg-blue-50">
                  <Image size={20} />
                  <input
                    type="file"
                    accept={allowedTypes.join(',')}
                    multiple
                    onChange={handleMediaSelect}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                </label>
                <button className="rounded-full p-2 transition hover:bg-blue-50">
                  <Heart size={20} />
                </button>
              </div>

              <button
                onClick={handleCreatePost}
                disabled={!canSubmit}
                className="flex items-center gap-2 rounded-full bg-blue-500 px-8 py-2 font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {(isSubmitting || hasUploadingMedia) && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting || hasUploadingMedia ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        {isFeedLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
            <Loader2 size={22} className="animate-spin" />
            <span>Dang tai bai viet...</span>
          </div>
        ) : feedError ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <MessageCircle size={48} className="mb-4 text-gray-300" />
            <p className="text-lg text-gray-700">{feedError}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle size={48} className="mb-4 text-gray-300" />
            <p className="text-lg text-gray-500">No posts yet</p>
            <p className="text-gray-400">Be the first to share a moment</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentPostAuthor}
              onLikeChange={handleLikeChange}
              onCommentCreated={handleCommentCreated}
            />
          ))
        )}
      </div>
    </div>
  )
}
