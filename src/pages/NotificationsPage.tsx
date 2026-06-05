import { Heart, UserPlus, MessageCircle, Share2 } from 'lucide-react'
import { mockUsers } from '../data/mockData'
import { formatDistanceToNow } from 'date-fns'

const notifications = [
  {
    id: 1,
    type: 'like',
    user: mockUsers[1],
    action: 'liked your post',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 2,
    type: 'follow',
    user: mockUsers[3],
    action: 'started following you',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: 3,
    type: 'comment',
    user: mockUsers[0],
    action: 'commented on your post',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 4,
    type: 'like',
    user: mockUsers[2],
    action: 'liked your post',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 5,
    type: 'follow',
    user: mockUsers[0],
    action: 'started following you',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
]

export default function NotificationsPage() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="text-red-500" />
      case 'follow':
        return <UserPlus size={20} className="text-blue-500" />
      case 'comment':
        return <MessageCircle size={20} className="text-blue-500" />
      case 'share':
        return <Share2 size={20} className="text-green-500" />
      default:
        return <Heart size={20} />
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'hover:bg-red-50'
      case 'follow':
        return 'hover:bg-blue-50'
      case 'comment':
        return 'hover:bg-blue-50'
      case 'share':
        return 'hover:bg-green-50'
      default:
        return 'hover:bg-gray-50'
    }
  }

  return (
    <div className="max-w-2xl mx-auto border-l border-r border-gray-200 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-20">
        <h1 className="text-xl font-bold">Notifications</h1>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200">
        {notifications.length === 0 ? (
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
                <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                  {notification.user.avatar && (
                    <img
                      src={notification.user.avatar}
                      alt={notification.user.fullName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">{notification.user.fullName}</span>
                    <span className="text-gray-600"> {notification.action}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
              {notification.type === 'follow' && (
                <button className="px-6 py-1.5 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition text-sm">
                  Follow
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
