import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Calendar, Loader2, Settings, User as UserIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { authService, User } from '@/services/authService'
import { friendService } from '@/services/friendService'
import { getApiErrorMessage } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { FriendshipStatusResponse } from '@/types'

interface EditForm {
  fullName: string
  bio: string
  avatar: string
  coverImage: string
}

export default function ProfilePage() {
  const { userId } = useParams()
  const { user: authUser, setUser } = useAuthStore()
  const [profile, setProfile] = useState<User | null>(null)
  const [friendship, setFriendship] = useState<FriendshipStatusResponse | null>(null)
  const [friendCount, setFriendCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({
    fullName: '',
    bio: '',
    avatar: '',
    coverImage: '',
  })

  const targetUserId = userId ? Number(userId) : authUser?.id
  const isOwnProfile = !!authUser?.id && authUser.id === targetUserId

  const loadProfile = useCallback(async () => {
    if (!authUser?.id || !targetUserId || Number.isNaN(targetUserId)) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const [profileData, friendsData, statusData] = await Promise.all([
        authService.getUserProfile(targetUserId),
        friendService.getFriends(targetUserId, 0, 1).catch(() => ({ totalElements: 0 })),
        isOwnProfile
          ? Promise.resolve<FriendshipStatusResponse | null>(null)
          : friendService.getFriendshipStatus(targetUserId),
      ])

      setProfile(profileData)
      setFriendCount(friendsData.totalElements ?? 0)
      setFriendship(statusData)
      setEditForm({
        fullName: profileData.fullName ?? '',
        bio: profileData.bio ?? '',
        avatar: profileData.avatar ?? '',
        coverImage: profileData.coverImage ?? '',
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Khong tai duoc ho so'))
    } finally {
      setLoading(false)
    }
  }, [authUser?.id, targetUserId, isOwnProfile])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const openEdit = () => {
    if (!profile) return
    setEditForm({
      fullName: profile.fullName ?? '',
      bio: profile.bio ?? '',
      avatar: profile.avatar ?? '',
      coverImage: profile.coverImage ?? '',
    })
    setIsEditing(true)
  }

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!authUser?.id) return

    setIsSaving(true)
    setError('')

    try {
      const updated = await authService.updateUserProfile(authUser.id, {
        fullName: editForm.fullName.trim(),
        bio: editForm.bio.trim() || undefined,
        avatar: editForm.avatar.trim() || undefined,
        coverImage: editForm.coverImage.trim() || undefined,
      })

      setProfile(updated)
      authService.updateStoredUser(updated)
      setUser(updated)
      setIsEditing(false)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Cap nhat ho so that bai'))
    } finally {
      setIsSaving(false)
    }
  }

  const runFriendAction = async (action: () => Promise<unknown>, nextStatus: FriendshipStatusResponse) => {
    setActionLoading(true)
    setError('')
    try {
      await action()
      setFriendship(nextStatus)
      await loadProfile()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Thao tac ket ban that bai'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendRequest = async () => {
    if (!targetUserId) return
    setActionLoading(true)
    setError('')
    try {
      const request = await friendService.sendFriendRequest(targetUserId)
      setFriendship({ status: 'PENDING_OUTGOING', requestId: request.id })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gui loi moi that bai'))
    } finally {
      setActionLoading(false)
    }
  }

  const renderFriendAction = () => {
    if (isOwnProfile) {
      return (
        <button
          type="button"
          onClick={openEdit}
          className="flex items-center gap-2 rounded-full bg-blue-500 px-8 py-2 font-semibold text-white transition hover:bg-blue-600"
        >
          <Settings size={18} />
          Chinh sua
        </button>
      )
    }

    if (!friendship) return null

    if (friendship.status === 'FRIENDS') {
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <span className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">
            Ban be
          </span>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => targetUserId && runFriendAction(() => friendService.unfriend(targetUserId), { status: 'NONE' })}
            className="rounded-full px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-70"
          >
            Huy ket ban
          </button>
        </div>
      )
    }

    if (friendship.status === 'PENDING_OUTGOING') {
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <span className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">
            Da gui loi moi
          </span>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => targetUserId && runFriendAction(() => friendService.cancelFriendRequest(targetUserId), { status: 'NONE' })}
            className="rounded-full px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-70"
          >
            Huy
          </button>
        </div>
      )
    }

    if (friendship.status === 'PENDING_INCOMING' && friendship.requestId) {
      const requestId = friendship.requestId
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => runFriendAction(() => friendService.acceptFriendRequest(requestId), { status: 'FRIENDS' })}
            className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-70"
          >
            Chap nhan
          </button>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => runFriendAction(() => friendService.rejectFriendRequest(requestId), { status: 'NONE' })}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-70"
          >
            Tu choi
          </button>
        </div>
      )
    }

    return (
      <button
        type="button"
        disabled={actionLoading}
        onClick={handleSendRequest}
        className="flex items-center gap-2 rounded-full bg-blue-500 px-8 py-2 font-semibold text-white transition hover:bg-blue-600 disabled:opacity-70"
      >
        {actionLoading && <Loader2 size={16} className="animate-spin" />}
        Ket ban
      </button>
    )
  }

  if (!authUser) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        Hay dang nhap de xem ho so
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-red-600">
        {error || 'Khong tai duoc ho so'}
      </div>
    )
  }

  const joinedDate = profile.createdAt
    ? format(new Date(profile.createdAt), 'MMMM yyyy')
    : ''

  return (
    <div className="min-h-screen border-l border-r border-gray-200">
      <div
        className="h-64 bg-gradient-to-br from-blue-400 to-purple-500 bg-cover bg-center"
        style={profile.coverImage ? { backgroundImage: `url(${profile.coverImage})` } : undefined}
      />

      <div className="border-b border-gray-200 px-4 pb-4">
        <div className="-mt-20 mb-4 flex items-start justify-between gap-4">
          <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-full border-4 border-white bg-gray-200">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <UserIcon size={48} />
              </div>
            )}
          </div>
          <div className="mt-20">{renderFriendAction()}</div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold">{profile.fullName}</h1>
          <p className="text-gray-500">@{profile.username}</p>
          {isOwnProfile && <p className="mt-1 text-sm text-gray-500">{profile.email}</p>}
        </div>

        {profile.bio && <p className="mt-3 text-gray-900">{profile.bio}</p>}

        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <Link to={`/friends/${profile.id}`} className="hover:underline">
            <span className="font-bold text-gray-900">{friendCount}</span>
            <span className="text-gray-500"> Ban be</span>
          </Link>
          <div>
            <span className="font-bold text-gray-900">{profile.followerCount ?? 0}</span>
            <span className="text-gray-500"> Followers</span>
          </div>
          <div>
            <span className="font-bold text-gray-900">{profile.followingCount ?? 0}</span>
            <span className="text-gray-500"> Following</span>
          </div>
        </div>

        {joinedDate && (
          <div className="mt-4 flex items-center gap-1 text-sm text-gray-500">
            <Calendar size={16} />
            <span>Joined {joinedDate}</span>
          </div>
        )}
      </div>

      <div className="px-4 py-16 text-center text-gray-500">
        <p className="text-lg">Chua co bai viet</p>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-bold">Chinh sua ho so</h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 p-5">
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">Ho ten</span>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  maxLength={150}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">Bio</span>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  rows={3}
                  maxLength={500}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">Avatar URL</span>
                <input
                  type="url"
                  value={editForm.avatar}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, avatar: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="https://..."
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">Cover image URL</span>
                <input
                  type="url"
                  value={editForm.coverImage}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, coverImage: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="https://..."
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-full px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Huy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-70"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  Luu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
