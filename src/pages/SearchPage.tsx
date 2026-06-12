import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Search as SearchIcon, User as UserIcon } from 'lucide-react'
import { searchService } from '@/services/searchService'
import { friendService } from '@/services/friendService'
import { getApiErrorMessage } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { FriendshipStatusResponse, Post, User } from '@/types'

type Tab = 'all' | 'posts' | 'people'

export default function SearchPage() {
  const { user: currentUser } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [friendshipByUserId, setFriendshipByUserId] = useState<Record<number, FriendshipStatusResponse>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionUserId, setActionUserId] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!debouncedQuery) {
      setUsers([])
      setPosts([])
      setError('')
      return
    }

    const runSearch = async () => {
      setLoading(true)
      setError('')

      try {
        let nextUsers: User[] = []
        let nextPosts: Post[] = []

        if (activeTab === 'people') {
          nextUsers = await searchService.searchUsers(debouncedQuery)
        } else if (activeTab === 'posts') {
          nextPosts = await searchService.searchPosts(debouncedQuery)
        } else {
          const result = await searchService.searchAll(debouncedQuery)
          nextUsers = result.users
          nextPosts = result.posts
        }

        setUsers(nextUsers)
        setPosts(nextPosts)

        if (currentUser?.id && nextUsers.length > 0) {
          const entries = await Promise.all(
            nextUsers
              .filter((user) => user.id !== currentUser.id)
              .map(async (user) => {
                try {
                  return [user.id, await friendService.getFriendshipStatus(user.id)] as const
                } catch {
                  return [user.id, { status: 'NONE' as const }] as const
                }
              })
          )
          setFriendshipByUserId(Object.fromEntries(entries))
        } else {
          setFriendshipByUserId({})
        }
      } catch (err) {
        setError(getApiErrorMessage(err, 'Tim kiem that bai'))
        setUsers([])
        setPosts([])
        setFriendshipByUserId({})
      } finally {
        setLoading(false)
      }
    }

    runSearch()
  }, [debouncedQuery, activeTab, currentUser?.id])

  const setFriendshipForUser = (userId: number, status: FriendshipStatusResponse) => {
    setFriendshipByUserId((prev) => ({ ...prev, [userId]: status }))
  }

  const handleFriendAction = async (targetUser: User, action: 'send' | 'cancel' | 'accept' | 'reject' | 'unfriend') => {
    if (!currentUser) {
      setError('Hay dang nhap de ket ban')
      return
    }

    if (targetUser.id === currentUser.id) return

    setActionUserId(targetUser.id)
    setError('')

    try {
      if (action === 'send') {
        const request = await friendService.sendFriendRequest(targetUser.id)
        setFriendshipForUser(targetUser.id, { status: 'PENDING_OUTGOING', requestId: request.id })
      } else if (action === 'cancel') {
        await friendService.cancelFriendRequest(targetUser.id)
        setFriendshipForUser(targetUser.id, { status: 'NONE' })
      } else if (action === 'unfriend') {
        await friendService.unfriend(targetUser.id)
        setFriendshipForUser(targetUser.id, { status: 'NONE' })
      } else {
        const requestId = friendshipByUserId[targetUser.id]?.requestId
        if (!requestId) return
        if (action === 'accept') {
          await friendService.acceptFriendRequest(requestId)
          setFriendshipForUser(targetUser.id, { status: 'FRIENDS' })
        } else {
          await friendService.rejectFriendRequest(requestId)
          setFriendshipForUser(targetUser.id, { status: 'NONE' })
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Thao tac ket ban that bai'))
    } finally {
      setActionUserId(null)
    }
  }

  const renderFriendButton = (user: User) => {
    const status = friendshipByUserId[user.id]?.status ?? 'NONE'
    const isLoadingAction = actionUserId === user.id

    if (status === 'FRIENDS') {
      return (
        <button
          type="button"
          disabled={isLoadingAction}
          onClick={() => handleFriendAction(user, 'unfriend')}
          className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-70"
        >
          {isLoadingAction ? <Loader2 size={16} className="animate-spin" /> : 'Ban be'}
        </button>
      )
    }

    if (status === 'PENDING_OUTGOING') {
      return (
        <button
          type="button"
          disabled={isLoadingAction}
          onClick={() => handleFriendAction(user, 'cancel')}
          className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-70"
        >
          {isLoadingAction ? <Loader2 size={16} className="animate-spin" /> : 'Da gui'}
        </button>
      )
    }

    if (status === 'PENDING_INCOMING') {
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={isLoadingAction}
            onClick={() => handleFriendAction(user, 'accept')}
            className="rounded-full bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-70"
          >
            Chap nhan
          </button>
          <button
            type="button"
            disabled={isLoadingAction}
            onClick={() => handleFriendAction(user, 'reject')}
            className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-70"
          >
            Tu choi
          </button>
        </div>
      )
    }

    return (
      <button
        type="button"
        disabled={isLoadingAction}
        onClick={() => handleFriendAction(user, 'send')}
        className="rounded-full bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-70"
      >
        {isLoadingAction ? <Loader2 size={16} className="animate-spin" /> : 'Ket ban'}
      </button>
    )
  }

  const showUsers = activeTab === 'all' || activeTab === 'people'
  const showPosts = activeTab === 'all' || activeTab === 'posts'
  const hasResults = (showUsers && users.length > 0) || (showPosts && posts.length > 0)

  return (
    <div className="mx-auto min-h-screen max-w-4xl border-l border-r border-gray-200">
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white p-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tim kiem bai viet, nguoi dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full bg-gray-100 py-2 pl-10 pr-4 outline-none transition focus:bg-gray-50"
          />
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        {(['all', 'posts', 'people'] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 border-b-2 py-3 font-semibold transition ${
              activeTab === tab
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab === 'all' ? 'Tat ca' : tab === 'posts' ? 'Bai viet' : 'Nguoi dung'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mx-4 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        {!debouncedQuery ? (
          <div className="py-16 text-center text-gray-500">
            <SearchIcon size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Nhap tu khoa de tim kiem</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : !hasResults ? (
          <div className="py-16 text-center text-gray-500">
            <p className="text-lg">Khong tim thay ket qua</p>
          </div>
        ) : (
          <>
            {showUsers && users.length > 0 && (
              <div className="divide-y divide-gray-200">
                {users.map((user) => {
                  const isSelf = currentUser?.id === user.id

                  return (
                    <div
                      key={`user-${user.id}`}
                      className="flex items-center justify-between gap-3 p-4 transition hover:bg-gray-50"
                    >
                      <Link to={`/profile/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.fullName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <UserIcon size={24} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">{user.fullName}</p>
                          <p className="truncate text-sm text-gray-500">@{user.username}</p>
                          {user.bio && <p className="mt-1 text-sm text-gray-700">{user.bio}</p>}
                          <p className="mt-1 text-xs text-gray-400">
                            {user.followerCount ?? 0} followers
                          </p>
                        </div>
                      </Link>

                      {!isSelf && currentUser && renderFriendButton(user)}
                    </div>
                  )
                })}
              </div>
            )}

            {showPosts && posts.length > 0 && (
              <div className={showUsers && users.length > 0 ? 'border-t border-gray-200' : ''}>
                {posts.map((post) => (
                  <div key={`post-${post.id}`} className="border-b border-gray-200 p-4">
                    {post.author?.fullName && (
                      <p className="mb-1 text-sm font-semibold text-gray-900">
                        {post.author.fullName}
                        <span className="ml-1 font-normal text-gray-500">@{post.author.username}</span>
                      </p>
                    )}
                    <p className="text-gray-900">{post.content}</p>
                    <p className="mt-2 text-xs text-gray-400">{post.likeCount ?? 0} likes</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
