import { useState } from 'react'
import { Search as SearchIcon, User } from 'lucide-react'
import { mockPosts, mockUsers } from '../data/mockData'

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const filteredPosts = mockPosts.filter((post) =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = mockUsers.filter((user) =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto border-l border-r border-gray-200 min-h-screen">
      {/* Search Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-20">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search posts, people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full outline-none focus:bg-gray-50 transition"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 font-semibold transition border-b-2 ${
            activeTab === 'all'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 font-semibold transition border-b-2 ${
            activeTab === 'posts'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Posts
        </button>
        <button
          onClick={() => setActiveTab('people')}
          className={`flex-1 py-3 font-semibold transition border-b-2 ${
            activeTab === 'people'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          People
        </button>
      </div>

      {/* Content */}
      <div>
        {searchQuery === '' ? (
          <div className="text-center py-16 text-gray-500">
            <SearchIcon size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Search for posts or people</p>
          </div>
        ) : (activeTab === 'all' || activeTab === 'posts') && filteredPosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {filteredPosts.map((post) => (
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
        ) : (activeTab === 'all' || activeTab === 'people') && filteredUsers.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                    {user.avatar && (
                      <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user.fullName}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                    {user.bio && <p className="text-sm text-gray-700 mt-1">{user.bio}</p>}
                  </div>
                </div>
                <button className="px-4 py-1.5 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition text-sm">
                  Follow
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No results found</p>
          </div>
        )}
      </div>
    </div>
  )
}
