'use client';

import { Heart, Home, Mail, Search, User, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { icon: Home, label: 'Home', href: '#' },
    { icon: Search, label: 'Explore', href: '#' },
    { icon: Heart, label: 'Likes', href: '#' },
    { icon: Mail, label: 'Messages', href: '#' },
    { icon: User, label: 'Profile', href: '#' },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
              S
            </div>
            <span className="hidden font-bold text-slate-900 sm:inline">Social</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden gap-2 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100"
              >
                <item.icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            ))}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-3">
                  <img
                    src={user.avatar || 'https://via.placeholder.com/32'}
                    alt={user.username}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div className="hidden lg:block">
                    <div className="text-sm font-semibold text-slate-900">
                      {user.fullName.split(' ')[0]}
                    </div>
                    <div className="text-xs text-slate-500">@{user.username}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <button className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700">
                Sign In
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 md:hidden"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 py-2 md:hidden">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-600 transition hover:bg-slate-100"
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};
