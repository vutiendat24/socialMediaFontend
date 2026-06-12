import { Link, NavLink } from 'react-router-dom'
import { Home, Search, Compass, Heart, MessageCircle, Bookmark, User, Menu, X, Users } from 'lucide-react'
import { useState } from 'react'
import { User as UserType } from '@/services/authService'

interface SidebarProps {
  user?: UserType;
  onLogout?: () => void;
}

export const Sidebar = ({ user, onLogout }: SidebarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const navItems = [
    { icon: Home, label: 'Home', to: '/' },
    { icon: Search, label: 'Explore', to: '/search' },
    { icon: Compass, label: 'Trending', to: '/explore' },
    { icon: Heart, label: 'Notifications', to: '/notifications' },
    { icon: Users, label: 'Friends', to: '/friends' },
    { icon: MessageCircle, label: 'Messages', to: '/messages' },
    { icon: Bookmark, label: 'Saved', to: '/saved' },
    { icon: User, label: 'Profile', to: '/profile' },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-64 md:bg-white md:border-r md:border-gray-200 md:p-4">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          {/* <div className="w-10 h-10 bg-gradient-to-br from-pink-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">📷</span>
          </div> */}
          <span className="text-2xl font-black ">Melody Media</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-gray-100 font-semibold text-black'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={24} />
                <span className="text-lg hidden lg:inline">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Create Post Button */}
        <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition mb-4 hidden lg:block">
          Create
        </button>

        {/* User Profile */}
        {user ? (
          <div className="border-t border-gray-200 pt-4">
            <Link to="/profile" className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition">
              <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                {user.avatar && (
                  <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="text-left flex-1 hidden lg:block">
                <p className="font-semibold text-sm">{user.fullName}</p>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>
            </Link>
            <button
              onClick={onLogout}
              className="flex items-center gap-3 w-full p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm mt-2 hidden lg:flex"
            >
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="hidden border-t border-gray-200 pt-4 lg:block">
            <Link
              to="/login"
              className="mb-2 block rounded-lg bg-blue-500 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-600"
            >
              Dang nhap
            </Link>
            <Link
              to="/register"
              className="block rounded-lg px-4 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Dang ky
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-600 to-purple-600 rounded flex items-center justify-center text-white font-bold">
            📷
          </div>
          <span className="font-black">Melody Media</span>
        </div>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2">
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <nav className="md:hidden fixed top-14 left-0 right-0 bg-white border-b border-gray-200 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-lg transition ${
                  isActive ? 'bg-gray-100 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={24} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition mt-4">
            Create
          </button>
        </nav>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 flex justify-around items-center px-2 py-2">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `flex-1 flex justify-center py-3 transition ${
                isActive ? 'text-black' : 'text-gray-600 hover:text-black'
              }`}
            >
              <Icon size={24} />
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
