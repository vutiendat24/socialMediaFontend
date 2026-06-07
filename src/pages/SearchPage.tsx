import { useCallback, useEffect, useState } from 'react'
import { Loader2, Search as SearchIcon, User as UserIcon } from 'lucide-react'
import { searchService } from '@/services/searchService'
import { authService } from '@/services/authService'
import { getApiErrorMessage } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { Post, User } from '@/types'

type Tab = 'all' | 'posts' | 'people'

export default function SearchPage() {
  const { user: currentUser } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionUserId, setActionUserId] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadFollowing = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      const following = await authService.getFollowing(currentUser.id, 0, 100)
      setFollowingIds(new Set(following.map((u) => u.id)))
    } catch {
      // optional — follow buttons still work without preloaded state
    }
  }, [currentUser?.id])

  useEffect(() => {
    loadFollowing()
  }, [loadFollowing])

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
        if (activeTab === 'people') {
          setUsers(await searchService.searchUsers(debouncedQuery))
          setPosts([])
        } else if (activeTab === 'posts') {
          setPosts(await searchService.searchPosts(debouncedQuery))
          setUsers([])
        } else {
          const result = await searchService.searchAll(debouncedQuery)
          setUsers(result.users)
          setPosts(result.posts)
        }
      } catch (err) {
        setError(getApiErrorMessage(err, 'Tim kiem that bai'))
        setUsers([])
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    runSearch()
  }, [debouncedQuery, activeTab])

  const handleFollowToggle = async (targetUser: User) => {
    if (!currentUser) {
      setError('Hay dang nhap de follow nguoi khac')
      return
    }

    if (targetUser.id === currentUser.id) return

    setActionUserId(targetUser.id)
    setError('')

    const isFollowing = followingIds.has(targetUser.id)

    try {
      if (isFollowing) {
        await authService.unfollowUser(targetUser.id)
        setFollowingIds((prev) => {
          const next = new Set(prev)
          next.delete(targetUser.id)
          return next
        })
      } else {
        await authService.followUser(targetUser.id)
        setFollowingIds((prev) => new Set(prev).add(targetUser.id))
      }
    } catch (err) {
      setError(getApiErrorMessage(err, isFollowing ? 'Unfollow that bai' : 'Follow that bai'))
    } finally {
      setActionUserId(null)
    }
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
                  const isFollowing = followingIds.has(user.id)
                  const isLoadingAction = actionUserId === user.id

                  return (
                    <div
                      key={`user-${user.id}`}
                      className="flex items-center justify-between p-4 transition hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.fullName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <UserIcon size={24} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.fullName}</p>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                          {user.bio && <p className="mt-1 text-sm text-gray-700">{user.bio}</p>}
                          <p className="mt-1 text-xs text-gray-400">
                            {user.followerCount ?? 0} followers
                          </p>
                        </div>
                      </div>

                      {!isSelf && currentUser && (
                        <button
                          type="button"
                          disabled={isLoadingAction}
                          onClick={() => handleFollowToggle(user)}
                          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition disabled:opacity-70 ${
                            isFollowing
                              ? 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {isLoadingAction ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : isFollowing ? (
                            'Unfollow'
                          ) : (
                            'Follow'
                          )}
                        </button>
                      )}
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
