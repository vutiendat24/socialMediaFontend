import { useCallback, useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Heart, Loader2, MessageCircle, Share2, UserPlus } from 'lucide-react'
import { getApiErrorMessage } from '@/services/api'
import { notificationService, type NotificationDto } from '@/services/notificationService'
import { useAuthStore } from '@/store/authStore'

const POLL_INTERVAL_MS = 3000

export default function NotificationsPage() {
  const currentUser = useAuthStore((state) => state.user)
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadNotifications = useCallback(
    async (showSpinner = false) => {
      if (!currentUser) {
        setNotifications([])
        setError('Vui long dang nhap de xem thong bao.')
        return
      }

      if (showSpinner) {
        setIsLoading(true)
      }
      setError(null)

      try {
        const items = await notificationService.getNotifications(String(currentUser.id))
        setNotifications(items)
      } catch (err) {
        setNotifications([])
        setError(getApiErrorMessage(err, 'Khong tai duoc thong bao.'))
      } finally {
        if (showSpinner) {
          setIsLoading(false)
        }
      }
    },
    [currentUser?.id],
  )

  useEffect(() => {
    if (!currentUser) {
      setNotifications([])
      setError('Vui long dang nhap de xem thong bao.')
      return
    }

    loadNotifications(true)
    const intervalId = window.setInterval(() => {
      loadNotifications(false)
    }, POLL_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [currentUser?.id, loadNotifications])

  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'POST_CREATED':
        return <FileText size={20} className="text-blue-500" />
      case 'LIKE':
        return <Heart size={20} className="text-red-500" />
      case 'FOLLOW':
      case 'FRIEND_REQUEST':
      case 'FRIEND_ACCEPTED':
        return <UserPlus size={20} className="text-blue-500" />
      case 'COMMENT':
        return <MessageCircle size={20} className="text-blue-500" />
      case 'SHARE':
        return <Share2 size={20} className="text-green-500" />
      default:
        return <Heart size={20} className="text-gray-500" />
    }
  }

  const getColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'POST_CREATED':
        return 'hover:bg-blue-50'
      case 'LIKE':
        return 'hover:bg-red-50'
      case 'FOLLOW':
      case 'FRIEND_REQUEST':
      case 'FRIEND_ACCEPTED':
      case 'COMMENT':
        return 'hover:bg-blue-50'
      case 'SHARE':
        return 'hover:bg-green-50'
      default:
        return 'hover:bg-gray-50'
    }
  }

  const getActorName = (notification: NotificationDto) =>
    notification.actorDisplayName ||
    notification.actorUsername ||
    (notification.actorId ? `User ${notification.actorId}` : notification.type)

  const getActorInitials = (notification: NotificationDto) => {
    const name = getActorName(notification).trim()
    if (!name) return notification.type.slice(0, 1).toUpperCase()
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  const getDescription = (notification: NotificationDto) => {
    const type = notification.type.toUpperCase()
    if (type === 'COMMENT') {
      return notification.contentPreview?.trim() || notification.message
    }

    if (type !== 'POST_CREATED') {
      return notification.message
    }

    return notification.contentPreview?.trim() || notification.message
  }

  const handleMarkAsRead = async (notification: NotificationDto) => {
    if (notification.readFlag) return

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, readFlag: true } : item,
      ),
    )

    try {
      await notificationService.markAsRead(notification.id)
    } catch {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, readFlag: false } : item,
        ),
      )
    }
  }

  return (
    <div className="max-w-2xl mx-auto border-l border-r border-gray-200 min-h-screen">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-20">
        <h1 className="text-xl font-bold">Notifications</h1>
      </div>

      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
            <Loader2 size={22} className="animate-spin" />
            <span>Dang tai thong bao...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-gray-500">
            <Heart size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Heart size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              role="button"
              tabIndex={0}
              onClick={() => handleMarkAsRead(notification)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleMarkAsRead(notification)
                }
              }}
              className={`px-4 py-3 flex items-center justify-between gap-3 transition cursor-pointer ${
                notification.readFlag ? 'bg-white' : 'bg-blue-50/40'
              } ${getColor(notification.type)}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex-shrink-0">{getIcon(notification.type)}</div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-semibold text-gray-500">
                  {notification.actorAvatarUrl ? (
                    <img
                      src={notification.actorAvatarUrl}
                      alt={getActorName(notification)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getActorInitials(notification)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {notification.type.toUpperCase() === 'POST_CREATED' ? (
                    <>
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {getActorName(notification)} vua dang bai viet moi
                      </p>
                      <p className="line-clamp-2 text-sm text-gray-700">
                        {getDescription(notification)}
                      </p>
                    </>
                  ) : notification.type.toUpperCase() === 'COMMENT' ? (
                    <>
                      <p className="text-sm font-semibold text-gray-900">{notification.message}</p>
                      <p className="line-clamp-2 text-sm text-gray-700">
                        {getDescription(notification)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-700">{notification.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              {!notification.readFlag && <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
