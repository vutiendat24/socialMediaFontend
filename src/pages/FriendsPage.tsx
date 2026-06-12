import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2, User as UserIcon } from 'lucide-react'
import { friendService } from '@/services/friendService'
import { getApiErrorMessage } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { FriendRequest, User } from '@/types'

type Tab = 'friends' | 'incoming' | 'outgoing'

const avatar = (user?: User) => (
  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
    {user?.avatar ? (
      <img src={user.avatar} alt={user.fullName} className="h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-gray-400">
        <UserIcon size={24} />
      </div>
    )}
  </div>
)

const nameBlock = (user?: User) => {
  if (!user) return null

  return (
    <Link to={`/profile/${user.id}`} className="min-w-0 flex-1">
      <p className="truncate font-semibold text-gray-900">{user.fullName}</p>
      <p className="truncate text-sm text-gray-500">@{user.username}</p>
      {user.bio && <p className="mt-1 line-clamp-2 text-sm text-gray-700">{user.bio}</p>}
    </Link>
  )
}

export default function FriendsPage() {
  const { userId } = useParams()
  const { user: currentUser } = useAuthStore()
  const targetUserId = userId ? Number(userId) : currentUser?.id
  const isOwnPage = !!currentUser?.id && currentUser.id === targetUserId
  const [activeTab, setActiveTab] = useState<Tab>('friends')
  const [friends, setFriends] = useState<User[]>([])
  const [incoming, setIncoming] = useState<FriendRequest[]>([])
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    if (!targetUserId || Number.isNaN(targetUserId)) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const friendsPage = await friendService.getFriends(targetUserId, 0, 50)
      setFriends(friendsPage.items ?? [])

      if (isOwnPage) {
        const [incomingPage, outgoingPage] = await Promise.all([
          friendService.getIncomingRequests(0, 50),
          friendService.getOutgoingRequests(0, 50),
        ])
        setIncoming(incomingPage.items ?? [])
        setOutgoing(outgoingPage.items ?? [])
      } else {
        setIncoming([])
        setOutgoing([])
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Khong tai duoc danh sach ban be'))
    } finally {
      setLoading(false)
    }
  }, [targetUserId, isOwnPage])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!isOwnPage && activeTab !== 'friends') {
      setActiveTab('friends')
    }
  }, [activeTab, isOwnPage])

  const runRequestAction = async (requestId: number, action: () => Promise<unknown>) => {
    setActionId(requestId)
    setError('')
    try {
      await action()
      await loadData()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Thao tac loi moi that bai'))
    } finally {
      setActionId(null)
    }
  }

  const tabs: Array<{ key: Tab; label: string; count: number }> = [
    { key: 'friends', label: 'Ban be', count: friends.length },
    { key: 'incoming', label: 'Loi moi den', count: incoming.length },
    { key: 'outgoing', label: 'Da gui', count: outgoing.length },
  ]

  const visibleTabs = isOwnPage ? tabs : tabs.slice(0, 1)

  if (!currentUser) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        Hay dang nhap de xem ban be
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl border-l border-r border-gray-200">
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-4">
        <h1 className="text-xl font-bold">Ban be</h1>
      </div>

      <div className="flex border-b border-gray-200">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 border-b-2 py-3 text-sm font-semibold transition ${
              activeTab === tab.key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {error && (
        <div className="mx-4 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : activeTab === 'friends' ? (
        friends.length === 0 ? (
          <div className="py-16 text-center text-gray-500">Chua co ban be</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-3 p-4 transition hover:bg-gray-50">
                {avatar(friend)}
                {nameBlock(friend)}
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'incoming' ? (
        incoming.length === 0 ? (
          <div className="py-16 text-center text-gray-500">Khong co loi moi moi</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {incoming.map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-3 p-4 transition hover:bg-gray-50">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {avatar(request.requester)}
                  {nameBlock(request.requester)}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={actionId === request.id}
                    onClick={() => runRequestAction(request.id, () => friendService.acceptFriendRequest(request.id))}
                    className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-70"
                  >
                    Chap nhan
                  </button>
                  <button
                    type="button"
                    disabled={actionId === request.id}
                    onClick={() => runRequestAction(request.id, () => friendService.rejectFriendRequest(request.id))}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-70"
                  >
                    Tu choi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : outgoing.length === 0 ? (
        <div className="py-16 text-center text-gray-500">Chua gui loi moi nao</div>
      ) : (
        <div className="divide-y divide-gray-200">
          {outgoing.map((request) => (
            <div key={request.id} className="flex items-center justify-between gap-3 p-4 transition hover:bg-gray-50">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {avatar(request.receiver)}
                {nameBlock(request.receiver)}
              </div>
              <button
                type="button"
                disabled={actionId === request.id}
                onClick={() => request.receiverId && runRequestAction(request.id, () => friendService.cancelFriendRequest(request.receiverId))}
                className="rounded-full px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-70"
              >
                Huy
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
