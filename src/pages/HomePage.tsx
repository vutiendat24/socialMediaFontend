import { useEffect, useMemo, useRef, useState } from 'react'
import { Globe2, Heart, Image, Loader2, Lock, MessageCircle, RotateCcw, Users, Video, X } from 'lucide-react'
import { PostCard } from '../components/PostCard'
import { currentUser as mockUser, mockPosts } from '../data/mockData'
import { authService } from '@/services/authService'
import { mediaService } from '@/services/mediaService'
import { postService } from '@/services/postService'
import { Post } from '@/types'

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
  const [posts, setPosts] = useState(mockPosts)
  const [caption, setCaption] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC')
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const selectedMediaRef = useRef<SelectedMedia[]>([])

  const currentUser = authService.getStoredUser() ?? mockUser
  const hasUploadingMedia = selectedMedia.some((media) => media.status === 'uploading')
  const hasFailedMedia = selectedMedia.some((media) => media.status === 'failed')
  const uploadedMediaIds = selectedMedia
    .map((media) => media.mediaId)
    .filter((mediaId): mediaId is number => Boolean(mediaId))
  const canSubmit =
    !isSubmitting &&
    !hasUploadingMedia &&
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

  const updateMedia = (mediaId: string, changes: Partial<SelectedMedia>) => {
    setSelectedMedia((prev) =>
      prev.map((media) => (media.id === mediaId ? { ...media, ...changes } : media))
    )
  }

  const uploadMediaItem = async (media: SelectedMedia) => {
    if (media.status === 'uploaded' && media.mediaId) {
      return media.mediaId
    }

    updateMedia(media.id, { status: 'uploading', progress: 0, error: undefined })

    try {
      const uploadedMediaId = await mediaService.uploadViaPresignedUrl(
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
        mediaId: uploadedMediaId,
        error: undefined,
      })

      return uploadedMediaId
    } catch (error) {
      const message = getReadableError(error, 'Upload file that bai.')
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

    // const token = localStorage.getItem('accessToken')
    // nho chinh lai 
    const token = "dsfsdfdsfsdf sdfsd"
    if (!token) {
      setFormError('Token thieu hoac da het han. Vui long dang nhap lai.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)
    setSuccessMessage(null)

    try {
      const createdPost = await postService.createPost({
        userId: currentUser.id,
        content: caption.trim(),
        visibility,
        mediaIds: uploadedMediaIds,
      })

      const newPost: Post = {
        ...createdPost,
        id: createdPost.id ?? Math.max(...posts.map((post) => post.id), 0) + 1,
        userId: createdPost.userId ?? currentUser.id,
        content: createdPost.content ?? caption,
        mediaUrls: createdPost.mediaUrls ?? [],
        likeCount: createdPost.likeCount ?? 0,
        commentCount: createdPost.commentCount ?? 0,
        shareCount: createdPost.shareCount ?? 0,
        visibility: createdPost.visibility ?? visibility,
        createdAt: createdPost.createdAt ?? new Date().toISOString(),
        updatedAt: createdPost.updatedAt ?? new Date().toISOString(),
        author: createdPost.author ?? currentUser,
      }

      setPosts((prev) => [newPost, ...prev])
      selectedMedia.forEach((media) => URL.revokeObjectURL(media.previewUrl))
      setCaption('')
      setVisibility('PUBLIC')
      setSelectedMedia([])
      setSuccessMessage('Dang bai thanh cong.')
    } catch (error) {
      setFormError(getReadableError(error, 'Tao bai viet that bai.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    setSuccessMessage(null)

    if (files.length === 0) return

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
    // nho chinh lai 
    // const token = localStorage.getItem('accessToken')
    const token = "dsfsdfdsfsdf sdfsd"
    if (!token) {
      setFormError('Token thieu hoac da het han. Vui long dang nhap lai.')
      return
    }

    mediaItems.forEach((media) => {
      uploadMediaItem(media).catch((error) => {
        setFormError(getReadableError(error, 'Upload file that bai.'))
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
      setFormError(getReadableError(error, 'Upload file that bai.'))
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

  const handleLike = (postId: number) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, likeCount: post.likeCount + 1 } : post
      )
    )
  }

  const handleComment = (postId: number) => {
    console.log('Comment on post:', postId)
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
              placeholder="Share your moment..."
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
        {posts.length === 0 ? (
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
              onLike={() => handleLike(post.id)}
              onComment={() => handleComment(post.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
