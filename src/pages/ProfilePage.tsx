import { currentUser, mockPosts } from '../data/mockData'
import { MapPin, Link as LinkIcon, Calendar, Settings } from 'lucide-react'

export default function ProfilePage() {
  const userPosts = mockPosts.filter((post) => post.userId === currentUser.id)

  return (
    <div className="border-l border-r border-gray-200 min-h-screen">
      {/* Cover Image */}
      <div className="h-64 bg-gradient-to-br from-blue-400 to-purple-500" />

      {/* Profile Header */}
      <div className="px-4 pb-4 border-b border-gray-200">
        <div className="flex justify-between items-start -mt-20 mb-4">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-300 overflow-hidden">
            {currentUser.avatar && (
              <img src={currentUser.avatar} alt={currentUser.fullName} className="w-full h-full object-cover" />
            )}
          </div>
          <button className="bg-blue-500 text-white px-8 py-2 rounded-full font-semibold hover:bg-blue-600 transition flex items-center gap-2">
            <Settings size={18} />
            Edit
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-bold">{currentUser.fullName}</h1>
          <p className="text-gray-500">@{currentUser.username}</p>
        </div>

        {currentUser.bio && (
          <p className="mt-3 text-gray-900">{currentUser.bio}</p>
        )}

        {/* Profile Stats */}
        <div className="flex gap-6 mt-4 text-sm">
          <div>
            <span className="font-bold text-gray-900">{currentUser.postCount}</span>
            <span className="text-gray-500"> Posts</span>
          </div>
          <div>
            <span className="font-bold text-gray-900">{currentUser.followerCount}</span>
            <span className="text-gray-500"> Followers</span>
          </div>
          <div>
            <span className="font-bold text-gray-900">{currentUser.followingCount}</span>
            <span className="text-gray-500"> Following</span>
          </div>
        </div>

        {/* Bio Links */}
        <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin size={16} />
            <span>San Francisco, CA</span>
          </div>
          <div className="flex items-center gap-1">
            <LinkIcon size={16} />
            <a href="#" className="text-blue-500 hover:underline">
              website.com
            </a>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <span>Joined March 2023</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-4 flex gap-8">
        <button className="py-4 font-semibold border-b-2 border-gray-900 text-gray-900">
          Posts
        </button>
        <button className="py-4 font-semibold text-gray-500 hover:text-gray-900">
          Saved
        </button>
        <button className="py-4 font-semibold text-gray-500 hover:text-gray-900">
          Tagged
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-1">
        {userPosts.map((post) => (
          <div
            key={post.id}
            className="aspect-square bg-gray-100 overflow-hidden hover:opacity-80 transition cursor-pointer group relative"
          >
            {post.mediaUrls && post.mediaUrls[0] && (
              <img
                src={post.mediaUrls[0]}
                alt="Post"
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-8">
              <div className="flex items-center gap-2 text-white font-semibold">
                <span>♥</span> {post.likeCount}
              </div>
              <div className="flex items-center gap-2 text-white font-semibold">
                <span>💬</span> {post.commentCount}
              </div>
            </div>
          </div>
        ))}
      </div>

      {userPosts.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No posts yet</p>
        </div>
      )}
    </div>
  )
}
