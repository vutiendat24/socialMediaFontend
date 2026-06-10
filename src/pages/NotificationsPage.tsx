import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Heart, Loader2, MessageCircle, Share2, UserPlus } from 'lucide-react'
import { getApiErrorMessage } from '@/services/api'
import { notificationService, type NotificationDto } from '@/services/notificationService'
import { useAuthStore } from '@/store/authStore'

export default function NotificationsPage() {
  const currentUser = useAuthStore((state) => state.user)
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) {
      setNotifications([])
      setError('Vui long dang nhap de xem thong bao.')
      return
    }

    let isCurrent = true
    setIsLoading(true)
    setError(null)

    notificationService
      .getNotifications(String(currentUser.id))
      .then((items) => {
        if (!isCurrent) return
        setNotifications(items)
      })
      .catch((err) => {
        if (!isCurrent) return
        setNotifications([])
        setError(getApiErrorMessage(err, 'Khong tai duoc thong bao.'))
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [currentUser?.id])

  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'LIKE':
        return <Heart size={20} className="text-red-500" />
      case 'FOLLOW':
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
      case 'LIKE':
        return 'hover:bg-red-50'
      case 'FOLLOW':
      case 'COMMENT':
        return 'hover:bg-blue-50'
      case 'SHARE':
        return 'hover:bg-green-50'
      default:
        return 'hover:bg-gray-50'
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
              className={`px-4 py-3 flex items-center justify-between transition ${getColor(notification.type)}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">{getIcon(notification.type)}</div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-500">
                  {notification.type.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{notification.message}</p>
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
