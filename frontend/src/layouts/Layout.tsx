import {
  Outlet,
  NavLink,
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom'
import { Code2, LogOut, User, Bell, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useRef, useEffect } from 'react'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    window.location.href = '/login'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownRef])

  // Determine if the current page should be full width (like Problem Solver IDE)
  // Matches /problem/:slug (singular) which is the ProblemDetail page
  const isSolverPage = /^\/problem\/[^/]+$/.test(location.pathname)
  const isFullWidth = isSolverPage

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      {/* Dark Header - HackerRank Style */}
      <header className="h-16 bg-[#232f3e] text-white flex-none sticky top-0 z-50 shadow-md">
        <div
          className={clsx(
            'h-full flex items-center justify-between px-4',
            isFullWidth ? 'w-full px-6' : 'max-w-7xl mx-auto',
          )}
        >
          {/* Left: Logo & Nav */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-green-600 p-1 rounded group-hover:bg-green-500 transition-colors">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white font-sans">
                Graphora
              </span>
            </Link>

            <div className="hidden md:flex h-8 w-[1px] bg-gray-600 mx-2"></div>

            <nav className="hidden md:flex items-center gap-2">
              <NavLink
                to="/problems"
                className={({ isActive }) =>
                  clsx(
                    'px-3 py-2 text-sm font-medium transition-colors border-b-2',
                    isActive && !isSolverPage
                      ? 'text-white border-green-500'
                      : 'text-gray-300 border-transparent hover:text-white',
                  )
                }
              >
                Prepare
              </NavLink>
              <NavLink
                to="/submissions"
                className={({ isActive }) =>
                  clsx(
                    'px-3 py-2 text-sm font-medium transition-colors border-b-2',
                    isActive
                      ? 'text-white border-green-500'
                      : 'text-gray-300 border-transparent hover:text-white',
                  )
                }
              >
                Submissions
              </NavLink>
            </nav>
          </div>

          {/* Search Bar (Mock) */}
          <div className="hidden lg:flex flex-1 max-w-sm mx-12 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-9 pl-9 pr-4 rounded-sm bg-[#323f54] border border-transparent text-sm text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-light"
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <button className="text-gray-300 hover:text-white relative p-1">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-[#232f3e]"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-500 transition-colors text-xs font-bold ring-2 ring-transparent focus:ring-green-400 text-white"
              >
                US
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded shadow-xl border border-border py-1 text-sm text-foreground animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="px-4 py-3 border-b border-border mb-1 bg-gray-50/50 dark:bg-zinc-800/50">
                    <p className="font-semibold text-foreground">User Name</p>
                    <p className="text-xs text-muted-foreground truncate">
                      user@example.com
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 hover:bg-green-50 dark:hover:bg-green-900/10 hover:text-green-700 dark:hover:text-green-400"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 hover:bg-green-50 dark:hover:bg-green-900/10 hover:text-green-700 dark:hover:text-green-400"
                  >
                    Settings
                  </Link>
                  <div className="h-px bg-border my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={clsx(
          'flex-1 w-full flex flex-col transform-gpu',
          isFullWidth
            ? 'h-[calc(100vh-64px)] overflow-hidden'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
        )}
      >
        <Outlet />
      </main>

      {/* Footer */}
      {!isFullWidth && (
        <footer className="border-t py-8 bg-white dark:bg-zinc-900 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <div className="flex gap-4 mb-4 md:mb-0">
              <a href="#" className="hover:text-foreground">
                Blog
              </a>
              <a href="#" className="hover:text-foreground">
                Scoring
              </a>
              <a href="#" className="hover:text-foreground">
                Environment
              </a>
              <a href="#" className="hover:text-foreground">
                FAQ
              </a>
              <a href="#" className="hover:text-foreground">
                About Us
              </a>
            </div>
            <div>&copy; {new Date().getFullYear()} Graphora</div>
          </div>
        </footer>
      )}
    </div>
  )
}
